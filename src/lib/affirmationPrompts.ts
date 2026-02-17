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
      { id: "health-1", suggestion: "EXAMPLE: I am now 180 lbs at 10% body fat by [date]. I prioritize my health and wellness every single day." },
      { id: "health-2", suggestion: "EXAMPLE: I am now the kind of man who treats his body like a weapon. I train hard, eat clean, and recover smart." },
    ],
  },
  {
    category: "Financial Sovereignty",
    icon: "🏛️",
    count: 2,
    slots: [
      { id: "wealth-1", suggestion: "EXAMPLE: I am now generating $[amount] per month in revenue by [date]. Money flows to me because I create massive value." },
      { id: "wealth-2", suggestion: "EXAMPLE: I am now 100% debt-free and financially sovereign. I make decisions from abundance, never from scarcity." },
    ],
  },
  {
    category: "Relationship Mastery",
    icon: "🤝",
    count: 2,
    slots: [
      { id: "relationships-1", suggestion: "EXAMPLE: I am now in a deeply aligned relationship built on trust, growth, and shared mission." },
      { id: "relationships-2", suggestion: "EXAMPLE: I am now the kind of man who attracts high-quality people because I am a high-quality man." },
    ],
  },
  {
    category: "Mission & Career",
    icon: "🎯",
    count: 2,
    slots: [
      { id: "career-1", suggestion: "EXAMPLE: I am now building a business that generates six figures annually doing work that sets my soul on fire." },
      { id: "career-2", suggestion: "EXAMPLE: I am now the kind of man who takes decisive action every day toward his mission. I don't wait. I execute." },
    ],
  },
  {
    category: "Leadership & Influence",
    icon: "🧭",
    count: 2,
    slots: [
      { id: "leadership-1", suggestion: "EXAMPLE: I am now the kind of man who commands a room with calm authority. People trust my judgment and follow my lead." },
      { id: "leadership-2", suggestion: "EXAMPLE: I am now a powerful communicator who influences outcomes and inspires others through clarity and conviction." },
    ],
  },
  {
    category: "Identity & Character",
    icon: "🛡️",
    count: 2,
    slots: [
      { id: "personal-1", suggestion: "EXAMPLE: I am now the kind of man who does what he says he's going to do. My word is my bond." },
      { id: "personal-2", suggestion: "EXAMPLE: I am now fully congruent — my thoughts, words, and actions are in complete alignment." },
    ],
  },
];

export const getAllSlots = (): AffirmationSlot[] =>
  AFFIRMATION_CATEGORIES.flatMap((c) => c.slots);
