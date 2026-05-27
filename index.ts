// Public package surface
//
// This file defines the stable API
// exposed to package consumers.
//
// Internal engine utilities should
// remain private unless there is a
// clear consumer-facing use case.

// Core conversion pipeline
export { convert } from "./src/convert";

// Metadata extraction utilities
export { getAnimationMetadata } from "./src/metadata";

// Public result contracts
export type { ConversionResult } from "./src/result";

// Public metadata contracts
export type { AnimationMetadata } from "./src/metadata";

// Public configuration contracts
export type { ConvertOptions } from "./src/config";

// Public preset names
export type { PresetName } from "./src/presets";
