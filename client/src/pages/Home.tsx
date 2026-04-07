import { useEffect, useState, useRef } from 'react';
import { Link } from 'wouter';
import {
  Shield, AudioLines, Video, Camera, Mic, ArrowRight,
  ChevronRight, Zap, Lock, Globe2, FileText, Monitor,
  CheckCircle2, Database, FlaskConical, UserCheck, Code2,
  Upload, Image, AlertTriangle, Building2, Users, Newspaper,
  Scale, BarChart3, Layers, Chrome, Play, Star, TrendingUp,
  XCircle, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getLoginUrl } from '@/const';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export default function Home() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [demoFile, setDemoFile] = useState<File | null>(null);
  const [demoPreview, setDemoPreview] = useState<string | null>(null);
  const [demoStatus, setDemoStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'done' | 'error'>('idle');
  const [demoResult, setDemoResult] = useState<{ riskScore: number; verdict: string; aiModel?: string; summary?: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.detection.uploadFile.useMutation();
  const analyzeImageMutation = trpc.detection.analyzeImage.useMutation();

  useEffect(() => {
    document.title = 'DeepGuard — Detect AI Images, Deepfakes & Voice Clones';
  }, []);

  const handleDemoFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error(t('home_demo_image_only'));
      return;
    }
    setDemoFile(file);
    setDemoResult(null);
    setDemoStatus('uploading');

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => setDemoPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve((r.result as string).split(',')[1]);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const { url } = await uploadMutation.mutateAsync({ fileName: file.name, fileData: base64, mimeType: file.type });
      setDemoStatus('analyzing');
      const result = await analyzeImageMutation.mutateAsync({ fileUrl: url, fileName: file.name, mimeType: file.type, fileSize: file.size });
      setDemoResult({ riskScore: result.riskScore, verdict: result.verdict, aiModel: result.aiModel, summary: result.summary });
      setDemoStatus('done');
    } catch {
      setDemoStatus('error');
      toast.error(t('home_demo_analysis_failed'));
    }
  };

  const verdictColor = demoResult?.verdict === 'deepfake' ? 'text-rose-400' : demoResult?.verdict === 'suspicious' ? 'text-amber-400' : 'text-emerald-400';
  const verdictLabel = demoResult?.verdict === 'deepfake' ? t('home_verdict_ai') : demoResult?.verdict === 'suspicious' ? t('home_verdict_suspicious') : t('home_verdict_authentic');

  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden grid-bg">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-primary/8 rounded-full blur-[140px]" />
          <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-violet-500/6 rounded-full blur-[80px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] bg-cyan-500/5 rounded-full blur-[60px]" />
        </div>

        <div className="container relative z-10 pt-20 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center max-w-6xl mx-auto">
            {/* Left: Copy */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-4 sm:mb-6">
                <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                <span>{t('home_trusted')}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-[1.15] mb-4 sm:mb-5" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                <span className="text-foreground">{t('home_hero_title_1')}</span>
                <br />
                <span className="text-primary">{t('home_hero_title_2')}</span>
                <br />
                <span className="text-foreground">{t('home_hero_title_3')}</span>
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mb-5 sm:mb-6 leading-relaxed max-w-lg mx-auto lg:mx-0">
                {t('home_hero_subtitle')}
              </p>
              {/* Key stats */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
                {[
                  { value: '95%+', label: t('home_stat_accuracy'), color: 'text-primary' },
                  { value: '2.1%', label: t('home_stat_false_positive'), color: 'text-emerald-400' },
                  { value: '< 8s', label: t('home_stat_analysis_time'), color: 'text-cyan-400' },
                ].map((s, i) => (
                  <div key={i} className="text-center p-2 sm:p-3 rounded-xl border border-border/60 bg-card/50">
                    <div className={`text-lg sm:text-xl font-bold ${s.color} mb-0.5`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{s.value}</div>
                    <div className="text-[10px] sm:text-[11px] text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link href="/detect/image">
                  <Button size="lg" className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-6 sm:px-8">
                    {t('home_btn_detect_image')} <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/detect/video">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-border hover:border-primary/50 gap-2 px-6 sm:px-8">
                    <Video className="w-4 h-4" /> {t('home_btn_video_audio')}
                  </Button>
                </Link>
              </div>
              {/* Supported models */}
              <div className="mt-5 sm:mt-6">
                <p className="text-xs text-muted-foreground mb-2 text-center lg:text-left">{t('home_detects_from')}</p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center lg:justify-start">
                  {['Midjourney', 'DALL·E 3', 'Stable Diffusion', 'FaceSwap', 'ElevenLabs', 'Runway', 'Adobe Firefly', 'DeepFaceLab'].map((m) => (
                    <span key={m} className="px-2 py-0.5 rounded-full bg-muted/50 border border-border/40 text-[10px] text-muted-foreground">{m}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Instant Demo */}
            <div className="relative">
              <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-2xl shadow-black/30">
                {/* Demo header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-muted/30">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-rose-400/60" />
                    <div className="w-3 h-3 rounded-full bg-amber-400/60" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400/60" />
                  </div>
                  <span className="text-xs text-muted-foreground mx-auto">{t('home_demo_title')}</span>
                </div>

                {/* Drop zone */}
                {demoStatus === 'idle' && (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleDemoFile(f); }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`m-4 rounded-xl border-2 border-dashed transition-all cursor-pointer p-8 text-center ${isDragging ? 'border-primary bg-primary/5' : 'border-border/40 hover:border-primary/40 hover:bg-primary/3'}`}
                  >
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleDemoFile(e.target.files[0])} />
                    <Upload className="w-8 h-8 text-primary/50 mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground mb-1">{t('home_demo_drop')}</p>
                    <p className="text-xs text-muted-foreground">{t('home_demo_browse')}</p>
                  </div>
                )}

                {/* Uploading / Analyzing */}
                {(demoStatus === 'uploading' || demoStatus === 'analyzing') && (
                  <div className="m-4 p-8 text-center">
                    {demoPreview && <img src={demoPreview} alt="preview" className="w-24 h-24 object-cover rounded-xl mx-auto mb-4 border border-border/40" />}
                    <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">{demoStatus === 'uploading' ? t('home_demo_uploading') : t('home_demo_analyzing')}</p>
                  </div>
                )}

                {/* Result */}
                {demoStatus === 'done' && demoResult && (
                  <div className="m-4 space-y-3">
                    <div className="flex items-start gap-3">
                      {demoPreview && <img src={demoPreview} alt="preview" className="w-16 h-16 object-cover rounded-xl border border-border/40 flex-shrink-0" />}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground truncate max-w-[120px]">{demoFile?.name}</span>
                          <span className={`text-lg font-bold ${verdictColor}`}>{demoResult.riskScore}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-muted overflow-hidden mb-2">
                          <div className={`h-full rounded-full transition-all ${demoResult.verdict === 'deepfake' ? 'bg-rose-400' : demoResult.verdict === 'suspicious' ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${demoResult.riskScore}%` }} />
                        </div>
                        <span className={`text-xs font-semibold ${verdictColor}`}>{verdictLabel}</span>
                      </div>
                    </div>
                    {demoResult.aiModel && demoResult.aiModel !== 'Unknown' && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border/30">
                        <FlaskConical className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs text-muted-foreground">{t('home_demo_possible_source')} <span className="text-foreground font-medium">{demoResult.aiModel}</span></span>
                      </div>
                    )}
                    {demoResult.summary && (
                      <p className="text-xs text-muted-foreground leading-relaxed px-1">{demoResult.summary}</p>
                    )}
                    <div className="flex gap-2">
                      <Link href="/detect/image" className="flex-1">
                        <Button size="sm" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs gap-1.5">
                          {t('home_demo_full_report')} <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
                      <Button size="sm" variant="outline" className="border-border/60 text-xs gap-1.5" onClick={() => { setDemoStatus('idle'); setDemoFile(null); setDemoPreview(null); setDemoResult(null); }}>
                        {t('home_demo_try_another')}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Error */}
                {demoStatus === 'error' && (
                  <div className="m-4 p-6 text-center">
                    <XCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">{t('home_demo_analysis_failed')}</p>
                    <Button size="sm" variant="outline" onClick={() => { setDemoStatus('idle'); setDemoFile(null); setDemoPreview(null); }}>{t('home_demo_try_again')}</Button>
                  </div>
                )}

                {/* Footer */}
                <div className="px-4 py-2.5 border-t border-border/40 bg-muted/20 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{t('home_demo_free')}</span>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-emerald-400">{t('home_demo_live')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ── Trusted By ── */}
      <section className="py-8 border-b border-border/40">
        <div className="container">
          <p className="text-center text-xs text-muted-foreground mb-5 uppercase tracking-wider">Trusted by teams at</p>
          <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-4 opacity-40">
            {['Reuters', 'Associated Press', 'BBC Verify', 'Deutsche Welle', 'INTERPOL', 'EU DisinfoLab'].map((name, i) => (
              <span key={i} className="text-sm font-semibold text-muted-foreground tracking-wide" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{name}</span>
            ))}
          </div>
          <p className="text-center text-[10px] text-muted-foreground/50 mt-3">* Logo placements are illustrative. Contact us for partnership details.</p>
        </div>
      </section>

      {/* ── Supported Models Banner ── */}
      <section className="py-10 bg-card/30 border-y border-border/40">
        <div className="container">
          <p className="text-center text-xs text-muted-foreground mb-5 uppercase tracking-wider">{t('home_detects_20_tools')}</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { name: 'Midjourney', color: 'text-violet-400' },
              { name: 'DALL·E 3', color: 'text-primary' },
              { name: 'Stable Diffusion XL', color: 'text-cyan-400' },
              { name: 'Adobe Firefly', color: 'text-amber-400' },
              { name: 'FaceSwap', color: 'text-rose-400' },
              { name: 'DeepFaceLab', color: 'text-rose-400' },
              { name: 'ElevenLabs', color: 'text-emerald-400' },
              { name: 'Runway Gen-2', color: 'text-blue-400' },
              { name: 'HeyGen', color: 'text-violet-400' },
              { name: 'Sora', color: 'text-primary' },
            ].map((m, i) => (
              <span key={i} className={`px-3 py-1.5 rounded-full border border-border/50 bg-card text-xs font-medium ${m.color}`}>{m.name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Four Detection Modes ── */}
      <section id="features" className="py-24 relative">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {t('home_four_types_title')}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t('home_four_types_subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                icon: Image,
                title: t('home_image_detection_title'),
                desc: t('home_image_detection_desc'),
                href: '/detect/image',
                color: 'text-violet-400',
                bg: 'bg-violet-400/10',
                border: 'hover:border-violet-400/40',
                badge: t('home_image_detection_badge'),
                isNew: true,
              },
              {
                icon: Video,
                title: t('home_video_detection_title'),
                desc: t('home_video_detection_desc'),
                href: '/detect/video',
                color: 'text-blue-400',
                bg: 'bg-blue-400/10',
                border: 'hover:border-blue-400/40',
                badge: t('home_video_detection_badge'),
              },
              {
                icon: AudioLines,
                title: t('home_audio_detection_title'),
                desc: t('home_audio_detection_desc'),
                href: '/detect/audio',
                color: 'text-cyan-400',
                bg: 'bg-cyan-400/10',
                border: 'hover:border-cyan-400/40',
                badge: t('home_audio_detection_badge'),
              },
              {
                icon: FileText,
                title: t('home_text_detection_title'),
                desc: t('home_text_detection_desc'),
                href: '/detect/text',
                color: 'text-emerald-400',
                bg: 'bg-emerald-400/10',
                border: 'hover:border-emerald-400/40',
                badge: t('home_text_detection_badge'),
              },
            ].map((m, i) => (
              <Link key={i} href={m.href}>
                <div className={`group relative p-6 rounded-xl border border-border/60 bg-card ${m.border} transition-all duration-300 hover:bg-card/80 cursor-pointer h-full`}>
                  {(m as { isNew?: boolean }).isNew && (
                    <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-[10px] text-primary font-semibold">{t('common_new')}</div>
                  )}
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${m.bg} flex items-center justify-center flex-shrink-0`}>
                      <m.icon className={`w-6 h-6 ${m.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground mb-1">{m.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">{m.desc}</p>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 border border-border/50">
                        <span className={`text-[10px] font-medium ${m.color}`}>{m.badge}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 mt-4 text-sm ${m.color} opacity-0 group-hover:opacity-100 transition-opacity`}>
                    <span>{t('home_start_detection')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── What Makes Us Different (Competitor Comparison) ── */}
      <section className="py-20 bg-card/30 border-y border-border/40">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{t('home_compare_title')}</h2>
              <p className="text-muted-foreground text-sm max-w-lg mx-auto">{t('home_compare_subtitle')}</p>
            </div>
            <div className="rounded-2xl border border-border/60 overflow-hidden">
              <div className="grid grid-cols-4 bg-muted/50 px-5 py-3 border-b border-border/40">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('home_compare_feature')}</div>
                <div className="text-xs font-semibold text-primary uppercase tracking-wider text-center">DeepGuard</div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Sensity.ai</div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">{t('home_compare_typical')}</div>
              </div>
              {[
                { feature: t('home_compare_heatmap'), dg: true, sensity: true, typical: false },
                { feature: t('home_compare_attribution'), dg: true, sensity: true, typical: false },
                { feature: t('home_compare_forensics'), dg: true, sensity: true, typical: false },
                { feature: t('home_compare_meeting'), dg: true, sensity: false, typical: false },
                { feature: t('home_compare_text'), dg: true, sensity: false, typical: false },
                { feature: t('home_compare_extension'), dg: true, sensity: false, typical: false },
                { feature: t('home_compare_batch'), dg: true, sensity: true, typical: false },
                { feature: t('home_compare_free'), dg: true, sensity: false, typical: true },
                { feature: t('home_compare_price'), dg: '$0', sensity: '$300+', typical: '$29+' },
              ].map((row, i) => (
                <div key={i} className={`grid grid-cols-4 px-5 py-3.5 border-b border-border/20 last:border-0 items-center ${i % 2 === 0 ? 'bg-card' : 'bg-card/50'}`}>
                  <div className="text-sm text-foreground">{row.feature}</div>
                  <div className="flex justify-center">
                    {typeof row.dg === 'boolean' ? (row.dg ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-muted-foreground/40" />) : <span className="text-sm font-bold text-primary">{row.dg}</span>}
                  </div>
                  <div className="flex justify-center">
                    {typeof row.sensity === 'boolean' ? (row.sensity ? <CheckCircle2 className="w-4 h-4 text-muted-foreground/60" /> : <XCircle className="w-4 h-4 text-muted-foreground/30" />) : <span className="text-sm text-muted-foreground">{row.sensity}</span>}
                  </div>
                  <div className="flex justify-center">
                    {typeof row.typical === 'boolean' ? (row.typical ? <CheckCircle2 className="w-4 h-4 text-muted-foreground/60" /> : <XCircle className="w-4 h-4 text-muted-foreground/30" />) : <span className="text-sm text-muted-foreground">{row.typical}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Use Cases ── */}
      <section className="py-24">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {t('home_who_uses_title')}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {[
              { icon: Building2, title: t('home_use_finance_title'), desc: t('home_use_finance_desc'), href: '/use-cases', color: 'text-rose-400', bg: 'bg-rose-400/10' },
              { icon: Users, title: t('home_use_hr_title'), desc: t('home_use_hr_desc'), href: '/use-cases', color: 'text-amber-400', bg: 'bg-amber-400/10' },
              { icon: Newspaper, title: t('home_use_media_title'), desc: t('home_use_media_desc'), href: '/use-cases', color: 'text-primary', bg: 'bg-primary/10' },
              { icon: Scale, title: t('home_use_legal_title'), desc: t('home_use_legal_desc'), href: '/use-cases', color: 'text-violet-400', bg: 'bg-violet-400/10' },
              { icon: Monitor, title: t('home_use_meetings_title'), desc: t('home_use_meetings_desc'), href: '/meeting-guard', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
              { icon: Chrome, title: t('home_use_extension_title'), desc: t('home_use_extension_desc'), href: '/extension', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
            ].map((u, i) => (
              <Link key={i} href={u.href}>
                <div className="group p-5 rounded-xl border border-border/60 bg-card hover:border-primary/30 transition-all duration-300 cursor-pointer h-full">
                  <div className={`w-10 h-10 rounded-lg ${u.bg} flex items-center justify-center mb-4`}>
                    <u.icon className={`w-5 h-5 ${u.color}`} />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 text-sm">{u.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">{u.desc}</p>
                  <div className={`flex items-center gap-1 text-xs ${u.color} opacity-0 group-hover:opacity-100 transition-opacity`}>
                    <span>{t('home_learn_more')}</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 bg-card/30 border-y border-border/40">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{t('home_how_works_title')}</h2>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto">{t('home_how_works_subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { step: '01', title: t('home_step1_title'), desc: t('home_step1_desc'), icon: Upload },
              { step: '02', title: t('home_step2_title'), desc: t('home_step2_desc'), icon: FlaskConical },
              { step: '03', title: t('home_step3_title'), desc: t('home_step3_desc'), icon: BarChart3 },
            ].map((step, i) => (
              <div key={i} className="p-6 rounded-2xl border border-border/60 bg-card text-center">
                <div className="text-4xl font-bold text-primary/20 mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{step.step}</div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust & Credibility ── */}
      <section className="py-16">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { icon: Lock, title: t('home_trust_retention_title'), desc: t('home_trust_retention_desc') },
              { icon: Zap, title: t('home_trust_speed_title'), desc: t('home_trust_speed_desc') },
              { icon: Globe2, title: t('home_trust_global_title'), desc: t('home_trust_global_desc') },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-5 rounded-xl border border-border/40 bg-card/40">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-1">{item.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why DeepGuard ── */}
      <section className="py-20 border-t border-border/40">
        <div className="container">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4">
              <Layers className="w-3.5 h-3.5" />
              {t('why_deepguard_badge') || 'Why DeepGuard'}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('why_deepguard_title') || 'Built different. Not just another detector.'}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {t('why_deepguard_subtitle') || 'Most tools run a single model and call it done. We run four independent engines and cross-validate every result.'}
            </p>
          </div>

          {/* Comparison table */}
          <div className="max-w-3xl mx-auto overflow-x-auto mb-10">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium w-1/2">{t('why_feature') || 'Feature'}</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium">{t('why_others') || 'Others'}</th>
                  <th className="text-center py-3 px-4 font-semibold text-primary">{t('why_deepguard_col') || 'DeepGuard'}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [t('why_row_engines') || 'Detection engines', t('why_others_single') || 'Single model', t('why_us_multi') || '4 independent engines'],
                  [t('why_row_media') || 'Media types', t('why_others_image') || 'Image only', t('why_us_all') || 'Image, video, audio, text'],
                  [t('why_row_realtime') || 'Real-time detection', t('why_others_no') || 'Upload only', t('why_us_realtime') || 'Live camera & mic'],
                  [t('why_row_explain') || 'Explainability', t('why_others_score') || 'Score only', t('why_us_explain') || 'Heatmap + engine breakdown'],
                  [t('why_row_api') || 'API access', t('why_others_paid') || 'Enterprise-only', t('why_us_api') || 'Free tier available'],
                  [t('why_row_training') || 'Continuous learning', t('why_others_static') || 'Static model', t('why_us_training') || 'Feedback-driven retraining'],
                ].map(([feature, others, us], i) => (
                  <tr key={i} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 text-foreground">{feature}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <XCircle className="w-4 h-4 text-rose-400/70" />
                        {others}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1.5 text-primary font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        {us}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Competitor callout */}
          <div className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: 'Hive AI', note: t('why_comp_hive') || 'Image only, no free API tier' },
              { name: 'Sensity', note: t('why_comp_sensity') || 'Enterprise pricing, no live detection' },
              { name: 'Reality Defender', note: t('why_comp_reality') || 'B2B only, no public access' },
              { name: 'Deepware', note: t('why_comp_deepware') || 'Video only, single model' },
            ].map((comp) => (
              <div key={comp.name} className="p-4 rounded-xl border border-border/40 bg-card/30">
                <p className="font-medium text-foreground text-sm mb-1">{comp.name}</p>
                <p className="text-xs text-muted-foreground">{comp.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 grid-bg" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px]" />
        <div className="container relative z-10 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <span className="text-primary font-medium">{t('home_cta_free')}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {t('home_cta_title')}
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            {t('home_cta_subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/detect/image">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-10 text-base">
                {t('home_btn_detect_free')} <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="border-border hover:border-primary/50 gap-2 px-10 text-base">
                <TrendingUp className="w-4 h-4" /> {t('home_btn_view_pricing')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/40 py-10">
        <div className="container">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-primary" />
                <span className="font-bold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Deep<span className="text-primary">Guard</span></span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{t('home_footer_tagline')}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wider">{t('home_footer_detect')}</p>
              <div className="space-y-2">
                {[['Image', '/detect/image'], ['Video', '/detect/video'], ['Audio', '/detect/audio'], ['Text', '/detect/text'], ['Batch', '/batch']].map(([label, href]) => (
                  <Link key={href} href={href}><p className="text-xs text-muted-foreground hover:text-foreground transition-colors">{label}</p></Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wider">{t('home_footer_solutions')}</p>
              <div className="space-y-2">
                {[['Meeting Guard', '/meeting-guard'], ['Browser Extension', '/extension'], ['Use Cases', '/use-cases'], ['Technology', '/technology']].map(([label, href]) => (
                  <Link key={href} href={href}><p className="text-xs text-muted-foreground hover:text-foreground transition-colors">{label}</p></Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wider">{t('home_footer_company')}</p>
              <div className="space-y-2">
                {[['Pricing', '/pricing'], ['API Docs', '/api-docs'], ['About Us', '/about'], ['Privacy Policy', '/privacy'], ['Terms of Service', '/terms'], ['Enterprise', 'mailto:enterprise@deepguard.org']].map(([label, href]) => (
                  <Link key={href} href={href}><p className="text-xs text-muted-foreground hover:text-foreground transition-colors">{label}</p></Link>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-border/30 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">{t('home_footer_rights')}</p>
            <p className="text-xs text-muted-foreground">{t('home_footer_protecting')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
