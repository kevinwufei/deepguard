import { useState, useRef, useCallback, useEffect } from 'react';
import {
  FileImage, Upload, X, Shield, AlertTriangle, CheckCircle2,
  Layers, Search, FileText, Download, Info, ChevronDown, ChevronUp,
  Cpu, Eye, Hash, Clock, Camera, Zap, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

interface ForensicData {
  fileName: string;
  fileSize: string;
  format: string;
  dimensions: string;
  colorSpace: string;
  hasExif: boolean;
  software: string;
  creationDate: string;
  modificationDate: string;
  gpsData: string;
  cameraModel: string;
  compressionArtifacts: string;
  metadataIntegrity: string;
  noisePattern: string;
}

interface HeatmapRegion {
  x: number; y: number; w: number; h: number; intensity: number; label: string;
}

interface EngineScore {
  engine: string;
  score: number;
  weight: number;
  available: boolean;
}

interface DetectionResult {
  riskScore: number;
  verdict: 'safe' | 'suspicious' | 'deepfake';
  confidence: number;
  aiModel: string;
  features: Array<{ name: string; confidence: number; description: string }>;
  summary: string;
  possibleSources: string[];
  heatmapRegions: HeatmapRegion[];
  forensic: ForensicData;
  engineBreakdown?: EngineScore[];
}

const ACCEPTED = 'image/jpeg,image/png,image/webp,image/gif,image/bmp,.jpg,.jpeg,.png,.webp,.gif,.bmp';
const MAX_MB = 50;

function getRiskColor(score: number) {
  if (score < 30) return { text: 'text-emerald-400', bg: 'bg-emerald-400', bar: 'from-emerald-400 to-emerald-500', border: 'border-emerald-400/30', badge: 'bg-emerald-400/10 text-emerald-400' };
  if (score < 70) return { text: 'text-amber-400', bg: 'bg-amber-400', bar: 'from-amber-400 to-orange-500', border: 'border-amber-400/30', badge: 'bg-amber-400/10 text-amber-400' };
  return { text: 'text-rose-400', bg: 'bg-rose-400', bar: 'from-rose-400 to-rose-600', border: 'border-rose-400/30', badge: 'bg-rose-400/10 text-rose-400' };
}

function HeatmapCanvas({ imageUrl, regions }: { imageUrl: string; regions: HeatmapRegion[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      if (showHeatmap && regions.length > 0) {
        regions.forEach(region => {
          const x = region.x * img.width;
          const y = region.y * img.height;
          const w = region.w * img.width;
          const h = region.h * img.height;

          // Draw heatmap overlay
          const alpha = region.intensity * 0.55;
          const r = region.intensity > 0.6 ? 255 : Math.round(region.intensity * 255 * 2);
          const g = region.intensity < 0.4 ? Math.round((1 - region.intensity) * 200) : Math.round((1 - region.intensity) * 100);
          ctx.fillStyle = `rgba(${r}, ${g}, 0, ${alpha})`;
          ctx.fillRect(x, y, w, h);

          // Draw bounding box
          ctx.strokeStyle = region.intensity > 0.6 ? 'rgba(239,68,68,0.9)' : 'rgba(251,191,36,0.8)';
          ctx.lineWidth = Math.max(2, img.width * 0.003);
          ctx.strokeRect(x, y, w, h);

          // Label
          const fontSize = Math.max(11, img.width * 0.018);
          ctx.font = `bold ${fontSize}px sans-serif`;
          const labelW = ctx.measureText(region.label).width + 10;
          ctx.fillStyle = region.intensity > 0.6 ? 'rgba(239,68,68,0.9)' : 'rgba(251,191,36,0.85)';
          ctx.fillRect(x, y - fontSize - 6, labelW, fontSize + 6);
          ctx.fillStyle = '#fff';
          ctx.fillText(region.label, x + 5, y - 5);
        });
      }
    };
    img.src = imageUrl;
  }, [imageUrl, regions, showHeatmap]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Pixel-Level Heatmap</span>
          <span className="text-xs text-muted-foreground">(Sensity-style forensic overlay)</span>
        </div>
        <button
          onClick={() => setShowHeatmap(v => !v)}
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          {showHeatmap ? 'Hide' : 'Show'} overlay
          {showHeatmap ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>
      <div className="rounded-xl overflow-hidden border border-border/60 bg-black">
        <canvas ref={canvasRef} className="w-full h-auto max-h-[400px] object-contain" />
      </div>
      {regions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {regions.map((r, i) => (
            <div key={i} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${r.intensity > 0.6 ? 'bg-rose-400/10 border-rose-400/30 text-rose-400' : 'bg-amber-400/10 border-amber-400/30 text-amber-400'}`}>
              <div className={`w-2 h-2 rounded-full ${r.intensity > 0.6 ? 'bg-rose-400' : 'bg-amber-400'}`} />
              {r.label} — {Math.round(r.intensity * 100)}% suspicious
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ImageDetect() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [activeTab, setActiveTab] = useState<'heatmap' | 'forensic' | 'report'>('heatmap');

  useEffect(() => {
    document.title = 'Image Deepfake Detection — DeepGuard';
  }, []);

  const analyzeImage = trpc.detection.analyzeImage.useMutation();

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) { setError('Please upload an image file (JPG, PNG, WebP, GIF, BMP)'); return; }
    if (f.size > MAX_MB * 1024 * 1024) { setError(`File size exceeds ${MAX_MB}MB limit`); return; }
    setFile(f);
    setResult(null);
    setError(null);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleAnalyze = async () => {
    if (!file) return;
    setIsAnalyzing(true); setUploadProgress(0); setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);
      formData.append('mimeType', file.type);

      const uploadUrl = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/upload');
        xhr.upload.onprogress = (e) => { if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 70)); };
        xhr.onload = () => {
          if (xhr.status === 200) { try { resolve(JSON.parse(xhr.responseText).url); } catch { reject(new Error('Invalid response')); } }
          else reject(new Error(`Upload failed: ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(formData);
      });

      setUploadProgress(75);
      const res = await analyzeImage.mutateAsync({ fileUrl: uploadUrl, fileName: file.name, mimeType: file.type, fileSize: file.size });
      setUploadProgress(100);
      setResult(res as DetectionResult);
      setActiveTab('heatmap');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      toast.error('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownloadReport = () => {
    if (!result) return;
    const report = [
      '=== DeepGuard Forensic Analysis Report ===',
      `Generated: ${new Date().toISOString()}`,
      `File: ${file?.name}`,
      '',
      '--- VERDICT ---',
      `AI Risk Score: ${result.riskScore}/100`,
      `Verdict: ${result.verdict.toUpperCase()}`,
      `Confidence: ${result.confidence}%`,
      `Likely AI Model: ${result.aiModel}`,
      '',
      '--- SUMMARY ---',
      result.summary,
      '',
      '--- DETECTION FEATURES ---',
      ...result.features.map(f => `• ${f.name} (${Math.round(f.confidence * 100)}%): ${f.description}`),
      '',
      '--- POSSIBLE AI SOURCES ---',
      result.possibleSources.join(', ') || 'None identified',
      '',
      '--- FILE FORENSICS ---',
      `Format: ${result.forensic.format}`,
      `Dimensions: ${result.forensic.dimensions}`,
      `Software: ${result.forensic.software}`,
      `EXIF Present: ${result.forensic.hasExif ? 'Yes' : 'No'}`,
      `Metadata Integrity: ${result.forensic.metadataIntegrity}`,
      `Noise Pattern: ${result.forensic.noisePattern}`,
      '',
      '--- MANIPULATED REGIONS ---',
      ...result.heatmapRegions.map(r => `• ${r.label}: ${Math.round(r.intensity * 100)}% suspicious`),
      '',
      '=== END OF REPORT ===',
      'This report is generated by DeepGuard AI Detection Platform.',
      'For court-admissible reports, please upgrade to Enterprise plan.',
    ].join('\n');

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `deepguard-report-${file?.name}.txt`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('Report downloaded');
  };

  const colors = result ? getRiskColor(result.riskScore) : null;

  return (
    <div className="min-h-screen py-12 grid-bg">
      <div className="container max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-400/10 border border-violet-400/30 mb-4">
            <FileImage className="w-8 h-8 text-violet-400" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Image Deepfake Detection
          </h1>
          <p className="text-muted-foreground">
            Pixel-level heatmap analysis · File forensics · AI model identification
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-3">
            {['Midjourney', 'DALL·E 3', 'Stable Diffusion', 'Firefly', 'GAN Faces'].map(m => (
              <span key={m} className="px-2.5 py-0.5 rounded-full bg-violet-400/10 border border-violet-400/20 text-violet-400 text-xs">{m}</span>
            ))}
          </div>
        </div>

        {/* Upload Card */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 mb-6">
          {!file ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${isDragging ? 'border-violet-400 bg-violet-400/5' : 'border-border/60 hover:border-violet-400/50 hover:bg-violet-400/5'}`}
            >
              <input ref={fileInputRef} type="file" accept={ACCEPTED} className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              <div className="w-14 h-14 rounded-2xl bg-violet-400/10 border border-violet-400/20 flex items-center justify-center mx-auto mb-4">
                <Upload className="w-7 h-7 text-violet-400" />
              </div>
              <p className="text-foreground font-medium mb-1">Drop an image here or click to upload</p>
              <p className="text-sm text-muted-foreground">JPG, PNG, WebP, GIF, BMP · Max {MAX_MB}MB</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview + file info */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 border border-border/40">
                {previewUrl && (
                  <img src={previewUrl} alt="preview" className="w-20 h-20 object-cover rounded-lg border border-border/40 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB · {file.type}</p>
                  {isAnalyzing && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{uploadProgress < 75 ? 'Uploading...' : 'Analyzing with AI...'}</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-1.5" />
                    </div>
                  )}
                </div>
                <button onClick={() => { setFile(null); setPreviewUrl(null); setResult(null); }} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-400/10 border border-rose-400/20 text-rose-400 text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}

              {!result && (
                <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full bg-violet-500 hover:bg-violet-600 text-white gap-2">
                  {isAnalyzing ? (
                    <><Cpu className="w-4 h-4 animate-spin" /> Analyzing image...</>
                  ) : (
                    <><Search className="w-4 h-4" /> Analyze for Deepfakes</>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        {result && colors && (
          <div className="space-y-5">
            {/* Verdict Card */}
            <div className={`rounded-2xl border ${colors.border} bg-card p-6`}>
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {result.riskScore >= 70 ? (
                      <AlertTriangle className={`w-5 h-5 ${colors.text}`} />
                    ) : result.riskScore >= 30 ? (
                      <Info className={`w-5 h-5 ${colors.text}`} />
                    ) : (
                      <CheckCircle2 className={`w-5 h-5 ${colors.text}`} />
                    )}
                    <h2 className="text-lg font-bold text-foreground">
                      {result.verdict === 'deepfake' ? 'AI-Generated Image Detected' :
                        result.verdict === 'suspicious' ? 'Suspicious — Possible AI Content' :
                          'Likely Authentic Image'}
                    </h2>
                  </div>
                  <p className="text-sm text-muted-foreground">{result.summary}</p>
                </div>
                <div className="text-center flex-shrink-0">
                  <div className={`text-4xl font-bold ${colors.text}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{result.riskScore}</div>
                  <div className="text-xs text-muted-foreground">Risk Score</div>
                </div>
              </div>

              <div className="w-full h-3 rounded-full bg-muted overflow-hidden mb-4">
                <div className={`h-full rounded-full bg-gradient-to-r ${colors.bar} transition-all duration-1000`} style={{ width: `${result.riskScore}%` }} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-xl bg-muted/30">
                  <div className={`text-lg font-bold ${colors.text}`}>{result.confidence}%</div>
                  <div className="text-xs text-muted-foreground">Confidence</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted/30">
                  <div className="text-lg font-bold text-foreground capitalize">{result.verdict}</div>
                  <div className="text-xs text-muted-foreground">Verdict</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted/30">
                  <div className="text-sm font-bold text-foreground truncate">{result.aiModel || 'Unknown'}</div>
                  <div className="text-xs text-muted-foreground">AI Model</div>
                </div>
              </div>

              {/* Multi-Engine Breakdown */}
              {result.engineBreakdown && result.engineBreakdown.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border/40">
                  <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> Multi-Engine Verification
                  </p>
                  <div className="space-y-2">
                    {result.engineBreakdown.map((eng) => (
                      <div key={eng.engine} className="flex items-center gap-3">
                        <div className="w-32 text-xs text-muted-foreground truncate flex-shrink-0">{eng.engine}</div>
                        {eng.available ? (
                          <>
                            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${
                                  eng.score >= 66 ? 'bg-rose-400' : eng.score >= 36 ? 'bg-amber-400' : 'bg-emerald-400'
                                }`}
                                style={{ width: `${eng.score}%` }}
                              />
                            </div>
                            <div className={`text-xs font-bold w-10 text-right flex-shrink-0 ${
                              eng.score >= 66 ? 'text-rose-400' : eng.score >= 36 ? 'text-amber-400' : 'text-emerald-400'
                            }`}>{eng.score}%</div>
                            <div className="text-xs text-muted-foreground w-12 text-right flex-shrink-0">{Math.round(eng.weight * 100)}% wt</div>
                          </>
                        ) : (
                          <div className="flex-1 text-xs text-muted-foreground/50 italic">Not configured — add API key to enable</div>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground/60 mt-2">
                    Final score is a weighted average across all available engines.
                    {result.engineBreakdown.filter(e => !e.available).length > 0 && ' Add SightEngine or Illuminarty API keys to improve accuracy.'}
                  </p>
                </div>
              )}

              {result.possibleSources.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border/40">
                  <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Possible AI Sources</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.possibleSources.map(s => (
                      <span key={s} className={`px-2.5 py-0.5 rounded-full text-xs border ${colors.badge} border-current/20`}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 p-1 rounded-xl bg-muted/30 border border-border/40">
              {[
                { id: 'heatmap', label: 'Heatmap', icon: Eye },
                { id: 'forensic', label: 'File Forensics', icon: Hash },
                { id: 'report', label: 'Detection Details', icon: BarChart3 },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              {activeTab === 'heatmap' && previewUrl && (
                <HeatmapCanvas imageUrl={previewUrl} regions={result.heatmapRegions} />
              )}

              {activeTab === 'forensic' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Hash className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-foreground">File Forensic Analysis</span>
                    <span className="text-xs text-muted-foreground">(EXIF · Metadata · Integrity)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: 'File Format', value: result.forensic.format, icon: FileImage },
                      { label: 'Dimensions', value: result.forensic.dimensions, icon: Camera },
                      { label: 'Color Space', value: result.forensic.colorSpace, icon: Layers },
                      { label: 'Software', value: result.forensic.software, icon: Cpu },
                      { label: 'EXIF Data', value: result.forensic.hasExif ? 'Present' : 'Missing / Stripped', icon: Info },
                      { label: 'Camera Model', value: result.forensic.cameraModel || 'Not found', icon: Camera },
                      { label: 'Creation Date', value: result.forensic.creationDate || 'Not found', icon: Clock },
                      { label: 'GPS Data', value: result.forensic.gpsData || 'Not found', icon: Search },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
                        <item.icon className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs text-muted-foreground">{item.label}</div>
                          <div className="text-sm font-medium text-foreground">{item.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                    {[
                      { label: 'Metadata Integrity', value: result.forensic.metadataIntegrity, good: result.forensic.metadataIntegrity === 'Consistent' },
                      { label: 'Noise Pattern', value: result.forensic.noisePattern, good: result.forensic.noisePattern === 'Natural' },
                      { label: 'Compression', value: result.forensic.compressionArtifacts, good: result.forensic.compressionArtifacts === 'Normal' },
                    ].map((item, i) => (
                      <div key={i} className={`p-3 rounded-xl border text-center ${item.good ? 'bg-emerald-400/5 border-emerald-400/20' : 'bg-rose-400/5 border-rose-400/20'}`}>
                        <div className={`text-sm font-semibold ${item.good ? 'text-emerald-400' : 'text-rose-400'}`}>{item.value}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'report' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-foreground">Detection Feature Analysis</span>
                  </div>
                  <div className="space-y-3">
                    {result.features.map((f, i) => (
                      <div key={i} className="p-4 rounded-xl bg-muted/30 border border-border/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-foreground">{f.name}</span>
                          <span className={`text-sm font-bold ${f.confidence > 0.6 ? 'text-rose-400' : f.confidence > 0.3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {Math.round(f.confidence * 100)}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden mb-2">
                          <div
                            className={`h-full rounded-full ${f.confidence > 0.6 ? 'bg-rose-400' : f.confidence > 0.3 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                            style={{ width: `${f.confidence * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">{f.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={handleDownloadReport} variant="outline" className="flex-1 border-border/60 hover:border-primary/40 gap-2">
                <Download className="w-4 h-4" /> Download Report
              </Button>
              <Button onClick={() => { setFile(null); setPreviewUrl(null); setResult(null); }} variant="outline" className="flex-1 border-border/60 hover:border-primary/40 gap-2">
                <FileImage className="w-4 h-4" /> Analyze Another
              </Button>
            </div>

            <div className="p-4 rounded-xl border border-violet-500/20 bg-violet-500/5">
              <div className="flex items-start gap-3">
                <Zap className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-violet-400 mb-0.5">Upgrade for Court-Ready Reports</p>
                  <p className="text-xs text-muted-foreground">Enterprise plan includes chain-of-custody metadata, signed PDF reports, and pixel-level bounding box evidence admissible in legal proceedings.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-6 p-4 rounded-xl border border-border/40 bg-card/40">
          <div className="flex items-start gap-3">
            <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Uploaded images are used only for AI analysis and deleted immediately after. They are never stored, shared, or used for training.
              Analysis uses multi-layer detection: pixel forensics, GAN artifact detection, metadata analysis, and noise pattern analysis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
