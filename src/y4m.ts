import type {
  AnimationFrame
} from "./frame";

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

// Greatest common divisor
function gcd(
  a: number,
  b: number
): number {
  return b === 0
    ? a
    : gcd(
        b,
        a % b
      );
}

// Find shared frame timing interval
function getBaseDelay(
  delays: number[]
): number {

  // Fallback if metadata is missing
  if (delays.length === 0) {
    return 1000 / 25;
  }

  return delays.reduce(
    (current, delay) =>
      gcd(current, delay)
  );
}

// Expand variable animation delays
// into a normalized frame timeline
export function expandFrameTimings(
  delays: number[]
): FrameTimeline {

  const baseDelay =
    getBaseDelay(delays);

  const expandedFrames:
    number[] = [];

  for (
    let frame = 0;
    frame < delays.length;
    frame++
  ) {
    const delay =
      delays[frame];

    const repeats =
      Math.max(
        1,
        Math.round(
          delay / baseDelay
        )
      );

    for (
      let i = 0;
      i < repeats;
      i++
    ) {
      expandedFrames.push(
        frame
      );
    }
  }

  return {
    expandedFrames,

    fps: {
      numerator: 1000,
      denominator:
        baseDelay
    }
  };
}

// Build dynamic Y4M stream header
export function buildY4MHeader({
  width,
  height,
  hasAlpha,
  delays
}: HeaderOptions) {

  // Y4M alpha signaling differs
  const chromaFormat =
    hasAlpha
      ? "C444alpha"
      : "C444";

  const { fps } =
    expandFrameTimings(
      delays
    );

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

// Stream a planar frame
// into avifenc stdin
export function writeFrame(
  stdin: NodeJS.WritableStream,

  frame: AnimationFrame
) {

  stdin.write(
    "FRAME\n"
  );

  stdin.write(
    frame.gPlane
  );

  stdin.write(
    frame.bPlane
  );

  stdin.write(
    frame.rPlane
  );

  // Optional alpha plane
  if (frame.aPlane) {
    stdin.write(
      frame.aPlane
    );
  }
}