import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { trpc } from '@/lib/trpc';
import { getBrowserFingerprint } from '@/lib/fingerprint';
import { useAuth } from '../_core/hooks/useAuth';
import { getLoginUrl } from '@/const';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Shield, Zap, LogIn } from 'lucide-react';

// ─── QuotaBadge ──────────────────────────────────────────────────────────────
// Shows "X / Y used today" badge. Renders nothing if unlimited.
export function QuotaBadge() {
  const { t } = useTranslation();
  const fingerprint = useMemo(() => getBrowserFingerprint(), []);
  const { data } = trpc.quota.status.useQuery({ fingerprint }, {
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  if (!data || data.isUnlimited) return null;

  const pct = data.limit > 0 ? (data.used / data.limit) * 100 : 0;
  const isWarning = data.remaining <= 1;
  const isDanger = data.remaining === 0;

  return (
    <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium
      ${isDanger
        ? 'bg-red-500/10 border-red-500/30 text-red-400'
        : isWarning
          ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
          : 'bg-white/5 border-white/10 text-white/60'
      }`}>
      <Shield className="w-3 h-3" />
      <span>
        {data.used}/{data.limit} {t('quota_used_today', 'used today')}
      </span>
      {/* Mini progress bar */}
      <div className="w-12 h-1 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isDanger ? 'bg-red-400' : isWarning ? 'bg-yellow-400' : 'bg-emerald-400'}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}

// ─── QuotaExceededModal ───────────────────────────────────────────────────────
// Shows a modal when the user hits the daily limit.
interface QuotaExceededModalProps {
  open: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  used: number;
  limit: number;
}

export function QuotaExceededModal({ open, onClose, isLoggedIn, used, limit }: QuotaExceededModalProps) {
  const { t } = useTranslation();
  const loginUrl = getLoginUrl();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-[#0a0a0a] border border-white/10 text-white">
        <DialogHeader>
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 mx-auto mb-4">
            <Shield className="w-7 h-7 text-red-400" />
          </div>
          <DialogTitle className="text-center text-xl font-bold">
            {t('quota_exceeded_title', 'Daily Limit Reached')}
          </DialogTitle>
          <DialogDescription className="text-center text-white/60 mt-2">
            {isLoggedIn
              ? t('quota_exceeded_logged_in', `You've used all ${limit} free detections today. Upgrade to Pro for unlimited access.`)
              : t('quota_exceeded_anonymous', `You've used all ${limit} free detections today. Sign in for 10 detections/day, or upgrade for unlimited.`)
            }
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-white/60">{t('quota_used', 'Used today')}</span>
            <span className="font-semibold text-red-400">{used} / {limit}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10">
            <div className="h-full rounded-full bg-red-400" style={{ width: '100%' }} />
          </div>
          <p className="text-xs text-white/40 mt-2 text-center">
            {t('quota_resets', 'Quota resets at midnight UTC')}
          </p>
        </div>

        <div className="flex flex-col gap-3 mt-2">
          {!isLoggedIn && (
            <Button
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold"
              onClick={() => { window.location.href = loginUrl; }}
            >
              <LogIn className="w-4 h-4 mr-2" />
              {t('quota_sign_in_cta', 'Sign In for 10 Free/Day')}
            </Button>
          )}
          <Button
            className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-semibold"
            onClick={() => { window.location.href = '/pricing'; onClose(); }}
          >
            <Zap className="w-4 h-4 mr-2" />
            {t('quota_upgrade_cta', 'Upgrade to Pro — Unlimited')}
          </Button>
          <Button variant="ghost" className="w-full text-white/40 hover:text-white/60" onClick={onClose}>
            {t('quota_try_tomorrow', 'Try again tomorrow')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── useQuotaCheck ────────────────────────────────────────────────────────────
// Hook to check quota before running a detection.
// Returns { checkQuota, QuotaModal } — call checkQuota() before detection,
// render <QuotaModal /> in your component.
export function useQuotaCheck() {
  const fingerprint = useMemo(() => getBrowserFingerprint(), []);
  const utils = trpc.useUtils();
  const { user } = useAuth();

  const checkAndEnforce = async (): Promise<{ allowed: boolean; quotaInfo?: { used: number; limit: number; isLoggedIn: boolean } }> => {
    try {
      const status = await utils.quota.status.fetch({ fingerprint });
      if (status.isUnlimited) return { allowed: true };
      if (status.remaining <= 0) {
        return {
          allowed: false,
          quotaInfo: { used: status.used, limit: status.limit, isLoggedIn: status.isLoggedIn },
        };
      }
      return { allowed: true };
    } catch {
      // If quota check fails, allow the request (fail open)
      return { allowed: true };
    }
  };

  return { fingerprint, checkAndEnforce, isLoggedIn: !!user };
}
