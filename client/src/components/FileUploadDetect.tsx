import { useState, useRef, useCallback } from 'react';
import { Upload, FileAudio, FileVideo, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLang } from '@/contexts/LanguageContext';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import DetectionResult from './DetectionResult';

interface FileUploadDetectProps {
  type: 'audio' | 'video';
  acceptedFormats: string;
  acceptMimeTypes: string;
  maxSizeMB?: number;
}

interface AnalysisResult {
  riskScore: number;
  verdict: 'safe' | 'suspicious' | 'deepfake';
  features: Array<{ name: string; confidence: number; description: string }>;
  summary: string;
}

export default function FileUploadDetect({
  type,
  acceptedFormats,
  acceptMimeTypes,
  maxSizeMB = 50,
}: FileUploadDetectProps) {
  const { t } = useLang();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = trpc.detection.uploadFile.useMutation();
  const analyzeAudio = trpc.detection.analyzeAudio.useMutation();
  const analyzeVideo = trpc.detection.analyzeVideo.useMutation();

  const handleFile = useCallback((f: File) => {
    if (f.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds ${maxSizeMB}MB limit`);
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
    setError(null);
    try {
      // Read file as base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // remove data:...;base64, prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Upload to S3
      const { url } = await uploadFile.mutateAsync({
        fileName: file.name,
        fileData: base64,
        mimeType: file.type,
      });

      // Analyze
      let analysisResult: AnalysisResult;
      if (type === 'audio') {
        analysisResult = await analyzeAudio.mutateAsync({
          fileUrl: url,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
        });
      } else {
        analysisResult = await analyzeVideo.mutateAsync({
          fileUrl: url,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
        });
      }
      setResult(analysisResult);
    } catch (err) {
      console.error(err);
      setError('Analysis failed. Please try again.');
      toast.error('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setSaved(false);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = () => {
    setSaved(true);
    toast.success(t.detect_saved);
  };

  const FileIcon = type === 'audio' ? FileAudio : FileVideo;

  if (result) {
    return (
      <DetectionResult
        riskScore={result.riskScore}
        verdict={result.verdict}
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
        className={`upload-zone rounded-2xl p-10 text-center cursor-pointer transition-all ${isDragging ? 'drag-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptMimeTypes}
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {file ? (
          <div className="space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto">
              <FileIcon className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">{file.name}</p>
              <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">{t.detect_upload_title}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t.detect_upload_hint} {acceptedFormats}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">Max {maxSizeMB}MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Analyze button */}
      {file && (
        <Button
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan gap-2 h-12 text-base"
          onClick={handleAnalyze}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t.detect_analyzing}
            </>
          ) : (
            <>
              <FileIcon className="w-5 h-5" />
              {type === 'audio' ? t.audio_title : t.video_title}
            </>
          )}
        </Button>
      )}
    </div>
  );
}
