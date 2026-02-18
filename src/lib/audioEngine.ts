// Audio engine for recording, reverb, mixing, concatenation, crossfade, and looping

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private activePlayback: { stop: () => void } | null = null;
  private recordedChunks: Blob[] = [];

  getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  async startRecording(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 2,
        sampleRate: 48000,
      },
    });
    this.recordedChunks = [];

    // Prefer high-quality codec when available
    const mimeOptions = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
    ];
    const mimeType = mimeOptions.find((m) => MediaRecorder.isTypeSupported(m));
    this.mediaRecorder = new MediaRecorder(stream, {
      ...(mimeType ? { mimeType } : {}),
      audioBitsPerSecond: 128000,
    });

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.recordedChunks.push(e.data);
    };

    this.mediaRecorder.start();
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) throw new Error("Not recording");

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: "audio/webm" });
        this.mediaRecorder?.stream.getTracks().forEach((t) => t.stop());
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  async decodeBlob(blob: Blob): Promise<AudioBuffer> {
    const ctx = this.getContext();
    const arrayBuffer = await blob.arrayBuffer();
    return ctx.decodeAudioData(arrayBuffer);
  }

  /**
   * Concatenate multiple audio buffers with a short crossfade gap between them
   */
  concatenateBuffers(buffers: AudioBuffer[], gapSeconds = 1.5): AudioBuffer {
    const ctx = this.getContext();
    const sampleRate = buffers[0].sampleRate;
    const gapSamples = Math.floor(gapSeconds * sampleRate);

    // Calculate total length
    let totalLength = 0;
    for (const buf of buffers) {
      totalLength += buf.length;
    }
    totalLength += gapSamples * (buffers.length - 1);

    const result = ctx.createBuffer(2, totalLength, sampleRate);

    let offset = 0;
    const fadeLength = Math.min(Math.floor(0.05 * sampleRate), 2205); // 50ms fade

    for (let b = 0; b < buffers.length; b++) {
      const buf = buffers[b];
      for (let ch = 0; ch < 2; ch++) {
        const outData = result.getChannelData(ch);
        const srcCh = ch < buf.numberOfChannels ? ch : 0;
        const inData = buf.getChannelData(srcCh);

        for (let i = 0; i < buf.length; i++) {
          let sample = inData[i];
          // Fade in at start of each clip (except first)
          if (b > 0 && i < fadeLength) {
            sample *= i / fadeLength;
          }
          // Fade out at end of each clip (except last)
          if (b < buffers.length - 1 && i >= buf.length - fadeLength) {
            sample *= (buf.length - i) / fadeLength;
          }
          outData[offset + i] = sample;
        }
      }
      offset += buf.length + gapSamples;
    }

    return result;
  }

  /**
   * Apply reverb using a generated impulse response
   */
  async applyReverbToBuffer(buffer: AudioBuffer, reverbAmount = 0.5): Promise<AudioBuffer> {
    const offlineCtx = new OfflineAudioContext(
      2,
      buffer.length + buffer.sampleRate * 3,
      buffer.sampleRate
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;

    const convolver = offlineCtx.createConvolver();
    const impulseLength = offlineCtx.sampleRate * 2.5;
    const impulse = offlineCtx.createBuffer(2, impulseLength, offlineCtx.sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < impulseLength; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulseLength, 2.5);
      }
    }
    convolver.buffer = impulse;

    const dryGain = offlineCtx.createGain();
    const wetGain = offlineCtx.createGain();
    dryGain.gain.value = 1 - reverbAmount * 0.5;
    wetGain.gain.value = reverbAmount;

    source.connect(dryGain);
    source.connect(convolver);
    convolver.connect(wetGain);
    dryGain.connect(offlineCtx.destination);
    wetGain.connect(offlineCtx.destination);

    source.start(0);
    return offlineCtx.startRendering();
  }

  // Keep legacy method for compatibility
  async applyReverb(audioBlob: Blob, reverbAmount = 0.5): Promise<AudioBuffer> {
    const buffer = await this.decodeBlob(audioBlob);
    return this.applyReverbToBuffer(buffer, reverbAmount);
  }

  /**
   * Mix voice buffer with background layers, looping voice with smooth crossfades.
   * Supports an ambient soundscape and/or a healing frequency tone.
   * Voice never fades — only backgrounds fade at the very end.
   */
  async mixWithBackgroundAndLoop(
    voiceBuffer: AudioBuffer,
    backgroundBuffer: AudioBuffer | null,
    bgVolume = 0.3,
    loopCount = 1,
    frequencyBuffer?: AudioBuffer | null,
    freqVolume?: number
  ): Promise<AudioBuffer> {
    const sampleRate = voiceBuffer.sampleRate;
    const voiceLen = voiceBuffer.length;
    const tailSeconds = 3;
    const tailSamples = Math.floor(sampleRate * tailSeconds);
    const bgFadeInSeconds = 3;
    const voiceDelaySeconds = 2;
    const voiceDelaySamples = Math.floor(sampleRate * voiceDelaySeconds);

    const gapSamples = Math.floor(sampleRate * 1.5);
    let totalVoiceLength: number;
    if (loopCount <= 1) {
      totalVoiceLength = voiceLen;
    } else {
      totalVoiceLength = voiceLen * loopCount + gapSamples * (loopCount - 1);
    }
    const totalLength = voiceDelaySamples + totalVoiceLength + tailSamples;

    const offlineCtx = new OfflineAudioContext(2, totalLength, sampleRate);
    const voiceEndTime = (voiceDelaySamples + totalVoiceLength) / sampleRate;
    const endTime = totalLength / sampleRate;

    // --- Voice loops ---
    for (let loop = 0; loop < loopCount; loop++) {
      const startSample = voiceDelaySamples + loop * (voiceLen + gapSamples);
      const startTime = startSample / sampleRate;

      const voiceSource = offlineCtx.createBufferSource();
      voiceSource.buffer = voiceBuffer;
      const voiceGain = offlineCtx.createGain();
      voiceGain.gain.value = 1.0;

      voiceSource.connect(voiceGain);
      voiceGain.connect(offlineCtx.destination);
      voiceSource.start(startTime);
    }

    // --- Helper to add a looping background layer ---
    const addBgLayer = (buffer: AudioBuffer, vol: number) => {
      const source = offlineCtx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const gain = offlineCtx.createGain();
      gain.gain.setValueAtTime(0, 0);
      gain.gain.linearRampToValueAtTime(vol, bgFadeInSeconds);
      gain.gain.setValueAtTime(vol, voiceEndTime);
      gain.gain.linearRampToValueAtTime(0.0, endTime);
      source.connect(gain);
      gain.connect(offlineCtx.destination);
      source.start(0);
      source.stop(endTime);
    };

    // Ambient soundscape layer
    if (backgroundBuffer) {
      addBgLayer(backgroundBuffer, bgVolume);
    }

    // Healing frequency layer
    if (frequencyBuffer) {
      addBgLayer(frequencyBuffer, freqVolume ?? bgVolume);
    }

    return offlineCtx.startRendering();
  }

  /**
   * Preview a clip with reverb and volume applied
   */
  async previewClipWithEffects(
    blob: Blob,
    reverbAmount: number,
    vocalVolume: number
  ): Promise<{ stop: () => void }> {
    let buffer = await this.decodeBlob(blob);
    buffer = await this.applyReverbToBuffer(buffer, reverbAmount);

    if (vocalVolume < 1.0) {
      const ctx = this.getContext();
      const scaled = ctx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
      for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
        const input = buffer.getChannelData(ch);
        const output = scaled.getChannelData(ch);
        for (let i = 0; i < input.length; i++) {
          output[i] = input[i] * vocalVolume;
        }
      }
      buffer = scaled;
    }

    return this.playBuffer(buffer);
  }

  audioBufferToWav(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1;
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const dataLength = buffer.length * blockAlign;
    const headerLength = 44;
    const totalLength = headerLength + dataLength;

    const arrayBuffer = new ArrayBuffer(totalLength);
    const view = new DataView(arrayBuffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, totalLength - 8, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, "data");
    view.setUint32(40, dataLength, true);

    let offset = 44;
    const channels: Float32Array[] = [];
    for (let ch = 0; ch < numChannels; ch++) {
      channels.push(buffer.getChannelData(ch));
    }

    for (let i = 0; i < buffer.length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = Math.max(-1, Math.min(1, channels[ch][i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: "audio/wav" });
  }

  playBuffer(buffer: AudioBuffer): { stop: () => void } {
    // Stop any currently playing track first
    if (this.activePlayback) {
      try { this.activePlayback.stop(); } catch {}
      this.activePlayback = null;
    }
    const ctx = this.getContext();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    const handle = { stop: () => { try { source.stop(); } catch {} } };
    this.activePlayback = handle;
    source.onended = () => {
      if (this.activePlayback === handle) this.activePlayback = null;
    };
    return handle;
  }
}

export const audioEngine = new AudioEngine();
