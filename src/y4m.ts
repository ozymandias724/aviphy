import type { AnimationFrame } from "./frame";

type HeaderOptions = {
  width: number;
  height: number;

  hasAlpha: boolean;

  delays: number[];
};

export type FrameTimeline = {
  expandedFrames: number[];

  fps: {
    numerator: number;
    denominator: number;
  };
};

/**
 * Compute the greatest common divisor for
 * a set of frame delays.
 *
 * Used to derive the smallest timing unit
 * that can accurately represent the source
 * animation.
 */
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/**
 * Determine the base frame delay used to
 * normalize variable animation timing.
 *
 * Example:
 *
 * [100, 200, 300]
 *
 * becomes:
 *
 * baseDelay = 100
 */
function getBaseDelay(delays: number[]): number {
  /**
   * Fallback to 25 FPS when metadata does
   * not provide timing information.
   */
  if (delays.length === 0) {
    return 1000 / 25;
  }

  return delays.reduce((current, delay) => gcd(current, delay));
}

/**
 * Convert variable frame delays into a
 * normalized timeline.
 *
 * Example:
 *
 * delays:
 * [100, 300]
 *
 * expandedFrames:
 * [0, 1, 1, 1]
 *
 * This allows Y4M to represent variable
 * timing using repeated frames at a
 * constant frame rate.
 */
export function expandFrameTimings(delays: number[]): FrameTimeline {
  const baseDelay = getBaseDelay(delays);

  const expandedFrames: number[] = [];

  for (let frame = 0; frame < delays.length; frame++) {
    const delay = delays[frame];

    const repeats = Math.max(1, Math.round(delay / baseDelay));

    for (let i = 0; i < repeats; i++) {
      expandedFrames.push(frame);
    }
  }

  return {
    expandedFrames,

    fps: {
      numerator: 1000,
      denominator: baseDelay,
    },
  };
}

/**
 * Build the Y4M stream header consumed
 * by avifenc.
 *
 * Frame timing is derived from the
 * normalized animation timeline.
 */
export function buildY4MHeader({
  width,
  height,
  hasAlpha,
  delays,
}: HeaderOptions) {
  /**
   * Y4M uses a distinct chroma format
   * when an alpha plane is present.
   */
  const chromaFormat = hasAlpha ? "C444alpha" : "C444";

  const { fps } = expandFrameTimings(delays);

  return (
    `YUV4MPEG2 ` +
    `W${width} ` +
    `H${height} ` +
    `F${fps.numerator}:${fps.denominator} ` +
    `Ip ` +
    `A0:0 ` +
    `${chromaFormat} ` +
    `XYSCSS=444\n`
  );
}

/**
 * Write a single planar frame into the
 * encoder's Y4M input stream.
 *
 * Channel ordering must match the format
 * declared in the Y4M header.
 */
export function writeFrame(
  stdin: NodeJS.WritableStream,
  frame: AnimationFrame,
) {
  stdin.write("FRAME\n");

  stdin.write(frame.gPlane);
  stdin.write(frame.bPlane);
  stdin.write(frame.rPlane);

  /**
   * Optional alpha plane.
   */
  if (frame.aPlane) {
    stdin.write(frame.aPlane);
  }
}
