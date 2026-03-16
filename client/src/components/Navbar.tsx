import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Shield, Menu, X, ChevronDown, Globe, LogOut, History, Mic, Video, Camera, AudioLines, Monitor, FileText, Code2, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useLang, LANGUAGES } from '@/contexts/LanguageContext';
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
    { href: '/detect/screen', label: t.nav_screen, icon: Monitor },
    { href: '/detect/text', label: t.nav_text || 'Text Detection', icon: FileText },
  ];

  const toolItems = [
    { href: '/api-console', label: 'API Console', icon: LayoutDashboard },
    { href: '/api-docs', label: t.nav_api || 'API Docs', icon: Code2 },
  ];

  const currentLang = LANGUAGES.find(l => l.code === lang);

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

            {/* Tools Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-sm text-muted-foreground hover:text-foreground gap-1">
                  {t.nav_api || 'API'}
                  <ChevronDown className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48 bg-card border-border">
                {toolItems.map(item => (
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
            {/* Language switcher - multi-language dropdown */}
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
            <div className="pt-2 border-t border-border/50">
              {/* Mobile language grid */}
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
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
                <Button size="sm" className="w-full mt-2 bg-primary text-primary-foreground" asChild>
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
