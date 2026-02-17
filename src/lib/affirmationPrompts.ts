export interface AffirmationSlot {
  id: string;
  suggestion: string;
}

export interface AffirmationCategory {
  category: string;
  icon: string;
  count: number;
  slots: AffirmationSlot[];
}

export const AFFIRMATION_CATEGORIES: AffirmationCategory[] = [
  {
    category: "Physical Health & Vitality",
    icon: "💪",
    count: 2,
    slots: [
      { id: "health-1", suggestion: "SAMPLE: I am now [weight] at [body fat %] by [January 1, 2026]. I take care of my body the way an athlete does — because that's who I am." },
      { id: "health-2", suggestion: "SAMPLE: I am now the kind of man who trains hard, eats clean, and recovers smart. My body is a weapon I sharpen every single day." },
    ],
  },
  {
    category: "Financial Sovereignty",
    icon: "🏛️",
    count: 2,
    slots: [
      { id: "wealth-1", suggestion: "SAMPLE: I am now generating $[amount] per month by [date]. Money flows to me because I solve real problems for real people." },
      { id: "wealth-2", suggestion: "SAMPLE: I am now 100% debt-free and financially sovereign. Every decision I make comes from abundance, never from fear." },
    ],
  },
  {
    category: "Relationship Mastery",
    icon: "🤝",
    count: 2,
    slots: [
      { id: "relationships-1", suggestion: "SAMPLE: I am now in a deeply aligned relationship built on trust, growth, and shared mission. I show up fully — no walls, no games." },
      { id: "relationships-2", suggestion: "SAMPLE: I am now the kind of man who attracts high-quality people because I hold myself to a higher standard than anyone else would." },
    ],
  },
  {
    category: "Mission & Career",
    icon: "🎯",
    count: 2,
    slots: [
      { id: "career-1", suggestion: "SAMPLE: I am now building something that generates six figures doing work that sets my soul on fire. My mission is clear and I execute on it daily." },
      { id: "career-2", suggestion: "SAMPLE: I am now the kind of man who doesn't wait for permission. I see what needs to be done and I do it. Decisiveness is my default." },
    ],
  },
  {
    category: "Leadership & Influence",
    icon: "🧭",
    count: 2,
    slots: [
      { id: "leadership-1", suggestion: "SAMPLE: I am now the kind of man who commands a room with calm authority. People trust my judgment because I trust myself first." },
      { id: "leadership-2", suggestion: "SAMPLE: I am now a powerful communicator. When I speak, people listen — not because I'm loud, but because I'm clear and I mean every word." },
    ],
  },
  {
    category: "Identity & Character",
    icon: "🛡️",
    count: 2,
    slots: [
      { id: "personal-1", suggestion: "SAMPLE: I am now the kind of man who does what he says he's going to do. My word is law — to myself first, and to everyone around me." },
      { id: "personal-2", suggestion: "SAMPLE: I am now fully congruent. My thoughts, words, and actions are in complete alignment. There is no gap between who I am and who I appear to be." },
    ],
  },
];

export const getAllSlots = (): AffirmationSlot[] =>
  AFFIRMATION_CATEGORIES.flatMap((c) => c.slots);
