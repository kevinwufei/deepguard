# DeepGuard - AI Deepfake Detection Platform TODO

## Phase 1: Project Setup & Database
- [x] Initialize project with web-db-user scaffold
- [x] Design and create detection_records database table
- [x] Set up i18n language context (zh/en)

## Phase 2: Global Style & Layout
- [x] Dark tech theme with cyan/blue accent colors in index.css
- [x] Responsive top navigation with logo, nav links, language switcher, auth
- [x] Landing page hero section with key stats
- [x] Feature cards section on landing page
- [x] Footer

## Phase 3: File Upload Detection
- [x] Audio upload detection page (/detect/audio)
- [x] Video upload detection page (/detect/video)
- [x] File upload component with drag-and-drop
- [x] AI analysis via LLM (audio/video deepfake analysis)
- [x] Risk score display (0-100) with animated gauge
- [x] Detailed analysis report (anomaly features, confidence)
- [x] Save detection result to database

## Phase 4: Real-time Detection
- [x] Real-time camera detection page (/detect/camera)
- [x] Real-time microphone detection page (/detect/microphone)
- [x] Browser camera/mic permission handling
- [x] Frame capture and periodic AI analysis
- [x] Live risk score updating

## Phase 5: History & i18n
- [x] Detection history page (/history)
- [x] History table with filename, time, score, type
- [x] Language switcher (zh/en) in navbar
- [x] Full i18n for all UI text

## Phase 6: Polish & Delivery
- [x] Responsive design verification (mobile/tablet/desktop)
- [x] Loading states and error handling
- [x] Vitest unit tests
- [x] Final checkpoint and delivery

## Phase 7: Screen Share Detection & App Planning
- [x] Screen share detection page (/detect/screen) with getDisplayMedia API
- [x] Backend API for screen frame analysis (analyzeScreenFrame)
- [x] Live risk score overlay during screen share session
- [ ] Plugin/extension download guide page (/extension)
- [x] Update navbar to include screen detection entry
- [x] Mobile App technical planning document

## Phase 8: PWA Upgrade
- [x] manifest.json with icons and theme
- [x] Service Worker for offline support
- [x] PWA install prompt banner
- [x] Mobile viewport and touch optimizations
- [x] iOS Safari meta tags

## Phase 9: React Native App Code
- [x] Project scaffold and structure
- [x] Navigation and routing
- [x] All detection pages (audio/video/camera/mic/screen)
- [x] API integration with DeepGuard backend
- [x] i18n (zh/en)
- [x] Detection history page
- [x] README for developers

## Phase 10: SEO Fixes
- [x] Fix page title to be 30-60 characters
- [x] Add keywords meta tag to homepage
- [x] Add/improve description meta tag

## Phase 11: Multi-language Support
- [x] Add Hindi (hi) translations
- [x] Add Spanish (es) translations
- [x] Add French (fr) translations
- [x] Add Arabic (ar) translations + RTL support
- [x] Add Russian (ru) translations
- [x] Add Portuguese (pt) translations
- [x] Add Polish (pl) translations
- [x] Add German (de) translations
- [x] Add Korean (ko) translations
- [x] Add Japanese (ja) translations
- [x] Add Turkish (tr) translations
- [x] Update language switcher UI to support 13 languages dropdown

## Phase 12: Major Platform Upgrade

### Homepage Redesign
- [x] Four detection entry cards (Image, Video, Audio, Text)
- [x] Credibility/accuracy stats section (94% accuracy, 2M dataset, etc.)
- [x] Reposition hero copy: "Detect if images, videos, audio or text are AI generated"
- [x] Supported AI models showcase (Midjourney, DALL-E, FaceSwap, etc.)

### Text AI Detection
- [x] New text detection page (/detect/text)
- [x] Paste text input with word count
- [x] Multi-model detection display (GPT detector, BERT detector, etc.)
- [x] Sentence-level AI probability highlighting
- [x] AI probability score + confidence score output

### Multi-Model Detection Architecture
- [x] Detector 1: General AI detection
- [x] Detector 2: Diffusion/GAN detection
- [x] Detector 3: Deepfake face detection
- [x] Detector 4: Watermark/metadata detection
- [x] Combined confidence score output

### Enhanced Audio/Video Detection
- [x] AI source identification (FaceSwap, DeepFaceLab, Midjourney, etc.)
- [x] Video frame-by-frame timeline with AI probability curve
- [x] Metadata extraction display (Software, Seed, Sampler)
- [x] Face anomaly details (lip sync, blink pattern, face mismatch)
- [x] PDF report download for detection results

### New Pages
- [x] API documentation page (/api-docs) with endpoint examples
- [x] Identity verification page (/verify) - real person detection
- [ ] Chrome extension guide page (/extension)

### Trust & Credibility
- [x] Model accuracy stats on homepage (94% accuracy, 2.1% false positive)
- [x] Training dataset badges (LAION, FaceForensics++, DFDC)

## Phase 13: Public API System
- [ ] Remove live person verification page and navbar entry
- [ ] Create api_keys database table (key, userId, name, tier, usageCount, rateLimit, active)
- [ ] Create api_usage_logs table (keyId, endpoint, timestamp, status)
- [ ] Build REST API endpoints: POST /api/v1/detect/audio, /detect/video, /detect/text
- [ ] API Key authentication middleware
- [ ] API Console page (/api-console): generate/revoke keys, view usage stats
- [ ] Upgrade API docs page with real endpoint examples and SDK code snippets
- [ ] Rate limiting by tier (Free: 100/day, Pro: 10000/day)

## Phase 14: Default Language & API Console
- [x] Change default language from zh to en
- [x] Create ApiConsole page (API key management dashboard)
- [x] Fix TypeScript compile error (missing ApiConsole module)
- [x] Increase max file upload size to 5GB (server body limit + frontend validation)

## Phase 15: Fix Video Detection & API Architecture
- [ ] Diagnose video upload detection failure
- [ ] Fix video detection pipeline
- [ ] Evaluate and integrate third-party deepfake detection APIs
- [ ] Document detection system architecture for user

## Phase 15: Fix Video Detection & API Clarification
- [ ] Fix video upload: replace base64 with direct multipart/form-data upload to avoid browser memory crash
- [ ] Fix server: accept multipart upload and stream directly to S3
- [ ] Show proper progress bar during large file upload
- [ ] Fix default maxSizeMB display in UI (show 5GB not 50MB)
- [ ] Upgrade API docs page with real working examples

## Phase 16: Major UX & Trust Upgrade
- [ ] Redesign homepage: instant demo drag-drop upload + strong value prop headline
- [ ] Add supported AI models showcase (Midjourney, SD, DALL-E, FaceSwap, etc.)
- [ ] Add accuracy stats prominently (95%+, 2M dataset, etc.)
- [ ] Add Pricing page (/pricing) with 4 tiers: Free / Pro $13.99 / Business $49 / Enterprise
- [ ] Add Technology/Trust page (/technology) with benchmarks, datasets, methodology
- [ ] Add Use Cases page (/use-cases) with journalist, law enforcement, dating, KYC scenarios
- [ ] Upgrade detection result with Heatmap visualization (canvas-based region highlighting)
- [ ] Add anomaly explanation text (why it's flagged as AI)
- [ ] Add batch detection page (/detect/batch) for uploading multiple files
- [ ] Update Navbar with Pricing, Technology, Use Cases links

## Phase 17: Competitor Analysis Upgrades (Sensity.ai + UncovAI)

### Image Detection + Forensics (Sensity.ai inspired)
- [ ] Image deepfake detection page (/detect/image) with pixel-level heatmap canvas
- [ ] File forensic analysis tab in results (EXIF, metadata, modification history)
- [ ] PDF forensic report export (court-ready, with DeepGuard branding)
- [ ] Bounding box overlay on detected face regions
- [ ] analyzeImage tRPC procedure in server/routers.ts
- [ ] GAN face detection (entirely synthetic faces)
- [ ] Acoustic waveform visualization for audio analysis

### New Solution Pages (UncovAI inspired)
- [ ] Zoom/Teams Meeting Bot page (/solutions/meetings)
- [ ] Browser Extension page (/solutions/browser-extension)
- [ ] WhatsApp Bot page (/solutions/whatsapp)
- [ ] URL/Phishing detection page (/detect/url)

### Use Case Pages
- [ ] CEO Fraud Detection use case (/use-cases/ceo-fraud)
- [ ] HR Scam Detection use case (/use-cases/hr-scam)
- [ ] Law Enforcement / Government use case (/use-cases/government)

### Technology Page
- [ ] Technology & Benchmarks page (/technology) with multilayer stack diagram
- [ ] Accuracy metrics (98% claim, dataset sizes, false positive rates)
- [ ] Detection methodology explanation (pixel + voice + file forensics)

### Homepage Redesign
- [ ] Instant demo upload area on homepage (drag & drop)
- [ ] CEO Fraud / HR Scam use case cards
- [ ] Multilayer detection architecture diagram
- [ ] Press/media coverage logos section
- [ ] Competitor comparison table

### Batch Detection
- [ ] Batch detection page (/detect/batch)

### Navigation Updates
- [ ] Update Navbar with new pages (Solutions dropdown, Use Cases, Technology, Pricing)
- [ ] Update App.tsx routes for all new pages
- [ ] Save checkpoint and deliver

## Phase 18: Competitor Analysis Completion & Full Platform Delivery
- [x] Pricing page updated (Pro $19, Business $49, Enterprise $199, meeting single-session $4.99)
- [x] Image detection page with pixel-level Heatmap canvas + EXIF forensics + PDF report
- [x] analyzeImage tRPC procedure added to server/routers.ts
- [x] Technology credibility page (/technology) with benchmarks, datasets, model architecture
- [x] Meeting Guard page (/meeting-guard) - Zoom/Teams real-time detection
- [x] Browser Extension page (/extension) - Chrome extension marketing
- [x] Use Cases page (/use-cases) - CEO fraud, HR scam, media, legal, government
- [x] Batch Detection page (/batch) - enterprise bulk upload with CSV export
- [x] Homepage revamp - instant demo upload widget, competitor comparison table, how-it-works, footer
- [x] Navbar upgraded - Detect/Solutions/Use Cases dropdowns, Technology, Pricing, Get Started CTA
- [x] All routes registered in App.tsx
- [x] 12 vitest tests passing (auth + detection + new pages)
- [x] Cost analysis: Pro $19 = 91% margin, Business $49 = 82% margin, meeting $4.99/session = 42% margin

## Phase 19: Resemble AI + Truly Analysis & Bug Fixes
- [x] Research Resemble AI and Truly features and tech stack
- [x] Fix video upload 413 error (chunked upload 6MB per chunk via /api/upload/chunk)
- [x] Fix mobile homepage layout/typography issues (responsive text, centered layout)
- [x] Add VoiceDetect page (/detect/voice) - real-time microphone analysis with waveform
- [x] Add Zero-Trust section to MeetingGuard (facial biometrics, device fingerprinting, network intel)
- [x] Add Voice Deepfake to Navbar Detect dropdown with LIVE badge
- [x] Register /detect/voice route in App.tsx
- [x] All 12 tests passing

## Phase 20: Multi-Engine Detection Accuracy Upgrade
- [x] Research third-party detection APIs (Hive, SightEngine, AI or Not, Illuminarty)
- [x] Upgrade image detection to multi-engine: SightEngine + Illuminarty + LLM weighted average
- [x] Upgrade video/audio detection with stricter LLM prompts (high sensitivity mode)
- [x] Show per-engine scores in detection result UI for transparency
- [x] All 12 tests passing

## Phase 21: SightEngine + Illuminarty Real API Integration
- [x] Store SIGHTENGINE_API_USER + SIGHTENGINE_API_SECRET via webdev_request_secrets
- [x] Store ILLUMINARTY_API_KEY via webdev_request_secrets
- [x] sightEngineDetect already uses env vars correctly (verified working)
- [x] Fix illuminartyDetect to use correct endpoint /detect (was /v1/detection)
- [x] Add graceful empty-body handling for Illuminarty (returns null, weights redistribute)
- [x] SightEngine test: real photo scores 0.04 (4%) - correctly identifies as NOT AI
- [x] Illuminarty test: API key valid, 200 OK
- [x] All 16 tests passing (4 test files)
- [x] Save checkpoint

## Phase 22: User Feedback + CLIP Model Training
- [x] Add userFeedback + feedbackLabel + feedbackNote + feedbackAt columns to detection_records table
- [x] Add submitDetectionFeedback + getTrainingData + getFeedbackStats helpers to db.ts
- [x] Add feedback.submit + trainingData.stats + trainingData.export tRPC procedures
- [x] Create FeedbackWidget component (correct/incorrect/unsure + ground truth label + optional note)
- [x] Integrate FeedbackWidget into ImageDetect result page (shows when recordId is returned)
- [x] analyzeImage mutation now returns recordId for feedback linking
- [x] Create /admin/training-data page (stats, progress bar, CSV/JSON export, schema docs)
- [x] Create model-training/train_clip_detector.py (CLIP ViT-B/32 fine-tuning, 4 unfrozen layers)
- [x] Create model-training/inference.py (single image prediction script)
- [x] Create model-training/README.md (full training guide, cost estimates, HF Hub deployment)
- [x] Create model-training/requirements.txt
- [x] All 16 tests passing (TypeScript 0 errors)
- [x] Save checkpoint
