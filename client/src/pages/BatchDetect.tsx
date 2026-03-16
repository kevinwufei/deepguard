import { useEffect, useState, useRef } from 'react';
import { Link } from 'wouter';
import {
  Upload, FileImage, FileVideo, FileAudio, CheckCircle2,
  AlertTriangle, XCircle, Download, Loader2, Layers,
  ArrowRight, Building2, Zap, BarChart3, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface BatchFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'analyzing' | 'done' | 'error';
  riskScore?: number;
  verdict?: 'safe' | 'suspicious' | 'deepfake';
  aiModel?: string;
  error?: string;
}

function getVerdictColor(verdict?: string) {
  if (verdict === 'deepfake') return 'text-rose-400';
  if (verdict === 'suspicious') return 'text-amber-400';
  if (verdict === 'safe') return 'text-emerald-400';
  return 'text-muted-foreground';
}

function getVerdictBg(verdict?: string) {
  if (verdict === 'deepfake') return 'bg-rose-400/10 border-rose-400/20';
  if (verdict === 'suspicious') return 'bg-amber-400/10 border-amber-400/20';
  if (verdict === 'safe') return 'bg-emerald-400/10 border-emerald-400/20';
  return 'bg-muted/30 border-border/30';
}

function FileTypeIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith('image/')) return <FileImage className="w-4 h-4 text-primary" />;
  if (mimeType.startsWith('video/')) return <FileVideo className="w-4 h-4 text-violet-400" />;
  if (mimeType.startsWith('audio/')) return <FileAudio className="w-4 h-4 text-cyan-400" />;
  return <FileImage className="w-4 h-4 text-muted-foreground" />;
}

export default function BatchDetect() {
  const [files, setFiles] = useState<BatchFile[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.detection.uploadFile.useMutation();
  const analyzeImageMutation = trpc.detection.analyzeImage.useMutation();
  const analyzeVideoMutation = trpc.detection.analyzeVideo.useMutation();
  const analyzeAudioMutation = trpc.detection.analyzeAudio.useMutation();

  useEffect(() => {
    document.title = 'Batch Detection — DeepGuard';
  }, []);

  const addFiles = (newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles);
    const supported = arr.filter(f =>
      f.type.startsWith('image/') || f.type.startsWith('video/') || f.type.startsWith('audio/')
    );
    if (supported.length < arr.length) {
      toast.error('Some files skipped', { description: 'Only image, video, and audio files are supported.' });
    }
    if (files.length + supported.length > 50) {
      toast.error('Limit reached', { description: 'Maximum 50 files per batch.' });
      return;
    }
    setFiles(prev => [
      ...prev,
      ...supported.map(f => ({
        id: `${Date.now()}-${Math.random()}`,
        file: f,
        status: 'pending' as const,
      }))
    ]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const runBatch = async () => {
    const pending = files.filter(f => f.status === 'pending' || f.status === 'error');
    if (pending.length === 0) return;
    setIsRunning(true);

    for (const batchFile of pending) {
      // Update status to uploading
      setFiles(prev => prev.map(f => f.id === batchFile.id ? { ...f, status: 'uploading' } : f));

      try {
        // Read file as base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(batchFile.file);
        });

        // Upload to S3
        const { url } = await uploadMutation.mutateAsync({
          fileName: batchFile.file.name,
          fileData: base64,
          mimeType: batchFile.file.type,
        });

        // Update status to analyzing
        setFiles(prev => prev.map(f => f.id === batchFile.id ? { ...f, status: 'analyzing' } : f));

        // Analyze
        let result: { riskScore: number; verdict: 'safe' | 'suspicious' | 'deepfake'; aiModel?: string };
        if (batchFile.file.type.startsWith('image/')) {
          result = await analyzeImageMutation.mutateAsync({
            fileUrl: url,
            fileName: batchFile.file.name,
            mimeType: batchFile.file.type,
            fileSize: batchFile.file.size,
          });
        } else if (batchFile.file.type.startsWith('video/')) {
          const r = await analyzeVideoMutation.mutateAsync({
            fileUrl: url,
            fileName: batchFile.file.name,
            mimeType: batchFile.file.type,
            fileSize: batchFile.file.size,
          });
          result = { riskScore: r.riskScore, verdict: r.verdict };
        } else {
          const r = await analyzeAudioMutation.mutateAsync({
            fileUrl: url,
            fileName: batchFile.file.name,
            mimeType: batchFile.file.type,
            fileSize: batchFile.file.size,
          });
          result = { riskScore: r.riskScore, verdict: r.verdict };
        }

        setFiles(prev => prev.map(f => f.id === batchFile.id ? {
          ...f,
          status: 'done',
          riskScore: result.riskScore,
          verdict: result.verdict,
          aiModel: (result as { aiModel?: string }).aiModel,
        } : f));
      } catch (err) {
        setFiles(prev => prev.map(f => f.id === batchFile.id ? {
          ...f,
          status: 'error',
          error: 'Analysis failed. Try again.',
        } : f));
      }
    }
    setIsRunning(false);
    toast.success('Batch complete', { description: `${pending.length} files analyzed.` });
  };

  const downloadCSV = () => {
    const done = files.filter(f => f.status === 'done');
    if (done.length === 0) return;
    const rows = [
      ['File Name', 'Type', 'Risk Score', 'Verdict', 'AI Model'],
      ...done.map(f => [
        f.file.name,
        f.file.type,
        f.riskScore?.toString() || '',
        f.verdict || '',
        f.aiModel || '',
      ])
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deepguard-batch-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const doneCount = files.filter(f => f.status === 'done').length;
  const flaggedCount = files.filter(f => f.verdict === 'deepfake' || f.verdict === 'suspicious').length;
  const pendingCount = files.filter(f => f.status === 'pending').length;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative pt-24 pb-12 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/3 w-[500px] h-[350px] bg-violet-500/5 rounded-full blur-[120px]" />
        </div>
        <div className="container relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-400/30 bg-violet-400/10 text-violet-400 text-sm font-medium mb-5">
              <Layers className="w-3.5 h-3.5" />
              <span>Batch Detection — Enterprise Feature</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Analyze hundreds of files<br />
              <span className="text-violet-400">at once</span>
            </h1>
            <p className="text-muted-foreground text-lg mb-6 max-w-2xl">
              Upload up to 50 images, videos, or audio files in one batch. DeepGuard processes them in parallel and gives you a downloadable CSV report.
            </p>
            <div className="flex flex-wrap gap-4">
              {[
                { icon: Zap, text: 'Parallel processing' },
                { icon: BarChart3, text: 'CSV export' },
                { icon: Shield, text: 'Up to 50 files per batch' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <item.icon className="w-4 h-4 text-violet-400" />
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Batch UI */}
      <section className="py-8">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer mb-6 p-10 text-center ${isDragging ? 'border-violet-400 bg-violet-400/5' : 'border-border/40 hover:border-violet-400/40 hover:bg-violet-400/3'}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,audio/*"
                className="hidden"
                onChange={e => e.target.files && addFiles(e.target.files)}
              />
              <Upload className="w-10 h-10 text-violet-400/60 mx-auto mb-3" />
              <p className="text-foreground font-medium mb-1">Drop files here or click to browse</p>
              <p className="text-sm text-muted-foreground">Images, videos, and audio files — up to 50 files per batch</p>
            </div>

            {/* Stats bar */}
            {files.length > 0 && (
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{files.length}</span> files queued
                </div>
                {doneCount > 0 && (
                  <div className="flex items-center gap-2 text-sm text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {doneCount} analyzed
                  </div>
                )}
                {flaggedCount > 0 && (
                  <div className="flex items-center gap-2 text-sm text-rose-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {flaggedCount} flagged
                  </div>
                )}
                <div className="ml-auto flex gap-3">
                  {doneCount > 0 && (
                    <Button size="sm" variant="outline" className="gap-1.5 border-border/60" onClick={downloadCSV}>
                      <Download className="w-3.5 h-3.5" /> Export CSV
                    </Button>
                  )}
                  {pendingCount > 0 && !isRunning && (
                    <Button size="sm" className="bg-violet-500 hover:bg-violet-600 text-white gap-1.5" onClick={runBatch}>
                      <Zap className="w-3.5 h-3.5" /> Analyze {pendingCount} Files
                    </Button>
                  )}
                  {isRunning && (
                    <Button size="sm" disabled className="gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* File List */}
            {files.length > 0 && (
              <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
                <div className="grid grid-cols-12 bg-muted/40 px-4 py-2.5 border-b border-border/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <div className="col-span-5">File</div>
                  <div className="col-span-2 text-center">Type</div>
                  <div className="col-span-2 text-center">Risk</div>
                  <div className="col-span-2 text-center">Verdict</div>
                  <div className="col-span-1 text-right">Remove</div>
                </div>
                <div className="divide-y divide-border/30 max-h-[500px] overflow-y-auto">
                  {files.map((f) => (
                    <div key={f.id} className="grid grid-cols-12 px-4 py-3 items-center hover:bg-muted/10 transition-colors">
                      {/* File name */}
                      <div className="col-span-5 flex items-center gap-2 min-w-0">
                        <FileTypeIcon mimeType={f.file.type} />
                        <span className="text-sm text-foreground truncate">{f.file.name}</span>
                      </div>
                      {/* Type */}
                      <div className="col-span-2 text-center text-xs text-muted-foreground">
                        {f.file.type.startsWith('image/') ? 'Image' : f.file.type.startsWith('video/') ? 'Video' : 'Audio'}
                      </div>
                      {/* Risk */}
                      <div className="col-span-2 text-center">
                        {f.status === 'pending' && <span className="text-xs text-muted-foreground">—</span>}
                        {(f.status === 'uploading' || f.status === 'analyzing') && (
                          <div className="flex items-center justify-center gap-1">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
                            <span className="text-xs text-violet-400">{f.status === 'uploading' ? 'Uploading' : 'Analyzing'}</span>
                          </div>
                        )}
                        {f.status === 'done' && (
                          <span className={`text-sm font-bold ${getVerdictColor(f.verdict)}`}>{f.riskScore}%</span>
                        )}
                        {f.status === 'error' && <span className="text-xs text-rose-400">Error</span>}
                      </div>
                      {/* Verdict */}
                      <div className="col-span-2 flex justify-center">
                        {f.status === 'done' && f.verdict && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getVerdictBg(f.verdict)} ${getVerdictColor(f.verdict)}`}>
                            {f.verdict === 'deepfake' ? 'AI/Deepfake' : f.verdict === 'suspicious' ? 'Suspicious' : 'Authentic'}
                          </span>
                        )}
                        {f.status === 'error' && (
                          <span className="text-[10px] text-rose-400">Failed</span>
                        )}
                        {(f.status === 'pending' || f.status === 'uploading' || f.status === 'analyzing') && (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        )}
                      </div>
                      {/* Remove */}
                      <div className="col-span-1 flex justify-end">
                        <button
                          onClick={() => removeFile(f.id)}
                          disabled={f.status === 'uploading' || f.status === 'analyzing'}
                          className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {files.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Add files above to start a batch analysis
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Enterprise CTA */}
      <section className="py-16 bg-card/30 border-t border-border/40">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Need to scan thousands of files?</h3>
                  <p className="text-sm text-muted-foreground mb-3">Enterprise customers get API access for automated batch scanning — integrate directly into your content moderation pipeline, HR system, or fraud detection workflow.</p>
                  <div className="flex flex-wrap gap-3">
                    {['REST API access', 'Webhook callbacks', 'Priority processing', 'SLA guarantee'].map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-violet-400">
                        <CheckCircle2 className="w-3 h-3" />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-3 flex-shrink-0">
                  <a href="mailto:enterprise@deepguard.org">
                    <Button className="bg-violet-500 hover:bg-violet-600 text-white gap-2 whitespace-nowrap">
                      <Building2 className="w-4 h-4" /> Talk to Sales
                    </Button>
                  </a>
                  <Link href="/pricing">
                    <Button variant="outline" className="border-violet-400/30 text-violet-400 hover:border-violet-400/60 gap-2 whitespace-nowrap">
                      View Plans <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
