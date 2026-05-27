import sharp from "sharp";

export type AnimationFrame = {
  gPlane: Buffer;
  bPlane: Buffer;
  rPlane: Buffer;

  aPlane: Buffer | null;
};

type ExtractFrameOptions = {
  input: string;

  frame: number;

  hasAlpha: boolean;
};

// Extract and repack
// a single animation frame
export async function extractFrame({
  input,
  frame,
  hasAlpha,
}: ExtractFrameOptions): Promise<AnimationFrame> {
  // Sharp extracts raw interleaved pixel data
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

  // Y4M expects planar channel ordering
  const gPlane = Buffer.alloc(pixelCount);

  const bPlane = Buffer.alloc(pixelCount);

  const rPlane = Buffer.alloc(pixelCount);

  // Optional alpha plane
  const aPlane = hasAlpha ? Buffer.alloc(pixelCount) : null;

  // Repack interleaved RGB(A)
  // into planar GBR(A)
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
