import { Video, Shield } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import FileUploadDetect from '@/components/FileUploadDetect';

export default function VideoDetect() {
  const { t, lang } = useLang();

  return (
    <div className="min-h-screen py-12 grid-bg">
      <div className="container max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-400/10 border border-blue-400/30 mb-4">
            <Video className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {t.video_title}
          </h1>
          <p className="text-muted-foreground">{t.video_subtitle}</p>
        </div>

        {/* Detection card */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
          <FileUploadDetect
            type="video"
            acceptedFormats={t.video_formats}
            acceptMimeTypes="video/mp4,video/webm,video/quicktime,video/x-msvideo,.mp4,.webm,.mov,.avi"
            maxSizeMB={50}
          />
        </div>

        {/* Info */}
        <div className="mt-6 p-4 rounded-xl border border-border/40 bg-card/40">
          <div className="flex items-start gap-3">
            <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              {lang === 'zh'
                ? '上传的视频文件仅用于 AI 分析，分析完成后立即删除，不会被存储或用于其他用途。'
                : 'Uploaded video files are used only for AI analysis and deleted immediately after. They are never stored or used for any other purpose.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
