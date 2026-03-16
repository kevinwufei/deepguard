import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Monitor, MonitorOff, Loader2, Shield, AlertTriangle,
  CheckCircle2, XCircle, Save, Info, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLang } from '@/contexts/LanguageContext';
import { useTranslation } from 'react-i18next';

interface LiveResult {
  riskScore: number;
  verdict: 'safe' | 'suspicious' | 'deepfake';
  topFeature: string;
}

const SUPPORTED_APPS = [
  { name: 'Zoom', icon: '🎥', color: 'bg-blue-500/10 border-blue-500/30 text-blue-400' },
  { name: 'Teams', icon: '💼', color: 'bg-violet-500/10 border-violet-500/30 text-violet-400' },
  { name: 'Google Meet', icon: '📹', color: 'bg-green-500/10 border-green-500/30 text-green-400' },
  { name: 'WeChat / 微信', icon: '💬', color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
  { name: 'WhatsApp', icon: '📱', color: 'bg-teal-500/10 border-teal-500/30 text-teal-400' },
  { name: 'FaceTime', icon: '📞', color: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' },
];

const STEPS = [
  { zh: '点击下方按钮，选择"共享屏幕"', en: 'Click the button below and select "Share Screen"' },
  { zh: '在弹出窗口中选择 Zoom / 微信 / Teams 等通话窗口，或选择整个屏幕', en: 'In the popup, select your Zoom / WeChat / Teams call window, or share entire screen' },
  { zh: 'DeepGuard 将每 6 秒自动截取一帧进行 AI 分析，实时显示风险评分', en: 'DeepGuard captures a frame every 6 seconds for AI analysis and shows live risk score' },
];

export default function ScreenDetect() {
  const { t } = useTranslation();
  const { lang } = useLang();
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
  const [analysisCount, setAnalysisCount] = useState(0);
  const [alertHistory, setAlertHistory] = useState<Array<{ score: number; verdict: string; time: string }>>([]);

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
    const video = videoRef.current;
    if (video.videoWidth === 0) return;

    const canvas = canvasRef.current;
    // Capture at reduced resolution for speed
    canvas.width = 640;
    canvas.height = Math.round((video.videoHeight / video.videoWidth) * 640);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
    const base64 = dataUrl.split(',')[1];

    setIsAnalyzing(true);
    try {
      const result = await analyzeFrame.mutateAsync({
        type: 'camera',
        frameData: base64,
        mimeType: 'image/jpeg',
      });
      setLiveResult(result);
      setAnalysisCount(c => c + 1);

      // Add to alert history if suspicious or deepfake
      if (result.verdict !== 'safe') {
        const now = new Date();
        const timeStr = now.toLocaleTimeString(lang === 'zh' ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setAlertHistory(prev => [{ score: result.riskScore, verdict: result.verdict, time: timeStr }, ...prev.slice(0, 4)]);
      }
    } catch (err) {
      console.error('Screen frame analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, analyzeFrame, lang]);

  const startDetection = async () => {
    setPermissionError(false);
    try {
      // Request screen capture
      const stream = await (navigator.mediaDevices as MediaDevices & {
        getDisplayMedia: (constraints?: MediaStreamConstraints) => Promise<MediaStream>
      }).getDisplayMedia({
        video: { frameRate: 5 },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Handle user stopping via browser UI
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopDetection();
      });

      setIsRunning(true);
      setSessionStartTime(Date.now());
      setSessionDuration(0);
      setSaved(false);
      setAlertHistory([]);
      setAnalysisCount(0);

      // Analyze every 6 seconds
      intervalRef.current = setInterval(captureAndAnalyze, 6000);
      // First analysis after 2s
      setTimeout(captureAndAnalyze, 2000);
    } catch (err: unknown) {
      console.error('Screen share error:', err);
      const errorName = err instanceof Error ? err.name : '';
      if (errorName !== 'NotAllowedError') {
        setPermissionError(true);
      }
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
      toast.success(t('detect_saved'));
    } catch {
      toast.error('Save failed');
    }
  };

  useEffect(() => {
    return () => { stopDetection(); };
  }, []);

  const verdictConfig = {
    safe: { color: 'text-emerald-400', bgColor: 'bg-emerald-400/10', borderColor: 'border-emerald-400/30', icon: CheckCircle2, label: t('detect_verdict_safe') },
    suspicious: { color: 'text-amber-400', bgColor: 'bg-amber-400/10', borderColor: 'border-amber-400/30', icon: AlertTriangle, label: t('detect_verdict_suspicious') },
    deepfake: { color: 'text-red-400', bgColor: 'bg-red-400/10', borderColor: 'border-red-400/30', icon: XCircle, label: t('detect_verdict_deepfake') },
  };

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="min-h-screen py-12 grid-bg">
      <div className="container max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-400/10 border border-orange-400/30 mb-4">
            <Monitor className="w-8 h-8 text-orange-400" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {t('screen_title')}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">{t('screen_subtitle')}</p>

          {/* Supported apps badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            {SUPPORTED_APPS.map(app => (
              <span key={app.name} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${app.color}`}>
                <span>{app.icon}</span>
                {app.name}
              </span>
            ))}
          </div>
        </div>

        {/* How it works steps */}
        {!isRunning && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {STEPS.map((step, i) => (
              <div key={i} className="flex gap-3 p-4 rounded-xl border border-border/40 bg-card/40">
                <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm">
                  {i + 1}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {lang === 'zh' ? step.zh : step.en}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Screen preview */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
              <div className="relative bg-muted/20" style={{ minHeight: '300px' }}>
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  muted
                  playsInline
                  style={{ maxHeight: '400px' }}
                />
                <canvas ref={canvasRef} className="hidden" />

                {!isRunning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 min-h-[300px]">
                    <div className="w-20 h-20 rounded-2xl bg-orange-400/10 border border-orange-400/20 flex items-center justify-center">
                      <MonitorOff className="w-10 h-10 text-orange-400/40" />
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {lang === 'zh' ? '点击下方按钮开始屏幕共享' : 'Click the button below to start screen sharing'}
                    </p>
                  </div>
                )}

                {/* Live indicator */}
                {isRunning && (
                  <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-sm">
                    <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                    <span className="text-xs text-white font-medium">SCREEN</span>
                    <span className="text-xs text-white/70">{formatTime(sessionDuration)}</span>
                  </div>
                )}

                {/* Analysis count */}
                {isRunning && analysisCount > 0 && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-sm">
                    <Zap className="w-3 h-3 text-primary" />
                    <span className="text-xs text-white">{analysisCount} {lang === 'zh' ? '次分析' : 'scans'}</span>
                  </div>
                )}

                {isAnalyzing && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30">
                    <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                    <span className="text-xs text-primary font-medium">{t('screen_analyzing')}</span>
                  </div>
                )}

                {/* Scan overlay */}
                {isRunning && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-3 border border-orange-400/15 rounded-lg" />
                    <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-orange-400/50 rounded-tl" />
                    <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-orange-400/50 rounded-tr" />
                    <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-orange-400/50 rounded-bl" />
                    <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-orange-400/50 rounded-br" />
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="p-4 space-y-3">
                {permissionError && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {t('screen_permission')}
                  </div>
                )}

                <Button
                  className={`w-full gap-2 h-12 text-base font-medium ${
                    isRunning
                      ? 'bg-destructive hover:bg-destructive/90 text-white'
                      : 'bg-orange-500 hover:bg-orange-500/90 text-white'
                  }`}
                  onClick={isRunning ? stopDetection : startDetection}
                >
                  {isRunning ? (
                    <><MonitorOff className="w-5 h-5" />{t('screen_stop')}</>
                  ) : (
                    <><Monitor className="w-5 h-5" />{t('screen_start')}</>
                  )}
                </Button>

                {/* Privacy note */}
                <div className="flex items-start gap-2 text-xs text-muted-foreground/70">
                  <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>
                    {lang === 'zh'
                      ? '屏幕内容仅用于 AI 分析，不会被录制或存储。分析完成后立即丢弃。'
                      : 'Screen content is only used for AI analysis and is never recorded or stored. Frames are discarded immediately after analysis.'}
                  </span>
                </div>
              </div>
            </div>

            {/* Alert history */}
            {alertHistory.length > 0 && (
              <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
                <h3 className="text-sm font-medium text-amber-400 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {lang === 'zh' ? '风险预警记录' : 'Risk Alert Log'}
                </h3>
                <div className="space-y-2">
                  {alertHistory.map((alert, i) => {
                    const vc = verdictConfig[alert.verdict as keyof typeof verdictConfig];
                    const Icon = vc.icon;
                    return (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-3.5 h-3.5 ${vc.color}`} />
                          <span className={`font-medium ${vc.color}`}>{vc.label}</span>
                          <span className="text-muted-foreground text-xs">@ {alert.time}</span>
                        </div>
                        <span className={`font-bold ${vc.color}`}>{alert.score}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Live score panel */}
          <div className="space-y-4">
            {/* Score card */}
            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                {t('screen_live_score')}
              </h3>

              {liveResult ? (() => {
                const cfg = verdictConfig[liveResult.verdict];
                const Icon = cfg.icon;
                return (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className={`text-5xl font-bold ${cfg.color}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        {liveResult.riskScore}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{t('detect_risk_score')}</div>
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
                    <div className={`flex items-center gap-2 justify-center ${cfg.color}`}>
                      <Icon className="w-4 h-4" />
                      <span className="font-semibold">{cfg.label}</span>
                    </div>
                    <div className={`p-3 rounded-lg ${cfg.bgColor} border ${cfg.borderColor} text-xs ${cfg.color}`}>
                      {liveResult.topFeature}
                    </div>
                  </div>
                );
              })() : (
                <div className="text-center py-8">
                  <div className="text-4xl font-bold text-muted-foreground/20 mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>--</div>
                  <p className="text-xs text-muted-foreground">
                    {isRunning
                      ? (lang === 'zh' ? '等待首次分析...' : 'Waiting for first scan...')
                      : (lang === 'zh' ? '开启屏幕共享后开始检测' : 'Start screen sharing to begin')}
                  </p>
                </div>
              )}
            </div>

            {/* Session stats */}
            {isRunning && (
              <div className="rounded-xl border border-border/40 bg-card/60 p-4 grid grid-cols-2 gap-3">
                <div className="text-center">
                  <div className="text-xl font-bold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {formatTime(sessionDuration)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {lang === 'zh' ? '检测时长' : 'Duration'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-primary" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {analysisCount}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {lang === 'zh' ? '已分析帧数' : 'Frames Scanned'}
                  </div>
                </div>
              </div>
            )}

            {/* Save button */}
            {liveResult && !isRunning && isAuthenticated && (
              <Button
                className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleSave}
                disabled={saved || saveResult.isPending}
              >
                <Save className="w-4 h-4" />
                {saved ? t('detect_saved') : t('detect_save_result')}
              </Button>
            )}

            {/* Tips */}
            <div className="p-4 rounded-xl border border-border/40 bg-card/40 space-y-3">
              <p className="text-xs font-semibold text-foreground">
                {lang === 'zh' ? '💡 使用技巧' : '💡 Tips'}
              </p>
              <ul className="space-y-2">
                {(lang === 'zh' ? [
                  '选择"窗口"而非整个屏幕，可以减少干扰，提升检测精度',
                  '确保通话对方的面部在画面中清晰可见',
                  '每 6 秒自动分析一次，高风险时会显示预警记录',
                ] : [
                  'Select a "Window" rather than the entire screen for better accuracy',
                  'Ensure the other person\'s face is clearly visible in the frame',
                  'Auto-analyzes every 6 seconds; high-risk frames appear in the alert log',
                ]).map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="text-primary mt-0.5">›</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
