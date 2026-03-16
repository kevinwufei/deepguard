import { Link } from 'wouter';
import { useEffect } from 'react';
import { Shield, AudioLines, Video, Camera, Mic, BarChart3, History, ArrowRight, ChevronRight, Zap, Lock, Globe2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLang } from '@/contexts/LanguageContext';
import { getLoginUrl } from '@/const';
import { useAuth } from '@/_core/hooks/useAuth';

export default function Home() {
  const { t } = useLang();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    document.title = 'DeepGuard - AI Deepfake Detection & Anti-Scam Platform';
  }, []);

  const features = [
    { icon: AudioLines, title: t.home_feature_audio_title, desc: t.home_feature_audio_desc, href: '/detect/audio', color: 'text-cyan-400' },
    { icon: Video, title: t.home_feature_video_title, desc: t.home_feature_video_desc, href: '/detect/video', color: 'text-blue-400' },
    { icon: Camera, title: t.home_feature_camera_title, desc: t.home_feature_camera_desc, href: '/detect/camera', color: 'text-violet-400' },
    { icon: Mic, title: t.home_feature_mic_title, desc: t.home_feature_mic_desc, href: '/detect/microphone', color: 'text-emerald-400' },
    { icon: BarChart3, title: t.home_feature_score_title, desc: t.home_feature_score_desc, href: '/detect/audio', color: 'text-amber-400' },
    { icon: History, title: t.home_feature_history_title, desc: t.home_feature_history_desc, href: '/history', color: 'text-rose-400' },
  ];

  const steps = [
    { num: '01', title: t.home_how_step1, desc: t.home_how_step1_desc, icon: ArrowRight },
    { num: '02', title: t.home_how_step2, desc: t.home_how_step2_desc, icon: Zap },
    { num: '03', title: t.home_how_step3, desc: t.home_how_step3_desc, icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden grid-bg">
        {/* Radial glow background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-violet-500/5 rounded-full blur-[80px]" />
        </div>

        <div className="container relative z-10 pt-24 pb-16">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-8">
              <Shield className="w-3.5 h-3.5" />
              <span>AI-Powered Deepfake Detection</span>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              <span className="text-foreground">{t.home_hero_title.split('，')[0]}，</span>
              <br />
              <span className="text-primary">{t.home_hero_title.split('，')[1] || ''}</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              {t.home_hero_subtitle}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/detect/audio">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan gap-2 px-8 text-base">
                  {t.home_hero_cta}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline" className="border-border hover:border-primary/50 text-foreground gap-2 px-8 text-base">
                  {t.home_hero_cta2}
                </Button>
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-16 max-w-xl mx-auto">
              {[
                { value: t.home_stats_detections, label: t.home_stats_detections_label },
                { value: t.home_stats_accuracy, label: t.home_stats_accuracy_label },
                { value: t.home_stats_speed, label: t.home_stats_speed_label },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-primary mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {stat.value}
                  </div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {t.home_features_title}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t.home_features_subtitle}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Link key={i} href={f.href}>
                <div className="group relative p-6 rounded-xl border border-border/60 bg-card hover:border-primary/40 transition-all duration-300 hover:bg-card/80 cursor-pointer h-full">
                  <div className="absolute inset-0 rounded-xl bg-primary/0 group-hover:bg-primary/3 transition-colors" />
                  <div className={`w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center mb-4 group-hover:border-primary/40 transition-colors`}>
                    <f.icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  <div className="flex items-center gap-1 mt-4 text-primary text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>{t.home_hero_cta}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-card/30 border-y border-border/40">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {t.home_how_title}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step, i) => (
              <div key={i} className="relative text-center">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-gradient-to-r from-primary/40 to-transparent" />
                )}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl border border-primary/30 bg-primary/10 text-primary text-2xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {step.num}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust indicators */}
      <section className="py-16">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { icon: Lock, title: '隐私保护', desc: '检测完成后文件立即删除，不存储任何用户数据' },
              { icon: Zap, title: '极速分析', desc: '平均5秒内完成分析，实时保护不等待' },
              { icon: Globe2, title: '全球可用', desc: '支持中英文，面向全球用户提供服务' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-5 rounded-xl border border-border/40 bg-card/40">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4.5 h-4.5 text-primary" />
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

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 grid-bg" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px]" />
        <div className="container relative z-10 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {t.home_cta_title}
          </h2>
          <p className="text-muted-foreground text-lg mb-8">{t.home_cta_subtitle}</p>
          <Link href="/detect/audio">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan gap-2 px-10 text-base">
              {t.home_cta_btn}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-10">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="font-bold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Deep<span className="text-primary">Guard</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground text-center">{t.footer_tagline}</p>
            <p className="text-xs text-muted-foreground">© 2025 DeepGuard. {t.footer_rights}.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
