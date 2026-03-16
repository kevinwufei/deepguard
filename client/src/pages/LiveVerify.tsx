import { useState, useRef, useEffect, useCallback } from 'react';
import { UserCheck, Camera, Shield, AlertTriangle, CheckCircle2, Loader2, RotateCcw, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

type VerifyResult = {
  realPersonProbability: number;
  deepfakeProbability: number;
  verdict: 'verified' | 'suspicious' | 'fake';
  confidence: number;
  signals: Array<{ name: string; status: 'pass' | 'warn' | 'fail'; description: string }>;
  summary: string;
};

export default function LiveVerify() {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isActive, setIsActive] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    document.title = 'Live Person Verification - DeepGuard';
    return () => stopCamera();
  }, []);

  const analyzeFrame = trpc.detection.analyzeRealtimeFrame.useMutation({
    onSuccess: (data: any) => {
      const score = data.riskScore ?? 0;
      const realProb = Math.max(0, 100 - score);
      setResult({
        realPersonProbability: realProb,
        deepfakeProbability: score,
        verdict: score < 30 ? 'verified' : score < 65 ? 'suspicious' : 'fake',
        confidence: data.confidence ?? 80,
        signals: data.features?.map((f: any) => ({
          name: f.name,
          status: f.confidence > 0.7 ? 'fail' : f.confidence > 0.4 ? 'warn' : 'pass',
          description: f.description,
        })) ?? [],
        summary: data.summary ?? '',
      });
      setAnalyzing(false);
      setFrameCount(c => c + 1);
    },
    onError: () => setAnalyzing(false),
  });

  const captureAndAnalyze = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || analyzing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    setAnalyzing(true);
    analyzeFrame.mutate({ frameData: dataUrl, type: 'camera', mimeType: 'image/jpeg' });
  }, [analyzing, analyzeFrame]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720, facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsActive(true);
      setResult(null);
      setFrameCount(0);
      intervalRef.current = setInterval(captureAndAnalyze, 8000);
      setTimeout(captureAndAnalyze, 1500);
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setPermissionDenied(true);
        toast.error('Camera permission denied. Please allow camera access.');
      } else {
        toast.error('Failed to access camera.');
      }
    }
  };

  const stopCamera = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    streamRef.current = null;
    setIsActive(false);
    setAnalyzing(false);
  };

  const getVerdictStyle = (verdict?: string) => {
    if (verdict === 'verified') return { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', icon: CheckCircle2 };
    if (verdict === 'suspicious') return { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', icon: AlertTriangle };
    return { color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30', icon: AlertTriangle };
  };

  const style = result ? getVerdictStyle(result.verdict) : null;

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="container max-w-5xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-sm font-medium mb-4">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Live Person Verification</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Verify You're Talking to a Real Person
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Point your camera at the person you're talking with — or use this for identity verification. Our AI detects deepfake faces, synthetic avatars, and video manipulation in real time.
          </p>
        </div>

        {/* Use case chips */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {['Dating Apps', 'Remote Interviews', 'KYC Verification', 'Video Calls', 'Online Meetings'].map(tag => (
            <span key={tag} className="px-3 py-1 rounded-full border border-border/60 bg-card text-xs text-muted-foreground">{tag}</span>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Camera feed */}
          <div className="lg:col-span-3 space-y-4">
            <div className="relative rounded-xl border border-border/60 bg-black overflow-hidden aspect-video">
              <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
              <canvas ref={canvasRef} className="hidden" />

              {!isActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
                  <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center mb-4">
                    <Camera className="w-8 h-8 text-violet-400" />
                  </div>
                  <p className="text-foreground font-medium mb-1">Camera not active</p>
                  <p className="text-muted-foreground text-sm">Click Start to begin verification</p>
                </div>
              )}

              {isActive && (
                <>
                  <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-white font-medium">LIVE</span>
                  </div>
                  {analyzing && (
                    <div className="absolute top-3 right-3 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10">
                      <Loader2 className="w-3 h-3 text-primary animate-spin" />
                      <span className="text-xs text-white">Analyzing...</span>
                    </div>
                  )}
                  {result && !analyzing && (
                    <div className={`absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-2 rounded-lg border backdrop-blur-sm ${style?.bg}`}>
                      <div className="flex items-center gap-2">
                        {style && <style.icon className={`w-4 h-4 ${style.color}`} />}
                        <span className={`text-sm font-semibold ${style?.color}`}>
                          {result.verdict === 'verified' ? 'Real Person Verified' : result.verdict === 'suspicious' ? 'Suspicious — Verify Manually' : 'Deepfake Detected'}
                        </span>
                      </div>
                      <span className={`text-xs font-bold ${style?.color}`}>{result.realPersonProbability}% Real</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex gap-3">
              {!isActive ? (
                <Button onClick={startCamera} disabled={permissionDenied} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white gap-2">
                  <Play className="w-4 h-4" /> Start Verification
                </Button>
              ) : (
                <Button onClick={stopCamera} variant="outline" className="flex-1 border-rose-500/40 text-rose-400 hover:bg-rose-500/10 gap-2">
                  <Square className="w-4 h-4" /> Stop
                </Button>
              )}
              {result && (
                <Button variant="outline" onClick={() => { setResult(null); setFrameCount(0); }} className="gap-2">
                  <RotateCcw className="w-4 h-4" /> Reset
                </Button>
              )}
            </div>

            {permissionDenied && (
              <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10">
                <p className="text-sm text-rose-400 font-medium mb-1">Camera access denied</p>
                <p className="text-xs text-muted-foreground">Please allow camera access in your browser settings and reload the page.</p>
              </div>
            )}
          </div>

          {/* Results panel */}
          <div className="lg:col-span-2 space-y-4">
            {!result && !analyzing && (
              <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
                  <Shield className="w-8 h-8 text-violet-400/50" />
                </div>
                <p className="text-muted-foreground text-sm">Verification results will appear here</p>
                <p className="text-muted-foreground/60 text-xs mt-1">Analysis runs every 8 seconds</p>
              </div>
            )}

            {analyzing && !result && (
              <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                <Loader2 className="w-10 h-10 text-violet-400 animate-spin mb-4" />
                <p className="text-foreground font-medium mb-1">Analyzing face...</p>
                <p className="text-muted-foreground text-xs">Checking for deepfake indicators</p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {/* Main verdict */}
                <div className={`p-5 rounded-xl border ${style?.bg}`}>
                  <div className="flex items-center gap-3 mb-4">
                    {style && <style.icon className={`w-5 h-5 ${style.color}`} />}
                    <span className={`font-semibold ${style?.color}`}>
                      {result.verdict === 'verified' ? 'Real Person Verified' : result.verdict === 'suspicious' ? 'Suspicious' : 'Deepfake Detected'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Real Person</p>
                      <p className="text-2xl font-bold text-emerald-400" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{result.realPersonProbability}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Deepfake Risk</p>
                      <p className="text-2xl font-bold text-rose-400" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{result.deepfakeProbability}%</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-xs text-muted-foreground">Confidence: <span className="text-foreground font-medium">{result.confidence}%</span> · Frames analyzed: <span className="text-foreground font-medium">{frameCount}</span></p>
                  </div>
                </div>

                {/* Signal checks */}
                {result.signals.length > 0 && (
                  <div className="p-4 rounded-xl border border-border/60 bg-card">
                    <p className="text-xs font-medium text-muted-foreground mb-3">Verification Signals</p>
                    <div className="space-y-2">
                      {result.signals.map((s, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${s.status === 'pass' ? 'bg-emerald-400' : s.status === 'warn' ? 'bg-amber-400' : 'bg-rose-400'}`} />
                          <div>
                            <p className="text-xs font-medium text-foreground">{s.name}</p>
                            <p className="text-xs text-muted-foreground">{s.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary */}
                {result.summary && (
                  <div className="p-4 rounded-xl border border-border/60 bg-card">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Summary</p>
                    <p className="text-sm text-foreground leading-relaxed">{result.summary}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Privacy note */}
        <div className="mt-8 p-4 rounded-xl border border-border/40 bg-muted/20 flex items-start gap-3">
          <Shield className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Privacy protected.</strong> Video frames are processed in real time and are never stored on our servers. All analysis happens through encrypted API calls and results are discarded immediately after display.
          </p>
        </div>
      </div>
    </div>
  );
}
