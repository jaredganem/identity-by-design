import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Loader2, TrendingUp, MessageSquareQuote, Target, Flame, Heart, Sparkles } from "lucide-react";

interface TrendAnalysis {
  summary?: string;
  totalCount?: number;
  categoryBreakdown?: Record<string, number>;
  themes?: { theme: string; frequency: string; description: string }[];
  powerPhrases?: { phrase: string; context: string }[];
  painPoints?: { pain: string; frequency: string; marketingAngle: string }[];
  pleasurePoints?: { desire: string; frequency: string; marketingAngle: string }[];
  goals?: { goal: string; category: string }[];
  languagePatterns?: { word: string; usage: string }[];
  periodDays?: number;
  parseError?: boolean;
  raw?: string;
  error?: string;
}

const FreqBadge = ({ freq }: { freq: string }) => {
  const colors: Record<string, string> = {
    high: "bg-destructive/20 text-destructive",
    medium: "bg-primary/20 text-primary",
    low: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium ${colors[freq] || colors.low}`}>
      {freq}
    </span>
  );
};

const AdminInsights = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<TrendAnalysis | null>(null);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setAuthorized(false);
      return;
    }
    // Server-side role verification using existing RPC
    const { data, error } = await supabase.rpc('has_role', {
      _user_id: session.user.id,
      _role: 'admin' as const,
    });
    if (error || !data) {
      setAuthorized(false);
      return;
    }
    setAuthorized(data === true);
  };

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-trends", {
        body: { days },
      });
      if (error) throw error;
      setAnalysis(data);
    } catch (e: any) {
      setAnalysis({ error: e?.message || "Failed to analyze. Are you an admin?" });
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!analysis) return;
    const rows = [
      ["Section", "Item", "Detail", "Frequency/Category"],
      ...(analysis.themes || []).map(t => ["Theme", t.theme, t.description, t.frequency]),
      ...(analysis.powerPhrases || []).map(p => ["Power Phrase", p.phrase, p.context, ""]),
      ...(analysis.painPoints || []).map(p => ["Pain Point", p.pain, p.marketingAngle, p.frequency]),
      ...(analysis.pleasurePoints || []).map(p => ["Desire", p.desire, p.marketingAngle, p.frequency]),
      ...(analysis.goals || []).map(g => ["Goal", g.goal, "", g.category]),
      ...(analysis.languagePatterns || []).map(l => ["Language", l.word, l.usage, ""]),
    ];
    const csv = rows.map(r => r.map(c => `"${(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `smfm-insights-${days}d-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Loading state while checking auth
  if (authorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (authorized === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-display text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">You must be logged in as an admin.</p>
          <Button variant="outline" onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-display">Marketing Intelligence</h1>
              <p className="text-sm text-muted-foreground">Anonymous affirmation trend analysis</p>
            </div>
          </div>
          {analysis && !analysis.error && (
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                days === d ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {d}d
            </button>
          ))}
          <Button onClick={runAnalysis} disabled={loading} className="ml-auto">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {loading ? "Analyzing..." : "Run Analysis"}
          </Button>
        </div>

        {/* Error */}
        {analysis?.error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {analysis.error}
          </div>
        )}

        {/* Results */}
        {analysis && !analysis.error && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            {/* Summary */}
            <div className="rounded-2xl border border-border bg-gradient-card p-6 space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="w-4 h-4" />
                <span>{analysis.totalCount} transcripts analyzed • Last {analysis.periodDays} days</span>
              </div>
              <p className="text-foreground leading-relaxed">{analysis.summary}</p>

              {/* Category Breakdown */}
              {analysis.categoryBreakdown && Object.keys(analysis.categoryBreakdown).length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {Object.entries(analysis.categoryBreakdown)
                    .sort(([, a], [, b]) => b - a)
                    .map(([cat, count]) => (
                      <span key={cat} className="text-xs bg-muted px-3 py-1 rounded-full">
                        {cat}: {count}
                      </span>
                    ))}
                </div>
              )}
            </div>

            {/* Power Phrases */}
            {analysis.powerPhrases && analysis.powerPhrases.length > 0 && (
              <Section icon={<MessageSquareQuote className="w-5 h-5 text-primary" />} title="🔥 Power Phrases" subtitle="Marketing-worthy language from real users">
                <div className="grid gap-3 sm:grid-cols-2">
                  {analysis.powerPhrases.map((p, i) => (
                    <div key={i} className="rounded-xl border border-border bg-background p-4 space-y-1">
                      <p className="font-display text-foreground">"{p.phrase}"</p>
                      <p className="text-xs text-muted-foreground">{p.context}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Pain Points */}
            {analysis.painPoints && analysis.painPoints.length > 0 && (
              <Section icon={<Flame className="w-5 h-5 text-destructive" />} title="😤 Pain Points" subtitle="What men are struggling with">
                <div className="space-y-3">
                  {analysis.painPoints.map((p, i) => (
                    <div key={i} className="rounded-xl border border-border bg-background p-4 flex items-start gap-3">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{p.pain}</span>
                          <FreqBadge freq={p.frequency} />
                        </div>
                        <p className="text-xs text-muted-foreground">💡 {p.marketingAngle}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Desires / Pleasure Points */}
            {analysis.pleasurePoints && analysis.pleasurePoints.length > 0 && (
              <Section icon={<Heart className="w-5 h-5 text-primary" />} title="🎯 Desires & Aspirations" subtitle="What men want to become/achieve">
                <div className="space-y-3">
                  {analysis.pleasurePoints.map((p, i) => (
                    <div key={i} className="rounded-xl border border-border bg-background p-4 flex items-start gap-3">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{p.desire}</span>
                          <FreqBadge freq={p.frequency} />
                        </div>
                        <p className="text-xs text-muted-foreground">💡 {p.marketingAngle}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Themes */}
            {analysis.themes && analysis.themes.length > 0 && (
              <Section icon={<TrendingUp className="w-5 h-5 text-primary" />} title="📊 Top Themes" subtitle="Recurring topics across all recordings">
                <div className="grid gap-3 sm:grid-cols-2">
                  {analysis.themes.map((t, i) => (
                    <div key={i} className="rounded-xl border border-border bg-background p-4 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{t.theme}</span>
                        <FreqBadge freq={t.frequency} />
                      </div>
                      <p className="text-xs text-muted-foreground">{t.description}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Goals */}
            {analysis.goals && analysis.goals.length > 0 && (
              <Section icon={<Target className="w-5 h-5 text-primary" />} title="🏆 Specific Goals" subtitle="What men are programming into their identity">
                <div className="flex flex-wrap gap-2">
                  {analysis.goals.map((g, i) => (
                    <span key={i} className="text-sm bg-muted px-3 py-1.5 rounded-full">
                      {g.goal} <span className="text-muted-foreground text-xs">({g.category})</span>
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* Language Patterns */}
            {analysis.languagePatterns && analysis.languagePatterns.length > 0 && (
              <Section icon={<Sparkles className="w-5 h-5 text-primary" />} title="💎 Unique Language" subtitle="Distinctive words and slang for branding">
                <div className="grid gap-3 sm:grid-cols-2">
                  {analysis.languagePatterns.map((l, i) => (
                    <div key={i} className="rounded-xl border border-border bg-background p-4 space-y-1">
                      <p className="font-display text-foreground text-lg">{l.word}</p>
                      <p className="text-xs text-muted-foreground">{l.usage}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </motion.div>
        )}

        {/* Empty state */}
        {!analysis && !loading && (
          <div className="text-center py-20 space-y-3">
            <TrendingUp className="w-12 h-12 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground">Select a time range and hit "Run Analysis" to mine user affirmations for marketing gold.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const Section = ({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2">
      {icon}
      <div>
        <h2 className="font-display text-lg text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
    {children}
  </div>
);

export default AdminInsights;
