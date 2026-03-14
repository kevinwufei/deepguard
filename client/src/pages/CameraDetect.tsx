import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, CameraOff, Loader2, Shield, AlertTriangle, CheckCircle2, XCircle, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLang } from '@/contexts/LanguageContext';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useAuth } from '@/_core/hooks/useAuth';

interface LiveResult {
  riskScore: number;
  verdict: 'safe' | 'suspicious' | 'deepfake';
  topFeature: string;
}

export default function CameraDetect() {
  const { t, lang } = useLang();
  const { isAuthenticated } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const [liveResult, setLiveResult] = useState<LiveResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  const analyzeFrame = trpc.detection.analyzeRealtimeFrame.useMutation();
  const saveResult = trpc.detection.saveRealtimeResult.useMutation();

  // Timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isRunning && sessionStartTime) {
      timer = setInterval(() => {
        setSessionDuration(Math.floor((Date.now() - sessionStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, sessionStartTime]);

  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isAnalyzing) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, 320, 240);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    const base64 = dataUrl.split(',')[1];
    setIsAnalyzing(true);
    try {
      const result = await analyzeFrame.mutateAsync({
        type: 'camera',
        frameData: base64,
        mimeType: 'image/jpeg',
      });
      setLiveResult(result);
    } catch (err) {
      console.error('Frame analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, analyzeFrame]);

  const startDetection = async () => {
    setPermissionError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsRunning(true);
      setSessionStartTime(Date.now());
      setSessionDuration(0);
      setSaved(false);
      // Analyze every 8 seconds
      intervalRef.current = setInterval(captureAndAnalyze, 8000);
      // First analysis after 2s
      setTimeout(captureAndAnalyze, 2000);
    } catch (err) {
      console.error('Camera error:', err);
      setPermissionError(true);
    }
  };

  const stopDetection = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsRunning(false);
  };

  const handleSave = async () => {
    if (!liveResult || !isAuthenticated) return;
    try {
      await saveResult.mutateAsync({
        type: 'camera',
        riskScore: liveResult.riskScore,
        verdict: liveResult.verdict,
        duration: sessionDuration,
      });
      setSaved(true);
      toast.success(t.detect_saved);
    } catch {
      toast.error('Save failed');
    }
  };

  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, []);

  const verdictConfig = {
    safe: { color: 'text-emerald-400', icon: CheckCircle2, label: t.detect_verdict_safe },
    suspicious: { color: 'text-amber-400', icon: AlertTriangle, label: t.detect_verdict_suspicious },
    deepfake: { color: 'text-red-400', icon: XCircle, label: t.detect_verdict_deepfake },
  };

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="min-h-screen py-12 grid-bg">
      <div className="container max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-400/10 border border-violet-400/30 mb-4">
            <Camera className="w-8 h-8 text-violet-400" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {t.camera_title}
          </h1>
          <p className="text-muted-foreground">{t.camera_subtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video feed */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
              <div className="relative aspect-video bg-muted/30">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
                <canvas ref={canvasRef} className="hidden" />

                {!isRunning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <CameraOff className="w-12 h-12 text-muted-foreground/40" />
                    <p className="text-muted-foreground text-sm">{t.camera_permission}</p>
                  </div>
                )}

                {/* Live indicator */}
                {isRunning && (
                  <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs text-white font-medium">LIVE</span>
                    <span className="text-xs text-white/70">{formatTime(sessionDuration)}</span>
                  </div>
                )}

                {/* Analyzing indicator */}
                {isAnalyzing && (
                  <div className="absolute top-3 right-3 flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30">
                    <Loader2 className="w-3 h-3 text-primary animate-spin" />
                    <span className="text-xs text-primary">{t.camera_analyzing}</span>
                  </div>
                )}

                {/* Scan overlay when running */}
                {isRunning && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-4 border border-primary/20 rounded-lg" />
                    <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-primary/60 rounded-tl" />
                    <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-primary/60 rounded-tr" />
                    <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-primary/60 rounded-bl" />
                    <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-primary/60 rounded-br" />
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="p-4">
                {permissionError && (
                  <div className="mb-3 flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {t.camera_permission}
                  </div>
                )}
                <Button
                  className={`w-full gap-2 h-11 ${isRunning ? 'bg-destructive hover:bg-destructive/90 text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan'}`}
                  onClick={isRunning ? stopDetection : startDetection}
                >
                  {isRunning ? (
                    <><CameraOff className="w-4 h-4" />{t.camera_stop}</>
                  ) : (
                    <><Camera className="w-4 h-4" />{t.camera_start}</>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Live score panel */}
          <div className="space-y-4">
            {/* Score card */}
            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                {t.camera_live_score}
              </h3>

              {liveResult ? (
                <div className="space-y-4">
                  {/* Score */}
                  <div className="text-center">
                    <div className={`text-5xl font-bold ${verdictConfig[liveResult.verdict].color}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {liveResult.riskScore}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{t.detect_risk_score}</div>
                  </div>

                  {/* Score bar */}
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        liveResult.verdict === 'safe' ? 'bg-emerald-400' :
                        liveResult.verdict === 'suspicious' ? 'bg-amber-400' : 'bg-red-400'
                      }`}
                      style={{ width: `${liveResult.riskScore}%` }}
                    />
                  </div>

                  {/* Verdict badge */}
                  {(() => {
                    const cfg = verdictConfig[liveResult.verdict];
                    const Icon = cfg.icon;
                    return (
                      <div className={`flex items-center gap-2 justify-center ${cfg.color}`}>
                        <Icon className="w-4 h-4" />
                        <span className="font-semibold">{cfg.label}</span>
                      </div>
                    );
                  })()}

                  {/* Top feature */}
                  <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                    {liveResult.topFeature}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="text-4xl font-bold text-muted-foreground/30 mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>--</div>
                  <p className="text-xs text-muted-foreground">
                    {isRunning ? t.camera_analyzing : t.camera_start}
                  </p>
                </div>
              )}
            </div>

            {/* Save button */}
            {liveResult && !isRunning && isAuthenticated && (
              <Button
                className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleSave}
                disabled={saved || saveResult.isPending}
              >
                <Save className="w-4 h-4" />
                {saved ? t.detect_saved : t.detect_save_result}
              </Button>
            )}

            {/* Tips */}
            <div className="p-4 rounded-xl border border-border/40 bg-card/40 space-y-2">
              <p className="text-xs font-medium text-foreground">
                {lang === 'zh' ? '检测说明' : 'Detection Notes'}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {lang === 'zh'
                  ? '系统每 8 秒自动截取一帧进行分析。请确保光线充足，面部清晰可见。'
                  : 'The system captures a frame every 8 seconds for analysis. Ensure good lighting and a clear view of the face.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
