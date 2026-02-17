import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { items, goal } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "No library items provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If no goal, do a smart random selection
    if (!goal || goal.trim() === "") {
      const shuffled = [...items].sort(() => Math.random() - 0.5);
      // Pick a balanced subset: at least 3, at most all
      const count = Math.min(items.length, Math.max(3, Math.ceil(items.length * 0.6)));
      const selectedIds = shuffled.slice(0, count).map((i: any) => i.id);
      return new Response(JSON.stringify({ selectedIds }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Goal-based: use AI to pick the best matching items
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const itemSummary = items.map((i: any, idx: number) => `${idx}. [${i.id}] "${i.name}" (${i.category})`).join("\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: "You are a personal development coach. Given a user's goal and their library of recorded affirmations, select the most relevant ones and order them for maximum impact. Return only the selected item IDs using the tool provided.",
          },
          {
            role: "user",
            content: `My goal: "${goal}"\n\nMy affirmation library:\n${itemSummary}\n\nPick the best ones for my goal and order them for maximum impact.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "select_track",
              description: "Select and order affirmation IDs for the user's track.",
              parameters: {
                type: "object",
                properties: {
                  selectedIds: {
                    type: "array",
                    items: { type: "string" },
                    description: "Ordered array of affirmation IDs to include in the track",
                  },
                },
                required: ["selectedIds"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "select_track" } },
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
    let selectedIds: string[] = [];

    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        selectedIds = parsed.selectedIds || [];
      } catch {
        // Fallback: return all items
        selectedIds = items.map((i: any) => i.id);
      }
    }

    // Filter to only valid IDs
    const validIds = new Set(items.map((i: any) => i.id));
    selectedIds = selectedIds.filter((id) => validIds.has(id));

    if (selectedIds.length === 0) {
      selectedIds = items.map((i: any) => i.id);
    }

    return new Response(JSON.stringify({ selectedIds }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("build-track error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
