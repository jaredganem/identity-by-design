/**
 * Feature Tier Mapping
 * ────────────────────
 * Central registry of all features tagged by pricing tier.
 * When we implement gating, check: canAccess(userTier, featureId)
 *
 * Tiers:
 *   "free"    → Basic functionality, lead-gen users
 *   "pro"     → Power users, enhanced UX & unlimited access
 *   "elite"   → Full AI suite + premium capabilities
 */

export type FeatureTier = "free" | "pro" | "elite";

export interface FeatureDefinition {
  id: string;
  name: string;
  description: string;
  tier: FeatureTier;
  category: "recording" | "library" | "ai" | "audio" | "export" | "personalization";
}

export const FEATURE_TIERS: FeatureDefinition[] = [
  // ─── FREE TIER ─────────────────────────────────────────
  {
    id: "guided_recording",
    name: "Guided Recording",
    description: "Record affirmations with default prompts across 6 categories (12 slots)",
    tier: "free",
    category: "recording",
  },
  {
    id: "freestyle_recording",
    name: "Freestyle Recording",
    description: "Record freeform affirmations without guided prompts",
    tier: "free",
    category: "recording",
  },
  {
    id: "417hz_playback",
    name: "417Hz Frequency Playback",
    description: "Listen to the base 417Hz healing frequency",
    tier: "free",
    category: "audio",
  },
  {
    id: "basic_mixer",
    name: "Basic Audio Mixer",
    description: "Adjust voice level and frequency level sliders",
    tier: "free",
    category: "audio",
  },
  {
    id: "library_save",
    name: "Save to Library",
    description: "Save recorded clips to the local affirmation library",
    tier: "free",
    category: "library",
  },
  {
    id: "library_browse",
    name: "Browse Library",
    description: "View saved affirmations organized by category",
    tier: "free",
    category: "library",
  },
  {
    id: "basic_export",
    name: "Download Program (Single)",
    description: "Export a single mixed track as WAV",
    tier: "free",
    category: "export",
  },
  {
    id: "sleep_timer",
    name: "Sleep Timer",
    description: "Set a timer to auto-stop playback",
    tier: "free",
    category: "audio",
  },
  {
    id: "edit_prompts",
    name: "Edit Prompts Manually",
    description: "Tap to edit any guided affirmation prompt text",
    tier: "free",
    category: "personalization",
  },

  // ─── PRO TIER ──────────────────────────────────────────
  {
    id: "custom_categories",
    name: "Custom Categories",
    description: "Create your own category names when saving clips",
    tier: "pro",
    category: "library",
  },
  {
    id: "ai_clip_naming",
    name: "AI Clip Naming",
    description: "Auto-name saved clips using AI transcription",
    tier: "pro",
    category: "ai",
  },
  {
    id: "ai_categorization",
    name: "AI Auto-Categorization",
    description: "AI suggests the best category for saved clips",
    tier: "pro",
    category: "ai",
  },
  {
    id: "depth_effect",
    name: "Depth Effect Control",
    description: "Advanced reverb/echo depth slider for immersive audio",
    tier: "pro",
    category: "audio",
  },
  {
    id: "repetition_control",
    name: "Repetition Control",
    description: "Set how many times affirmations repeat in the mix",
    tier: "pro",
    category: "audio",
  },
  {
    id: "unlimited_library",
    name: "Unlimited Library Storage",
    description: "No cap on saved affirmations (free tier could be limited)",
    tier: "pro",
    category: "library",
  },
  {
    id: "speech_to_text_input",
    name: "Voice Input for Goals",
    description: "Speak your goals via microphone instead of typing",
    tier: "pro",
    category: "personalization",
  },

  // ─── ELITE TIER ────────────────────────────────────────
  {
    id: "ai_personalize_prompts",
    name: "AI Prompt Personalization",
    description: "AI generates all 12 affirmation prompts from your goals",
    tier: "elite",
    category: "ai",
  },
  {
    id: "ai_track_builder",
    name: "AI Track Builder",
    description: "Full AI-generated affirmation tracks from a theme or custom input",
    tier: "elite",
    category: "ai",
  },
  {
    id: "ai_freestyle_track",
    name: "AI Freestyle Track Builder",
    description: "AI composes freestyle affirmation scripts for recording",
    tier: "elite",
    category: "ai",
  },
  {
    id: "identity_player",
    name: "Identity Player",
    description: "Dedicated player with circular visualizer, playlist, loop/shuffle controls",
    tier: "pro",
    category: "audio",
  },
  {
    id: "pwa_install",
    name: "Installable App (PWA)",
    description: "Install to home screen for native-like offline experience",
    tier: "pro",
    category: "export",
  },

  // ─── FUTURE ADVANCED FEATURES (Elite) ──────────────────
  {
    id: "ai_voice_clone",
    name: "AI Voice Cloning",
    description: "Clone your voice so AI can generate affirmations in YOUR voice",
    tier: "elite",
    category: "ai",
  },
  {
    id: "ai_coaching_feedback",
    name: "AI Delivery Coaching",
    description: "AI analyzes your tone/energy and coaches you to speak with more conviction",
    tier: "elite",
    category: "ai",
  },
  {
    id: "background_soundscapes",
    name: "Background Soundscapes",
    description: "Layer nature sounds, binaural beats, or lo-fi under your affirmations",
    tier: "elite",
    category: "audio",
  },
  {
    id: "multiple_frequencies",
    name: "Multiple Healing Frequencies",
    description: "Choose from 417Hz, 528Hz, 639Hz, 741Hz, 852Hz solfeggio frequencies",
    tier: "elite",
    category: "audio",
  },
  {
    id: "daily_program_scheduler",
    name: "Daily Program Scheduler",
    description: "Schedule specific affirmation tracks to play at set times (morning/night routines)",
    tier: "elite",
    category: "personalization",
  },
  {
    id: "progress_tracking",
    name: "Progress & Streak Tracking",
    description: "Track daily listening streaks, total hours, and consistency metrics",
    tier: "elite",
    category: "personalization",
  },
  {
    id: "cloud_sync",
    name: "Cloud Library Sync",
    description: "Sync affirmation library across devices via cloud storage",
    tier: "elite",
    category: "library",
  },
  {
    id: "share_tracks",
    name: "Share Tracks",
    description: "Share finished affirmation programs with others or on social media",
    tier: "elite",
    category: "export",
  },
  {
    id: "subliminal_mode",
    name: "Subliminal Layering",
    description: "Lower voice volume beneath conscious hearing for subliminal programming",
    tier: "elite",
    category: "audio",
  },
  {
    id: "batch_export",
    name: "Batch Export All Tracks",
    description: "Export entire library as a zip of WAV/MP3 files",
    tier: "elite",
    category: "export",
  },
];

// ─── Helper for future gating ────────────────────────────
const TIER_RANK: Record<FeatureTier, number> = { free: 0, pro: 1, elite: 2 };

export function canAccess(userTier: FeatureTier, featureId: string): boolean {
  const feature = FEATURE_TIERS.find((f) => f.id === featureId);
  if (!feature) return false;
  return TIER_RANK[userTier] >= TIER_RANK[feature.tier];
}

export function getFeaturesByTier(tier: FeatureTier): FeatureDefinition[] {
  return FEATURE_TIERS.filter((f) => f.tier === tier);
}

export function getFeaturesUpToTier(tier: FeatureTier): FeatureDefinition[] {
  return FEATURE_TIERS.filter((f) => TIER_RANK[f.tier] <= TIER_RANK[tier]);
}
