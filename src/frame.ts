import sharp from "sharp";

export type AnimationFrame = {
  gPlane: Buffer;
  bPlane: Buffer;
  rPlane: Buffer;

  aPlane: Buffer | null;
};

type ExtractFrameOptions = {
  input: string | Buffer;
  frame: number;
  hasAlpha: boolean;
};

/**
 * Extract a single animation frame and convert
 * Sharp's interleaved RGB(A) pixel layout into
 * the planar GBR(A) format expected by Y4M.
 */
export async function extractFrame({
  input,
  frame,
  hasAlpha,
}: ExtractFrameOptions): Promise<AnimationFrame> {
  /**
   * Sharp returns raw interleaved pixels:
   *
   * RGBARGBARGBA...
   */
  const { data, info } = await sharp(input, {
    animated: true,
    page: frame,
    pages: 1,
  })
    .raw()
    .toBuffer({
      resolveWithObject: true,
    });

  const pixelCount = info.width * info.height;

  /**
   * Y4M expects separate color planes:
   *
   * GGGGG...
   * BBBBB...
   * RRRRR...
   * AAAAA...
   */
  const gPlane = Buffer.alloc(pixelCount);
  const bPlane = Buffer.alloc(pixelCount);
  const rPlane = Buffer.alloc(pixelCount);

  const aPlane = hasAlpha ? Buffer.alloc(pixelCount) : null;

  /**
   * Repack interleaved RGB(A) data into
   * planar GBR(A) channel buffers.
   */
  for (let i = 0; i < pixelCount; i++) {
    const offset = i * info.channels;

    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];

    gPlane[i] = g;
    bPlane[i] = b;
    rPlane[i] = r;

    if (hasAlpha && aPlane) {
      const a = data[offset + 3];

      aPlane[i] = a;
    }
  }

  return {
    gPlane,
    bPlane,
    rPlane,

    aPlane,
  };
}
