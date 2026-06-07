import { spawn } from "node:child_process";

import { createLogger, type LogLevel } from "./logger";
import { resolveAvifencBinary } from "./resolveBinary";

type AvifEncoderOptions = {
  output: string;
  quality: number;
  speed: number;
  logLevel: LogLevel;
};

/**
 * Build avifenc CLI arguments.
 *
 * Resulting command resembles:
 *
 * avifenc \
 *   --stdin \
 *   --cicp 1/13/0 \
 *   -q 80 \
 *   --speed 6 \
 *   output.avif
 *
 * Frames are streamed over stdin as Y4M data
 * rather than written to temporary files.
 */
function createAvifencArgs({
  output,
  quality,
  speed,
}: Pick<AvifEncoderOptions, "output" | "quality" | "speed">): string[] {
  return [
    /**
     * Read Y4M frame data from stdin.
     *
     * Aviphy streams frames directly into
     * avifenc, avoiding temporary files.
     */
    "--stdin",

    /**
     * Explicitly signal BT.709 / sRGB color
     * information to AVIF consumers.
     */
    "--cicp",
    "1/13/0",

    /**
     * AVIF quality.
     *
     * Higher values generally increase
     * quality at the expense of file size.
     */
    "-q",
    String(quality),

    /**
     * Encoder effort level.
     *
     * Lower values are slower but may
     * produce smaller files.
     */
    "--speed",
    String(speed),

    /**
     * Destination AVIF file.
     */
    output,
  ];
}

export function createAvifEncoder({
  output,
  quality,
  speed,
  logLevel,
}: AvifEncoderOptions) {
  const logger = createLogger(logLevel);

  const avifencPath = resolveAvifencBinary();

  logger.debug(`Using avifenc binary: ${avifencPath}`);

  const args = createAvifencArgs({
    output,
    quality,
    speed,
  });

  logger.debug(`avifenc ${args.join(" ")}`);

  /**
   * Launch avifenc as a child process.
   *
   * The returned process exposes stdin,
   * allowing the frame pipeline to stream
   * Y4M data directly into the encoder.
   */
  const encoder = spawn(avifencPath, args);

  /**
   * Attach process diagnostics and ensure
   * stdout/stderr are properly consumed.
   */
  logger.attachProcess("avifenc", encoder);

  return encoder;
}
