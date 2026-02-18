import { useRef, useCallback, useState } from "react";

/**
 * Lightweight hook wrapping the Web Speech API (SpeechRecognition).
 * Uses auto-restarting single-shot mode for Android compatibility.
 * `continuous: true` causes stuttering/duplicate text on Android Chrome,
 * so we use single-shot recognition that auto-restarts on `onend`.
 */

const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

function abbreviate(text: string, maxLen = 50): string {
  const cleaned = text.trim().replace(/\s+/g, " ");
  if (cleaned.length <= maxLen) return cleaned;
  const truncated = cleaned.slice(0, maxLen);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 20 ? truncated.slice(0, lastSpace) : truncated) + "…";
}

export function useSpeechRecognition() {
  const recognitionRef = useRef<any>(null);
  const committedText = useRef("");      // All finalized text across restarts
  const activeRef = useRef(false);       // Whether we should keep listening
  const [transcript, setTranscript] = useState("");
  const supported = !!SpeechRecognition;

  const startInstance = useCallback(() => {
    if (!SpeechRecognition || !activeRef.current) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;      // Single-shot — avoids Android stutter
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let interim = "";
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            // Append finalized text to our committed buffer
            const finalText = result[0].transcript.trim();
            if (finalText) {
              committedText.current = committedText.current
                ? `${committedText.current} ${finalText}`
                : finalText;
            }
          } else {
            interim = result[0].transcript;
          }
        }
        const combined = (committedText.current + (interim ? ` ${interim}` : "")).trim();
        setTranscript(combined);
      };

      recognition.onerror = (e: any) => {
        console.log("[SpeechRecognition] Error:", e.error);
        // Don't restart on fatal errors
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          activeRef.current = false;
        }
      };

      recognition.onend = () => {
        console.log("[SpeechRecognition] Segment ended. Committed:", committedText.current);
        // Auto-restart if still active (keeps listening through natural pauses)
        if (activeRef.current) {
          try {
            startInstance();
          } catch {
            activeRef.current = false;
          }
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.log("[SpeechRecognition] Failed to start:", e);
      activeRef.current = false;
    }
  }, []);

  const start = useCallback(() => {
    if (!SpeechRecognition) {
      console.log("[SpeechRecognition] Not supported in this browser");
      return;
    }
    committedText.current = "";
    setTranscript("");
    activeRef.current = true;
    console.log("[SpeechRecognition] Started listening");
    startInstance();
  }, [startInstance]);

  const stop = useCallback((): string => {
    activeRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // already stopped
      }
      recognitionRef.current = null;
    }
    const raw = committedText.current || transcript;
    return abbreviate(raw);
  }, [transcript]);

  return { start, stop, transcript, supported };
}
