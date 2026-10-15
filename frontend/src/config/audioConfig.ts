/**
 * Centralized Audio Configuration for Gyan
 * Supports background ambient music, interactive SFX, and educational TTS.
 */

export const AUDIO_CONFIG = {
  volumes: {
    // Background music should remain quiet and non-distracting (15-25% range)
    backgroundMusic: 0.18,
    // SFX should be crisp, pleasant, and audible without being loud
    sfx: 0.65,
    // TTS volume
    tts: 1.0,
    // Ducked background music volume when TTS or SFX is playing
    duckedMusic: 0.04,
  },
  speech: {
    // Deliberate and clear speech rate for dyslexia friendliness (0.60 - 0.70)
    defaultRate: 0.65,
    defaultPitch: 1.1,
  },
  ducking: {
    duckDurationMs: 200,
    unduckDurationMs: 350,
  },
  assets: {
    backgroundMusic: require('../../assets/audio/background/calm_learning_background.wav'),
    sfxTap: require('../../assets/audio/sfx/tap.wav'),
    sfxCorrect: require('../../assets/audio/sfx/correct.wav'),
    sfxWrong: require('../../assets/audio/sfx/wrong.wav'),
    sfxCelebration: require('../../assets/audio/sfx/celebration.wav'),
  },
} as const;
