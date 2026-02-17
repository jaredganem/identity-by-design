import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CATEGORIES = [
  { id: "health", category: "Physical Health & Vitality", slots: ["health-1", "health-2"] },
  { id: "wealth", category: "Financial Sovereignty", slots: ["wealth-1", "wealth-2"] },
  { id: "relationships", category: "Relationship Mastery", slots: ["relationships-1", "relationships-2"] },
  { id: "career", category: "Mission & Career", slots: ["career-1", "career-2"] },
  { id: "leadership", category: "Leadership & Influence", slots: ["leadership-1", "leadership-2"] },
  { id: "personal", category: "Identity & Character", slots: ["personal-1", "personal-2"] },
];

function buildAdvancedPrompt(intake: Record<string, string>): string {
  const sections = [
    { key: "outcomes", label: "DESIRED OUTCOMES & ACHIEVEMENTS" },
    { key: "identity_gaps", label: "IDENTITY GAPS (who they're NOT being but WANT to be, do, or have)" },
    { key: "blockers", label: "TOP BLOCKERS & LIMITING BELIEFS" },
    { key: "peak_identity", label: "PEAK IDENTITY (who they are at their best)" },
    { key: "negative_patterns", label: "NEGATIVE PATTERNS TO REFRAME (anger, doubt, etc.)" },
  ];

  return sections
    .map((s) => `### ${s.label}\n${intake[s.key] || "(not provided)"}`)
    .join("\n\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { goals, advancedIntake } = body;
    const isAdvanced = !!advancedIntake && typeof advancedIntake === "object";

    if (!isAdvanced && (!goals || typeof goals !== "string" || goals.trim().length === 0)) {
      return new Response(JSON.stringify({ error: "No goals provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const slotList = CATEGORIES.flatMap((c) =>
      c.slots.map((s) => `${s} (${c.category})`)
    ).join("\n");

    const userContent = isAdvanced
      ? `Here is my deep-dive identity intake:\n\n${buildAdvancedPrompt(advancedIntake)}\n\nWrite personalized affirmations for these 12 slots:\n${slotList}`
      : `Here are my goals and outcomes:\n\n"${goals}"\n\nWrite personalized affirmations for these 12 slots:\n${slotList}`;

    const systemPrompt = isAdvanced
      ? `You are an elite masculine identity coach writing deeply personalized affirmations for men.

This man completed a 5-step identity deep-dive. You have:
1. His desired outcomes and achievements
2. His identity gaps — who he's NOT being but WANTS to be
3. His top blockers and limiting beliefs
4. His peak identity — who he is at his BEST
5. His negative patterns (anger, frustration, doubt, etc.)

Rules:
- Every affirmation MUST start with "I am now" and be written in present tense as if it's already true.
- CRITICALLY IMPORTANT: Take EVERY negative pattern and blocker and REFRAME it as its empowered positive opposite. If he says "anger" → "I am now calm, grounded, and in total command of my emotional state." If he says "self-doubt" → "I am now operating with unwavering self-belief and rock-solid conviction."
- Anchor affirmations to his PEAK IDENTITY — weave in exactly who he described being at his best.
- Address his SPECIFIC blockers by name, reframed as conquered.
- Be specific and vivid. Include numbers, dates, and concrete details when provided.
- Keep each affirmation 1-3 sentences. Powerful, direct, no fluff.
- Match each affirmation to its category. Make them feel like a man wrote them for himself.
- If a category isn't directly mentioned, create a powerful affirmation that still aligns with his overall identity shift.

Return the affirmations using the tool provided.`
      : `You are a masculine self-mastery coach writing identity affirmations for men.

Rules:
- Every affirmation MUST start with "I am now" and be written in present tense as if it's already true.
- Be specific and vivid. Include numbers, dates, and concrete details when the user provides them.
- Keep each affirmation 1-3 sentences. Powerful, direct, no fluff.
- Match each affirmation to its category. Make them feel like a man wrote them for himself.
- Adapt to the user's specific goals — weave their exact words and targets into the affirmations.
- If the user doesn't mention a category, still write a strong generic affirmation for it.

Return the affirmations using the tool provided.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: isAdvanced ? "google/gemini-2.5-flash" : "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "set_affirmations",
              description: "Set the personalized affirmation text for each slot.",
              parameters: {
                type: "object",
                properties: Object.fromEntries(
                  CATEGORIES.flatMap((c) =>
                    c.slots.map((s) => [s, { type: "string", description: `Affirmation for ${c.category}` }])
                  )
                ),
                required: CATEGORIES.flatMap((c) => c.slots),
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "set_affirmations" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let affirmations: Record<string, string> = {};

    if (toolCall?.function?.arguments) {
      try {
        affirmations = JSON.parse(toolCall.function.arguments);
      } catch {
        throw new Error("Failed to parse AI response");
      }
    }

    return new Response(JSON.stringify({ affirmations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("personalize-prompts error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
