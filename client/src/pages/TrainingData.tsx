import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import {
  Database, Download, BarChart3, CheckCircle, XCircle, HelpCircle,
  Image, Video, Mic, FileText, RefreshCw, Lock, ArrowLeft, Layers,
  AlertTriangle, ExternalLink, ChevronRight, Sparkles, ThumbsDown
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number | string; color: string }) {
  return (
    <div className={`p-4 rounded-xl border ${color} bg-slate-800/40`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 opacity-70" />
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{typeof value === 'number' ? value.toLocaleString() : value}</p>
    </div>
  );
}

type MislabeledRecord = {
  id: number;
  type: string;
  fileUrl: string | null;
  fileName: string | null;
  riskScore: number;
  verdict: string;
  feedbackLabel: string | null;
  feedbackNote: string | null;
  feedbackAt: Date | null;
  createdAt: Date;
};

function MislabeledCard({ record }: { record: MislabeledRecord }) {
  const typeIcon: Record<string, React.ElementType> = {
    image: Image, video: Video, audio: Mic, text: FileText,
  };
  const TypeIcon = typeIcon[record.type] ?? FileText;

  const verdictColor = record.verdict === 'deepfake' ? 'text-red-400' :
    record.verdict === 'suspicious' ? 'text-amber-400' : 'text-green-400';

  const labelColor: Record<string, string> = {
    ai_generated: 'bg-red-500/15 text-red-400 border-red-500/30',
    real: 'bg-green-500/15 text-green-400 border-green-500/30',
    deepfake_video: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    ai_audio: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    human_audio: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    ai_text: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    human_text: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  };

  return (
    <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/8 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
            <TypeIcon className="w-4 h-4 text-slate-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{record.fileName || `Record #${record.id}`}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {/* System verdict (wrong) */}
              <span className="text-xs text-slate-500">System said:</span>
              <span className={`text-xs font-semibold ${verdictColor}`}>{record.verdict}</span>
              <span className="text-xs text-slate-500">({record.riskScore}%)</span>
              {/* User correction */}
              {record.feedbackLabel && (
                <>
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span className="text-xs text-slate-500">Actually:</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${labelColor[record.feedbackLabel] ?? 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                    {record.feedbackLabel.replace(/_/g, ' ')}
                  </span>
                </>
              )}
            </div>
            {record.feedbackNote && (
              <p className="text-xs text-slate-400 mt-1.5 italic">"{record.feedbackNote}"</p>
            )}
            <p className="text-[10px] text-slate-600 mt-1">
              Flagged {record.feedbackAt ? new Date(record.feedbackAt).toLocaleDateString() : 'recently'}
            </p>
          </div>
        </div>
        {record.fileUrl && record.type === 'image' && (
          <a
            href={record.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 p-1.5 rounded-lg border border-slate-700 text-slate-500 hover:text-white hover:border-slate-500 transition-colors"
            title="View file"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function TrainingData() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [exported, setExported] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'mislabeled' | 'export'>('overview');

  const stats = trpc.trainingData.stats.useQuery(undefined, {
    enabled: user?.role === 'admin',
    retry: false,
  });

  const mislabeled = trpc.trainingData.mislabeled.useQuery(
    { limit: 200 },
    { enabled: user?.role === 'admin' && activeTab === 'mislabeled', retry: false }
  );

  const exportData = trpc.trainingData.export.useQuery(
    { limit: 5000 },
    { enabled: false, retry: false }
  );

  // ── Auth guards ──────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
        <div className="text-center">
          <Lock className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400">Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
        <div className="text-center">
          <Lock className="w-12 h-12 text-red-500/50 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">Admin Access Required</h2>
          <p className="text-slate-400 mb-6">This page is only accessible to platform administrators.</p>
          <Link href="/">
            <Button variant="outline" className="gap-2 border-slate-600">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Export handlers ──────────────────────────────────────────────────────────
  const handleExportCSV = async () => {
    const result = await exportData.refetch();
    if (!result.data) return;
    const rows = result.data;
    const headers = ['id', 'type', 'fileName', 'fileUrl', 'riskScore', 'verdict', 'userFeedback', 'feedbackLabel', 'feedbackNote', 'feedbackAt', 'createdAt'];
    const csvContent = [
      headers.join(','),
      ...rows.map(r => headers.map(h => {
        const val = r[h as keyof typeof r];
        if (val === null || val === undefined) return '';
        const str = String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deepguard-training-data-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
  };

  const handleExportJSON = async () => {
    const result = await exportData.refetch();
    if (!result.data) return;
    const jsonContent = JSON.stringify(result.data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deepguard-training-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMislabeledJSON = async () => {
    const result = await mislabeled.refetch();
    if (!result.data) return;
    const jsonContent = JSON.stringify(result.data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deepguard-mislabeled-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const s = stats.data;

  // ── Tabs ─────────────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { id: 'mislabeled' as const, label: 'Error Cases', icon: AlertTriangle, badge: s ? undefined : undefined },
    { id: 'export' as const, label: 'Export Dataset', icon: Download },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white">
      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <button className="p-2 rounded-lg border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Database className="w-6 h-6 text-cyan-400" />
              <h1 className="text-2xl font-bold">Training Data Dashboard</h1>
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Admin Only</Badge>
            </div>
            <p className="text-slate-400 text-sm">
              User feedback → error records → CLIP model improvement pipeline.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-slate-800/50 border border-slate-700/50 mb-8 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Overview Tab ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats grid */}
            {stats.isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 rounded-xl bg-slate-800/40 border border-slate-700/50 animate-pulse" />
                ))}
              </div>
            ) : s ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={BarChart3} label="Total Detections" value={s.totalDetections} color="border-slate-700/50" />
                <StatCard icon={Layers} label="Labeled Samples" value={s.labeledSamples} color="border-cyan-500/30" />
                <StatCard icon={AlertTriangle} label="AI-Generated Labels" value={s.aiSamples} color="border-red-500/30" />
                <StatCard icon={CheckCircle} label="Real / Authentic Labels" value={s.realSamples} color="border-green-500/30" />
              </div>
            ) : null}

            {/* Progress bar */}
            {s && (
              <div className="p-5 rounded-xl border border-slate-700/50 bg-slate-800/30">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Progress Toward First Training Run</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Minimum 1,000 labeled samples recommended for CLIP fine-tuning</p>
                  </div>
                  <span className="text-sm font-bold text-cyan-400">{s.labeledSamples} / 1,000</span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (s.labeledSamples / 1000) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-slate-500">0</span>
                  <span className="text-xs text-slate-500">
                    {s.labeledSamples >= 1000 ? '✅ Ready to train!' : `${1000 - s.labeledSamples} more samples needed`}
                  </span>
                  <span className="text-xs text-slate-500">1,000</span>
                </div>
              </div>
            )}

            {/* How the feedback loop works */}
            <div className="p-6 rounded-xl border border-slate-700/50 bg-slate-800/20">
              <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                How the Feedback Loop Works
              </h2>
              <div className="grid md:grid-cols-4 gap-4">
                {[
                  { step: '1', title: 'User runs detection', desc: 'Image, video, audio, or text is analyzed by 4 AI engines.' },
                  { step: '2', title: 'User gives feedback', desc: 'A "Was this accurate?" widget appears after every result.' },
                  { step: '3', title: 'Error is recorded', desc: 'If wrong, the user selects the correct label and optionally adds notes.' },
                  { step: '4', title: 'Model is retrained', desc: 'Admin exports mislabeled cases → fine-tunes CLIP → redeploys.' },
                ].map(item => (
                  <div key={item.step} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-bold flex items-center justify-center shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{item.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Mislabeled Cases Tab ── */}
        {activeTab === 'mislabeled' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <ThumbsDown className="w-4 h-4 text-red-400" />
                  Error Cases — Flagged as Incorrect
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  These are detections where users said our model was <strong className="text-red-400">wrong</strong>.
                  Use these to fine-tune the model and fix systematic errors.
                </p>
              </div>
              {mislabeled.data && mislabeled.data.length > 0 && (
                <Button
                  onClick={handleExportMislabeledJSON}
                  size="sm"
                  variant="outline"
                  className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export JSON
                </Button>
              )}
            </div>

            {mislabeled.isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 rounded-xl bg-slate-800/40 border border-slate-700/50 animate-pulse" />
                ))}
              </div>
            ) : mislabeled.data && mislabeled.data.length > 0 ? (
              <div className="space-y-3">
                {mislabeled.data.map(record => (
                  <MislabeledCard key={record.id} record={record as MislabeledRecord} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 rounded-xl border border-slate-700/50 bg-slate-800/20">
                <CheckCircle className="w-12 h-12 text-emerald-400/50 mx-auto mb-3" />
                <p className="text-slate-300 font-medium">No error cases yet</p>
                <p className="text-slate-500 text-sm mt-1">
                  When users flag incorrect detections, they'll appear here for review.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Export Tab ── */}
        {activeTab === 'export' && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-slate-700/50 bg-slate-800/30">
              <h2 className="text-lg font-semibold text-white mb-1">Export Full Training Dataset</h2>
              <p className="text-sm text-slate-400 mb-5">
                Download all labeled detection records. Each row includes the file URL, AI risk score, system verdict, and the ground-truth label provided by the user.
                Use this dataset with the CLIP fine-tuning script in <code className="bg-slate-800 px-1 rounded text-xs">/model-training/</code>.
              </p>

              <div className="grid md:grid-cols-2 gap-4 mb-5">
                <div className="p-4 rounded-lg border border-slate-600/50 bg-slate-900/40">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-white">CSV Format</span>
                    <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">Recommended</Badge>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">Compatible with pandas, Excel, and most ML frameworks.</p>
                  <Button
                    onClick={handleExportCSV}
                    disabled={exportData.isFetching}
                    className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 gap-2"
                    variant="outline"
                  >
                    {exportData.isFetching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {exportData.isFetching ? 'Exporting...' : 'Download CSV'}
                  </Button>
                </div>

                <div className="p-4 rounded-lg border border-slate-600/50 bg-slate-900/40">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-white">JSON Format</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">Structured format with full metadata. Best for PyTorch DataLoader.</p>
                  <Button
                    onClick={handleExportJSON}
                    disabled={exportData.isFetching}
                    className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 gap-2"
                    variant="outline"
                  >
                    {exportData.isFetching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {exportData.isFetching ? 'Exporting...' : 'Download JSON'}
                  </Button>
                </div>
              </div>

              {exported && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <p className="text-sm text-green-400">
                    Dataset exported. Use it with the CLIP fine-tuning script in <code className="bg-slate-800 px-1 rounded text-xs">/model-training/</code>
                  </p>
                </div>
              )}
            </div>

            {/* Schema reference */}
            <div className="p-6 rounded-xl border border-slate-700/50 bg-slate-800/30">
              <h2 className="text-base font-semibold text-white mb-4">Dataset Schema</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 pr-4 text-slate-400 font-medium">Column</th>
                      <th className="text-left py-2 pr-4 text-slate-400 font-medium">Type</th>
                      <th className="text-left py-2 text-slate-400 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {[
                      { col: 'id', type: 'integer', desc: 'Unique record ID' },
                      { col: 'type', type: 'enum', desc: 'Detection type: image | video | audio | text' },
                      { col: 'fileUrl', type: 'string', desc: 'S3 URL of the uploaded file (used for CLIP image encoding)' },
                      { col: 'fileName', type: 'string', desc: 'Original file name' },
                      { col: 'riskScore', type: 'integer', desc: 'System AI risk score (0–100)' },
                      { col: 'verdict', type: 'enum', desc: 'System verdict: safe | suspicious | deepfake' },
                      { col: 'userFeedback', type: 'enum', desc: 'User rating: correct | incorrect | unsure' },
                      { col: 'feedbackLabel', type: 'enum', desc: 'Ground truth: ai_generated | real | deepfake_video | ai_audio | human_audio | ai_text | human_text' },
                      { col: 'feedbackNote', type: 'string', desc: 'Optional user note (e.g. "Generated with Midjourney v6")' },
                      { col: 'feedbackAt', type: 'timestamp', desc: 'When the feedback was submitted' },
                      { col: 'createdAt', type: 'timestamp', desc: 'When the detection was performed' },
                    ].map(row => (
                      <tr key={row.col}>
                        <td className="py-2 pr-4 font-mono text-cyan-400 text-xs">{row.col}</td>
                        <td className="py-2 pr-4 text-slate-500 text-xs">{row.type}</td>
                        <td className="py-2 text-slate-300 text-xs">{row.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
