import { AudioLines, Shield } from 'lucide-react';
import FileUploadDetect from '@/components/FileUploadDetect';
import { useLang } from '@/contexts/LanguageContext';
import { useTranslation } from 'react-i18next';

export default function AudioDetect() {
  const { t } = useTranslation();
  const { lang } = useLang();

  return (
    <div className="min-h-screen py-12 grid-bg">
      <div className="container max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-400/10 border border-cyan-400/30 mb-4">
            <AudioLines className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {t('audio_title')}
          </h1>
          <p className="text-muted-foreground">{t('audio_subtitle')}</p>
        </div>

        {/* Detection card */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
          <FileUploadDetect
            type="audio"
            accept="audio/mpeg,audio/wav,audio/mp4,audio/ogg,audio/flac,audio/x-flac,audio/aac,.mp3,.wav,.m4a,.ogg,.flac"
            maxSizeMB={5120}
          />
        </div>

        {/* Info */}
        <div className="mt-6 p-4 rounded-xl border border-border/40 bg-card/40">
          <div className="flex items-start gap-3">
            <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('audio_privacy_note')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
