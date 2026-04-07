import { useEffect } from 'react';
import { Link } from 'wouter';
import { Shield, Target, Eye, Lock, Globe2, ArrowRight, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

export default function AboutUs() {
  const { t } = useTranslation();
  useEffect(() => {
    document.title = 'About Us — DeepGuard AI Deepfake Detection';
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/6 rounded-full blur-[120px]" />
        </div>
        <div className="container relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-6">
            <Shield className="w-3.5 h-3.5" />
            <span>About DeepGuard</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Protecting truth in<br />
            <span className="text-primary">the age of AI</span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-4">
            DeepGuard is an AI-powered media forensics platform that helps individuals, journalists, enterprises, and governments detect manipulated content — including AI-generated images, deepfake videos, cloned voices, and machine-written text.
          </p>
          <p className="text-muted-foreground text-base leading-relaxed">
            We believe that in a world where synthetic media is becoming indistinguishable from reality, accessible and transparent detection tools are essential to maintaining trust in digital communication.
          </p>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-16 bg-card/30 border-y border-border/40">
        <div className="container max-w-4xl">
          <h2 className="text-2xl font-bold mb-10 text-center" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Our Principles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { icon: Eye, title: 'Transparency', desc: 'We clearly disclose our detection methods, accuracy benchmarks, and limitations. Our multi-engine approach shows per-engine scores so you know exactly what each detector found.', color: 'text-primary', bg: 'bg-primary/10' },
              { icon: Lock, title: 'Privacy First', desc: 'All uploaded files are processed in isolated environments and deleted immediately after analysis. We never store your content or use it for model training.', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
              { icon: Target, title: 'Accuracy Over Claims', desc: 'We use real third-party detection APIs (SightEngine, Illuminarty) alongside our own models. We report actual accuracy from benchmark testing, not marketing claims.', color: 'text-amber-400', bg: 'bg-amber-400/10' },
              { icon: Globe2, title: 'Global Accessibility', desc: 'Available in 13 languages with a generous free tier. We offer 50% discounts for NGOs, academic institutions, and independent journalists.', color: 'text-violet-400', bg: 'bg-violet-400/10' },
            ].map((v, i) => (
              <div key={i} className="p-6 rounded-xl border border-border/60 bg-card">
                <div className={`w-10 h-10 rounded-lg ${v.bg} flex items-center justify-center mb-4`}>
                  <v.icon className={`w-5 h-5 ${v.color}`} />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detection Methodology Transparency */}
      <section className="py-16">
        <div className="container max-w-3xl">
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>How Our Detection Works</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            We combine multiple independent detection engines and weight their results to reduce false positives. Here is how each media type is analyzed:
          </p>
          <div className="space-y-6">
            {[
              { title: 'Image Detection', desc: 'Multi-engine: SightEngine (GAN/diffusion detection), Illuminarty (AI probability), LLM visual analysis, and our own CLIP-based model. Scores are weighted and combined for a final verdict. Pixel-level heatmap regions are generated to highlight suspicious areas.', engines: '4 engines', badge: 'Production' },
              { title: 'Video & Audio Detection', desc: 'Currently powered by LLM-based multimodal analysis examining visual artifacts, temporal consistency, spectral patterns, and prosody. We are actively integrating dedicated deepfake detection models for higher accuracy.', engines: '1 engine + LLM', badge: 'Beta' },
              { title: 'Text Detection', desc: 'LLM-based analysis using perplexity, burstiness, and stylometric signals. Provides sentence-level AI probability scoring. Dedicated text detection API integration is planned.', engines: 'LLM analysis', badge: 'Beta' },
            ].map((m, i) => (
              <div key={i} className="p-5 rounded-xl border border-border/60 bg-card/50">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-foreground">{m.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${m.badge === 'Production' ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/30' : 'bg-amber-400/20 text-amber-400 border border-amber-400/30'}`}>
                    {m.badge}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">{m.engines}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-card/30 border-t border-border/40">
        <div className="container text-center">
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Questions or Partnership Inquiries?</h2>
          <p className="text-muted-foreground mb-6">Reach out to us for enterprise partnerships, academic collaborations, or press inquiries.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="mailto:hello@deepguard.org">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-8">
                Contact Us <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
            <Link href="/technology">
              <Button size="lg" variant="outline" className="border-border/60 hover:border-primary/40 gap-2 px-8">
                View Technology Details
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/40 py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Deep<span className="text-primary">Guard</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground">© 2025–2026 DeepGuard. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
