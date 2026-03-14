import { Shield, ShieldAlert, ShieldX, CheckCircle2, AlertTriangle, XCircle, RotateCcw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLang } from '@/contexts/LanguageContext';

interface Feature {
  name: string;
  confidence: number;
  description: string;
}

interface DetectionResultProps {
  riskScore: number;
  verdict: 'safe' | 'suspicious' | 'deepfake';
  features: Feature[];
  summary: string;
  onReset: () => void;
  onSave?: () => void;
  saved?: boolean;
  saving?: boolean;
}

export default function DetectionResult({
  riskScore,
  verdict,
  features,
  summary,
  onReset,
  onSave,
  saved,
  saving,
}: DetectionResultProps) {
  const { t } = useLang();

  const verdictConfig = {
    safe: {
      label: t.detect_verdict_safe,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
      borderColor: 'border-emerald-400/30',
      glowClass: 'glow-green',
      icon: CheckCircle2,
      shieldIcon: Shield,
      scoreColor: 'text-emerald-400',
      barColor: 'bg-emerald-400',
    },
    suspicious: {
      label: t.detect_verdict_suspicious,
      color: 'text-amber-400',
      bgColor: 'bg-amber-400/10',
      borderColor: 'border-amber-400/30',
      glowClass: '',
      icon: AlertTriangle,
      shieldIcon: ShieldAlert,
      scoreColor: 'text-amber-400',
      barColor: 'bg-amber-400',
    },
    deepfake: {
      label: t.detect_verdict_deepfake,
      color: 'text-red-400',
      bgColor: 'bg-red-400/10',
      borderColor: 'border-red-400/30',
      glowClass: 'glow-red',
      icon: XCircle,
      shieldIcon: ShieldX,
      scoreColor: 'text-red-400',
      barColor: 'bg-red-400',
    },
  };

  const cfg = verdictConfig[verdict];
  const VerdictIcon = cfg.icon;
  const ShieldIcon = cfg.shieldIcon;

  // Gauge arc calculation
  const radius = 54;
  const circumference = Math.PI * radius; // half circle
  const strokeDashoffset = circumference - (riskScore / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Main result card */}
      <div className={`rounded-2xl border ${cfg.borderColor} ${cfg.bgColor} p-6`}>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Gauge */}
          <div className="relative flex-shrink-0">
            <svg width="140" height="80" viewBox="0 0 140 80">
              {/* Background arc */}
              <path
                d="M 10 75 A 60 60 0 0 1 130 75"
                fill="none"
                stroke="oklch(0.22 0.02 240)"
                strokeWidth="10"
                strokeLinecap="round"
              />
              {/* Score arc */}
              <path
                d="M 10 75 A 60 60 0 0 1 130 75"
                fill="none"
                stroke={verdict === 'safe' ? 'oklch(0.70 0.18 140)' : verdict === 'suspicious' ? 'oklch(0.75 0.18 60)' : 'oklch(0.60 0.22 25)'}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={`${strokeDashoffset}`}
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
              <span className={`text-3xl font-bold ${cfg.scoreColor}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {riskScore}
              </span>
              <span className="text-xs text-muted-foreground">{t.detect_risk_score}</span>
            </div>
          </div>

          {/* Verdict */}
          <div className="flex-1 text-center sm:text-left">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${cfg.borderColor} ${cfg.bgColor} mb-3`}>
              <VerdictIcon className={`w-4 h-4 ${cfg.color}`} />
              <span className={`font-semibold ${cfg.color}`}>{cfg.label}</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{summary}</p>
          </div>

          {/* Shield icon */}
          <div className={`hidden sm:flex w-16 h-16 rounded-2xl ${cfg.bgColor} border ${cfg.borderColor} items-center justify-center flex-shrink-0`}>
            <ShieldIcon className={`w-8 h-8 ${cfg.color}`} />
          </div>
        </div>
      </div>

      {/* Features */}
      {features.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <div className="w-1 h-4 bg-primary rounded-full" />
            {t.detect_features_detected}
          </h3>
          <div className="space-y-3">
            {features.map((f, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{f.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {t.detect_confidence}: {Math.round(f.confidence * 100)}%
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${cfg.barColor} rounded-full transition-all duration-700`}
                    style={{ width: `${f.confidence * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          className="flex-1 gap-2 border-border hover:border-primary/50"
          onClick={onReset}
        >
          <RotateCcw className="w-4 h-4" />
          {t.detect_try_another}
        </Button>
        {onSave && (
          <Button
            className="flex-1 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={onSave}
            disabled={saved || saving}
          >
            <Save className="w-4 h-4" />
            {saved ? t.detect_saved : saving ? '...' : t.detect_save_result}
          </Button>
        )}
      </div>
    </div>
  );
}
