import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import {
  Database, Download, BarChart3, CheckCircle, XCircle, HelpCircle,
  Image, Video, Mic, FileText, RefreshCw, Lock, ArrowLeft, Layers
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

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

export default function TrainingData() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [exported, setExported] = useState(false);

  const stats = trpc.trainingData.stats.useQuery(undefined, {
    enabled: user?.role === 'admin',
    retry: false,
  });

  const exportData = trpc.trainingData.export.useQuery(
    { limit: 5000 },
    { enabled: false, retry: false }
  );

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

  const s = stats.data;

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
            <p className="text-slate-400 text-sm">Labeled detection records collected from user feedback — ready for CLIP model fine-tuning.</p>
          </div>
        </div>

        {/* Stats */}
        {stats.isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-slate-800/40 border border-slate-700/50 animate-pulse" />
            ))}
          </div>
        ) : s ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard icon={BarChart3} label="Total Detections" value={s.totalDetections} color="border-slate-700/50" />
            <StatCard icon={Layers} label="Labeled Samples" value={s.labeledSamples} color="border-cyan-500/30 text-cyan-400" />
            <StatCard icon={CheckCircle} label="AI-Generated Labels" value={s.aiSamples} color="border-red-500/30 text-red-400" />
            <StatCard icon={Image} label="Real / Authentic Labels" value={s.realSamples} color="border-green-500/30 text-green-400" />
          </div>
        ) : null}

        {/* Progress toward training threshold */}
        {s && (
          <div className="mb-8 p-5 rounded-xl border border-slate-700/50 bg-slate-800/30">
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
                {s.labeledSamples >= 1000
                  ? '✅ Ready to train!'
                  : `${1000 - s.labeledSamples} more samples needed`}
              </span>
              <span className="text-xs text-slate-500">1,000</span>
            </div>
          </div>
        )}

        {/* Export section */}
        <div className="p-6 rounded-xl border border-slate-700/50 bg-slate-800/30 mb-8">
          <h2 className="text-lg font-semibold text-white mb-1">Export Training Dataset</h2>
          <p className="text-sm text-slate-400 mb-5">
            Download all labeled detection records as CSV or JSON. Each row includes the file URL, AI risk score, system verdict, and the ground-truth label provided by the user.
            Use this dataset directly with the CLIP fine-tuning script.
          </p>

          <div className="grid md:grid-cols-2 gap-4 mb-5">
            <div className="p-4 rounded-lg border border-slate-600/50 bg-slate-900/40">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-white">CSV Format</span>
                <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">Recommended</Badge>
              </div>
              <p className="text-xs text-slate-400 mb-3">Compatible with pandas, Excel, and most ML frameworks. Best for quick data inspection and preprocessing.</p>
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
              <p className="text-xs text-slate-400 mb-3">Structured format with full metadata. Best for custom preprocessing pipelines and PyTorch DataLoader integration.</p>
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
              <p className="text-sm text-green-400">Dataset exported successfully. Use it with the CLIP fine-tuning script in <code className="bg-slate-800 px-1 rounded text-xs">/model-training/</code></p>
            </div>
          )}
        </div>

        {/* Data schema */}
        <div className="p-6 rounded-xl border border-slate-700/50 bg-slate-800/30">
          <h2 className="text-lg font-semibold text-white mb-4">Dataset Schema</h2>
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
                  { col: 'feedbackLabel', type: 'enum', desc: 'Ground truth: ai_generated | real | deepfake_video | ai_audio | human_audio' },
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
    </div>
  );
}
