import { useCallback, useMemo, useRef, useState } from "react";
import { FileAudio, FileVideo, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import DetectionResult from "./DetectionResult";
import { useLang } from "@/contexts/LanguageContext";
import { QuotaExceededModal, useQuotaCheck } from "@/components/QuotaGuard";
import { FeedbackWidget } from "@/components/FeedbackWidget";

interface FileUploadDetectProps {
  type: "audio" | "video";
  accept: string;
  maxSizeMB?: number;
}

interface AnalysisResult {
  riskScore: number;
  verdict: string;
  confidence: number;
  features: Array<{ name: string; confidence: number; description: string }>;
  summary: string;
  possibleSources?: string[];
  metadata?: Record<string, string>;
  frameTimeline?: Array<{ timestamp: number; score: number } | { frame: number; timestamp: string; aiProbability: number }>;
  faceAnomalies?: Array<{ type: string; severity: string; description: string }>;
}

export default function FileUploadDetect({ type, accept, maxSizeMB = 5120 }: FileUploadDetectProps) {
  const { t } = useLang();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [recordId, setRecordId] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState<{ used: number; limit: number; isLoggedIn: boolean } | null>(null);
  const { checkAndEnforce } = useQuotaCheck();

  const analyzeAudio = trpc.detection.analyzeAudio.useMutation();
  const analyzeVideo = trpc.detection.analyzeVideo.useMutation();

  const handleFile = useCallback((f: File) => {
    if (f.size > maxSizeMB * 1024 * 1024) {
      const limitLabel = maxSizeMB >= 1024 ? `${(maxSizeMB / 1024).toFixed(0)}GB` : `${maxSizeMB}MB`;
      setError(`File size exceeds ${limitLabel} limit`);
      return;
    }
    setFile(f);
    setResult(null);
    setSaved(false);
    setError(null);
  }, [maxSizeMB]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  // Chunked upload: splits file into 6MB chunks to avoid proxy 413 limits
  const uploadFileChunked = async (
    file: File,
    onProgress: (pct: number) => void
  ): Promise<string> => {
    const CHUNK_SIZE = 6 * 1024 * 1024; // 6MB per chunk
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append('file', chunk, file.name);
      formData.append('uploadId', uploadId);
      formData.append('chunkIndex', String(i));
      formData.append('totalChunks', String(totalChunks));
      formData.append('fileName', file.name);
      formData.append('mimeType', file.type || 'application/octet-stream');

      const response = await fetch('/api/upload/chunk', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Chunk upload failed: ${response.status}`);
      }

      const data = await response.json();
      // Progress: 0-80% during upload
      onProgress(Math.round(((i + 1) / totalChunks) * 80));

      if (data.status === 'complete') {
        return data.url;
      }
    }
    throw new Error('Upload incomplete: server did not return final URL');
  };

  const handleAnalyze = async () => {
    if (!file) return;

    // Check quota before uploading
    const { allowed, quotaInfo: qi } = await checkAndEnforce();
    if (!allowed) {
      setQuotaExceeded(true);
      setQuotaInfo(qi ?? null);
      return;
    }

    setIsAnalyzing(true);
    setUploadProgress(0);
    setError(null);

    try {
      const uploadUrl = await uploadFileChunked(file, setUploadProgress);

      setUploadProgress(85); // Upload done, now analyzing

      // Analyze the uploaded file
      let rawResult: AnalysisResult & { recordId?: number | null };
      if (type === "audio") {
        rawResult = await analyzeAudio.mutateAsync({
          fileUrl: uploadUrl,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
        }) as AnalysisResult & { recordId?: number | null };
      } else {
        rawResult = await analyzeVideo.mutateAsync({
          fileUrl: uploadUrl,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
        }) as AnalysisResult & { recordId?: number | null };
      }

      const { recordId: rid, ...analysisResult } = rawResult;
      setUploadProgress(100);
      setResult(analysisResult);
      setRecordId(rid ?? null);
    } catch (err: any) {
      console.error("Detection error:", err);
      const msg = err?.message || "Analysis failed. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setRecordId(null);
    setSaved(false);
    setError(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = () => {
    setSaved(true);
    toast.success(t.detect_saved);
  };

  const FileIcon = type === "audio" ? FileAudio : FileVideo;
  const limitLabel = maxSizeMB >= 1024 ? `${(maxSizeMB / 1024).toFixed(0)}GB` : `${maxSizeMB}MB`;

  if (result) {
    return (
      <>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/20 mb-4">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">AI-ASSISTED</span>
          <span className="text-xs text-muted-foreground">Analysis powered by LLM. Results are indicative, not forensic-grade. <a href="/technology" className="text-primary hover:underline">Learn more</a></span>
        </div>
        <DetectionResult
          riskScore={result.riskScore}
          verdict={result.verdict as 'safe' | 'suspicious' | 'deepfake'}
          features={result.features}
          summary={result.summary}
          onReset={handleReset}
          onSave={handleSave}
          saved={saved}
        />
        {recordId && (
          <FeedbackWidget
            recordId={recordId}
            detectionType={type}
            currentVerdict={result.verdict as 'safe' | 'suspicious' | 'deepfake'}
          />
        )}
      </>
    );
  }

  return (
    <>
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer
          ${isDragging ? "border-cyan-400 bg-cyan-400/10" : "border-border hover:border-cyan-500/50 hover:bg-white/5"}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />

        {file ? (
          <div className="flex flex-col items-center gap-3">
            <FileIcon className="w-12 h-12 text-cyan-400" />
            <div>
              <p className="font-medium text-foreground">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {file.size >= 1024 * 1024 * 1024
                  ? `${(file.size / (1024 * 1024 * 1024)).toFixed(2)} GB`
                  : `${(file.size / (1024 * 1024)).toFixed(2)} MB`}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); handleReset(); }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4 mr-1" /> Remove
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center">
              <Upload className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <p className="font-medium text-foreground">Drop your file here</p>
              <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
            </div>
            <p className="text-xs text-muted-foreground/60 mt-1">Max {limitLabel} · {accept.replace(/,/g, ", ")}</p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Upload / Analysis progress */}
      {isAnalyzing && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{uploadProgress < 85 ? "Uploading file..." : "Analyzing with AI..."}</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Analyze button */}
      {file && !isAnalyzing && (
        <Button
          onClick={handleAnalyze}
          className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
          size="lg"
        >
          <FileIcon className="w-4 h-4 mr-2" />
          {t.detect_analyzing || "Analyze File"}
        </Button>
      )}
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
