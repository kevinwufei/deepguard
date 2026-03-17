import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import {
  Building2, Users, Shield, Newspaper, Scale, GraduationCap,
  Globe2, ArrowRight, AlertTriangle, CheckCircle2, ChevronRight,
  DollarSign, Video, FileImage, Mic, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

const CATEGORIES = [
  { id: 'enterprise', label: 'Enterprise & Finance', icon: Building2 },
  { id: 'hr', label: 'HR & Recruiting', icon: Users },
  { id: 'media', label: 'Media & Journalism', icon: Newspaper },
  { id: 'legal', label: 'Legal & Government', icon: Scale },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'social', label: 'Social Media', icon: Globe2 },
];

const USE_CASES = {
  enterprise: {
    headline: 'CEO Fraud & Financial Scams',
    subhead: 'Deepfake video calls are now the preferred tool for wire transfer fraud. A single successful attack averages $2.9M in losses.',
    color: 'text-rose-400',
    bg: 'bg-rose-400/10',
    border: 'border-rose-400/20',
    stat: { value: '$2.9M', label: 'Average BEC fraud loss (FBI 2023)' },
    scenarios: [
      {
        title: 'Fake CFO Wire Transfer Request',
        threat: 'Attacker creates a deepfake video of your CFO and calls your finance team on Zoom, requesting an urgent wire transfer to a new account.',
        detection: 'DeepGuard\'s real-time meeting monitor detects the synthetic face and alerts the finance team before any transfer is initiated.',
        type: 'video',
        severity: 'Critical',
      },
      {
        title: 'AI-Cloned CEO Voice Authorization',
        threat: 'A voice clone of your CEO calls your bank\'s phone line to authorize a large transaction, using ElevenLabs or similar TTS technology.',
        detection: 'DeepGuard\'s audio analysis detects the prosody anomalies and spectral artifacts characteristic of AI voice synthesis.',
        type: 'audio',
        severity: 'Critical',
      },
      {
        title: 'Fake Vendor Identity Verification',
        threat: 'A fraudulent vendor sends AI-generated ID documents and a deepfake selfie video to pass your KYC process.',
        detection: 'DeepGuard\'s image and video analysis flags the synthetic face and inconsistent document metadata.',
        type: 'image',
        severity: 'High',
      },
    ],
    tools: ['Real-time meeting monitor', 'Audio deepfake detection', 'Image forensics', 'API integration'],
    plan: 'Business or Enterprise',
  },
  hr: {
    headline: 'Fake Job Candidates & Identity Fraud',
    subhead: 'Remote hiring has created a new attack surface. Candidates are using deepfake filters and AI-generated documents to impersonate qualified applicants.',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/20',
    stat: { value: '1 in 4', label: 'Remote interviews involve identity deception (KPMG 2024)' },
    scenarios: [
      {
        title: 'Deepfake Video Interview',
        threat: 'A candidate uses a real-time deepfake filter (HeyGen, DeepFaceLive) to appear as a different person during a Zoom interview.',
        detection: 'DeepGuard detects the face-swap overlay in real time during the interview session.',
        type: 'video',
        severity: 'High',
      },
      {
        title: 'AI-Generated Resume & Portfolio',
        threat: 'A candidate submits an AI-generated portfolio of work samples (images, writing) that they didn\'t actually create.',
        detection: 'DeepGuard\'s text and image detection identifies AI-generated content across submitted materials.',
        type: 'image',
        severity: 'Medium',
      },
      {
        title: 'Fake ID Documents',
        threat: 'Forged or AI-generated identity documents (passport, driver\'s license) submitted for background checks.',
        detection: 'Forensic analysis detects metadata inconsistencies, missing EXIF data, and pixel-level manipulation artifacts.',
        type: 'image',
        severity: 'High',
      },
    ],
    tools: ['Meeting monitor for interviews', 'Document forensics', 'Text AI detection', 'Batch verification'],
    plan: 'Pro or Business',
  },
  media: {
    headline: 'Misinformation & Fake News Detection',
    subhead: 'Viral AI-generated images and videos spread faster than corrections. Journalists and fact-checkers need instant verification tools.',
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    stat: { value: '900%', label: 'Increase in AI-generated political content (2024)' },
    scenarios: [
      {
        title: 'Viral Fake News Image',
        threat: 'An AI-generated image of a political event or natural disaster goes viral on social media before journalists can verify it.',
        detection: 'Right-click the image with the DeepGuard extension or upload it directly. Get a pixel-level heatmap showing manipulation regions.',
        type: 'image',
        severity: 'High',
      },
      {
        title: 'Deepfake Political Video',
        threat: 'A fabricated video of a politician saying something they never said is shared across platforms ahead of an election.',
        detection: 'DeepGuard\'s video analysis detects face-swap artifacts and temporal inconsistencies, with a frame-by-frame timeline.',
        type: 'video',
        severity: 'Critical',
      },
      {
        title: 'AI-Generated Press Release',
        threat: 'A fake press release written by an AI is sent to newsrooms, mimicking the style of a real company or government agency.',
        detection: 'Text analysis detects AI generation patterns with sentence-level probability scores.',
        type: 'text',
        severity: 'Medium',
      },
    ],
    tools: ['Browser extension', 'Image heatmap', 'Video frame analysis', 'Text detection', 'Batch verification'],
    plan: 'Pro',
  },
  legal: {
    headline: 'Evidence Authentication & Fraud Investigation',
    subhead: 'Courts and law enforcement agencies need forensically sound tools to verify digital evidence. AI manipulation of evidence is an emerging legal challenge.',
    color: 'text-violet-400',
    bg: 'bg-violet-400/10',
    border: 'border-violet-400/20',
    stat: { value: '67%', label: 'Of legal professionals expect AI-manipulated evidence cases to increase (ABA 2024)' },
    scenarios: [
      {
        title: 'Manipulated Evidence Photos',
        threat: 'Digital photos submitted as legal evidence have been altered using AI tools to add, remove, or change elements.',
        detection: 'Enterprise forensic reports include pixel-level evidence, chain-of-custody metadata, and signed analysis summaries.',
        type: 'image',
        severity: 'Critical',
      },
      {
        title: 'Deepfake Video Evidence',
        threat: 'A video submitted as evidence in a criminal or civil case has been deepfake-manipulated to alter what happened.',
        detection: 'Frame-by-frame analysis with bounding box annotations, temporal consistency scoring, and court-ready PDF report.',
        type: 'video',
        severity: 'Critical',
      },
      {
        title: 'AI-Cloned Voice in Recordings',
        threat: 'An audio recording submitted as evidence has been altered using voice cloning to change what was said.',
        detection: 'Spectral analysis detects synthesis artifacts. Enterprise report includes technical methodology for expert witness use.',
        type: 'audio',
        severity: 'Critical',
      },
    ],
    tools: ['Court-ready PDF reports', 'Chain-of-custody metadata', 'Pixel-level bounding boxes', 'Expert witness documentation'],
    plan: 'Enterprise',
  },
  education: {
    headline: 'Academic Integrity & AI Content Detection',
    subhead: 'Students are using AI to generate essays, research papers, and even fake research data. Educators need reliable detection tools.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/20',
    stat: { value: '43%', label: 'Of students admit to using AI for assignments (Stanford 2024)' },
    scenarios: [
      {
        title: 'AI-Written Essays & Papers',
        threat: 'Students submit essays or research papers generated by ChatGPT, Claude, or other LLMs without disclosure.',
        detection: 'Multi-model text analysis with sentence-level AI probability scores and detector breakdown.',
        type: 'text',
        severity: 'Medium',
      },
      {
        title: 'AI-Generated Research Images',
        threat: 'Fabricated microscopy images, charts, or research photographs submitted in academic papers.',
        detection: 'Image forensics detects AI generation artifacts and metadata inconsistencies in submitted figures.',
        type: 'image',
        severity: 'High',
      },
      {
        title: 'Impersonation in Online Exams',
        threat: 'A student uses a deepfake filter during a proctored online exam to have someone else take the test.',
        detection: 'Real-time meeting monitor detects face-swap during the exam session.',
        type: 'video',
        severity: 'High',
      },
    ],
    tools: ['Text AI detection', 'Image forensics', 'Meeting monitor', 'Batch document checking'],
    plan: 'Pro or Business',
  },
  social: {
    headline: 'Social Media Verification & Scam Detection',
    subhead: 'AI-generated profiles, romance scams, and fake influencer content are flooding social platforms. Protect yourself before engaging.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
    border: 'border-cyan-400/20',
    stat: { value: '$1.3B', label: 'Lost to romance scams in 2023 (FTC)' },
    scenarios: [
      {
        title: 'AI-Generated Profile Photos',
        threat: 'A romance scammer or fake account uses AI-generated profile photos (ThisPersonDoesNotExist, Midjourney) to create a convincing fake identity.',
        detection: 'Upload the profile photo or use the browser extension to detect GAN-generated faces instantly.',
        type: 'image',
        severity: 'High',
      },
      {
        title: 'Deepfake Video Message',
        threat: 'A scammer sends a deepfake video "proof of life" to convince a victim they\'re talking to a real person.',
        detection: 'Video analysis detects face-swap artifacts and unnatural temporal patterns.',
        type: 'video',
        severity: 'High',
      },
      {
        title: 'AI-Generated Phishing Emails',
        threat: 'Highly personalized phishing emails written by AI that perfectly mimic the style of a known contact or brand.',
        detection: 'Text analysis detects AI generation patterns. URL scanner flags known phishing domains.',
        type: 'text',
        severity: 'Medium',
      },
    ],
    tools: ['Browser extension', 'Image detection', 'Video analysis', 'Text AI detection'],
    plan: 'Free or Pro',
  },
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  video: Video,
  audio: Mic,
  image: FileImage,
  text: FileText,
};

const SEVERITY_COLORS: Record<string, string> = {
  Critical: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
  High: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  Medium: 'text-primary bg-primary/10 border-primary/20',
};

export default function UseCases() {
  const { t } = useTranslation();
  const [active, setActive] = useState('enterprise');
  const uc = USE_CASES[active as keyof typeof USE_CASES];

  useEffect(() => {
    document.title = 'Use Cases — DeepGuard AI Detection';
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-primary/5 rounded-full blur-[120px]" />
        </div>
        <div className="container relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-6">
            <Shield className="w-3.5 h-3.5" />
            <span>{t("usecase_real_world")}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Who needs DeepGuard — and why
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            AI-generated content is being weaponized across industries. Here's how DeepGuard is being used to stop it.
          </p>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="sticky top-16 z-30 bg-background/95 backdrop-blur-sm border-b border-border/40 py-3">
        <div className="container">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActive(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${active === cat.id ? 'bg-primary/10 text-primary border border-primary/30' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30 border border-transparent'}`}
              >
                <cat.icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Use Case Content */}
      <section className="py-16">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className={`p-6 rounded-2xl border ${uc.border} ${uc.bg} mb-8`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className={`text-2xl font-bold ${uc.color} mb-2`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{uc.headline}</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">{uc.subhead}</p>
                </div>
                <div className="text-center flex-shrink-0 p-4 rounded-xl bg-background/50 border border-border/40">
                  <div className={`text-3xl font-bold ${uc.color} mb-1`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{uc.stat.value}</div>
                  <div className="text-[10px] text-muted-foreground max-w-[120px] leading-tight">{uc.stat.label}</div>
                </div>
              </div>
            </div>

            {/* Scenarios */}
            <div className="space-y-4 mb-8">
              <h3 className="text-lg font-semibold text-foreground mb-4">{t("usecase_attack_scenarios")}</h3>
              {uc.scenarios.map((scenario, i) => {
                const TypeIcon = TYPE_ICONS[scenario.type] || FileImage;
                return (
                  <div key={i} className="rounded-2xl border border-border/60 bg-card overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-3 border-b border-border/30 bg-muted/20">
                      <TypeIcon className={`w-4 h-4 ${uc.color}`} />
                      <h4 className="font-medium text-foreground text-sm">{scenario.title}</h4>
                      <div className="ml-auto">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${SEVERITY_COLORS[scenario.severity]}`}>
                          {scenario.severity}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
                      <div className="p-4 rounded-xl bg-rose-400/5 border border-rose-400/15">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                          <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Threat</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{scenario.threat}</p>
                      </div>
                      <div className={`p-4 rounded-xl ${uc.bg} border ${uc.border}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className={`w-3.5 h-3.5 ${uc.color}`} />
                          <span className={`text-xs font-semibold ${uc.color} uppercase tracking-wider`}>DeepGuard</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{scenario.detection}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tools & Plan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-5 rounded-xl border border-border/60 bg-card">
                <h4 className="font-semibold text-foreground mb-3 text-sm">{t("usecase_recommended_tools")}</h4>
                <ul className="space-y-2">
                  {uc.tools.map((tool, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className={`w-3.5 h-3.5 ${uc.color} flex-shrink-0`} />
                      {tool}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`p-5 rounded-xl border ${uc.border} ${uc.bg}`}>
                <h4 className={`font-semibold ${uc.color} mb-3 text-sm`}>{t("usecase_recommended_plan")}</h4>
                <p className="text-foreground font-bold text-lg mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{uc.plan}</p>
                <div className="flex gap-3">
                  <Link href="/pricing">
                    <Button size="sm" className={`gap-1.5 ${uc.color === 'text-primary' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`} variant={uc.color === 'text-primary' ? 'default' : 'outline'}>
                      View Plans <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                  <Link href="/detect/text">
                    <Button size="sm" variant="outline" className="border-border/60 gap-1.5">
                      Try Free <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="py-16 bg-card/30 border-y border-border/40">
        <div className="container">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 max-w-4xl mx-auto">
            {[
              { icon: DollarSign, value: '$2.9B', label: 'Lost to BEC fraud annually', color: 'text-rose-400' },
              { icon: Video, value: '900%', label: 'Increase in deepfake video calls', color: 'text-amber-400' },
              { icon: Users, value: '1 in 4', label: 'Remote interviews involve deception', color: 'text-primary' },
              { icon: Globe2, value: '500M+', label: 'AI images created daily', color: 'text-cyan-400' },
            ].map((stat, i) => (
              <div key={i} className="text-center p-5 rounded-xl border border-border/60 bg-card">
                <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
                <div className={`text-2xl font-bold ${stat.color} mb-1`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="container relative z-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{t("usecase_start_protecting")}</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">No credit card required. 10 free detections every month. Upgrade when you need more.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/detect/text">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-8">
                Start Free <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href="mailto:enterprise@deepguard.org">
              <Button size="lg" variant="outline" className="border-border/60 hover:border-primary/40 gap-2 px-8">
                Talk to Sales <Building2 className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
