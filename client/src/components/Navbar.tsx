import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Shield, Menu, X, ChevronDown, Globe, LogOut, History,
  Mic, Video, Camera, AudioLines, Monitor, FileText, Code2,
  LayoutDashboard, Image, Layers, Building2, Newspaper,
  Scale, Users, Cpu, Video as VideoIcon, Chrome, DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useLang, LANGUAGES } from '@/contexts/LanguageContext';
import { useAuth } from '@/_core/hooks/useAuth';
import { getLoginUrl } from '@/const';
import { trpc } from '@/lib/trpc';
import { useTranslation } from 'react-i18next';

export default function Navbar() {
  const { lang, setLang } = useLang();
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => window.location.href = '/',
  });

  const detectItems = [
    { href: '/detect/image', label: t('nav_image_detection'), icon: Image, badge: t('common_new'), color: 'text-violet-400' },
    { href: '/detect/video', label: t('nav_video_detection'), icon: Video, color: 'text-blue-400' },
    { href: '/detect/audio', label: t('nav_audio_detection'), icon: AudioLines, color: 'text-cyan-400' },
    { href: '/detect/voice', label: t('nav_voice_deepfake'), icon: Mic, badge: t('common_live'), color: 'text-violet-400' },
    { href: '/detect/text', label: t('nav_text_detection'), icon: FileText, color: 'text-emerald-400' },
    { href: '/detect/screen', label: t('nav_screen_monitor'), icon: Monitor, color: 'text-amber-400' },
    { href: '/batch', label: t('nav_batch_detection'), icon: Layers, color: 'text-violet-400' },
  ];

  const solutionsItems = [
    { href: '/meeting-guard', label: t('nav_meeting_guard'), icon: VideoIcon, desc: t('nav_meeting_guard_desc'), color: 'text-rose-400' },
    { href: '/extension', label: t('nav_browser_extension'), icon: Chrome, desc: t('nav_browser_extension_desc'), color: 'text-primary' },
    { href: '/api-docs', label: t('nav_enterprise_api'), icon: Code2, desc: t('nav_enterprise_api_desc'), color: 'text-violet-400' },
    { href: '/api-console', label: t('nav_api_console'), icon: LayoutDashboard, desc: t('nav_api_console_desc'), color: 'text-cyan-400' },
  ];

  const useCaseItems = [
    { href: '/use-cases', label: t('nav_finance'), icon: Building2, color: 'text-rose-400' },
    { href: '/use-cases', label: t('nav_hr'), icon: Users, color: 'text-amber-400' },
    { href: '/use-cases', label: t('nav_media'), icon: Newspaper, color: 'text-primary' },
    { href: '/use-cases', label: t('nav_legal'), icon: Scale, color: 'text-violet-400' },
  ];

  const currentLang = LANGUAGES.find(l => l.code === lang);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="relative">
              <Shield className="w-7 h-7 text-primary group-hover:scale-110 transition-transform" />
              <div className="absolute inset-0 bg-primary/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <span className="text-lg font-bold text-foreground tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Deep<span className="text-primary">Guard</span>
              </span>
              <p className="text-[10px] text-muted-foreground leading-none hidden sm:block">{t('nav_platform_tagline')}</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-0.5">
            {/* Detect Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className={`text-sm gap-1 ${['/detect/image', '/detect/video', '/detect/audio', '/detect/text', '/detect/screen', '/batch'].includes(location) ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                  {t('nav_detect')}
                  <ChevronDown className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-52 bg-card border-border">
                {detectItems.map(item => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href} className="flex items-center gap-2.5 cursor-pointer py-2">
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                      <span className="flex-1">{item.label}</span>
                      {(item as { badge?: string }).badge && (
                        <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-bold border border-primary/20">{(item as { badge?: string }).badge}</span>
                      )}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Solutions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className={`text-sm gap-1 ${['/meeting-guard', '/extension', '/api-docs', '/api-console'].includes(location) ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                  {t('nav_solutions')}
                  <ChevronDown className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-60 bg-card border-border">
                {solutionsItems.map(item => (
                  <DropdownMenuItem key={item.href + item.label} asChild>
                    <Link href={item.href} className="flex items-start gap-3 cursor-pointer py-2.5">
                      <div className={`w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0`}>
                        <item.icon className={`w-4 h-4 ${item.color}`} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{item.label}</div>
                        <div className="text-xs text-muted-foreground">{item.desc}</div>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Use Cases Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className={`text-sm gap-1 ${location === '/use-cases' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                  {t('nav_use_cases')}
                  <ChevronDown className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-52 bg-card border-border">
                {useCaseItems.map(item => (
                  <DropdownMenuItem key={item.label} asChild>
                    <Link href={item.href} className="flex items-center gap-2.5 cursor-pointer py-2">
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                      <span>{item.label}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/use-cases" className="flex items-center gap-2.5 cursor-pointer py-2 text-primary">
                    <span className="text-xs">{t('nav_view_all_use_cases')}</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Technology */}
            <Link href="/technology">
              <Button variant="ghost" size="sm" className={`text-sm ${location === '/technology' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                {t('nav_technology')}
              </Button>
            </Link>

            {/* Pricing */}
            <Link href="/pricing">
              <Button variant="ghost" size="sm" className={`text-sm ${location === '/pricing' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                {t('nav_pricing')}
              </Button>
            </Link>

            {/* History */}
            {isAuthenticated && (
              <Link href="/history">
                <Button variant="ghost" size="sm" className={`text-sm gap-1.5 ${location === '/history' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                  <History className="w-3.5 h-3.5" />
                  {t('nav_history')}
                </Button>
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Language switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">{currentLang?.nativeName}</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 bg-card border-border max-h-80 overflow-y-auto">
                {LANGUAGES.map((l, i) => (
                  <div key={l.code}>
                    {i > 0 && i % 6 === 0 && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      onClick={() => setLang(l.code)}
                      className={`flex items-center justify-between cursor-pointer ${lang === l.code ? 'text-primary bg-primary/10' : ''}`}
                    >
                      <span className="font-medium">{l.nativeName}</span>
                      <span className="text-xs text-muted-foreground">{l.label}</span>
                    </DropdownMenuItem>
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Auth */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-sm gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                      {user?.name?.[0] || 'U'}
                    </div>
                    <span className="text-muted-foreground max-w-20 truncate">{user?.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-border">
                  <DropdownMenuItem asChild>
                    <Link href="/history" className="flex items-center gap-2 cursor-pointer">
                      <History className="w-4 h-4" /> {t('nav_history')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout.mutate()} className="text-destructive gap-2 cursor-pointer">
                    <LogOut className="w-4 h-4" />
                    {t('nav_logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground text-sm" asChild>
                  <a href={getLoginUrl()}>Sign In</a>
                </Button>
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                  <Link href="/pricing">Get Started</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl max-h-[80vh] overflow-y-auto">
          <div className="container py-4 flex flex-col gap-1">
            <Link href="/" onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">Home</Button>
            </Link>

            <p className="text-xs text-muted-foreground px-3 pt-2 pb-1 uppercase tracking-wider font-medium">Detect</p>
            {detectItems.map(item => (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                  {item.label}
                  {(item as { badge?: string }).badge && <span className="ml-auto text-[9px] text-primary font-bold">{(item as { badge?: string }).badge}</span>}
                </Button>
              </Link>
            ))}

            <p className="text-xs text-muted-foreground px-3 pt-2 pb-1 uppercase tracking-wider font-medium">Solutions</p>
            {solutionsItems.map(item => (
              <Link key={item.href + item.label} href={item.href} onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                  {item.label}
                </Button>
              </Link>
            ))}

            <Link href="/use-cases" onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Use Cases
              </Button>
            </Link>
            <Link href="/technology" onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Cpu className="w-4 h-4 text-primary" />
                {t('nav_technology')}
              </Button>
            </Link>
            <Link href="/pricing" onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                {t('nav_pricing')}
              </Button>
            </Link>
            {isAuthenticated && (
              <Link href="/history" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <History className="w-4 h-4" />
                  {t('nav_history')}
                </Button>
              </Link>
            )}

            <div className="pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1 px-1">
                <Globe className="w-3 h-3" /> Language
              </p>
              <div className="grid grid-cols-3 gap-1">
                {LANGUAGES.map(l => (
                  <Button
                    key={l.code}
                    variant={lang === l.code ? 'default' : 'ghost'}
                    size="sm"
                    className={`text-xs h-8 ${lang === l.code ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                    onClick={() => { setLang(l.code); setMobileOpen(false); }}
                  >
                    {l.nativeName}
                  </Button>
                ))}
              </div>
              {!isAuthenticated && (
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" className="flex-1" asChild>
                    <a href={getLoginUrl()}>Sign In</a>
                  </Button>
                  <Button size="sm" className="flex-1 bg-primary text-primary-foreground" asChild>
                    <Link href="/pricing" onClick={() => setMobileOpen(false)}>Get Started</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
