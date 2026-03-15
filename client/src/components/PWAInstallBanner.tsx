import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLang } from '@/contexts/LanguageContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallBanner() {
  const { lang } = useLang();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    // Check if previously dismissed
    const wasDismissed = sessionStorage.getItem('pwa_banner_dismissed');
    if (wasDismissed) return;

    // Detect iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    if (ios) {
      // Show iOS manual install guide after 3s
      setTimeout(() => setShowBanner(true), 3000);
    } else {
      // Listen for Chrome/Android install prompt
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setShowBanner(true);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    sessionStorage.setItem('pwa_banner_dismissed', '1');
  };

  if (!showBanner || dismissed) return null;

  return (
    <>
      {/* Install Banner */}
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
        <div className="rounded-2xl border border-primary/30 bg-card/95 backdrop-blur-xl shadow-2xl shadow-black/50 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {lang === 'zh' ? '安装 DeepGuard 到手机' : 'Install DeepGuard on your phone'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {lang === 'zh'
                  ? '添加到主屏幕，像使用 App 一样随时检测，无需每次打开浏览器'
                  : 'Add to home screen for instant access — works like a native app'}
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-xs gap-1.5"
                  onClick={handleInstall}
                >
                  <Download className="w-3.5 h-3.5" />
                  {lang === 'zh' ? '立即安装' : 'Install Now'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs text-muted-foreground"
                  onClick={handleDismiss}
                >
                  {lang === 'zh' ? '稍后再说' : 'Maybe Later'}
                </Button>
              </div>
            </div>
            <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Manual Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowIOSGuide(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">
                {lang === 'zh' ? '如何安装到 iPhone' : 'How to install on iPhone'}
              </h3>
              <button onClick={() => setShowIOSGuide(false)}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-3">
              {(lang === 'zh' ? [
                { step: '1', text: '点击 Safari 底部的「分享」按钮（方块加箭头图标）' },
                { step: '2', text: '在弹出菜单中向下滑动，找到「添加到主屏幕」' },
                { step: '3', text: '点击「添加」，DeepGuard 图标将出现在您的主屏幕上' },
              ] : [
                { step: '1', text: 'Tap the Share button at the bottom of Safari (square with arrow icon)' },
                { step: '2', text: 'Scroll down in the menu and tap "Add to Home Screen"' },
                { step: '3', text: 'Tap "Add" — the DeepGuard icon will appear on your home screen' },
              ]).map(item => (
                <div key={item.step} className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0 text-primary text-xs font-bold">
                    {item.step}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
            <div className="text-center text-xs text-muted-foreground/60 pt-1">
              {lang === 'zh' ? '仅支持 Safari 浏览器' : 'Safari browser only'}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
