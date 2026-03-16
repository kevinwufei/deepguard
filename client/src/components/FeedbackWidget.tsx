import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, HelpCircle, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

type FeedbackType = 'correct' | 'incorrect' | 'unsure';
type LabelType = 'ai_generated' | 'real' | 'deepfake_video' | 'ai_audio' | 'human_audio';

interface FeedbackWidgetProps {
  recordId: number;
  detectionType: 'image' | 'video' | 'audio' | 'text';
  currentVerdict: 'safe' | 'suspicious' | 'deepfake';
}

const LABEL_OPTIONS: { value: LabelType; label: string; color: string }[] = [
  { value: 'ai_generated', label: 'AI Generated Image', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { value: 'real', label: 'Real / Authentic', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { value: 'deepfake_video', label: 'Deepfake Video', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { value: 'ai_audio', label: 'AI-Generated Audio', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { value: 'human_audio', label: 'Real Human Voice', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
];

export function FeedbackWidget({ recordId, detectionType, currentVerdict }: FeedbackWidgetProps) {
  const [expanded, setExpanded] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackType | null>(null);
  const [label, setLabel] = useState<LabelType | null>(null);
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submitFeedback = trpc.feedback.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success('Thank you! Your feedback helps improve detection accuracy.');
    },
    onError: () => {
      toast.error('Failed to submit feedback. Please try again.');
    },
  });

  const handleSubmit = () => {
    if (!feedback) {
      toast.error('Please select whether the detection was correct or not.');
      return;
    }
    submitFeedback.mutate({ recordId, feedback, label, note: note || undefined });
  };

  // Suggest default label based on verdict
  const suggestedLabel: LabelType = currentVerdict === 'safe' ? 'real'
    : detectionType === 'video' ? 'deepfake_video'
    : detectionType === 'audio' ? 'ai_audio'
    : 'ai_generated';

  if (submitted) {
    return (
      <div className="mt-6 p-4 rounded-xl border border-green-500/30 bg-green-500/10 flex items-center gap-3">
        <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
        <div>
          <p className="text-sm font-medium text-green-400">Feedback submitted — thank you!</p>
          <p className="text-xs text-slate-400 mt-0.5">Your label has been added to the training dataset and will help improve future detection accuracy.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-slate-700/50 bg-slate-800/30 overflow-hidden">
      {/* Header toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ThumbsUp className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-slate-200">Was this detection accurate?</span>
          <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400 bg-cyan-500/10">
            Help train our model
          </Badge>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-700/50">
          {/* Feedback buttons */}
          <div className="pt-3">
            <p className="text-xs text-slate-400 mb-2">Was the detection result correct?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setFeedback('correct')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                  feedback === 'correct'
                    ? 'border-green-500 bg-green-500/20 text-green-400'
                    : 'border-slate-600 text-slate-400 hover:border-green-500/50 hover:text-green-400'
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                Yes, correct
              </button>
              <button
                onClick={() => setFeedback('incorrect')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                  feedback === 'incorrect'
                    ? 'border-red-500 bg-red-500/20 text-red-400'
                    : 'border-slate-600 text-slate-400 hover:border-red-500/50 hover:text-red-400'
                }`}
              >
                <ThumbsDown className="w-4 h-4" />
                No, wrong
              </button>
              <button
                onClick={() => setFeedback('unsure')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                  feedback === 'unsure'
                    ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400'
                    : 'border-slate-600 text-slate-400 hover:border-yellow-500/50 hover:text-yellow-400'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                Not sure
              </button>
            </div>
          </div>

          {/* Ground truth label */}
          <div>
            <p className="text-xs text-slate-400 mb-2">What is this content actually? <span className="text-slate-500">(optional but very helpful)</span></p>
            <div className="flex flex-wrap gap-2">
              {LABEL_OPTIONS.filter(opt =>
                detectionType === 'image' ? ['ai_generated', 'real'].includes(opt.value) :
                detectionType === 'video' ? ['deepfake_video', 'real'].includes(opt.value) :
                detectionType === 'audio' ? ['ai_audio', 'human_audio'].includes(opt.value) :
                ['ai_generated', 'real'].includes(opt.value)
              ).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setLabel(label === opt.value ? null : opt.value)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    label === opt.value ? opt.color : 'border-slate-600 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Optional note */}
          <div>
            <p className="text-xs text-slate-400 mb-2">Additional notes <span className="text-slate-500">(optional)</span></p>
            <Textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. This was generated with Midjourney v6, the hands look slightly off..."
              className="text-sm bg-slate-900/50 border-slate-600 text-slate-300 placeholder:text-slate-600 resize-none h-16"
              maxLength={500}
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Your feedback is anonymous and used only to improve detection accuracy.
            </p>
            <Button
              onClick={handleSubmit}
              disabled={!feedback || submitFeedback.isPending}
              size="sm"
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-medium"
            >
              {submitFeedback.isPending ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
