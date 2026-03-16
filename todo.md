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
