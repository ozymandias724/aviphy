import fs from "node:fs";
import path from "node:path";

import { convert } from "../src/convert";

import type { ConvertOptions } from "../src/config";

import type { ConversionResult } from "../src/result";

import { formatBytes, formatDuration, formatReduction } from "../src/format";

// Example consumer-side batch orchestration.
//
// Batch processing intentionally lives
// outside the core conversion engine.
//
// This demonstrates how downstream
// applications may compose the library
// into larger processing pipelines.

export type BatchResult = {
  completed: number;
  failed: number;

  results: ConversionResult[];

  totalInputSize: number;
  totalOutputSize: number;

  reductionPercent: number;

  durationMs: number;
};

type BatchOptions = {
  inputDirectory: string;

  outputDirectory: string;

  convertOptions?: Omit<ConvertOptions, "input" | "output">;
};

// Supported animated input formats
const SUPPORTED_EXTENSIONS = [".gif", ".webp"];

// Sequential batch conversion orchestration
export async function batchConvert({
  inputDirectory,
  outputDirectory,

  convertOptions = {},
}: BatchOptions): Promise<BatchResult> {
  const startTime = performance.now();

  // Validate directories exist
  if (!fs.existsSync(inputDirectory)) {
    throw new Error(`Input directory does not exist: ${inputDirectory}`);
  }

  if (!fs.existsSync(outputDirectory)) {
    throw new Error(`Output directory does not exist: ${outputDirectory}`);
  }

  // Find supported animated image inputs
  const inputFiles = fs
    .readdirSync(inputDirectory)
    .filter((file) =>
      SUPPORTED_EXTENSIONS.includes(path.extname(file).toLowerCase()),
    );

  if (inputFiles.length === 0) {
    throw new Error(
      `No supported animated image files found in directory: ${inputDirectory}`,
    );
  }

  const results: ConversionResult[] = [];

  let completed = 0;
  let failed = 0;

  console.log(`Found ${inputFiles.length} supported animated files.\n`);

  // Sequential orchestration intentionally
  //
  // Consumer applications may choose:
  // - parallelization
  // - queues
  // - workers
  // - retry systems
  for (const file of inputFiles) {
    const input = path.join(inputDirectory, file);

    const outputName = path.parse(file).name + ".avif";

    const output = path.join(outputDirectory, outputName);

    console.log(`Converting ${file}...`);

    try {
      const result = await convert({
        input,
        output,

        ...convertOptions,
      });

      results.push(result);

      completed++;

      // Per-file reporting
      console.log({
        file,

        frames: result.sourceFrameCount,

        inputSize: formatBytes(result.inputSize),

        outputSize: formatBytes(result.outputSize),

        reduction: formatReduction(result.reductionPercent),

        duration: formatDuration(result.durationMs),
      });

      console.log();
    } catch (error) {
      failed++;

      console.error(`Failed ${file}`);

      console.error(error);

      console.log();
    }
  }

  // Aggregate conversion metrics
  const totalInputSize = results.reduce(
    (sum, result) => sum + result.inputSize,

    0,
  );

  const totalOutputSize = results.reduce(
    (sum, result) => sum + result.outputSize,

    0,
  );

  const reductionPercent =
    totalInputSize === 0 ? 0 : (1 - totalOutputSize / totalInputSize) * 100;

  const durationMs = performance.now() - startTime;

  // Structured aggregate batch result
  return {
    completed,
    failed,

    results,

    totalInputSize,
    totalOutputSize,

    reductionPercent,

    durationMs,
  };
}
