/**
 * Media Session API integration.
 * Registers the app as a media player with the OS so audio continues
 * playing when the screen locks or the app is backgrounded.
 */

interface MediaSessionHandlers {
  onPlay?: () => void;
  onPause?: () => void;
  onNextTrack?: () => void;
  onPrevTrack?: () => void;
}

export function updateMediaSession(
  title: string,
  artist = "Identity by Design",
  handlers?: MediaSessionHandlers
) {
  if (!("mediaSession" in navigator)) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title,
    artist,
    album: "Identity Installation",
    artwork: [
      { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  });

  if (handlers?.onPlay) {
    navigator.mediaSession.setActionHandler("play", handlers.onPlay);
  }
  if (handlers?.onPause) {
    navigator.mediaSession.setActionHandler("pause", handlers.onPause);
  }
  if (handlers?.onNextTrack) {
    navigator.mediaSession.setActionHandler("nexttrack", handlers.onNextTrack);
  }
  if (handlers?.onPrevTrack) {
    navigator.mediaSession.setActionHandler("previoustrack", handlers.onPrevTrack);
  }
}

export function clearMediaSession() {
  if (!("mediaSession" in navigator)) return;
  navigator.mediaSession.metadata = null;
  try {
    navigator.mediaSession.setActionHandler("play", null);
    navigator.mediaSession.setActionHandler("pause", null);
    navigator.mediaSession.setActionHandler("nexttrack", null);
    navigator.mediaSession.setActionHandler("previoustrack", null);
  } catch {}
}
