import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Home from "./pages/Home";
import Navbar from "./components/Navbar";
import AudioDetect from "./pages/AudioDetect";
import VideoDetect from "./pages/VideoDetect";
import CameraDetect from "./pages/CameraDetect";
import MicDetect from "./pages/MicDetect";
import History from './pages/History';
import ScreenDetect from './pages/ScreenDetect';
import TextDetect from './pages/TextDetect';
import ApiDocs from './pages/ApiDocs';
import ApiConsole from './pages/ApiConsole';
import PWAInstallBanner from './components/PWAInstallBanner';
import Pricing from './pages/Pricing';
import ImageDetect from './pages/ImageDetect';
import Technology from './pages/Technology';
import MeetingGuard from './pages/MeetingGuard';
import Extension from './pages/Extension';
import UseCases from './pages/UseCases';
import BatchDetect from './pages/BatchDetect';
import VoiceDetect from './pages/VoiceDetect';

function Router() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PWAInstallBanner />
      <main className="pt-16">
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
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

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
