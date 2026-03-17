import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2, XCircle, HelpCircle, ThumbsUp, ThumbsDown,
  ChevronDown, ChevronUp, Sparkles, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

type FeedbackType = 'correct' | 'incorrect' | 'unsure';
type LabelType = 'ai_generated' | 'real' | 'deepfake_video' | 'ai_audio' | 'human_audio' | 'ai_text' | 'human_text';
type DetectionType = 'image' | 'video' | 'audio' | 'text';
type Verdict = 'safe' | 'suspicious' | 'deepfake' | 'human' | 'mixed' | 'ai_generated';

interface FeedbackWidgetProps {
  recordId: number;
  detectionType: DetectionType;
  currentVerdict: Verdict;
}

const LABEL_OPTIONS: { value: LabelType; label: string; labelKey: string; color: string; types: DetectionType[] }[] = [
  { value: 'ai_generated',  label: 'AI Generated Image',    labelKey: 'fb_label_ai_image',   color: 'bg-red-500/20 text-red-400 border-red-500/30',       types: ['image'] },
  { value: 'real',          label: 'Real / Authentic',       labelKey: 'fb_label_real',        color: 'bg-green-500/20 text-green-400 border-green-500/30', types: ['image', 'video', 'audio'] },
  { value: 'deepfake_video',label: 'Deepfake Video',         labelKey: 'fb_label_deepfake_vid',color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', types: ['video'] },
  { value: 'ai_audio',      label: 'AI-Cloned Voice',        labelKey: 'fb_label_ai_audio',    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', types: ['audio'] },
  { value: 'human_audio',   label: 'Real Human Voice',       labelKey: 'fb_label_human_audio', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',    types: ['audio'] },
  { value: 'ai_text',       label: 'AI-Generated Text',      labelKey: 'fb_label_ai_text',     color: 'bg-rose-500/20 text-rose-400 border-rose-500/30',    types: ['text'] },
  { value: 'human_text',    label: 'Human-Written Text',     labelKey: 'fb_label_human_text',  color: 'bg-teal-500/20 text-teal-400 border-teal-500/30',    types: ['text'] },
];

export function FeedbackWidget({ recordId, detectionType, currentVerdict }: FeedbackWidgetProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<'collapsed' | 'rating' | 'detail' | 'done'>('collapsed');
  const [feedback, setFeedback] = useState<FeedbackType | null>(null);
  const [label, setLabel] = useState<LabelType | null>(null);
  const [note, setNote] = useState('');

  const submitFeedback = trpc.feedback.submit.useMutation({
    onSuccess: () => {
      setPhase('done');
      toast.success(t('fb_toast_thanks', 'Thank you! Your feedback improves detection accuracy.'));
    },
    onError: () => {
      toast.error(t('fb_toast_error', 'Failed to submit feedback. Please try again.'));
    },
  });

  // One-click quick submit for "correct" — no need to expand
  const handleQuickCorrect = () => {
    setFeedback('correct');
    submitFeedback.mutate({ recordId, feedback: 'correct', label: null, note: undefined });
  };

  // "Wrong" opens detail panel
  const handleWrong = () => {
    setFeedback('incorrect');
    setPhase('detail');
  };

  const handleDetailSubmit = () => {
    submitFeedback.mutate({
      recordId,
      feedback: feedback ?? 'incorrect',
      label,
      note: note || undefined,
    });
  };

  const filteredLabels = LABEL_OPTIONS.filter(opt => opt.types.includes(detectionType));

  // ── Done state ──────────────────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <div className="mt-5 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/8 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-emerald-400">
            {t('fb_done_title', 'Feedback recorded — thank you!')}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {feedback === 'incorrect'
              ? t('fb_done_incorrect', 'This case has been flagged for model retraining. Your label will help fix similar errors.')
              : t('fb_done_correct', 'Great! Confirmed detections strengthen our training baseline.')}
          </p>
        </div>
      </div>
    );
  }

  // ── Detail panel (wrong / unsure) ───────────────────────────────────────────
  if (phase === 'detail') {
    return (
      <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-500/20">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-amber-400">
            {t('fb_wrong_title', 'Help us fix this — what is it really?')}
          </span>
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* Ground truth label */}
          <div>
            <p className="text-xs text-slate-400 mb-2">
              {t('fb_label_prompt', 'Select the correct label')}
              <span className="text-slate-500 ml-1">{t('fb_optional', '(optional but very helpful)')}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {filteredLabels.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setLabel(label === opt.value ? null : opt.value)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    label === opt.value ? opt.color : 'border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                  }`}
                >
                  {t(opt.labelKey, opt.label)}
                </button>
              ))}
            </div>
          </div>

          {/* Optional note */}
          <div>
            <p className="text-xs text-slate-400 mb-2">
              {t('fb_note_prompt', 'Additional details')}
              <span className="text-slate-500 ml-1">{t('fb_optional', '(optional)')}</span>
            </p>
            <Textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={t('fb_note_placeholder', 'e.g. This was generated with Midjourney v6, the hands look slightly off...')}
              className="text-sm bg-slate-900/50 border-slate-600 text-slate-300 placeholder:text-slate-600 resize-none h-16"
              maxLength={500}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setPhase('collapsed')}
              className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
            >
              {t('fb_cancel', 'Cancel')}
            </button>
            <Button
              onClick={handleDetailSubmit}
              disabled={submitFeedback.isPending}
              size="sm"
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
            >
              {submitFeedback.isPending
                ? t('fb_submitting', 'Submitting...')
                : t('fb_submit_report', 'Submit Error Report')}
            </Button>
          </div>

          <p className="text-xs text-slate-600 text-center">
            {t('fb_privacy', 'Anonymous · used only to improve detection accuracy')}
          </p>
        </div>
      </div>
    );
  }

  // ── Collapsed / quick-rate state ────────────────────────────────────────────
  return (
    <div className="mt-5 flex items-center justify-between px-4 py-3 rounded-xl border border-slate-700/50 bg-slate-800/20">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-cyan-400" />
        <span className="text-sm text-slate-300">
          {t('fb_prompt', 'Was this detection accurate?')}
        </span>
        <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400 bg-cyan-500/8 hidden sm:inline-flex">
          {t('fb_badge', 'Help train AI')}
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleQuickCorrect}
          disabled={submitFeedback.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-600 text-slate-400 text-sm
            hover:border-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('fb_yes', 'Yes')}</span>
        </button>
        <button
          onClick={handleWrong}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-600 text-slate-400 text-sm
            hover:border-red-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <ThumbsDown className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('fb_no', 'Wrong')}</span>
        </button>
      </div>
    </div>
  );
}
