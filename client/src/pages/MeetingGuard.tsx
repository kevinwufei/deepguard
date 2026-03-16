import { useEffect } from 'react';
import { Link } from 'wouter';
import {
  Video, Shield, AlertTriangle, CheckCircle2, Zap, Users,
  Monitor, Mic, Eye, ArrowRight, Star, Clock, Lock,
  Building2, ChevronRight, Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Share your screen in DeepGuard',
    desc: 'Open DeepGuard\'s Screen Monitor tab during your Zoom, Teams, or Google Meet call. No plugins or meeting bot required — it works with any video platform.',
    icon: Monitor,
  },
  {
    step: '02',
    title: 'AI analyzes every participant in real time',
    desc: 'DeepGuard captures frames from your screen every few seconds and runs deepfake detection on each visible face. You see a live risk score for each participant.',
    icon: Eye,
  },
  {
    step: '03',
    title: 'Get instant alerts when something\'s off',
    desc: 'If a face shows deepfake indicators — unnatural blending, temporal inconsistencies, or GAN artifacts — you receive an immediate on-screen alert with a confidence score.',
    icon: AlertTriangle,
  },
];

const USE_CASES = [
  {
    icon: Building2,
    title: 'CEO Fraud & Executive Impersonation',
    color: 'text-rose-400',
    bg: 'bg-rose-400/10',
    border: 'border-rose-400/20',
    scenario: 'A caller on a Zoom call claims to be your CFO, requesting an urgent wire transfer.',
    solution: 'DeepGuard detects the deepfake face in real time and alerts you before any action is taken.',
    stat: '$2.9B lost to BEC fraud in 2023 (FBI IC3)',
  },
  {
    icon: Users,
    title: 'Fake Job Candidates (HR Fraud)',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/20',
    scenario: 'A job applicant uses a real-time deepfake filter to impersonate someone else during a video interview.',
    solution: 'DeepGuard flags the synthetic face overlay, protecting your hiring process from identity fraud.',
    stat: '1 in 4 remote job interviews now involves identity deception (KPMG 2024)',
  },
  {
    icon: Shield,
    title: 'Legal & Notary Verification',
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    scenario: 'A remote notarization requires verifying the signer\'s identity over video call.',
    solution: 'DeepGuard provides a session report confirming no deepfake activity was detected, usable as supporting documentation.',
    stat: 'Remote notarization fraud increased 340% since 2021',
  },
  {
    icon: Video,
    title: 'Media & Press Interviews',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
    border: 'border-cyan-400/20',
    scenario: 'A journalist interviews a source over video who may be using a deepfake to hide their identity.',
    solution: 'DeepGuard verifies the authenticity of the video feed and generates a timestamped verification report.',
    stat: 'Deepfake video calls increased 900% in 2024 (Onfido)',
  },
];

const PLATFORMS = [
  { name: 'Zoom', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { name: 'Microsoft Teams', color: 'text-violet-400', bg: 'bg-violet-400/10' },
  { name: 'Google Meet', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { name: 'Webex', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  { name: 'Skype', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  { name: 'FaceTime', color: 'text-rose-400', bg: 'bg-rose-400/10' },
];

export default function MeetingGuard() {
  useEffect(() => {
    document.title = 'Real-Time Meeting Deepfake Detection — DeepGuard';
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-[600px] h-[400px] bg-rose-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] bg-primary/5 rounded-full blur-[100px]" />
        </div>
        <div className="container relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-rose-400/30 bg-rose-400/10 text-rose-400 text-sm font-medium mb-6">
              <Video className="w-3.5 h-3.5" />
              <span>Real-Time Meeting Protection</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-5 leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Is the person on your<br />
              <span className="text-rose-400">video call really who they say they are?</span>
            </h1>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl leading-relaxed">
              Deepfake video call fraud is rising fast. DeepGuard monitors your Zoom, Teams, and Google Meet sessions in real time — alerting you the moment a synthetic face is detected.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/detect/screen">
                <Button size="lg" className="bg-rose-500 hover:bg-rose-600 text-white gap-2 px-8">
                  <Play className="w-4 h-4" /> Start Meeting Monitor
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="border-rose-400/30 text-rose-400 hover:border-rose-400/60 gap-2 px-8">
                  View Pricing <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-5 mt-8">
              {[
                { icon: Zap, text: 'Analysis every 5 seconds' },
                { icon: Lock, text: 'No meeting bot — screen-based only' },
                { icon: Clock, text: 'Session report included' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <item.icon className="w-4 h-4 text-rose-400" />
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Supported Platforms */}
      <section className="py-12 bg-card/30 border-y border-border/40">
        <div className="container">
          <p className="text-center text-sm text-muted-foreground mb-6">Works with any video platform — no plugins or meeting bots required</p>
          <div className="flex flex-wrap justify-center gap-3">
            {PLATFORMS.map((p, i) => (
              <div key={i} className={`flex items-center gap-2 px-4 py-2 rounded-full border border-border/60 ${p.bg}`}>
                <Video className={`w-4 h-4 ${p.color}`} />
                <span className={`text-sm font-medium ${p.color}`}>{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>How It Works</h2>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto">No meeting bots, no calendar integrations, no privacy concerns. DeepGuard works entirely through your screen.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-border/40 z-0" style={{ width: 'calc(100% - 2rem)', left: 'calc(100% - 1rem)' }} />
                )}
                <div className="relative z-10 p-6 rounded-2xl border border-border/60 bg-card h-full">
                  <div className="text-4xl font-bold text-primary/20 mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{step.step}</div>
                  <div className="w-10 h-10 rounded-xl bg-rose-400/10 flex items-center justify-center mb-4">
                    <step.icon className="w-5 h-5 text-rose-400" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-card/30 border-y border-border/40">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Real-World Threats We Stop</h2>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto">These aren't hypothetical scenarios. Each of these fraud types is actively occurring at scale.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {USE_CASES.map((uc, i) => (
              <div key={i} className={`p-6 rounded-2xl border ${uc.border} bg-card`}>
                <div className={`w-10 h-10 rounded-xl ${uc.bg} flex items-center justify-center mb-4`}>
                  <uc.icon className={`w-5 h-5 ${uc.color}`} />
                </div>
                <h3 className="font-semibold text-foreground mb-3">{uc.title}</h3>
                <div className="space-y-3 mb-4">
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                    <p className="text-xs text-muted-foreground font-medium mb-1 uppercase tracking-wider">Scenario</p>
                    <p className="text-xs text-foreground leading-relaxed">{uc.scenario}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${uc.bg} border ${uc.border}`}>
                    <p className={`text-xs font-medium mb-1 uppercase tracking-wider ${uc.color}`}>DeepGuard Response</p>
                    <p className="text-xs text-foreground leading-relaxed">{uc.solution}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-3.5 h-3.5 ${uc.color} flex-shrink-0`} />
                  <p className="text-[11px] text-muted-foreground italic">{uc.stat}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing callout */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="rounded-2xl border border-rose-400/20 bg-rose-400/5 p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Meeting Detection Pricing</h3>
                  <p className="text-sm text-muted-foreground mb-4">Pay per session, or get unlimited sessions with Business plan.</p>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { label: 'Single session', price: '$4.99', sub: 'Up to 2 hours' },
                      { label: '10-session pack', price: '$39.99', sub: 'Save 20%' },
                      { label: 'Business plan', price: '$49/mo', sub: '30 sessions included' },
                    ].map((item, i) => (
                      <div key={i} className="px-3 py-2 rounded-lg border border-rose-400/20 bg-rose-400/5 text-center">
                        <div className="text-sm font-bold text-rose-400">{item.price}</div>
                        <div className="text-[10px] text-muted-foreground">{item.label}</div>
                        <div className="text-[10px] text-muted-foreground">{item.sub}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-3 flex-shrink-0">
                  <Link href="/detect/screen">
                    <Button className="bg-rose-500 hover:bg-rose-600 text-white gap-2 whitespace-nowrap">
                      <Play className="w-4 h-4" /> Start Monitor
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button variant="outline" className="border-rose-400/30 text-rose-400 hover:border-rose-400/60 gap-2 whitespace-nowrap">
                      View All Plans <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <section className="py-12 bg-card/30 border-t border-border/40">
        <div className="container">
          <div className="flex flex-wrap justify-center gap-6 max-w-3xl mx-auto">
            {[
              { icon: Lock, text: 'Screen capture stays local — never uploaded' },
              { icon: Shield, text: 'No meeting bot joins your call' },
              { icon: CheckCircle2, text: 'Session report for documentation' },
              { icon: Star, text: 'Works on any OS: Windows, macOS, Linux' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <item.icon className="w-4 h-4 text-primary flex-shrink-0" />
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
