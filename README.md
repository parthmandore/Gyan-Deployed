# Gyan — Offline-First Educational Mobile Application

## About the Project

Gyan is a multilingual, game-based educational mobile application designed to support children with dyslexia.

The application makes foundational learning more engaging through interactive educational games, visual activities, audio-assisted learning, and progress tracking.

It supports English, Hindi, and Marathi, with a focus on making core learning activities available offline.

Gyan is designed as an educational support tool and is not intended to diagnose dyslexia.

## Problem Statement

Many children who experience difficulties with reading, spelling, and letter recognition may benefit from interactive and multisensory learning approaches.

However, accessible digital learning resources may be limited by language availability, internet requirements, and the need for engaging educational activities.

Gyan aims to address these challenges through multilingual, game-based learning with offline-first functionality.

## Key Features

- **18 Registered Educational Games**: Thoughtfully curated interactive activities covering literacy, numeracy, logic, and perception.
- **Multilingual Support**: Full native support for English, Hindi (हिन्दी), and Marathi (मराठी).
- **Letter & Alphabet Recognition Activities**: Interactive letter identification, confusable letter discrimination, and vowel/matra pairing.
- **Word Matching & Spelling Exercises**: Vocabulary formation, missing letter fill-ins, and categorical word discovery.
- **Number & Mathematics Activities**: Enumeration, basic arithmetic, numerical sequences, and number pattern puzzles.
- **Shape & Colour Recognition**: Perceptual identification and visual-spatial reasoning games.
- **Local Profiles & Learning Progress Persistence**: Self-contained child profile management and session tracking stored locally on-device.
- **XP-Based Feedback & Rewards**: Immediate positive reinforcement, star ratings, and celebratory feedback without penalizing mistakes.
- **Native Text-to-Speech**: Device-native speech synthesis assisting children with auditory pronunciation cues.
- **Background Music & Sound Effects**: Ambient background audio tracks and tactile sound effects with full volume and mute controls.
- **Offline-First Core Gameplay**: Complete independence from network connections or cloud services at runtime.
- **Installable Android APK**: Streamlined standalone build configuration optimized for mobile devices.

## Technology Stack

- **Framework**: React Native (v0.86.3) with Expo (SDK 57)
- **Language**: TypeScript (v6.0.3)
- **Navigation**: React Navigation (Native Stack v7)
- **State Management**: Zustand (v5.0.14)
- **Local Persistence**: `@react-native-async-storage/async-storage` (v2.2.0)
- **Animations & Worklets**: React Native Reanimated (v4.5.1) & React Native Worklets (v0.10.1)
- **UI Components & Icons**: React Native Paper (v5.15.3), Expo Linear Gradient, React Native SVG
- **Internationalization**: `i18next` (v26.3.6), `react-i18next` (v17.0.11), Expo Localization
- **Speech & Audio**: Expo Speech (native TTS), Expo Audio (BGM & SFX playback)
- **Build System**: Expo Application Services (EAS Build)

## Architecture

Gyan follows a client-side offline-first architecture designed for responsiveness and zero external runtime dependencies:

```
┌────────────────────────────────────────────────────────┐
│                   Gyan Mobile Client                   │
├────────────────────────────────────────────────────────┤
│  Navigation Layer                                      │
│  ├── RootNavigator (Language Selection / Profile Gate) │
│  └── GamesNavigator (18 Registered Game Modules)       │
├────────────────────────────────────────────────────────┤
│  UI & Component Layer                                  │
│  ├── CartoonBackground, BigTouchTarget, GameHUD        │
│  ├── ResponsiveContainer, IslandPanel, FriendlyModal   │
│  └── Dyslexia-Optimized Typography & Color Tokens      │
├────────────────────────────────────────────────────────┤
│  State & Persistence Layer                             │
│  ├── useProgressStore (XP, Session History, Mastery)   │
│  ├── childProfileStore (Local Child Profiles)          │
│  ├── appLanguageStore (Mother Tongue & Target Lang)    │
│  └── AsyncStorage Engine (On-Device Storage)           │
├────────────────────────────────────────────────────────┤
│  Audio & Feedback Subsystem                            │
│  ├── Expo Speech (Device-Native Text-to-Speech)        │
│  ├── AudioManager (Local Background Music & Sound FX)  │
│  └── Haptic & Celebration Overlay Orchestration        │
└────────────────────────────────────────────────────────┘
```

## Offline-First Approach

Gyan operates 100% offline without requiring any backend servers, network connections, or external API calls:

- **Zero Runtime Backend Dependency**: All session calculations, scoring, and level progressions are executed purely on the client device.
- **Embedded Game Assets**: All graphical assets, illustrations, and audio files are bundled directly into the application package.
- **Bundled Multilingual Translations**: Full translation dictionaries for English, Hindi, and Marathi are bundled locally via i18next JSON resources.
- **On-Device Speech Synthesis**: Audio prompts utilize device-native speech synthesis engines (`expo-speech`), removing the need for cloud-based speech generation or network streaming.
- **Local Data Persistence**: Child profiles, game session logs, skill mastery scores, and XP progress are saved directly to `AsyncStorage`.

## Android Deployment

The standalone Android build is configured for streamlined distribution:

- **Application ID / Package Name**: `com.parthmandore.gyan`
- **Build Profiles**: Managed via `eas.json` with an internal distribution preview profile configured to generate standalone APKs directly.
- **Permissions Audit**: Android permissions have been audited to strictly include only essential audio playback permissions (`MODIFY_AUDIO_SETTINGS`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK`). Microphone recording permissions (`RECORD_AUDIO`) have been completely removed for this standalone offline release.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/parthmandore/Gyan-Deployed.git
   cd Gyan-Deployed/frontend
   ```

2. Install project dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npx expo start
   ```

4. Run on your desired platform:
   - Press `a` in the terminal to launch on an Android emulator or connected device.
   - Press `w` to run in a web browser.
   - Scan the displayed QR code with the Expo Go mobile app (or an Expo development client).

## Building the APK

To generate a standalone installable Android APK file using Expo Application Services (EAS):

1. Run the build command from the `frontend` directory:
   ```bash
   cd frontend
   npx eas-cli@latest build --platform android --profile preview
   ```

2. The build runs in Expo's cloud build environment using the `preview` profile configured in `frontend/eas.json`, which produces a direct downloadable `.apk` file for testing and installation without requiring Google Play Store publishing.

## Educational Impact

Gyan is specifically designed to accommodate children with dyslexia and diverse language learning needs through targeted multisensory principles:

- **High-Contrast, Calm Visuals**: Clean visual hierarchies, soft pastel backdrops, high-contrast text, and generous spacing minimize visual crowding and cognitive fatigue.
- **Tactile Touch Targets**: Oversized, responsive touch areas provide immediate visual depression and tactile feedback suitable for developing motor skills.
- **Multisensory Reinforcement**: Every activity pairs visual elements with spoken audio cues and sound feedback, facilitating dual-coding cognitive reinforcement.
- **Pacing & Encouragement**: Timers and challenges are relaxed, errors provide encouraging corrective guidance rather than harsh penalties, and achievements celebrate learning effort and persistence.

## Current Status

- Standalone offline deployment version.
- 18 core touch-based educational games fully tested, verified, and functioning without external backend requirements.
- Clean permission configuration and TypeScript validation passing with zero errors.
- Production-ready EAS build configuration targeting `com.parthmandore.gyan`.

## Future Improvements

- Additional regional language translations (e.g., Tamil, Telugu, Bengali).
- On-device accessibility controls for dynamic font scaling and dyslexia-friendly typography toggles.
- Additional game realms and adaptive difficulty levels based on long-term local progress trends.
- Offline printable parent and educator progress summaries.

## License

This project does not currently specify an open-source license. All rights reserved. For inquiries regarding use, distribution, or contributions, please contact the repository owner.
