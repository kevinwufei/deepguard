import { useParams, Link } from "wouter";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Shield, AlertTriangle, CheckCircle, ExternalLink, Share2, Eye, Clock, FileType } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SharedReport() {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation();

  const { data: report, isLoading, error } = trpc.reports.get.useQuery(
    { token: token ?? "" },
    { enabled: !!token }
  );

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: t("report_public_title") + ", url" });
    } else {
      await navigator.clipboard.writeText(url);
      alert(t("share_link_copied"));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">{t("report_loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">{t("report_not_found")}</h1>
          <p className="text-gray-400 mb-6">{t("report_not_found_desc")}</p>
          <Link href="/">
            <Button className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold">
              {t("go_home")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const verdictConfig = {
    safe: { color: "text-green-400", bg: "bg-green-500/10 border-green-500/30", icon: CheckCircle, label: t("verdict_safe"), badgeClass: "bg-green-500/20 text-green-400 border-green-500/30" },
    suspicious: { color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30", icon: AlertTriangle, label: t("verdict_suspicious"), badgeClass: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    deepfake: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", icon: AlertTriangle, label: t("verdict_deepfake"), badgeClass: "bg-red-500/20 text-red-400 border-red-500/30" },
  };

  const vc = verdictConfig[report.verdict as keyof typeof verdictConfig] || verdictConfig.safe;
  const VerdictIcon = vc.icon;

  const analysisData = (() => {
    try {
      return report.analysisReport ? JSON.parse(report.analysisReport) : null;
    } catch {
      return null;
    }
  })();

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0d0d14]/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Shield className="w-6 h-6 text-cyan-400" />
            <span className="font-bold text-lg">DeepGuard</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-gray-400">
              <Eye className="w-4 h-4" />
              <span>{report.viewCount} {t("views")}</span>
            </div>
            <Button
              onClick={handleShare}
              variant="outline"
              size="sm"
              className="border-white/20 text-gray-300 hover:text-white hover:border-white/40 bg-transparent"
            >
              <Share2 className="w-4 h-4 mr-1.5" />
              {t("share")}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Verified badge */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-3 py-1 text-xs text-cyan-400">
            <Shield className="w-3.5 h-3.5" />
            <span>{t("report_verified_by")}</span>
          </div>
          <span className="text-xs text-gray-500">
            {new Date(report.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>

        {/* Main verdict card */}
        <Card className={`border ${vc.bg} bg-transparent mb-6`}>
          <CardContent className="p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 ${vc.bg}`}>
                <VerdictIcon className={`w-10 h-10 ${vc.color}`} />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className={`text-3xl font-bold ${vc.color}`}>{vc.label}</h1>
                  <Badge className={`text-sm px-3 py-1 border ${vc.badgeClass}`}>
                    {report.riskScore}% {t("ai_probability")}
                  </Badge>
                </div>
                <p className="text-gray-400 text-sm">
                  {analysisData?.summary || (t("report_summary_default"))}
                </p>
              </div>
            </div>

            {/* Risk meter */}
            <div className="mt-6">
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>{t("real")}</span>
                <span>{t("ai_generated")}</span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    report.riskScore >= 66 ? "bg-gradient-to-r from-orange-500 to-red-500" :
                    report.riskScore >= 36 ? "bg-gradient-to-r from-yellow-500 to-orange-500" :
                    "bg-gradient-to-r from-green-500 to-cyan-500"
                  }`}
                  style={{ width: `${report.riskScore}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File info + analysis grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Card className="border border-white/10 bg-white/[0.03]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400 font-medium flex items-center gap-2">
                <FileType className="w-4 h-4" />
                {t("file_info")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t("file_name")}</span>
                <span className="text-white truncate max-w-[160px]">{report.fileName || "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t("content_type")}</span>
                <span className="text-white capitalize">{report.type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t("analyzed_on")}</span>
                <span className="text-white">{new Date(report.createdAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-white/10 bg-white/[0.03]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400 font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {t("detection_summary")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t("risk_score")}</span>
                <span className={`font-semibold ${vc.color}`}>{report.riskScore}/100</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t("verdict")}</span>
                <Badge className={`text-xs border ${vc.badgeClass}`}>{vc.label}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t("report_views")}</span>
                <span className="text-white">{report.viewCount}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Engine breakdown if available */}
        {analysisData?.engineBreakdown && (
          <Card className="border border-white/10 bg-white/[0.03] mb-6">
            <CardHeader>
              <CardTitle className="text-sm text-gray-400 font-medium">
                {t("engine_breakdown")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analysisData.engineBreakdown.map((engine: { engine: string; score: number; available: boolean }) => (
                <div key={engine.engine}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className={engine.available ? "text-white" : "text-gray-600"}>{engine.engine}</span>
                    <span className={engine.available ? "text-cyan-400" : "text-gray-600"}>
                      {engine.available ? `${engine.score}%` : (t("unavailable"))}
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${engine.available ? "bg-cyan-500" : "bg-white/10"}`}
                      style={{ width: engine.available ? `${engine.score}%` : "0%" }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* CTA */}
        <div className="text-center py-8 border-t border-white/10">
          <p className="text-gray-400 mb-4 text-sm">
            {t("shared_report_cta")}
          </p>
          <Link href="/">
            <Button className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-8">
              <Shield className="w-4 h-4 mr-2" />
              {t("try_deepguard")}
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
