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
    category: "Physical Dominance",
    icon: "⚔️",
    count: 2,
    slots: [
      { id: "health-1", suggestion: "I am now 180 lbs at 10% body fat by [date]. I prioritize my health and wellness every single day." },
      { id: "health-2", suggestion: "I am the kind of man who treats his body like a weapon. I train hard, eat clean, and recover smart." },
    ],
  },
  {
    category: "Financial Sovereignty",
    icon: "🏛️",
    count: 2,
    slots: [
      { id: "wealth-1", suggestion: "I am now generating $[amount] per month in revenue by [date]. Money flows to me because I create massive value." },
      { id: "wealth-2", suggestion: "I am 100% debt-free and financially sovereign. I make decisions from abundance, never from scarcity." },
    ],
  },
  {
    category: "Relationship Mastery",
    icon: "🤝",
    count: 2,
    slots: [
      { id: "relationships-1", suggestion: "I am now in a deeply aligned relationship built on trust, growth, and shared mission." },
      { id: "relationships-2", suggestion: "I am the kind of man who attracts high-quality people because I am a high-quality man." },
    ],
  },
  {
    category: "Mission & Career",
    icon: "🎯",
    count: 2,
    slots: [
      { id: "career-1", suggestion: "I am now building a business that generates six figures annually doing work that sets my soul on fire." },
      { id: "career-2", suggestion: "I am the kind of man who takes decisive action every day toward his mission. I don't wait. I execute." },
    ],
  },
  {
    category: "Identity & Character",
    icon: "🛡️",
    count: 4,
    slots: [
      { id: "personal-1", suggestion: "I am the kind of man who does what he says he's going to do. My word is my bond." },
      { id: "personal-2", suggestion: "I am now fully congruent — my thoughts, words, and actions are in complete alignment." },
      { id: "personal-3", suggestion: "I am mentally, emotionally, physically, and spiritually aligned with my highest self." },
      { id: "personal-4", suggestion: "I am the kind of man who leads by example. I walk my talk and others follow." },
    ],
  },
];

export const getAllSlots = (): AffirmationSlot[] =>
  AFFIRMATION_CATEGORIES.flatMap((c) => c.slots);
