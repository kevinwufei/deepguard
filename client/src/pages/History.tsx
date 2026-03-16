import { History as HistoryIcon, AudioLines, Video, Camera, Mic, Shield, CheckCircle2, AlertTriangle, XCircle, Lock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { getLoginUrl } from '@/const';
import { Link } from 'wouter';
import { useLang } from '@/contexts/LanguageContext';
import { useTranslation } from 'react-i18next';

const typeConfig = {
  audio: { icon: AudioLines, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  video: { icon: Video, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  camera: { icon: Camera, color: 'text-violet-400', bg: 'bg-violet-400/10' },
  microphone: { icon: Mic, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
};

const verdictConfig = {
  safe: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30' },
  suspicious: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30' },
  deepfake: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30' },
};

export default function History() {
  const { t } = useTranslation();
  const { lang } = useLang();
  const { isAuthenticated, loading } = useAuth();
  const { data: records, isLoading } = trpc.detection.getHistory.useQuery(
    { limit: 50 },
    { enabled: isAuthenticated }
  );

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString(lang === 'zh' ? 'zh-CN' : undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      audio: t('history_type_audio'),
      video: t('history_type_video'),
      camera: t('history_type_camera'),
      microphone: t('history_type_microphone'),
    };
    return map[type] || type;
  };

  const getVerdictLabel = (verdict: string) => {
    const map: Record<string, string> = {
      safe: t('detect_verdict_safe'),
      suspicious: t('detect_verdict_suspicious'),
      deepfake: t('detect_verdict_deepfake'),
    };
    return map[verdict] || verdict;
  };

  return (
    <div className="min-h-screen py-12 grid-bg">
      <div className="container max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 mb-4">
            <HistoryIcon className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {t('history_title')}
          </h1>
          <p className="text-muted-foreground">{t('history_subtitle')}</p>
        </div>

        {/* Not logged in */}
        {!loading && !isAuthenticated && (
          <div className="rounded-2xl border border-border/60 bg-card p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">{t('history_login_required')}</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {t('history_login_required')}
            </p>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2" asChild>
              <a href={getLoginUrl()}>
                <Shield className="w-4 h-4" />
                {t('nav_login')}
              </a>
            </Button>
          </div>
        )}

        {/* Loading */}
        {isAuthenticated && isLoading && (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 rounded-xl bg-card/50 border border-border/40 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {isAuthenticated && !isLoading && records && records.length === 0 && (
          <div className="rounded-2xl border border-border/60 bg-card p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mx-auto mb-4">
              <HistoryIcon className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">{t('history_empty')}</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {t('history_empty')}
            </p>
            <Link href="/detect/audio">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                {t('home_hero_cta')}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        )}

        {/* Records list */}
        {isAuthenticated && !isLoading && records && records.length > 0 && (
          <div className="space-y-3">
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: t('history_stat_total'), value: records.length, color: 'text-primary' },
                { label: t('common_safe'), value: records.filter(r => r.verdict === 'safe').length, color: 'text-emerald-400' },
                { label: t('common_deepfake'), value: records.filter(r => r.verdict === 'deepfake').length, color: 'text-red-400' },
              ].map((stat, i) => (
                <div key={i} className="rounded-xl border border-border/40 bg-card/60 p-4 text-center">
                  <div className={`text-2xl font-bold ${stat.color}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {stat.value}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Table header - desktop */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs text-muted-foreground font-medium">
              <div className="col-span-1">{t('history_col_type')}</div>
              <div className="col-span-4">{t('history_col_file')}</div>
              <div className="col-span-3">{t('history_col_time')}</div>
              <div className="col-span-2">{t('history_col_score')}</div>
              <div className="col-span-2">{t('history_col_verdict')}</div>
            </div>

            {/* Records */}
            {records.map((record) => {
              const tc = typeConfig[record.type as keyof typeof typeConfig] || typeConfig.audio;
              const vc = verdictConfig[record.verdict as keyof typeof verdictConfig] || verdictConfig.safe;
              const TypeIcon = tc.icon;
              const VerdictIcon = vc.icon;

              return (
                <div
                  key={record.id}
                  className="rounded-xl border border-border/40 bg-card hover:border-border/70 transition-colors p-4"
                >
                  {/* Mobile layout */}
                  <div className="md:hidden flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg ${tc.bg} flex items-center justify-center flex-shrink-0`}>
                      <TypeIcon className={`w-4.5 h-4.5 ${tc.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-foreground text-sm truncate">{record.fileName || getTypeLabel(record.type)}</p>
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${vc.bg} ${vc.color} border ${vc.border} flex-shrink-0`}>
                          <VerdictIcon className="w-3 h-3" />
                          {getVerdictLabel(record.verdict)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">{formatDate(record.createdAt)}</span>
                        <span className={`text-xs font-semibold ${vc.color}`}>{t('detect_risk_score')}: {record.riskScore}</span>
                      </div>
                    </div>
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-1">
                      <div className={`w-8 h-8 rounded-lg ${tc.bg} flex items-center justify-center`}>
                        <TypeIcon className={`w-4 h-4 ${tc.color}`} />
                      </div>
                    </div>
                    <div className="col-span-4">
                      <p className="text-sm font-medium text-foreground truncate">{record.fileName || getTypeLabel(record.type)}</p>
                      <p className="text-xs text-muted-foreground">{getTypeLabel(record.type)}</p>
                    </div>
                    <div className="col-span-3">
                      <p className="text-sm text-muted-foreground">{formatDate(record.createdAt)}</p>
                    </div>
                    <div className="col-span-2">
                      <span className={`text-lg font-bold ${vc.color}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        {record.riskScore}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">/100</span>
                    </div>
                    <div className="col-span-2">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${vc.bg} ${vc.color} border ${vc.border}`}>
                        <VerdictIcon className="w-3 h-3" />
                        {getVerdictLabel(record.verdict)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
