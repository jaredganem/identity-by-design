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
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.recordedChunks = [];
    this.mediaRecorder = new MediaRecorder(stream);

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
   * Mix voice buffer with background, looping voice with smooth crossfades.
   * 417Hz plays continuously underneath. After the last voice loop,
   * 417Hz plays alone for a few seconds then gently fades out.
   * Voice never fades — only background fades at the very end.
   */
  async mixWithBackgroundAndLoop(
    voiceBuffer: AudioBuffer,
    backgroundBuffer: AudioBuffer,
    bgVolume = 0.3,
    loopCount = 1
  ): Promise<AudioBuffer> {
    const sampleRate = voiceBuffer.sampleRate;
    const voiceLen = voiceBuffer.length;
    const tailSeconds = 3; // 417Hz plays alone after last voice
    const tailSamples = Math.floor(sampleRate * tailSeconds);
    const crossfadeSamples = Math.floor(sampleRate * 2); // 2s crossfade between voice loops
    const bgFadeSamples = Math.floor(sampleRate * 3); // 3s fade out for background at end

    // Total length: voice loops with crossfade overlap + tail
    let totalVoiceLength: number;
    if (loopCount <= 1) {
      totalVoiceLength = voiceLen;
    } else {
      totalVoiceLength = voiceLen * loopCount - crossfadeSamples * (loopCount - 1);
    }
    const totalLength = totalVoiceLength + tailSamples;

    const offlineCtx = new OfflineAudioContext(2, totalLength, sampleRate);

    // --- Voice loops (no fade on voice, just gentle crossfade overlap) ---
    for (let loop = 0; loop < loopCount; loop++) {
      const startSample = loop * (voiceLen - crossfadeSamples);
      const startTime = startSample / sampleRate;

      const voiceSource = offlineCtx.createBufferSource();
      voiceSource.buffer = voiceBuffer;
      const voiceGain = offlineCtx.createGain();
      voiceGain.gain.value = 1.0;

      // Fade in for non-first loops
      if (loop > 0) {
        voiceGain.gain.setValueAtTime(0.0, startTime);
        voiceGain.gain.linearRampToValueAtTime(1.0, startTime + crossfadeSamples / sampleRate);
      }
      // Fade out for non-last loops
      if (loop < loopCount - 1) {
        const fadeOutStart = startTime + (voiceLen - crossfadeSamples) / sampleRate;
        voiceGain.gain.setValueAtTime(1.0, fadeOutStart);
        voiceGain.gain.linearRampToValueAtTime(0.0, fadeOutStart + crossfadeSamples / sampleRate);
      }

      voiceSource.connect(voiceGain);
      voiceGain.connect(offlineCtx.destination);
      voiceSource.start(startTime);
    }

    // --- Single continuous 417Hz background ---
    const bgSource = offlineCtx.createBufferSource();
    bgSource.buffer = backgroundBuffer;
    bgSource.loop = true;
    const bgGain = offlineCtx.createGain();
    bgGain.gain.value = bgVolume;

    // Fade out background during the tail (after voice ends)
    const voiceEndTime = totalVoiceLength / sampleRate;
    bgGain.gain.setValueAtTime(bgVolume, voiceEndTime);
    bgGain.gain.linearRampToValueAtTime(0.0, totalLength / sampleRate);

    bgSource.connect(bgGain);
    bgGain.connect(offlineCtx.destination);
    bgSource.start(0);
    bgSource.stop(totalLength / sampleRate);

    return offlineCtx.startRendering();
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
