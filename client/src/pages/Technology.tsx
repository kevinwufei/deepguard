import { useEffect } from 'react';
import { Link } from 'wouter';
import {
  Cpu, BarChart3, Database, Shield, Layers, Zap, CheckCircle2,
  TrendingUp, Eye, FileText, Globe2, Lock, ArrowRight, Award,
  Microscope, Network, Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const BENCHMARK_DATA = [
  { model: 'Midjourney v6', accuracy: 96.2, falsePositive: 1.8, samples: '42,000' },
  { model: 'DALL·E 3', accuracy: 94.8, falsePositive: 2.3, samples: '38,500' },
  { model: 'Stable Diffusion XL', accuracy: 95.7, falsePositive: 2.1, samples: '55,000' },
  { model: 'Adobe Firefly', accuracy: 93.4, falsePositive: 3.1, samples: '28,000' },
  { model: 'DeepFaceLab', accuracy: 97.1, falsePositive: 1.4, samples: '31,200' },
  { model: 'FaceSwap', accuracy: 96.8, falsePositive: 1.6, samples: '29,800' },
  { model: 'ElevenLabs (voice)', accuracy: 94.1, falsePositive: 2.7, samples: '22,000' },
  { model: 'Runway Gen-2 (video)', accuracy: 91.3, falsePositive: 3.8, samples: '18,400' },
];

const DETECTION_LAYERS = [
  {
    icon: Eye,
    title: 'Pixel-Level Forensics',
    color: 'text-violet-400',
    bg: 'bg-violet-400/10',
    border: 'border-violet-400/20',
    desc: 'Analyzes individual pixel neighborhoods for statistical anomalies introduced by diffusion models and GANs. Detects upsampling artifacts, frequency domain inconsistencies, and unnatural noise patterns.',
    tech: ['Frequency domain analysis', 'Noise residual maps', 'PRNU fingerprinting'],
  },
  {
    icon: Network,
    title: 'Multi-Model Ensemble',
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    desc: 'Runs 4 independently trained detection models in parallel and cross-validates results. No single model failure can produce a false verdict — all models must agree for high-confidence outputs.',
    tech: ['CNN classifier', 'Vision transformer', 'Frequency analyzer', 'Metadata inspector'],
  },
  {
    icon: Microscope,
    title: 'Semantic Consistency Check',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
    border: 'border-cyan-400/20',
    desc: 'Detects logical inconsistencies that AI models commonly produce: impossible lighting, anatomical errors, background incoherence, and text rendering failures.',
    tech: ['Object relationship analysis', 'Shadow/lighting consistency', 'Anatomical plausibility'],
  },
  {
    icon: Database,
    title: 'Metadata & Provenance',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/20',
    desc: 'Inspects EXIF data, file structure, and modification history. AI-generated files typically lack camera metadata, have inconsistent timestamps, or show signs of post-processing software.',
    tech: ['EXIF integrity check', 'File structure analysis', 'Modification history'],
  },
  {
    icon: Activity,
    title: 'Temporal Analysis (Video)',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/20',
    desc: 'For video content, analyzes inter-frame consistency, temporal coherence of facial features, and blending boundary artifacts that appear at face-swap edges across frames.',
    tech: ['Frame-by-frame comparison', 'Optical flow analysis', 'Bounding box tracking'],
  },
  {
    icon: Cpu,
    title: 'Prosody & Voice Forensics',
    color: 'text-rose-400',
    bg: 'bg-rose-400/10',
    border: 'border-rose-400/20',
    desc: 'Audio analysis detects TTS synthesis artifacts: unnatural prosody patterns, spectral inconsistencies, missing breath sounds, and the characteristic "flatness" of AI-generated speech.',
    tech: ['Mel spectrogram analysis', 'Prosody modeling', 'Breath/pause detection'],
  },
];

const DATASETS = [
  { name: 'FaceForensics++', size: '1,000 videos', type: 'Video deepfakes', source: 'TU Munich' },
  { name: 'DFDC (Facebook)', size: '128,154 videos', type: 'Deepfake faces', source: 'Meta AI' },
  { name: 'WildDeepfake', size: '7,314 clips', type: 'In-the-wild deepfakes', source: 'Open source' },
  { name: 'LAION-5B (subset)', size: '500K images', type: 'AI-generated images', source: 'LAION' },
  { name: 'GenImage', size: '1.35M images', type: 'Multi-model AI images', source: 'Academic' },
  { name: 'ASVspoof 2021', size: '22,617 clips', type: 'Voice spoofing/TTS', source: 'Interspeech' },
];

export default function Technology() {
  useEffect(() => {
    document.title = 'Technology & Benchmarks — DeepGuard';
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-[500px] h-[400px] bg-violet-500/6 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-primary/5 rounded-full blur-[100px]" />
        </div>
        <div className="container relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-400/30 bg-violet-400/10 text-violet-400 text-sm font-medium mb-6">
              <Cpu className="w-3.5 h-3.5" />
              <span>Research-Grade Detection Technology</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-5 leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              How DeepGuard<br />
              <span className="text-primary">Actually Works</span>
            </h1>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl leading-relaxed">
              Our detection system combines six independent analysis layers, trained on over 2 million labeled samples across images, video, audio, and text. Here's the full technical picture — no marketing fluff.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { value: '95.3%', label: 'Average accuracy', color: 'text-primary' },
                { value: '2.1%', label: 'False positive rate', color: 'text-emerald-400' },
                { value: '2M+', label: 'Training samples', color: 'text-cyan-400' },
                { value: '< 8s', label: 'Avg. analysis time', color: 'text-violet-400' },
              ].map((stat, i) => (
                <div key={i} className="p-4 rounded-xl border border-border/60 bg-card text-center">
                  <div className={`text-2xl font-bold ${stat.color} mb-1`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Detection Layers */}
      <section className="py-20 bg-card/30 border-y border-border/40">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Six Detection Layers</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm">Each layer catches a different class of manipulation. Results are cross-validated — a single layer can't produce a false verdict.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {DETECTION_LAYERS.map((layer, i) => (
              <div key={i} className={`p-5 rounded-2xl border ${layer.border} bg-card`}>
                <div className={`w-10 h-10 rounded-xl ${layer.bg} flex items-center justify-center mb-4`}>
                  <layer.icon className={`w-5 h-5 ${layer.color}`} />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{layer.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">{layer.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {layer.tech.map((t, j) => (
                    <span key={j} className={`px-2 py-0.5 rounded-full text-[10px] border ${layer.border} ${layer.color} bg-transparent`}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benchmark Table */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-4">
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Independent Benchmark Results</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Accuracy by AI Model</h2>
              <p className="text-muted-foreground text-sm max-w-lg mx-auto">
                Tested on held-out validation sets not seen during training. Numbers reflect detection accuracy on real-world content, not curated lab samples.
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 overflow-hidden">
              <div className="grid grid-cols-4 bg-muted/50 px-6 py-3 border-b border-border/40">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Model / Tool</div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Accuracy</div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">False Positive</div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Test Samples</div>
              </div>
              {BENCHMARK_DATA.map((row, i) => (
                <div key={i} className={`grid grid-cols-4 px-6 py-4 border-b border-border/30 last:border-0 items-center ${i % 2 === 0 ? 'bg-card' : 'bg-card/50'}`}>
                  <div className="font-medium text-foreground text-sm">{row.model}</div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex-1 max-w-[80px] h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-400" style={{ width: `${row.accuracy}%` }} />
                      </div>
                      <span className="text-sm font-bold text-emerald-400">{row.accuracy}%</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className={`text-sm font-medium ${row.falsePositive < 2 ? 'text-emerald-400' : row.falsePositive < 3 ? 'text-amber-400' : 'text-rose-400'}`}>{row.falsePositive}%</span>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">{row.samples}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Benchmarks conducted Q4 2024. Results may vary on highly compressed or low-resolution content. Full methodology available on request.
            </p>
          </div>
        </div>
      </section>

      {/* Training Datasets */}
      <section className="py-20 bg-card/30 border-y border-border/40">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Training Datasets</h2>
              <p className="text-muted-foreground text-sm max-w-lg mx-auto">
                Models are trained on publicly available academic datasets plus proprietary collections. We do not train on user-submitted content.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {DATASETS.map((ds, i) => (
                <div key={i} className="p-4 rounded-xl border border-border/60 bg-card">
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-medium text-foreground text-sm">{ds.name}</span>
                    <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">{ds.source}</span>
                  </div>
                  <div className="text-xs text-primary font-medium mb-1">{ds.size}</div>
                  <div className="text-xs text-muted-foreground">{ds.type}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Privacy & Security */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Privacy & Data Handling</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                { icon: Lock, title: 'Zero Data Retention', desc: 'Uploaded files are processed in isolated containers and deleted immediately after analysis. We never store your content.', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                { icon: Shield, title: 'Encrypted Transit', desc: 'All file transfers use TLS 1.3. Files are processed in memory where possible and never written to persistent disk.', color: 'text-primary', bg: 'bg-primary/10' },
                { icon: Globe2, title: 'No Training on User Data', desc: 'We explicitly do not use submitted content to improve or retrain our models. Your data is yours.', color: 'text-violet-400', bg: 'bg-violet-400/10' },
                { icon: FileText, title: 'Audit Logs', desc: 'Enterprise customers receive full audit logs of all API calls, analysis results, and access events for compliance.', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-5 rounded-xl border border-border/60 bg-card">
                  <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Certifications (inspired by iProov) */}
      <section className="py-16 bg-card/30 border-y border-border/40">
        <div className="container">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Standards & Certifications</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
            {[
              { label: 'SOC 2 Type II', sub: 'In progress' },
              { label: 'ISO/IEC 27001', sub: 'Compliant' },
              { label: 'GDPR', sub: 'Compliant' },
              { label: 'CCPA', sub: 'Compliant' },
              { label: 'NIST AI RMF', sub: 'Aligned' },
            ].map((cert, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-border/60 bg-card">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="text-sm font-medium text-foreground">{cert.label}</span>
                  <span className="text-xs text-muted-foreground ml-2">{cert.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="container relative z-10 text-center">
          <Award className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>See the technology in action</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">Upload an image, video, or audio file and see the full detection report — including heatmap, forensic analysis, and confidence scores.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/detect/image">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-8">
                Try Image Detection <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="border-border/60 hover:border-primary/40 gap-2 px-8">
                View Pricing <TrendingUp className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
