# Gyan — Architecture & Developer Documentation

## Overview
**Gyan** is an offline-first, multilingual, game-based learning application for young children (ages 5–7), specifically engineered to support phonological processing, visual comfort, and early cognitive development for children with dyslexia and diverse language backgrounds.

Gyan unifies **18 standalone interactive educational games**, an offline XP and mastery engine, and an offline-resilient child dashboard into a single cohesive application.

---

## Key Architecture & Features

### 1. Child Profile & Dual-Language Onboarding (`SignUpProfileScreen`)
- **Child Buddy Avatars**: 6 friendly animal companions (🦁 Brave Lion, 🐘 Wise Elephant, 🐵 Playful Monkey, 🦊 Clever Fox, 🦉 Curious Owl, 🐼 Gentle Panda).
- **Dual-Language Model**:
  - **Mother Tongue (UI & Spoken Voice Guide)**: English, हिन्दी, or मराठी.
  - **Learning Language (Target Vocabulary & Phonetics)**: English, हिन्दी, or मराठी.
- **Age Adaptive**: Levels tailored for Age 5, 6, and 7.

### 2. Child Dashboard (`ChildDashboardScreen`)
Research-backed interface answering key questions for young learners:
- **Where am I?**: Child header with avatar, level badge (e.g. "Level 1 Curious Explorer"), and level XP progress bar.
- **What have I achieved?**:
  - **Today's Journey**: Daily adventure map for guided activities.
  - **Skill Mastery Map**: Letters & Phonics, Reading & Words, Vocabulary, Mathematics, Grammar & Syntax, Reasoning & Logic, and Shapes & Colours.
  - **Badges & Trophies Gallery**: Interactive achievement badges with tap-to-celebrate modals.
  - **Gentle Daily Goal**: Daily micro-activities with star meter.
  - **Recent Adventures Feed**: History of games played with accuracy and XP earned.
- **What should I do next?**:
  - **Personalized Recommended Quest**: Dynamically evaluates the child's skill performance and age, presenting an intuitive hero card that immediately launches the next optimal game.

### 3. 100% Offline-First Resilience
- Fully self-contained on-device storage using `AsyncStorage`.
- No external runtime servers, APIs, or cloud speech processing required.
- Device-native text-to-speech powered by `expo-speech` with local asset audio playback powered by `expo-audio`.

---

## 18 Registered Educational Games Included
1. **AlphabetMatching** — Spatial grid letter pairing with confusable prevention
2. **CapitalSmallMatch** — Upper/lower case matching
3. **VowelMatraMatch** — Multilingual vowel and matra pairing
4. **LetterTracing** — Handwriting and stroke canvas
5. **MathChallenge** — Mental arithmetic challenges
6. **AptitudeChallenge** — Pattern recognition and reasoning
7. **GrammarChallenge** — Sentence and syntax exercises
8. **ColourChallenge** — Color recognition and identification
9. **ShapeChallenge** — Geometry and shape recognition
10. **MissingLetters** — Letter sequencing and word completion
11. **MissingLetterWords** — Vocabulary fill-in-the-blank
12. **MissingNumbers** — Numerical sequencing
13. **NumberCounting** — Visual object enumeration
14. **OddWordOut** — Categorical discrimination
15. **PutInOrder** — Sequencing and ordering
16. **GuessTheShape** — Clue-based silhouette guessing
17. **LanguagePairMatch** — Bilingual word pairing
18. **FindTheCorrectWord** — Vocabulary identification

---

## Running the Frontend Application

From `Gyan_deployment/frontend`:
```bash
npm install
npx expo start
```
- Press `a` for Android (emulator or physical device)
- Press `w` for Web
- Scan QR code using Expo Go on a mobile device

## Building Standalone Android APK

From `Gyan_deployment/frontend`:
```bash
npx eas-cli@latest build --platform android --profile preview
```
