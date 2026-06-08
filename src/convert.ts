/// <reference types="node" />

import fs from "node:fs";

import { createLogger } from "./logger";
import { resolveConfig } from "./config";
import { getAnimationMetadata } from "./metadata";
import { extractFrame } from "./frame";
import { buildY4MHeader, writeFrame, expandFrameTimings } from "./y4m";
import { createAvifEncoder } from "./avifenc";

import type { ConvertOptions } from "./config";
import type { AnimationFrame } from "./frame";
import type { ConversionResult } from "./result";

/**
 * Main animated image → AVIF conversion pipeline.
 */
export async function convert(
  options: ConvertOptions,
): Promise<ConversionResult> {
  /**
   * Normalize and validate user configuration.
   */
  const { input, output, preset, quality, speed, preserveAlpha, logLevel } =
    resolveConfig(options);

  /**
   * Runtime callbacks are not configuration.
   */
  const { onProgress } = options;

  const logger = createLogger(logLevel);

  /**
   * Track total conversion duration.
   */
  const startTime = performance.now();

  /**
   * Capture original input size for reporting.
   */
  const inputSize = typeof input === "string"
    ? fs.statSync(input).size
    : input.length;

  logger.log("Loading animation metadata...");

  onProgress?.({
    type: "stage",
    stage: "metadata",
  });

  const metadata = await getAnimationMetadata(input);

  logger.debug("Animation metadata:");
  logger.debug(metadata);

  /**
   * Respect source alpha unless explicitly disabled.
   */
  const hasAlpha = metadata.hasAlpha && preserveAlpha;

  logger.log("Conversion settings:");
  logger.log({
    source: {
      frames: metadata.pages,
      resolution: `${metadata.width}x${metadata.height}`,
      sourceAlpha: metadata.hasAlpha,
      encodingAlpha: hasAlpha,
    },

    encoding: {
      preset: preset ?? "custom",
      quality,
      speed,
    },
  });

  logger.log("Launching AVIF encoder...");

  const avifenc = createAvifEncoder({
    output,
    quality,
    speed,
    logLevel,
  });

  /**
   * Build the Y4M stream header consumed by avifenc.
   */
  const header = buildY4MHeader({
    width: metadata.width,
    height: metadata.height,
    hasAlpha,
    delays: metadata.delays,
  });

  logger.debug("Generated Y4M header:");
  logger.debug(header);

  avifenc.stdin.write(header);

  onProgress?.({
    type: "stage",
    stage: "frames",
  });

  /**
   * Convert source frame delays into a normalized
   * timeline where repeated frames preserve the
   * original animation timing.
   */
  const { expandedFrames } = expandFrameTimings(metadata.delays);

  logger.log(`Streaming ${expandedFrames.length} frame(s)...`);

  /**
   * Frame timing expansion can reference the same
   * source frame multiple times.
   *
   * Cache decoded frames to avoid redundant Sharp
   * extraction work.
   */
  const frameCache = new Map<number, AnimationFrame>();

  for (let index = 0; index < expandedFrames.length; index++) {
    const frame = expandedFrames[index];

    onProgress?.({
      type: "frame",
      current: index + 1,
      total: expandedFrames.length,
    });

    // Logging every frame can be noisy, but the debug log level is available for users who want that level of detail.
    logger.debug(`Processing frame ${index + 1} of ${expandedFrames.length}`);

    let frameData = frameCache.get(frame);

    /**
     * Extract each source frame once.
     */
    if (!frameData) {
      frameData = await extractFrame({
        input,
        frame,
        hasAlpha,
      });

      frameCache.set(frame, frameData);
    }

    /**
     * Repeated writes preserve timing in the
     * normalized animation timeline.
     */
    writeFrame(avifenc.stdin, frameData);
  }

  avifenc.stdin.end();

  onProgress?.({
    type: "stage",
    stage: "encoding",
  });

  logger.log("Encoding AVIF...");

  /**
   * Wait for encoder completion.
   *
   * A defensive timeout protects callers from
   * indefinitely hanging child processes.
   */
  await new Promise<void>((resolve, reject) => {
    let timeoutHandle: ReturnType<typeof setTimeout>;

    const cleanup = () => {
      clearTimeout(timeoutHandle);
    };

    timeoutHandle = setTimeout(() => {
      avifenc.kill();

      reject(new Error("avifenc conversion timeout after 30000ms"));
    }, 30000);

    avifenc.on("close", (code, signal) => {
      cleanup();

      if (code === 0) {
        resolve();

        return;
      }

      if (signal) {
        reject(new Error(`avifenc killed by signal ${signal}`));

        return;
      }

      reject(new Error(`avifenc exited with code ${code ?? "unknown"}`));
    });

    avifenc.on("error", (error) => {
      cleanup();

      reject(error);
    });
  });

  /**
   * Collect final output statistics.
   */
  const outputSize = fs.statSync(output).size;

  const reductionPercent = (1 - outputSize / inputSize) * 100;

  const durationMs = performance.now() - startTime;

  /**
   * Structured conversion result contract.
   */
  return {
    inputSize,
    outputSize,

    reductionPercent,

    sourceFrameCount: metadata.pages,

    durationMs,
  };
}
