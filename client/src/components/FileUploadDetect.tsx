import { useCallback, useRef, useState } from "react";
import { FileAudio, FileVideo, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import DetectionResult from "./DetectionResult";
import { useLang } from "@/contexts/LanguageContext";

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
  const [saved, setSaved] = useState(false);

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

  const handleAnalyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Use multipart/form-data upload via XMLHttpRequest for progress tracking
      // This avoids loading the entire file into memory as base64
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", file.name);
      formData.append("mimeType", file.type);

      const uploadUrl = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload");
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 80)); // 0-80% for upload
          }
        };
        xhr.onload = () => {
          if (xhr.status === 200) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data.url);
            } catch {
              reject(new Error("Invalid server response"));
            }
          } else {
            try {
              const err = JSON.parse(xhr.responseText);
              reject(new Error(err.error || `Upload failed: ${xhr.status}`));
            } catch {
              reject(new Error(`Upload failed: ${xhr.status}`));
            }
          }
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(formData);
      });

      setUploadProgress(85); // Upload done, now analyzing

      // Analyze the uploaded file
      let analysisResult: AnalysisResult;
      if (type === "audio") {
        analysisResult = await analyzeAudio.mutateAsync({
          fileUrl: uploadUrl,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
        });
      } else {
        analysisResult = await analyzeVideo.mutateAsync({
          fileUrl: uploadUrl,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
        });
      }

      setUploadProgress(100);
      setResult(analysisResult);
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
      <DetectionResult
        riskScore={result.riskScore}
        verdict={result.verdict as 'safe' | 'suspicious' | 'deepfake'}
        features={result.features}
        summary={result.summary}
        onReset={handleReset}
        onSave={handleSave}
        saved={saved}
      />
    );
  }

  return (
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
  );
}
