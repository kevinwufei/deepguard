import { useState } from 'react';
import { useEffect } from 'react';
import { QuotaExceededModal, useQuotaCheck } from '@/components/QuotaGuard';
import { FileText, FlaskConical, AlertTriangle, CheckCircle2, HelpCircle, Loader2, RotateCcw, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

type Verdict = 'human' | 'mixed' | 'ai_generated';
type DetectionResult = {
  riskScore: number;
  verdict: Verdict;
  confidence: number;
  detectors: Array<{ name: string; score: number; verdict: string }>;
  sentences: Array<{ text: string; aiProbability: number }>;
  possibleModels: string[];
  summary: string;
};

function VerdictBadge({ verdict }: { verdict: Verdict }) {
  if (verdict === 'human') return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-semibold">
      <CheckCircle2 className="w-4 h-4" /> Human Written
    </span>
  );
  if (verdict === 'mixed') return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-sm font-semibold">
      <HelpCircle className="w-4 h-4" /> Mixed Content
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-sm font-semibold">
      <AlertTriangle className="w-4 h-4" /> AI Generated
    </span>
  );
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

function SentenceHighlight({ sentences }: { sentences: Array<{ text: string; aiProbability: number }> }) {
  if (!sentences.length) return null;
  return (
    <div className="space-y-1.5">
      {sentences.map((s, i) => {
        const prob = s.aiProbability;
        const bg = prob >= 70 ? 'bg-rose-500/20 border-rose-500/30' :
                   prob >= 40 ? 'bg-amber-500/15 border-amber-500/25' :
                   'bg-emerald-500/10 border-emerald-500/20';
        const label = prob >= 70 ? `${prob}% AI` : prob >= 40 ? `${prob}% mixed` : `${prob}% human`;
        const labelColor = prob >= 70 ? 'text-rose-400' : prob >= 40 ? 'text-amber-400' : 'text-emerald-400';
        return (
          <div key={i} className={`flex items-start gap-3 p-2.5 rounded-lg border ${bg}`}>
            <span className={`text-[10px] font-bold whitespace-nowrap mt-0.5 ${labelColor}`}>{label}</span>
            <p className="text-sm text-foreground leading-relaxed">{s.text}</p>
          </div>
        );
      })}
    </div>
  );
}

export default function TextDetect() {
  const { t } = useTranslation();
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [showSentences, setShowSentences] = useState(true);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState<{ used: number; limit: number; isLoggedIn: boolean } | null>(null);
  const { checkAndEnforce } = useQuotaCheck();

  useEffect(() => {
    document.title = 'AI Text Detector - DeepGuard';
  }, []);

  const analyze = trpc.detection.analyzeText.useMutation({
    onSuccess: (data) => {
      setResult(data as DetectionResult);
    },
    onError: (err) => {
      toast.error('Analysis failed: ' + err.message);
    },
  });

  const wordCount = inputText.trim().split(/\s+/).filter(Boolean).length;
  const charCount = inputText.length;

  const handleAnalyze = async () => {
    if (inputText.trim().length < 50) {
      toast.error('Please enter at least 50 characters for accurate analysis.');
      return;
    }
    // Check quota before analyzing
    const { allowed, quotaInfo: qi } = await checkAndEnforce();
    if (!allowed) {
      setQuotaExceeded(true);
      setQuotaInfo(qi ?? null);
      return;
    }
    analyze.mutate({ text: inputText });
  };

  const handleReset = () => {
    setInputText('');
    setResult(null);
  };

  const getScoreColor = (score: number) =>
    score >= 70 ? 'bg-gradient-to-r from-rose-500 to-rose-600' :
    score >= 40 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
    'bg-gradient-to-r from-emerald-400 to-emerald-500';

  const getScoreTextColor = (score: number) =>
    score >= 70 ? 'text-rose-400' : score >= 40 ? 'text-amber-400' : 'text-emerald-400';

  return (
    <>
    <div className="min-h-screen pt-20 pb-16">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm font-medium mb-4">
            <FileText className="w-3.5 h-3.5" />
            <span>{t('text_page_title')}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Detect AI-Generated Text
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Paste any text — articles, essays, emails, messages. Four detection models run in parallel to identify ChatGPT, Claude, Gemini, and other AI writing.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Input panel */}
          <div className="lg:col-span-3 space-y-4">
            <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                <span className="text-sm font-medium text-foreground">Paste your text here</span>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{wordCount} words</span>
                  <span>{charCount} / 10,000</span>
                </div>
              </div>
              <textarea
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Paste any text you want to check for AI generation. Minimum 50 characters for accurate results.

Example: Paste an article, email, essay, or any written content here..."
                className="w-full h-64 p-4 bg-transparent text-foreground text-sm leading-relaxed resize-none outline-none placeholder:text-muted-foreground/50"
                maxLength={10000}
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleAnalyze}
                disabled={analyze.isPending || charCount < 50}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              >
                {analyze.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing with 4 detectors...</>
                ) : (
                  <><FlaskConical className="w-4 h-4" /> Analyze Text</>
                )}
              </Button>
              {(inputText || result) && (
                <Button variant="outline" onClick={handleReset} className="gap-2">
                  <RotateCcw className="w-4 h-4" /> Reset
                </Button>
              )}
            </div>

            {charCount < 50 && charCount > 0 && (
              <p className="text-xs text-amber-400">{50 - charCount} more characters needed for analysis.</p>
            )}

            {/* Detector badges */}
            <div className="p-4 rounded-xl border border-border/40 bg-card/40">
              <p className="text-xs text-muted-foreground mb-3 font-medium">Running detectors:</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'GPT/LLM Detector', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                  { name: 'Perplexity Analyzer', color: 'text-blue-400', bg: 'bg-blue-500/10' },
                  { name: 'Burstiness Detector', color: 'text-violet-400', bg: 'bg-violet-500/10' },
                  { name: 'Stylometric Analyzer', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                ].map(d => (
                  <div key={d.name} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${d.bg}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${d.color.replace('text-', 'bg-')}`} />
                    <span className={`text-xs font-medium ${d.color}`}>{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Results panel */}
          <div className="lg:col-span-2 space-y-4">
            {!result && !analyze.isPending && (
              <div className="h-full flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground text-sm">Results will appear here after analysis</p>
              </div>
            )}

            {analyze.isPending && (
              <div className="h-full flex flex-col items-center justify-center py-16 text-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-foreground font-medium mb-1">Analyzing text...</p>
                <p className="text-muted-foreground text-xs">Running 4 detection models in parallel</p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {/* Overall score */}
                <div className="p-5 rounded-xl border border-border/60 bg-card">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-muted-foreground">AI Probability</span>
                    <VerdictBadge verdict={result.verdict} />
                  </div>
                  <div className={`text-5xl font-bold mb-3 ${getScoreTextColor(result.riskScore)}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {result.riskScore}%
                  </div>
                  <ScoreBar score={result.riskScore} color={getScoreColor(result.riskScore)} />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">Confidence: <span className="text-foreground font-medium">{result.confidence}%</span></span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs gap-1 text-muted-foreground hover:text-foreground"
                      onClick={() => { navigator.clipboard.writeText(`AI Probability: ${result.riskScore}% | Verdict: ${result.verdict} | Confidence: ${result.confidence}%`); toast.success('Copied!'); }}
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </Button>
                  </div>
                </div>

                {/* Per-detector scores */}
                <div className="p-4 rounded-xl border border-border/60 bg-card">
                  <p className="text-xs font-medium text-muted-foreground mb-3">Detector Breakdown</p>
                  <div className="space-y-3">
                    {result.detectors.map((d, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-foreground">{d.name}</span>
                          <span className={`text-xs font-bold ${getScoreTextColor(d.score)}`}>{d.score}%</span>
                        </div>
                        <ScoreBar score={d.score} color={getScoreColor(d.score)} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Possible models */}
                {result.possibleModels.length > 0 && (
                  <div className="p-4 rounded-xl border border-border/60 bg-card">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Possible Source Models</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.possibleModels.map(m => (
                        <span key={m} className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">{m}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary */}
                {result.summary && (
                  <div className="p-4 rounded-xl border border-border/60 bg-card">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Analysis Summary</p>
                    <p className="text-sm text-foreground leading-relaxed">{result.summary}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sentence-level analysis (full width below) */}
        {result && result.sentences.length > 0 && (
          <div className="mt-6 p-5 rounded-xl border border-border/60 bg-card">
            <button
              onClick={() => setShowSentences(!showSentences)}
              className="flex items-center justify-between w-full text-left"
            >
              <div>
                <p className="font-medium text-foreground">Sentence-Level Analysis</p>
                <p className="text-xs text-muted-foreground mt-0.5">Each sentence highlighted by AI probability</p>
              </div>
              {showSentences ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            {showSentences && (
              <div className="mt-4">
                <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-500/30 inline-block" /> High AI (≥70%)</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500/20 inline-block" /> Mixed (40-69%)</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500/15 inline-block" /> Human (&lt;40%)</span>
                </div>
                <SentenceHighlight sentences={result.sentences} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>

    {/* Quota exceeded modal */}
    <QuotaExceededModal
      open={quotaExceeded}
      onClose={() => setQuotaExceeded(false)}
      isLoggedIn={quotaInfo?.isLoggedIn ?? false}
      used={quotaInfo?.used ?? 0}
      limit={quotaInfo?.limit ?? 3}
    />
    </>
  );
}
