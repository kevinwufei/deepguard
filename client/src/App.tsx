import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Navbar from "./components/Navbar";
import PWAInstallBanner from './components/PWAInstallBanner';

// ── Lazy-loaded pages (code splitting) ──────────────────────────
const Home = lazy(() => import("./pages/Home"));
const AudioDetect = lazy(() => import("./pages/AudioDetect"));
const VideoDetect = lazy(() => import("./pages/VideoDetect"));
const CameraDetect = lazy(() => import("./pages/CameraDetect"));
const MicDetect = lazy(() => import("./pages/MicDetect"));
const History = lazy(() => import("./pages/History"));
const ScreenDetect = lazy(() => import("./pages/ScreenDetect"));
const TextDetect = lazy(() => import("./pages/TextDetect"));
const ApiDocs = lazy(() => import("./pages/ApiDocs"));
const ApiConsole = lazy(() => import("./pages/ApiConsole"));
const Pricing = lazy(() => import("./pages/Pricing"));
const ImageDetect = lazy(() => import("./pages/ImageDetect"));
const Technology = lazy(() => import("./pages/Technology"));
const MeetingGuard = lazy(() => import("./pages/MeetingGuard"));
const Extension = lazy(() => import("./pages/Extension"));
const UseCases = lazy(() => import("./pages/UseCases"));
const BatchDetect = lazy(() => import("./pages/BatchDetect"));
const VoiceDetect = lazy(() => import("./pages/VoiceDetect"));
const TrainingData = lazy(() => import("./pages/TrainingData"));
const SharedReport = lazy(() => import("./pages/SharedReport"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));

// Minimal loading spinner for lazy routes
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Public report page — no navbar */}
        <Route path="/report/:token">
          <Suspense fallback={<PageLoader />}>
            <SharedReport />
          </Suspense>
        </Route>
        {/* All other routes with navbar */}
        <Route>
          <div className="min-h-screen bg-background">
            <Navbar />
            <PWAInstallBanner />
            <main className="pt-16">
              <Suspense fallback={<PageLoader />}>
                <Switch>
                  <Route path="/" component={Home} />
                  <Route path="/detect/audio" component={AudioDetect} />
                  <Route path="/detect/video" component={VideoDetect} />
                  <Route path="/detect/camera" component={CameraDetect} />
                  <Route path="/detect/microphone" component={MicDetect} />
                  <Route path="/history" component={History} />
                  <Route path="/detect/screen" component={ScreenDetect} />
                  <Route path="/detect/text" component={TextDetect} />
                  <Route path="/api-console" component={ApiConsole} />
                  <Route path="/api-docs" component={ApiDocs} />
                  <Route path="/pricing" component={Pricing} />
                  <Route path="/detect/image" component={ImageDetect} />
                  <Route path="/technology" component={Technology} />
                  <Route path="/meeting-guard" component={MeetingGuard} />
                  <Route path="/extension" component={Extension} />
                  <Route path="/use-cases" component={UseCases} />
                  <Route path="/batch" component={BatchDetect} />
                  <Route path="/detect/voice" component={VoiceDetect} />
                  <Route path="/admin/training-data" component={TrainingData} />
                  <Route path="/about" component={AboutUs} />
                  <Route path="/privacy" component={Privacy} />
                  <Route path="/terms" component={Terms} />
                  <Route path="/404" component={NotFound} />
                  <Route component={NotFound} />
                </Switch>
              </Suspense>
            </main>
          </div>
        </Route>
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
