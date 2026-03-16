import { useEffect } from 'react';
import { Link } from 'wouter';
import {
  Globe2, Shield, Zap, MousePointer2, Eye, CheckCircle2,
  Chrome, ArrowRight, Star, Lock, Twitter, Newspaper,
  Image, Video, Volume2, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

const FEATURES = [
  {
    icon: MousePointer2,
    title: 'Right-Click to Detect',
    desc: 'Right-click any image or video on any website and select "Check with DeepGuard." Results appear in under 5 seconds.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: Eye,
    title: 'Inline Risk Badges',
    desc: 'Optionally show a small risk badge on every image as you browse. Green = authentic, amber = suspicious, red = likely AI.',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
  },
  {
    icon: Zap,
    title: 'Instant Results',
    desc: 'Detection runs in the background. You don\'t leave the page — results pop up in a sidebar panel with the full report.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
  },
  {
    icon: Globe2,
    title: 'Works Everywhere',
    desc: 'Twitter/X, Reddit, Facebook, news sites, WhatsApp Web, LinkedIn — any page with images or videos.',
    color: 'text-violet-400',
    bg: 'bg-violet-400/10',
  },
  {
    icon: Lock,
    title: 'Privacy First',
    desc: 'Images are sent to DeepGuard\'s API only when you explicitly request analysis. Passive badge mode uses local heuristics only.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
  },
  {
    icon: Shield,
    title: 'Phishing URL Detection',
    desc: 'Warns you when a link leads to a known AI-generated phishing page or scam site. Powered by our threat intelligence feed.',
    color: 'text-rose-400',
    bg: 'bg-rose-400/10',
  },
];

const SOCIAL_PLATFORMS = [
  { icon: Twitter, name: 'Twitter / X', desc: 'Detect AI images in your feed before retweeting', color: 'text-sky-400' },
  { icon: Newspaper, name: 'News Sites', desc: 'Verify images in news articles before sharing', color: 'text-amber-400' },
  { icon: Image, name: 'Reddit', desc: 'Check images in posts and comments instantly', color: 'text-orange-400' },
  { icon: Video, name: 'YouTube', desc: 'Detect AI-generated thumbnails and video stills', color: 'text-rose-400' },
  { icon: Volume2, name: 'WhatsApp Web', desc: 'Verify images and voice notes shared in chats', color: 'text-emerald-400' },
  { icon: Globe2, name: 'Any Website', desc: 'Works on any page with images or videos', color: 'text-violet-400' },
];

export default function Extension() {
  const { t } = useTranslation();
  useEffect(() => {
    document.title = 'Browser Extension — DeepGuard AI Detection';
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-[500px] h-[400px] bg-primary/6 rounded-full blur-[120px]" />
        </div>
        <div className="container relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-6">
              <Chrome className="w-3.5 h-3.5" />
              <span>Browser Extension — Coming Soon</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-5 leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Detect AI content<br />
              <span className="text-primary">as you browse the web</span>
            </h1>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl leading-relaxed">
              The DeepGuard browser extension brings AI detection to every website you visit. Right-click any image, get a result in seconds. No tab switching, no copy-pasting URLs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-8" onClick={() => { window.location.href = 'mailto:beta@deepguard.org?subject=Extension Beta Access'; }}>
                <Chrome className="w-4 h-4" /> Join Beta Waitlist
              </Button>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="border-border/60 hover:border-primary/40 gap-2 px-8">
                  View Pricing <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <p className="text-xs text-muted-foreground mt-4">Chrome extension in beta. Firefox and Safari versions planned for Q3 2025.</p>
          </div>
        </div>
      </section>

      {/* Mock Extension UI */}
      <section className="py-16 bg-card/30 border-y border-border/40">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <p className="text-center text-sm text-muted-foreground mb-8">Extension popup preview</p>
            {/* Simulated extension popup */}
            <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-2xl shadow-black/30 max-w-sm mx-auto">
              {/* Extension header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-muted/30">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Deep<span className="text-primary">Guard</span></span>
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-emerald-400">Active</span>
                </div>
              </div>
              {/* Result */}
              <div className="p-4">
                <div className="rounded-xl border border-rose-400/20 bg-rose-400/5 p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded-lg bg-muted/50 border border-border/40 flex items-center justify-center flex-shrink-0">
                      <Image className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-foreground">viral_photo.jpg</span>
                        <span className="text-xs font-bold text-rose-400">87% AI</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden mb-2">
                        <div className="h-full rounded-full bg-rose-400" style={{ width: '87%' }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground">Likely Midjourney v6 · Face symmetry anomaly detected</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label: 'Noise Pattern', val: 'Synthetic', color: 'text-rose-400' },
                    { label: 'EXIF Data', val: 'Missing', color: 'text-amber-400' },
                    { label: 'Confidence', val: '91%', color: 'text-primary' },
                  ].map((item, i) => (
                    <div key={i} className="text-center p-2 rounded-lg bg-muted/30">
                      <div className={`text-xs font-bold ${item.color}`}>{item.val}</div>
                      <div className="text-[10px] text-muted-foreground">{item.label}</div>
                    </div>
                  ))}
                </div>
                <Button size="sm" className="w-full bg-primary/10 text-primary hover:bg-primary/20 text-xs gap-1.5">
                  <Eye className="w-3 h-3" /> View Full Report
                </Button>
              </div>
              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-border/40 bg-muted/20 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">3 detections used today</span>
                <span className="text-[10px] text-primary">Pro Plan</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>What the extension does</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {FEATURES.map((f, i) => (
              <div key={i} className="p-5 rounded-2xl border border-border/60 bg-card">
                <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Platforms */}
      <section className="py-20 bg-card/30 border-y border-border/40">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Works on every platform</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {SOCIAL_PLATFORMS.map((p, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl border border-border/60 bg-card">
                <p.icon className={`w-5 h-5 ${p.color} flex-shrink-0 mt-0.5`} />
                <div>
                  <div className={`text-sm font-medium ${p.color}`}>{p.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Waitlist CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="container relative z-10 text-center">
          <Chrome className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Join the beta waitlist</h2>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            The extension is in private beta. Pro and Business subscribers get early access. Sign up to be notified when it launches.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {[
              { icon: CheckCircle2, text: 'Free for Pro subscribers' },
              { icon: Star, text: 'Chrome first, Firefox coming soon' },
              { icon: Lock, text: 'No browsing history collected' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <item.icon className="w-4 h-4 text-primary" />
                {item.text}
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-8" onClick={() => { window.location.href = 'mailto:beta@deepguard.org?subject=Extension Beta Access'; }}>
              <Chrome className="w-4 h-4" /> Join Beta Waitlist <ArrowRight className="w-4 h-4" />
            </Button>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="border-border/60 hover:border-primary/40 gap-2 px-8">
                Get Pro Access
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
