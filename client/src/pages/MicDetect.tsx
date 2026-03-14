import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Loader2, Shield, AlertTriangle, CheckCircle2, XCircle, Save, Activity } from 'lucide-react';
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

export default function MicDetect() {
  const { t, lang } = useLang();
  const { isAuthenticated } = useAuth();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const [liveResult, setLiveResult] = useState<LiveResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

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

  // Audio visualizer
  const drawWaveform = useCallback(() => {
    if (!analyzerRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const analyzer = analyzerRef.current;
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyzer.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Compute audio level
    const avg = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
    setAudioLevel(avg / 255);

    // Draw bars
    const barWidth = (canvas.width / bufferLength) * 2.5;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * canvas.height;
      const alpha = 0.4 + (dataArray[i] / 255) * 0.6;
      ctx.fillStyle = `oklch(0.65 0.18 200 / ${alpha})`;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }

    animFrameRef.current = requestAnimationFrame(drawWaveform);
  }, []);

  const analyzeChunk = useCallback(async () => {
    if (chunksRef.current.length === 0 || isAnalyzing) return;
    const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
    chunksRef.current = [];
    if (blob.size < 1000) return; // skip tiny chunks

    setIsAnalyzing(true);
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
      const base64 = btoa(binary);
      const result = await analyzeFrame.mutateAsync({
        type: 'microphone',
        frameData: base64,
        mimeType: 'audio/wav',
      });
      setLiveResult(result);
    } catch (err) {
      console.error('Mic analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, analyzeFrame]);

  const startDetection = async () => {
    setPermissionError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Setup audio analyzer for visualization
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyzer = audioCtx.createAnalyser();
      analyzer.fftSize = 256;
      source.connect(analyzer);
      analyzerRef.current = analyzer;

      // Setup MediaRecorder
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start(1000); // collect chunks every 1s

      setIsRunning(true);
      setSessionStartTime(Date.now());
      setSessionDuration(0);
      setSaved(false);

      // Analyze every 10 seconds
      intervalRef.current = setInterval(analyzeChunk, 10000);
      setTimeout(analyzeChunk, 5000);

      // Start visualizer
      drawWaveform();
    } catch (err) {
      console.error('Mic error:', err);
      setPermissionError(true);
    }
  };

  const stopDetection = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsRunning(false);
    setAudioLevel(0);
  };

  const handleSave = async () => {
    if (!liveResult || !isAuthenticated) return;
    try {
      await saveResult.mutateAsync({
        type: 'microphone',
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
    return () => { stopDetection(); };
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-400/10 border border-emerald-400/30 mb-4">
            <Mic className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {t.mic_title}
          </h1>
          <p className="text-muted-foreground">{t.mic_subtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Audio visualizer */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
              {/* Visualizer */}
              <div className="relative h-48 bg-muted/20 flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={160}
                  className="w-full h-full"
                />
                {!isRunning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-border flex items-center justify-center">
                      <MicOff className="w-7 h-7 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm text-muted-foreground">{t.mic_permission}</p>
                  </div>
                )}

                {/* Live indicator */}
                {isRunning && (
                  <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs text-white font-medium">REC</span>
                    <span className="text-xs text-white/70">{formatTime(sessionDuration)}</span>
                  </div>
                )}

                {isAnalyzing && (
                  <div className="absolute top-3 right-3 flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30">
                    <Loader2 className="w-3 h-3 text-primary animate-spin" />
                    <span className="text-xs text-primary">{t.mic_analyzing}</span>
                  </div>
                )}
              </div>

              {/* Audio level bar */}
              {isRunning && (
                <div className="px-4 py-2 border-t border-border/40">
                  <div className="flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-100"
                        style={{ width: `${audioLevel * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="p-4">
                {permissionError && (
                  <div className="mb-3 flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {t.mic_permission}
                  </div>
                )}
                <Button
                  className={`w-full gap-2 h-11 ${isRunning ? 'bg-destructive hover:bg-destructive/90 text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan'}`}
                  onClick={isRunning ? stopDetection : startDetection}
                >
                  {isRunning ? (
                    <><MicOff className="w-4 h-4" />{t.mic_stop}</>
                  ) : (
                    <><Mic className="w-4 h-4" />{t.mic_start}</>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Live score panel */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                {t.mic_live_score}
              </h3>

              {liveResult ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className={`text-5xl font-bold ${verdictConfig[liveResult.verdict].color}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {liveResult.riskScore}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{t.detect_risk_score}</div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        liveResult.verdict === 'safe' ? 'bg-emerald-400' :
                        liveResult.verdict === 'suspicious' ? 'bg-amber-400' : 'bg-red-400'
                      }`}
                      style={{ width: `${liveResult.riskScore}%` }}
                    />
                  </div>
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
                  <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                    {liveResult.topFeature}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="text-4xl font-bold text-muted-foreground/30 mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>--</div>
                  <p className="text-xs text-muted-foreground">
                    {isRunning ? t.mic_analyzing : t.mic_start}
                  </p>
                </div>
              )}
            </div>

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

            <div className="p-4 rounded-xl border border-border/40 bg-card/40 space-y-2">
              <p className="text-xs font-medium text-foreground">
                {lang === 'zh' ? '检测说明' : 'Detection Notes'}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {lang === 'zh'
                  ? '系统每 10 秒自动分析一段语音。请正常说话，系统将实时检测 AI 合成痕迹。'
                  : 'The system analyzes a 10-second audio segment automatically. Speak normally and the system will detect AI synthesis traces in real-time.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
