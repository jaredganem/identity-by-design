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
    category: "Health",
    icon: "🌿",
    count: 2,
    slots: [
      { id: "health-1", suggestion: "Every cell in my body vibrates with perfect health and vitality." },
      { id: "health-2", suggestion: "I nourish my body with love and it rewards me with energy and strength." },
    ],
  },
  {
    category: "Wealth",
    icon: "✨",
    count: 2,
    slots: [
      { id: "wealth-1", suggestion: "Abundance flows freely and effortlessly into my life." },
      { id: "wealth-2", suggestion: "I am a powerful magnet for prosperity and financial freedom." },
    ],
  },
  {
    category: "Relationships",
    icon: "💛",
    count: 2,
    slots: [
      { id: "relationships-1", suggestion: "I attract loving, supportive, and authentic connections." },
      { id: "relationships-2", suggestion: "My relationships are filled with trust, joy, and deep understanding." },
    ],
  },
  {
    category: "Career",
    icon: "🚀",
    count: 2,
    slots: [
      { id: "career-1", suggestion: "I am confidently stepping into my highest professional purpose." },
      { id: "career-2", suggestion: "Success and recognition flow to me through work I love." },
    ],
  },
  {
    category: "Personal Growth",
    icon: "🔮",
    count: 4,
    slots: [
      { id: "personal-1", suggestion: "I am worthy of love, success, and happiness exactly as I am." },
      { id: "personal-2", suggestion: "I release all fear and embrace my limitless potential." },
      { id: "personal-3", suggestion: "My confidence grows stronger with each passing day." },
      { id: "personal-4", suggestion: "I trust my intuition and honor my authentic self." },
    ],
  },
];

export const getAllSlots = (): AffirmationSlot[] =>
  AFFIRMATION_CATEGORIES.flatMap((c) => c.slots);
