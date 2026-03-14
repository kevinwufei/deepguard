import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Shield, Menu, X, ChevronDown, Globe, LogOut, History, Mic, Video, Camera, AudioLines } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useLang } from '@/contexts/LanguageContext';
import { useAuth } from '@/_core/hooks/useAuth';
import { getLoginUrl } from '@/const';
import { trpc } from '@/lib/trpc';

export default function Navbar() {
  const { t, lang, setLang } = useLang();
  const { user, isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => window.location.href = '/',
  });

  const detectItems = [
    { href: '/detect/audio', label: t.nav_audio, icon: AudioLines },
    { href: '/detect/video', label: t.nav_video, icon: Video },
    { href: '/detect/camera', label: t.nav_camera, icon: Camera },
    { href: '/detect/microphone', label: t.nav_microphone, icon: Mic },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <Shield className="w-7 h-7 text-primary group-hover:scale-110 transition-transform" />
              <div className="absolute inset-0 bg-primary/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <span className="text-lg font-bold text-foreground tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Deep<span className="text-primary">Guard</span>
              </span>
              <p className="text-[10px] text-muted-foreground leading-none hidden sm:block">{t.nav_tagline}</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/">
              <Button variant="ghost" size="sm" className={`text-sm ${location === '/' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                {t.nav_home}
              </Button>
            </Link>

            {/* Detect Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-sm text-muted-foreground hover:text-foreground gap-1">
                  {t.nav_detect}
                  <ChevronDown className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48 bg-card border-border">
                {detectItems.map(item => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href} className="flex items-center gap-2 cursor-pointer">
                      <item.icon className="w-4 h-4 text-primary" />
                      <span>{item.label}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/history">
              <Button variant="ghost" size="sm" className={`text-sm gap-1.5 ${location === '/history' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                <History className="w-3.5 h-3.5" />
                {t.nav_history}
              </Button>
            </Link>
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-2">
            {/* Language switcher */}
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground gap-1.5"
              onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">{lang === 'zh' ? 'EN' : '中文'}</span>
            </Button>

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
                  <DropdownMenuItem onClick={() => logout.mutate()} className="text-destructive gap-2 cursor-pointer">
                    <LogOut className="w-4 h-4" />
                    {t.nav_logout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan" asChild>
                <a href={getLoginUrl()}>{t.nav_login}</a>
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl">
          <div className="container py-4 flex flex-col gap-1">
            <Link href="/" onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">{t.nav_home}</Button>
            </Link>
            {detectItems.map(item => (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <item.icon className="w-4 h-4 text-primary" />
                  {item.label}
                </Button>
              </Link>
            ))}
            <Link href="/history" onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <History className="w-4 h-4" />
                {t.nav_history}
              </Button>
            </Link>
            <div className="flex items-center gap-2 pt-2 border-t border-border/50">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={() => { setLang(lang === 'zh' ? 'en' : 'zh'); setMobileOpen(false); }}
              >
                <Globe className="w-4 h-4" />
                {lang === 'zh' ? 'EN' : '中文'}
              </Button>
              {!isAuthenticated && (
                <Button size="sm" className="bg-primary text-primary-foreground" asChild>
                  <a href={getLoginUrl()}>{t.nav_login}</a>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
