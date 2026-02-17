import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the user is admin
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch transcripts (last 30 days by default)
    const body = req.method === "POST" ? await req.json() : {};
    const days = body.days || 30;
    const since = new Date(Date.now() - days * 86400000).toISOString();

    const { data: transcripts, error: fetchErr } = await supabase
      .from("affirmation_transcripts")
      .select("transcript_text, category, source, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(2000);

    if (fetchErr) throw fetchErr;

    if (!transcripts || transcripts.length === 0) {
      return new Response(
        JSON.stringify({
          summary: "No transcripts found for this period.",
          totalCount: 0,
          themes: [],
          powerPhrases: [],
          painPoints: [],
          goals: [],
          categoryBreakdown: {},
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build prompt for AI analysis
    const allTexts = transcripts.map((t) => t.transcript_text).join("\n---\n");
    const categoryList = transcripts
      .filter((t) => t.category)
      .map((t) => t.category);

    const categoryCounts: Record<string, number> = {};
    categoryList.forEach((c) => {
      categoryCounts[c!] = (categoryCounts[c!] || 0) + 1;
    });

    const analysisPrompt = `You are a marketing analyst for a men's personal development brand called "Self-Mastery for Men™". 

Analyze these ${transcripts.length} affirmation recordings from users (anonymized). Extract actionable marketing intelligence.

AFFIRMATION TRANSCRIPTS:
${allTexts}

Return a JSON object with these fields:
1. "themes" — array of top 10 recurring themes/topics (e.g., "financial freedom", "confidence", "discipline"). Each: { "theme": string, "frequency": "high"|"medium"|"low", "description": string }
2. "powerPhrases" — array of 15-20 standout marketing-worthy phrases users actually said. These should be punchy, emotionally resonant language you could use in ads/copy. Each: { "phrase": string, "context": string }
3. "painPoints" — array of 10 problems/frustrations men are expressing. Each: { "pain": string, "frequency": "high"|"medium"|"low", "marketingAngle": string }
4. "pleasurePoints" — array of 10 desired outcomes/aspirations. Each: { "desire": string, "frequency": "high"|"medium"|"low", "marketingAngle": string }
5. "goals" — array of 10 specific goals men are setting. Each: { "goal": string, "category": string }
6. "languagePatterns" — array of 8 unique words/slang/phrases that are distinctive and could be used in branding. Each: { "word": string, "usage": string }
7. "summary" — 3-4 sentence executive summary of what men are focused on right now

Return ONLY valid JSON, no markdown.`;

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const aiResponse = await fetch("https://ai-gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: analysisPrompt }],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`AI request failed: ${errText}`);
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || "";

    // Strip markdown code fences if present
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch {
      analysis = { raw: content, parseError: true };
    }

    return new Response(
      JSON.stringify({
        ...analysis,
        totalCount: transcripts.length,
        categoryBreakdown: categoryCounts,
        periodDays: days,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("analyze-trends error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
