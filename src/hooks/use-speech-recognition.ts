import { useRef, useCallback, useState } from "react";

/**
 * Lightweight hook wrapping the Web Speech API (SpeechRecognition).
 * Runs alongside the MediaRecorder so we can auto-name clips from what the user says.
 * Falls back gracefully — if the browser doesn't support it, transcript stays empty.
 */

const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

function abbreviate(text: string, maxLen = 50): string {
  const cleaned = text.trim().replace(/\s+/g, " ");
  if (cleaned.length <= maxLen) return cleaned;
  // Cut at the last full word within maxLen and add ellipsis
  const truncated = cleaned.slice(0, maxLen);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 20 ? truncated.slice(0, lastSpace) : truncated) + "…";
}

export function useSpeechRecognition() {
  const recognitionRef = useRef<any>(null);
  const fullTranscript = useRef("");
  const [transcript, setTranscript] = useState("");
  const supported = !!SpeechRecognition;

  const start = useCallback(() => {
    if (!SpeechRecognition) {
      console.log("[SpeechRecognition] Not supported in this browser");
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      fullTranscript.current = "";
      setTranscript("");

      recognition.onresult = (event: any) => {
        let final = "";
        let interim = "";
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            final += result[0].transcript + " ";
          } else {
            // Only use the LAST interim result to avoid stuttering repeats
            interim = result[0].transcript;
          }
        }
        fullTranscript.current = final.trim();
        const combined = (final + interim).trim();
        setTranscript(combined);
        console.log("[SpeechRecognition] Heard:", combined);
      };

      recognition.onerror = (e: any) => {
        console.log("[SpeechRecognition] Error:", e.error);
      };

      recognition.onend = () => {
        console.log("[SpeechRecognition] Ended. Final:", fullTranscript.current);
      };

      recognition.start();
      console.log("[SpeechRecognition] Started listening");
      recognitionRef.current = recognition;
    } catch (e) {
      console.log("[SpeechRecognition] Failed to start:", e);
      // Browser may throw if permissions denied
    }
  }, []);

  const stop = useCallback((): string => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // already stopped
      }
      recognitionRef.current = null;
    }
    // Use the final transcript, fall back to whatever we have
    const raw = fullTranscript.current || transcript;
    return abbreviate(raw);
  }, [transcript]);

  return { start, stop, transcript, supported };
}
