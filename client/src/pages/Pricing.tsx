import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import {
  Shield, Check, X, Zap, Building2, Users, ChevronRight,
  Star, ArrowRight, HelpCircle, Sparkles, Video, Camera,
  FileImage, Mic, Globe2, Lock, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getLoginUrl } from '@/const';
import { useAuth } from '@/_core/hooks/useAuth';

// Competitor pricing reference: deepguardtech.com Pro ~$42, Business ~$70, Enterprise ~$280
// Our pricing: 30%+ cheaper across all tiers
const PLANS = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Try DeepGuard with no commitment',
    monthlyPrice: 0,
    yearlyPrice: 0,
    color: 'text-muted-foreground',
    borderColor: 'border-border/60',
    bgColor: 'bg-card',
    badgeColor: '',
    badge: '',
    cta: 'Get Started Free',
    ctaVariant: 'outline' as const,
    highlight: false,
    features: [
      { text: '10 detections / month', included: true },
      { text: 'Text AI detection', included: true },
      { text: 'Image deepfake detection', included: true },
      { text: 'Audio AI detection', included: true },
      { text: 'Video deepfake (up to 100 MB)', included: true },
      { text: 'Basic risk score report', included: true },
      { text: 'Heatmap visualization', included: false },
      { text: 'File forensic analysis', included: false },
      { text: 'Batch detection', included: false },
      { text: 'API access', included: false },
      { text: 'Meeting detection', included: false },
      { text: 'PDF forensic report export', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For journalists, researchers & creators',
    monthlyPrice: 19,
    yearlyPrice: 15,
    color: 'text-primary',
    borderColor: 'border-primary/60',
    bgColor: 'bg-primary/5',
    badgeColor: 'bg-primary/20 text-primary border-primary/30',
    badge: 'Most Popular',
    cta: 'Start Pro — $19/mo',
    ctaVariant: 'default' as const,
    highlight: true,
    features: [
      { text: '500 detections / month', included: true },
      { text: 'Text AI detection', included: true },
      { text: 'Image deepfake detection', included: true },
      { text: 'Audio AI detection', included: true },
      { text: 'Video deepfake (up to 2 GB)', included: true },
      { text: 'Detailed risk score report', included: true },
      { text: 'Heatmap visualization', included: true },
      { text: 'File forensic analysis (EXIF/metadata)', included: true },
      { text: 'Batch detection (up to 20 files)', included: true },
      { text: 'API access (1,000 calls/month)', included: true },
      { text: 'Meeting detection ($4.99/session)', included: true },
      { text: 'PDF forensic report export', included: true },
    ],
  },
  {
    id: 'business',
    name: 'Business',
    tagline: 'For teams, agencies & media companies',
    monthlyPrice: 49,
    yearlyPrice: 39,
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/40',
    bgColor: 'bg-cyan-500/5',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    badge: 'Best Value',
    cta: 'Start Business — $49/mo',
    ctaVariant: 'outline' as const,
    highlight: false,
    features: [
      { text: '3,000 detections / month', included: true },
      { text: 'All Pro features included', included: true },
      { text: 'Video deepfake (up to 5 GB)', included: true },
      { text: 'Full forensic analysis report', included: true },
      { text: 'Heatmap + artifact visualization', included: true },
      { text: 'Unlimited batch detection', included: true },
      { text: 'API access (10,000 calls/month)', included: true },
      { text: 'Meeting detection (30 sessions/month)', included: true },
      { text: 'White-label PDF reports', included: true },
      { text: 'Priority processing', included: true },
      { text: 'Team seats (up to 5)', included: true },
      { text: 'Email + chat support', included: true },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'For platforms, law enforcement & government',
    monthlyPrice: 199,
    yearlyPrice: 159,
    color: 'text-violet-400',
    borderColor: 'border-violet-500/40',
    bgColor: 'bg-violet-500/5',
    badgeColor: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    badge: 'Court-Ready',
    cta: 'Contact Sales',
    ctaVariant: 'outline' as const,
    highlight: false,
    features: [
      { text: 'Unlimited detections', included: true },
      { text: 'All Business features included', included: true },
      { text: 'Video deepfake (up to 5 GB)', included: true },
      { text: 'Court-admissible forensic reports', included: true },
      { text: 'Pixel-level heatmap + bounding boxes', included: true },
      { text: 'Unlimited batch detection', included: true },
      { text: 'Unlimited API + webhooks', included: true },
      { text: 'Unlimited meeting detection', included: true },
      { text: 'Dedicated GPU processing', included: true },
      { text: 'Unlimited team seats', included: true },
      { text: 'SLA + dedicated account manager', included: true },
      { text: 'On-premise deployment option', included: true },
    ],
  },
];

const MEETING_ADDON = {
  perSession: 4.99,
  per10: 39.99,
  per30: 99.99,
  monthly: 29.99,
};

const COMPETITOR_COMPARISON = [
  { feature: 'Image deepfake detection', us: true, them: true },
  { feature: 'Video deepfake detection', us: true, them: true },
  { feature: 'Audio AI voice detection', us: true, them: false },
  { feature: 'Text AI detection', us: true, them: false },
  { feature: 'Pixel-level heatmap', us: true, them: true },
  { feature: 'File forensic analysis (EXIF)', us: true, them: false },
  { feature: 'Real-time meeting detection', us: true, them: false },
  { feature: 'Court-ready PDF reports', us: true, them: true },
  { feature: 'Batch detection', us: true, them: true },
  { feature: '13 languages supported', us: true, them: false },
  { feature: 'API access', us: true, them: true },
  { feature: 'Pro plan price', us: '$19/mo', them: '$42/mo', highlight: true },
  { feature: 'Business plan price', us: '$49/mo', them: '$70/mo', highlight: true },
];

const FAQS = [
  {
    q: 'What counts as one "detection"?',
    a: 'Each file upload or text submission counts as one detection, regardless of file size or length. Running the same file again counts as a new detection.',
  },
  {
    q: 'How does meeting detection work?',
    a: 'Our screen-sharing monitor captures frames from your Zoom, Teams, or Google Meet session every few seconds and analyzes them in real time for deepfake indicators. Each session is billed at $4.99 (Pro) or included in Business/Enterprise plans.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes — cancel at any time from your account settings. You keep access until the end of your billing period. No cancellation fees.',
  },
  {
    q: 'Do you offer discounts for NGOs or academic institutions?',
    a: 'Yes — 50% discount for verified non-profits, academic institutions, and independent journalists. Contact us with your credentials.',
  },
  {
    q: 'Is my data private?',
    a: 'All uploaded files are processed in isolated environments and deleted immediately after analysis. We never store, train on, or share your content.',
  },
  {
    q: 'What is a "court-ready" forensic report?',
    a: 'Enterprise reports include a structured PDF with chain-of-custody metadata, pixel-level evidence, confidence scores, and a signed analysis summary — formatted to meet evidentiary standards for legal proceedings.',
  },
];

export default function Pricing() {
  const { isAuthenticated } = useAuth();
  const [isYearly, setIsYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    document.title = 'Pricing — DeepGuard AI Deepfake Detection';
  }, []);

  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/6 rounded-full blur-[120px]" />
        </div>
        <div className="container relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Up to 55% cheaper than leading competitors — same enterprise-grade accuracy</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Simple, Transparent Pricing
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
            Start free. Upgrade when you need more detections, larger files, or API access.
            No hidden fees. Cancel anytime.
          </p>
          <div className="inline-flex items-center gap-3 p-1 rounded-full border border-border/60 bg-card">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${!isYearly ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${isYearly ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Yearly
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${isYearly ? 'bg-white/20' : 'bg-emerald-500/20 text-emerald-400'}`}>Save 20%</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Pricing Cards ── */}
      <section className="pb-16">
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl border ${plan.borderColor} ${plan.bgColor} p-6 flex flex-col transition-all duration-300 ${plan.highlight ? 'ring-1 ring-primary/30 shadow-lg shadow-primary/10' : ''}`}
              >
                {plan.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full border text-xs font-semibold whitespace-nowrap ${plan.badgeColor}`}>
                    {plan.badge}
                  </div>
                )}
                <div className="mb-5">
                  <h3 className={`text-xl font-bold mb-1 ${plan.color}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{plan.name}</h3>
                  <p className="text-xs text-muted-foreground">{plan.tagline}</p>
                </div>
                <div className="mb-5">
                  {plan.monthlyPrice === 0 ? (
                    <span className="text-4xl font-bold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Free</span>
                  ) : (
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-bold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-muted-foreground mb-1 text-sm">/month</span>
                    </div>
                  )}
                  {isYearly && plan.monthlyPrice > 0 && (
                    <p className="text-xs text-emerald-400 mt-1">Billed annually — save ${(plan.monthlyPrice - plan.yearlyPrice) * 12}/yr</p>
                  )}
                </div>

                {/* CTA */}
                {plan.id === 'enterprise' ? (
                  <a href="mailto:enterprise@deepguard.org" className="mb-5">
                    <Button variant="outline" className={`w-full border-violet-500/40 text-violet-400 hover:border-violet-500/70`}>
                      Contact Sales <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </a>
                ) : plan.id === 'free' && !isAuthenticated ? (
                  <a href={getLoginUrl()} className="mb-5">
                    <Button variant="outline" className="w-full border-border/60 hover:border-primary/40">
                      {plan.cta}
                    </Button>
                  </a>
                ) : (
                  <Link href="/detect/text" className="mb-5 block">
                    <Button
                      variant={plan.ctaVariant}
                      className={`w-full ${plan.ctaVariant === 'default' ? 'bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan' : plan.id === 'business' ? 'border-cyan-500/40 text-cyan-400 hover:border-cyan-500/70' : 'border-border/60 hover:border-primary/40'}`}
                    >
                      {plan.cta} <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                )}

                {/* Feature list */}
                <ul className="space-y-2.5 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      {f.included ? (
                        <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.color}`} />
                      ) : (
                        <X className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground/30" />
                      )}
                      <span className={`text-xs leading-relaxed ${f.included ? 'text-foreground' : 'text-muted-foreground/40'}`}>{f.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6 flex items-center justify-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            30-day money-back guarantee on all paid plans. No questions asked.
          </p>
        </div>
      </section>

      {/* ── Meeting Detection Add-on ── */}
      <section className="py-16 bg-card/30 border-y border-border/40">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-4">
                <Video className="w-3.5 h-3.5" />
                <span>Meeting Detection Add-on</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Real-Time Zoom & Teams Protection
              </h2>
              <p className="text-muted-foreground text-sm max-w-lg mx-auto">
                Detect deepfake faces and AI voice clones during live video calls. Available as pay-per-session or a monthly bundle.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Single session', price: '$4.99', sub: 'Up to 2 hours', icon: Camera, color: 'text-primary', border: 'border-primary/30', bg: 'bg-primary/5' },
                { label: '10-session pack', price: '$39.99', sub: 'Save 20%', icon: Video, color: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'bg-cyan-500/5' },
                { label: '30-session pack', price: '$99.99', sub: 'Save 33%', icon: BarChart3, color: 'text-violet-400', border: 'border-violet-500/30', bg: 'bg-violet-500/5' },
                { label: 'Unlimited monthly', price: '$29.99', sub: 'Business plan', icon: Zap, color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/5' },
              ].map((item, i) => (
                <div key={i} className={`p-4 rounded-xl border ${item.border} ${item.bg} text-center`}>
                  <item.icon className={`w-6 h-6 ${item.color} mx-auto mb-2`} />
                  <div className={`text-xl font-bold ${item.color} mb-1`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{item.price}</div>
                  <div className="text-xs font-medium text-foreground mb-0.5">{item.label}</div>
                  <div className="text-[10px] text-muted-foreground">{item.sub}</div>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-muted-foreground mt-4">
              Business and Enterprise plans include meeting detection. Free and Pro users can purchase sessions separately.
            </p>
          </div>
        </div>
      </section>

      {/* ── Competitor Comparison ── */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Why DeepGuard?</h2>
              <p className="text-muted-foreground text-sm">More detection types, more languages, lower prices than the leading competitor.</p>
            </div>
            <div className="rounded-2xl border border-border/60 overflow-hidden">
              <div className="grid grid-cols-3 bg-muted/50 px-6 py-3 border-b border-border/40">
                <div className="text-sm font-medium text-muted-foreground">Feature</div>
                <div className="text-sm font-semibold text-primary text-center">DeepGuard</div>
                <div className="text-sm font-medium text-muted-foreground text-center">Competitor</div>
              </div>
              {COMPETITOR_COMPARISON.map((row, i) => (
                <div key={i} className={`grid grid-cols-3 px-6 py-3 border-b border-border/30 last:border-0 ${row.highlight ? 'bg-primary/5' : i % 2 === 0 ? 'bg-card' : 'bg-card/50'}`}>
                  <div className={`text-sm ${row.highlight ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{row.feature}</div>
                  <div className="text-center">
                    {typeof row.us === 'boolean' ? (
                      row.us ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-muted-foreground/40 mx-auto" />
                    ) : (
                      <span className={`text-sm font-bold ${row.highlight ? 'text-emerald-400' : 'text-foreground'}`}>{row.us}</span>
                    )}
                  </div>
                  <div className="text-center">
                    {typeof row.them === 'boolean' ? (
                      row.them ? <Check className="w-4 h-4 text-muted-foreground mx-auto" /> : <X className="w-4 h-4 text-muted-foreground/40 mx-auto" />
                    ) : (
                      <span className={`text-sm ${row.highlight ? 'text-rose-400 font-bold' : 'text-muted-foreground'}`}>{row.them}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">Competitor pricing based on publicly available information as of Q1 2025.</p>
          </div>
        </div>
      </section>

      {/* ── Use Case Callouts ── */}
      <section className="py-16 bg-card/30 border-y border-border/40">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>The Right Plan for Every Use Case</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
            {[
              { icon: Users, title: 'Journalists & Fact-Checkers', plan: 'Pro', planColor: 'text-primary', desc: 'Verify images and videos before publishing. Detect AI-generated misinformation at scale.', bg: 'bg-primary/10', color: 'text-primary' },
              { icon: Shield, title: 'Law Enforcement', plan: 'Enterprise', planColor: 'text-violet-400', desc: 'Court-admissible forensic reports with chain-of-custody. Dedicated support and SLA.', bg: 'bg-violet-500/10', color: 'text-violet-400' },
              { icon: Building2, title: 'Social Media Platforms', plan: 'Enterprise', planColor: 'text-violet-400', desc: 'Unlimited API for real-time content moderation. Webhook integration for automated workflows.', bg: 'bg-blue-500/10', color: 'text-blue-400' },
              { icon: Star, title: 'Individuals & Creators', plan: 'Free → Pro', planColor: 'text-amber-400', desc: 'Protect your identity online. Verify content authenticity before sharing.', bg: 'bg-amber-500/10', color: 'text-amber-400' },
            ].map((item, i) => (
              <div key={i} className="p-5 rounded-xl border border-border/60 bg-card">
                <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center mb-4`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div className={`text-xs font-semibold ${item.planColor} mb-2`}>{item.plan}</div>
                <h3 className="font-semibold text-foreground text-sm mb-2">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust Signals (from iProov/Reality Defender analysis) ── */}
      <section className="py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                { icon: Lock, title: 'Privacy First', desc: 'Files deleted immediately after analysis. Zero data retention. SOC 2 compliant infrastructure.' },
                { icon: Globe2, title: '13 Languages', desc: 'Full platform support for English, Chinese, Spanish, Arabic, Hindi, French, and 7 more languages.' },
                { icon: FileImage, title: 'Court-Ready Reports', desc: 'Enterprise reports include chain-of-custody metadata and pixel-level evidence for legal proceedings.' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-5 rounded-xl border border-border/40 bg-card/40">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground text-sm mb-1">{item.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 bg-card/30 border-t border-border/40">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Frequently Asked Questions</h2>
            </div>
            <div className="space-y-3">
              {FAQS.map((faq, i) => (
                <div key={i} className="rounded-xl border border-border/60 bg-card overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/20 transition-colors"
                  >
                    <span className="font-medium text-foreground text-sm">{faq.q}</span>
                    <HelpCircle className={`w-4 h-4 flex-shrink-0 ml-4 transition-colors ${openFaq === i ? 'text-primary' : 'text-muted-foreground'}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-5">
                      <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-primary/8 rounded-full blur-[100px]" />
        <div className="container relative z-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Start detecting AI content today</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">No credit card required. 10 free detections every month, forever.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/detect/text">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan gap-2 px-8">
                Start Free <Zap className="w-4 h-4" />
              </Button>
            </Link>
            <a href="mailto:enterprise@deepguard.org">
              <Button size="lg" variant="outline" className="border-border/60 hover:border-primary/40 gap-2 px-8">
                Talk to Sales <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/40 py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Deep<span className="text-primary">Guard</span></span>
          </div>
          <p className="text-sm text-muted-foreground">AI Deepfake Detection & Anti-Scam Platform</p>
          <p className="text-xs text-muted-foreground">© 2025 DeepGuard. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
