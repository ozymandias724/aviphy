/// <reference types="node" />

import fs from "node:fs";

import { resolveConfig } from "./config";

import { getAnimationMetadata } from "./metadata";
import { extractFrame } from "./frame";

import {
  buildY4MHeader,
  writeFrame,
  expandFrameTimings
} from "./y4m";

import { createAvifEncoder } from "./avifenc";

import type { ConvertOptions } from "./config";


import type {
  PresetName
} from "./presets";
import type {
  AnimationFrame
} from "./frame";
import type {
  ConversionResult
} from "./result";

import type {
  ConversionProgressEvent
} from "./progress";



function createDebugLogger(
  enabled: boolean
) {
  return (
    ...args: unknown[]
  ) => {
    if (enabled) {
      console.log(...args);
    }
  };
}

// Main animated image → AVIF conversion pipeline
export async function convert(
  options: ConvertOptions
): Promise<ConversionResult> {

  // Normalize and validate config up front
  const {
    input,
    output,

    preset,

    quality,
    speed,

    preserveAlpha,
    debug: debugEnabled,
  } = resolveConfig(options);

  // Runtime callbacks are not configuration
  const {
    onProgress
  } = options;

  const debug =
    createDebugLogger(
      debugEnabled
    );

  // Track total conversion duration
  const startTime =
    performance.now();

  // Capture original input filesize
  const inputSize =
    fs.statSync(input).size;

  console.log(
    "Loading animation metadata..."
  );

  onProgress?.({
    type: "stage",
    stage: "metadata",
  });

  const metadata =
    await getAnimationMetadata(input);

  debug("\nFULL METADATA:");
  debug(metadata);

  // Respect source alpha unless explicitly disabled
  const hasAlpha =
    metadata.hasAlpha &&
    preserveAlpha;

  console.log(
    `Frames detected: ${metadata.pages}`
  );

  console.log(
    `Resolution: ${metadata.width}x${metadata.height}`
  );

  console.log(
    `Source alpha detected: ${metadata.hasAlpha}`
  );

  console.log(
    `Encoding alpha: ${hasAlpha}`
  );

  console.log(
    "\nEncoding settings:"
  );

  console.log({
    preset:
      preset ?? "custom",

    quality,
    speed,
  });

  console.log(
    "\nStarting avifenc..."
  );

  // Streaming encoder child process
  const avifenc =
    createAvifEncoder({
      output,
      quality,
      speed,
    });

  // Build timing-aware Y4M stream header
  const header =
    buildY4MHeader({
      width: metadata.width,
      height: metadata.height,
      hasAlpha,
      delays: metadata.delays,
    });

  debug("\nY4M HEADER:");
  debug(header);

  avifenc.stdin.write(
    header
  );

  onProgress?.({
    type: "stage",
    stage: "frames",
  });

  // Expand variable animation timing
  // into a normalized frame timeline
  const {
    expandedFrames
  } = expandFrameTimings(
    metadata.delays
  );

  // Cache decoded source frames
  // so timing duplication avoids re-extraction
  const frameCache =
  new Map<
    number,
    AnimationFrame
  >();

  for (
    let index = 0;
    index < expandedFrames.length;
    index++
  ) {
    const frame =
      expandedFrames[index];

    onProgress?.({
      type: "frame",
      current: index + 1,
      total: expandedFrames.length,
    });

    console.log(
      `Processing frame ${index + 1}/${expandedFrames.length}`
    );

    let frameData =
      frameCache.get(frame);

    // Extract each source frame once
    if (!frameData) {
      frameData =
        await extractFrame({
          input,
          frame,
          hasAlpha,
        });

      frameCache.set(
        frame,
        frameData
      );
    }

    // Duplicate writes preserve timing
    writeFrame(
      avifenc.stdin,
      frameData
    );
  }

  avifenc.stdin.end();

  onProgress?.({
    type: "stage",
    stage: "encoding",
  });

  // Wait for encoder process completion
  await new Promise<void>(
    (resolve, reject) => {
      avifenc.on(
        "close",
        (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(
              new Error(
                `avifenc exited with code ${code}`
              )
            );
          }
        }
      );

      avifenc.on(
        "error",
        reject
      );
    }
  );

  // Capture final output filesize
  const outputSize =
    fs.statSync(output).size;

  const reductionPercent =
    (
      (1 - outputSize / inputSize) *
      100
    );

  const durationMs =
    performance.now() -
    startTime;

  // Structured conversion result contract
  return {
    inputSize,
    outputSize,

    reductionPercent,

    sourceFrameCount:
      metadata.pages,

    durationMs,
  };
}