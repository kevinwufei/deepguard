import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Key, Plus, Trash2, Copy, Eye, EyeOff, BarChart3, Zap, Shield, Globe, Lock, CheckCircle } from 'lucide-react';
import { getLoginUrl } from '@/const';
import Navbar from '@/components/Navbar';
import { useTranslation } from 'react-i18next';

const TIER_CONFIG = {
  free: { label: 'Free', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30', limit: '100 req/day', price: '$0' },
  pro: { label: 'Pro', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', limit: '10,000 req/day', price: '$29/mo' },
  enterprise: { label: 'Enterprise', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', limit: 'Unlimited', price: 'Custom' },
};

export default function ApiConsole() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: keys, refetch } = trpc.apiKeys.list.useQuery(undefined, { enabled: isAuthenticated });
  const { data: stats } = trpc.apiKeys.stats.useQuery(undefined, { enabled: isAuthenticated });

  const createKey = trpc.apiKeys.create.useMutation({
    onSuccess: (data) => {
      setCreatedKey(data.rawKey);
      setNewKeyName('');
      refetch();
      toast.success('API key created! Save it now — it will not be shown again.');
    },
    onError: () => toast.error('Failed to create API key'),
  });

  const revokeKey = trpc.apiKeys.revoke.useMutation({
    onSuccess: () => { refetch(); toast.success('API key revoked'); },
    onError: () => toast.error('Failed to revoke key'),
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-4">
          <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
            <Lock className="w-10 h-10 text-primary" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Sign in to access API Console</h2>
            <p className="text-muted-foreground max-w-md">
              Generate and manage your API keys to integrate DeepGuard detection into your own applications.
            </p>
          </div>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
            <a href={getLoginUrl()}>Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-5xl py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Key className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">{t('api_console_title')}</h1>
          </div>
          <p className="text-muted-foreground">
            Manage your API keys and integrate DeepGuard detection into any application.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats?.totalCalls?.toLocaleString() ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Total API Calls</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <Key className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-2xl font-bold">{keys?.filter(k => k.isActive).length ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Active Keys</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-yellow-400" />
                <div>
                  <p className="text-2xl font-bold">3</p>
                  <p className="text-xs text-muted-foreground">Available Endpoints</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Create Key + Key List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create New Key */}
            <Card className="bg-card border-border/60">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="w-4 h-4 text-primary" />
                  Create New API Key
                </CardTitle>
                <CardDescription>Give your key a descriptive name so you can identify it later.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Label htmlFor="key-name" className="sr-only">Key Name</Label>
                    <Input
                      id="key-name"
                      placeholder="e.g. My App, Production, Testing..."
                      value={newKeyName}
                      onChange={e => setNewKeyName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && newKeyName.trim() && createKey.mutate({ name: newKeyName.trim() })}
                      className="bg-background/50"
                    />
                  </div>
                  <Button
                    onClick={() => createKey.mutate({ name: newKeyName.trim() })}
                    disabled={!newKeyName.trim() || createKey.isPending}
                    className="bg-primary hover:bg-primary/90 shrink-0"
                  >
                    {createKey.isPending ? 'Creating...' : 'Generate Key'}
                  </Button>
                </div>

                {/* Show newly created key */}
                {createdKey && (
                  <div className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-medium text-green-400">Key created — save it now!</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      This key will only be shown once. Copy it and store it securely.
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-background/60 rounded px-3 py-2 font-mono break-all">
                        {showKey ? createdKey : createdKey.slice(0, 16) + '•'.repeat(24)}
                      </code>
                      <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setShowKey(!showKey)}>
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="shrink-0" onClick={() => handleCopy(createdKey)}>
                        {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Key List */}
            <Card className="bg-card border-border/60">
              <CardHeader>
                <CardTitle className="text-base">Your API Keys</CardTitle>
                <CardDescription>{keys?.filter(k => k.isActive).length ?? 0} active key(s)</CardDescription>
              </CardHeader>
              <CardContent>
                {!keys || keys.filter(k => k.isActive).length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <Key className="w-8 h-8 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No active keys yet. Create one above to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {keys.filter(k => k.isActive).map(key => {
                      const tier = TIER_CONFIG[key.tier as keyof typeof TIER_CONFIG] ?? TIER_CONFIG.free;
                      return (
                        <div key={key.id} className="flex items-center justify-between p-3 rounded-lg bg-background/40 border border-border/40 hover:border-border/70 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-1.5 rounded bg-primary/10">
                              <Key className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm truncate">{key.name}</span>
                                <Badge variant="outline" className={`text-xs ${tier.color}`}>{tier.label}</Badge>
                              </div>
                              <div className="flex items-center gap-3 mt-0.5">
                                <code className="text-xs text-muted-foreground font-mono">{key.keyPrefix}••••••••</code>
                                <span className="text-xs text-muted-foreground">{key.usageCount.toLocaleString()} calls</span>
                                <span className="text-xs text-muted-foreground">Limit: {tier.limit}</span>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => {
                              if (confirm(`Revoke key "${key.name}"? This cannot be undone.`)) {
                                revokeKey.mutate({ keyId: key.id });
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Quick Start + Tiers */}
          <div className="space-y-6">
            {/* Quick Start */}
            <Card className="bg-card border-border/60">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  Quick Start
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">Send a POST request with your API key:</p>
                <pre className="text-xs bg-background/60 rounded-lg p-3 overflow-x-auto font-mono leading-relaxed border border-border/40">
{`curl -X POST \\
  https://deepguard.org/api/v1/detect/text \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"text":"Paste text here..."}'`}
                </pre>
                <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                  <a href="/api-docs">View Full API Docs →</a>
                </Button>
              </CardContent>
            </Card>

            {/* Tier Info */}
            <Card className="bg-card border-border/60">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  API Tiers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(TIER_CONFIG).map(([tier, cfg]) => (
                  <div key={tier} className={`p-3 rounded-lg border ${cfg.color}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-sm">{cfg.label}</span>
                      <span className="text-sm font-bold">{cfg.price}</span>
                    </div>
                    <p className="text-xs opacity-80">{cfg.limit}</p>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground pt-1">
                  All keys start as Free tier. Contact us to upgrade.
                </p>
              </CardContent>
            </Card>

            {/* Endpoints */}
            <Card className="bg-card border-border/60">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  Endpoints
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { method: 'POST', path: '/api/v1/detect/text', desc: 'AI text detection' },
                  { method: 'POST', path: '/api/v1/detect/audio', desc: 'Voice deepfake detection' },
                  { method: 'POST', path: '/api/v1/detect/video', desc: 'Video deepfake detection' },
                  { method: 'GET', path: '/api/v1/status', desc: 'API health check' },
                ].map(ep => (
                  <div key={ep.path} className="flex items-start gap-2">
                    <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30 shrink-0 mt-0.5">
                      {ep.method}
                    </Badge>
                    <div>
                      <code className="text-xs font-mono text-foreground/80">{ep.path}</code>
                      <p className="text-xs text-muted-foreground">{ep.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
