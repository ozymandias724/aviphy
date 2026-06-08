/// <reference types="node" />

import { convert } from "./convert";

import type { PresetName } from "./presets";
import { createLogger, type LogLevel } from "./logger";

import { formatBytes, formatDuration, formatReduction } from "./format";

/**
 * Thin CLI wrapper around the conversion engine.
 *
 * Responsible for:
 * - Parsing command-line arguments
 * - Invoking the conversion engine
 * - Formatting human-readable output
 */

const input = process.argv[2];
const output = process.argv[3];

if (!input || !output) {
  console.error("Usage: bun run src/cli.ts <input> <output> [options]");

  process.exit(1);
}

/**
 * Read a numeric flag from argv.
 *
 * Example:
 * --quality 80
 */
function getNumberFlag(flag: string, fallback: number) {
  const index = process.argv.indexOf(flag);

  if (index === -1) {
    return fallback;
  }

  const value = Number(process.argv[index + 1]);

  return Number.isNaN(value) ? fallback : value;
}

/**
 * Read a string flag from argv.
 *
 * Example:
 * --preset web
 */
function getStringFlag(flag: string) {
  const index = process.argv.indexOf(flag);

  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

/**
 * Logging verbosity.
 */
let logLevel: LogLevel = "normal";

if (process.argv.includes("--debug")) {
  logLevel = "debug";
}

const logger = createLogger(logLevel);

/**
 * Conversion options.
 */
const preserveAlpha = !process.argv.includes("--no-alpha");

const quality = getNumberFlag("--quality", 50);

const speed = getNumberFlag("--speed", 8);

/**
 * Config validation occurs downstream.
 */
const preset = getStringFlag("--preset") as PresetName | undefined;

logger.debug("CLI options", {
  input,
  output,
  preset,
  quality,
  speed,
  preserveAlpha,
  logLevel,
});

/**
 * Execute conversion engine.
 */
const result = await convert({
  input,
  output,

  preset,

  quality,
  speed,

  preserveAlpha,
  logLevel,
});

logger.log("\nConversion complete.\n");

/**
 * Present structured conversion results.
 */
logger.log({
  frames: result.sourceFrameCount,

  inputSize: formatBytes(result.inputSize),

  outputSize: formatBytes(result.outputSize),

  reduction: formatReduction(result.reductionPercent),

  duration: formatDuration(result.durationMs),
});
