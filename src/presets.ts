// Opinionated AVIF encoder presets
// Explicit CLI options can still override these values

export const PRESETS = {

  fast: {
    quality: 40,
    speed: 9
  },

  balanced: {
    quality: 50,
    speed: 8
  },

  "high-quality": {
    quality: 80,
    speed: 4
  },

  lossless: {
    quality: 100,
    speed: 1
  }

} as const;

// Valid preset names derived from PRESETS
export type PresetName =
  keyof typeof PRESETS;