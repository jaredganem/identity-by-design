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
    const { audioBase64, mimeType } = await req.json();

    if (!audioBase64) {
      return new Response(JSON.stringify({ error: "No audio provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
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
              content:
                "You transcribe short audio clips of spoken affirmations. Return ONLY the transcribed text, nothing else. If the text is longer than 50 characters, abbreviate it naturally — keep the key meaning and cut at a word boundary, ending with '…'. Do not add quotes, labels, or explanations. If you cannot hear anything, return 'Untitled Clip'.",
            },
            {
              role: "user",
              content: [
                {
                  type: "input_audio",
                  input_audio: {
                    data: audioBase64,
                    format: mimeType?.includes("webm") ? "webm" : "wav",
                  },
                },
                {
                  type: "text",
                  text: "Transcribe this affirmation clip and return a short name for it.",
                },
              ],
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "classify_affirmation",
                description: "Classify the affirmation into a category.",
                parameters: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "Short transcribed name (max 50 chars)" },
                    category: {
                      type: "string",
                      enum: [
                        "Physical Health & Vitality",
                        "Financial Sovereignty",
                        "Relationship Mastery",
                        "Mission & Career",
                        "Leadership & Influence",
                        "Identity & Character",
                        "Custom",
                      ],
                      description: "Best matching category for this affirmation",
                    },
                  },
                  required: ["name", "category"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "classify_affirmation" } },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited, please try again shortly." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();

    // Handle tool_calls response (structured output)
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let name = "Untitled Clip";
    let category = "Custom";
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        name = parsed.name || "Untitled Clip";
        category = parsed.category || "Custom";
      } catch {
        // fallback to content
        name = data.choices?.[0]?.message?.content?.trim() || "Untitled Clip";
      }
    } else {
      name = data.choices?.[0]?.message?.content?.trim() || "Untitled Clip";
    }

    return new Response(JSON.stringify({ name, category }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("transcribe-clip error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
