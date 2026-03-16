import { useEffect, useState } from 'react';
import { Code2, Copy, CheckCircle2, Terminal, Zap, Shield, Globe2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function CodeBlock({ code, language = 'bash' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative rounded-xl border border-border/60 bg-[#0d1117] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 bg-muted/20">
        <span className="text-xs text-muted-foreground font-mono">{language}</span>
        <Button variant="ghost" size="sm" className="h-6 text-xs gap-1 text-muted-foreground hover:text-foreground" onClick={copy}>
          {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <pre className="p-4 text-sm text-foreground font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap">
        <code>{code}</code>
      </pre>
    </div>
  );
}

const endpoints = [
  {
    method: 'POST',
    path: '/api/detect/text',
    desc: 'Analyze text for AI generation. Returns probability score, sentence-level breakdown, and likely source models.',
    badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    request: `{
  "text": "Your text content here (50–10,000 characters)"
}`,
    response: `{
  "riskScore": 87,
  "verdict": "ai_generated",
  "confidence": 94,
  "detectors": [
    { "name": "GPT/LLM Detector", "score": 91, "verdict": "Likely ChatGPT-4" },
    { "name": "Perplexity Analyzer", "score": 85, "verdict": "Low perplexity" },
    { "name": "Burstiness Detector", "score": 82, "verdict": "Uniform sentence length" },
    { "name": "Stylometric Analyzer", "score": 90, "verdict": "AI-typical phrasing" }
  ],
  "sentences": [
    { "text": "The quick brown fox...", "aiProbability": 92 }
  ],
  "possibleModels": ["ChatGPT-4", "Claude 3", "Gemini Pro"],
  "summary": "High probability of AI generation detected across all four models."
}`,
    curl: `curl -X POST https://deepguard.org/api/detect/text \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"text": "Your text content here"}'`,
  },
  {
    method: 'POST',
    path: '/api/detect/audio',
    desc: 'Upload an audio file to detect AI voice cloning, TTS synthesis, or deepfake audio. Supports mp3, wav, m4a.',
    badge: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    request: `// multipart/form-data
{
  "file": <audio_file>,        // mp3, wav, m4a (max 16MB)
  "fileName": "recording.mp3"
}`,
    response: `{
  "riskScore": 73,
  "verdict": "deepfake",
  "confidence": 89,
  "features": [
    { "name": "Spectral Artifacts", "confidence": 0.91, "description": "Unnatural frequency patterns detected" },
    { "name": "Prosody Anomaly", "confidence": 0.84, "description": "Robotic intonation patterns" }
  ],
  "possibleSources": ["ElevenLabs", "Bark", "Whisper TTS"],
  "metadata": { "Format": "MP3", "SampleRate": "44100 Hz", "Channels": "Stereo" },
  "summary": "High likelihood of AI voice synthesis detected."
}`,
    curl: `curl -X POST https://deepguard.org/api/detect/audio \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@recording.mp3" \\
  -F "fileName=recording.mp3"`,
  },
  {
    method: 'POST',
    path: '/api/detect/video',
    desc: 'Upload a video file to detect face-swapping, deepfake manipulation, or AI-generated faces. Supports mp4, webm.',
    badge: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    request: `// multipart/form-data
{
  "file": <video_file>,        // mp4, webm (max 50MB)
  "fileName": "video.mp4"
}`,
    response: `{
  "riskScore": 91,
  "verdict": "deepfake",
  "confidence": 96,
  "features": [...],
  "possibleSources": ["FaceSwap", "DeepFaceLab", "SimSwap"],
  "metadata": { "Resolution": "1920x1080", "FrameRate": "30fps", "Codec": "H.264" },
  "frameTimeline": [
    { "frame": 120, "timestamp": "0:04", "aiProbability": 91 },
    { "frame": 315, "timestamp": "0:10", "aiProbability": 95 }
  ],
  "faceAnomalies": [
    { "type": "Face Mismatch", "severity": "high", "description": "Boundary artifacts around jaw line" },
    { "type": "Lip Sync Anomaly", "severity": "medium", "description": "Slight desync between audio and lip movement" }
  ],
  "summary": "Strong deepfake indicators detected. Face replacement likely."
}`,
    curl: `curl -X POST https://deepguard.org/api/detect/video \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@video.mp4" \\
  -F "fileName=video.mp4"`,
  },
];

const useCases = [
  { icon: Globe2, title: 'Social Media Platforms', desc: 'Automatically flag AI-generated content before it goes viral. Integrate into your content moderation pipeline.' },
  { icon: Shield, title: 'News & Media Verification', desc: 'Verify authenticity of user-submitted photos, videos, and articles before publication.' },
  { icon: Zap, title: 'Recruitment & HR', desc: 'Detect AI-generated resumes, cover letters, and verify video interview authenticity.' },
  { icon: Terminal, title: 'Dating & Identity Apps', desc: 'Verify profile photos and videos are real. Prevent catfishing and deepfake impersonation.' },
];

export default function ApiDocs() {
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    document.title = 'API Documentation - DeepGuard';
  }, []);

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="container max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-4">
            <Code2 className="w-3.5 h-3.5" />
            <span>Enterprise API</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            DeepGuard API Documentation
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Integrate AI content detection into your platform with a single REST API call.
            Batch process thousands of files, build real-time moderation pipelines, or add deepfake detection to any app.
          </p>
        </div>

        {/* Base URL & Auth */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          <div className="p-5 rounded-xl border border-border/60 bg-card">
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Base URL</p>
            <CodeBlock code="https://deepguard.org/api" language="url" />
          </div>
          <div className="p-5 rounded-xl border border-border/60 bg-card">
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Authentication</p>
            <CodeBlock code='Authorization: Bearer YOUR_API_KEY' language="header" />
          </div>
        </div>

        {/* Endpoints */}
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-5" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Endpoints</h2>

          {/* Tab selector */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {endpoints.map((ep, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${activeTab === i ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border/60 bg-card text-muted-foreground hover:text-foreground'}`}
              >
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${ep.badge}`}>POST</span>
                <span className="font-mono text-xs">{ep.path.split('/').pop()}</span>
              </button>
            ))}
          </div>

          {endpoints.map((ep, i) => (
            <div key={i} className={i === activeTab ? 'block' : 'hidden'}>
              <div className="p-5 rounded-xl border border-border/60 bg-card mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold border ${ep.badge}`}>POST</span>
                  <code className="text-sm font-mono text-foreground">{ep.path}</code>
                </div>
                <p className="text-sm text-muted-foreground">{ep.desc}</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Request Body</p>
                  <CodeBlock code={ep.request} language="json" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Response</p>
                  <CodeBlock code={ep.response} language="json" />
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">cURL Example</p>
                <CodeBlock code={ep.curl} language="bash" />
              </div>
            </div>
          ))}
        </div>

        {/* Rate limits */}
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-5" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Rate Limits & Pricing</h2>
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-muted/20">
                  <th className="text-left px-5 py-3 text-muted-foreground font-medium">Plan</th>
                  <th className="text-left px-5 py-3 text-muted-foreground font-medium">Requests/month</th>
                  <th className="text-left px-5 py-3 text-muted-foreground font-medium">Rate limit</th>
                  <th className="text-left px-5 py-3 text-muted-foreground font-medium">Price</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { plan: 'Free', requests: '100', rate: '5 req/min', price: '$0', highlight: false },
                  { plan: 'Pro', requests: '10,000', rate: '60 req/min', price: '$49/mo', highlight: false },
                  { plan: 'Business', requests: '100,000', rate: '300 req/min', price: '$199/mo', highlight: true },
                  { plan: 'Enterprise', requests: 'Unlimited', rate: 'Custom', price: 'Contact us', highlight: false },
                ].map((row, i) => (
                  <tr key={i} className={`border-b border-border/30 ${row.highlight ? 'bg-primary/5' : ''}`}>
                    <td className="px-5 py-3 font-medium text-foreground">
                      {row.plan}
                      {row.highlight && <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-primary/20 text-primary border border-primary/30">Popular</span>}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{row.requests}</td>
                    <td className="px-5 py-3 text-muted-foreground">{row.rate}</td>
                    <td className="px-5 py-3 text-primary font-medium">{row.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Use cases */}
        <div>
          <h2 className="text-xl font-bold mb-5" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Common Use Cases</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {useCases.map((u, i) => (
              <div key={i} className="flex items-start gap-4 p-5 rounded-xl border border-border/60 bg-card">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <u.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-1">{u.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{u.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 p-6 rounded-xl border border-primary/20 bg-primary/5 text-center">
          <h3 className="font-bold text-foreground mb-2">Ready to integrate?</h3>
          <p className="text-sm text-muted-foreground mb-4">Get your API key by signing up for a free account. No credit card required.</p>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
            <Code2 className="w-4 h-4" /> Get API Key
          </Button>
        </div>
      </div>
    </div>
  );
}
