import fs from "node:fs";
import path from "node:path";

import type { LogLevel } from "./logger";
import type { ConversionProgressEvent } from "./progress";

import { PRESETS, type PresetName } from "./presets";

/**
 * Fully validated conversion configuration.
 *
 * All defaults have been applied and all
 * values are safe for downstream systems
 * to consume without additional checks.
 */
export type ResolvedConfig = {
  input: string;
  output: string;
  preset?: PresetName;
  quality: number;
  speed: number;
  preserveAlpha: boolean;
  logLevel: LogLevel;
};

/**
 * Public conversion API options.
 *
 * Most fields are optional and will be
 * normalized into a ResolvedConfig.
 */
export type ConvertOptions = {
  input: string;
  output: string;
  preset?: PresetName;
  quality?: number;
  speed?: number;
  preserveAlpha?: boolean;
  logLevel?: LogLevel;

  /**
   * Optional runtime progress events.
   */
  onProgress?: (event: ConversionProgressEvent) => void;
};

/**
 * Ensure a numeric option falls within a
 * supported encoder range.
 */
function assertInRange(value: number, min: number, max: number, name: string) {
  if (value < min || value > max) {
    throw new Error(`${name} must be between ${min} and ${max}.`);
  }
}

/**
 * Validate filesystem assumptions before
 * conversion begins.
 *
 * Failing early produces clearer errors and
 * avoids expensive downstream work.
 */
function validateFilesystem(input: string, output: string) {
  /**
   * Input must exist.
   */
  if (!fs.existsSync(input)) {
    throw new Error(`Input file does not exist: ${input}`);
  }

  /**
   * Input must be a regular file.
   */
  const inputStats = fs.statSync(input);

  if (!inputStats.isFile()) {
    throw new Error(`Input path is not a file: ${input}`);
  }

  /**
   * Output directory must already exist.
   *
   * Directory creation is intentionally left
   * to the caller.
   */
  const outputDirectory = path.dirname(output);

  if (!fs.existsSync(outputDirectory)) {
    throw new Error(`Output directory does not exist: ${outputDirectory}`);
  }

  /**
   * Prevent accidental self-overwrites.
   */
  const resolvedInput = path.resolve(input);
  const resolvedOutput = path.resolve(output);

  if (resolvedInput === resolvedOutput) {
    throw new Error("Input and output paths cannot be the same.");
  }
}

/**
 * Normalize user-provided options into a
 * fully validated ResolvedConfig.
 */
export function resolveConfig(options: ConvertOptions): ResolvedConfig {
  const {
    input,
    output,
    preset,
    preserveAlpha = true,
    logLevel = "normal",
  } = options;

  /**
   * Basic path validation.
   */
  if (!input.trim()) {
    throw new Error("Input path is required.");
  }

  if (!output.trim()) {
    throw new Error("Output path is required.");
  }

  /**
   * Validate filesystem assumptions before
   * any conversion work begins.
   */
  validateFilesystem(input, output);

  /**
   * Validate preset names before lookup.
   */
  if (preset && !(preset in PRESETS)) {
    throw new Error(`Unknown preset: ${preset}`);
  }

  const presetConfig = preset ? PRESETS[preset] : undefined;

  /**
   * Resolution order:
   *
   * 1. Explicit option
   * 2. Preset default
   * 3. Library default
   */
  const quality = options.quality ?? presetConfig?.quality ?? 50;

  const speed = options.speed ?? presetConfig?.speed ?? 8;

  /**
   * Guard against invalid encoder settings.
   */
  assertInRange(quality, 0, 100, "Quality");
  assertInRange(speed, 0, 10, "Speed");

  /**
   * Downstream systems can trust this object
   * without additional validation.
   */
  return {
    input,
    output,

    preset,

    quality,
    speed,

    preserveAlpha,
    logLevel,
  };
}
