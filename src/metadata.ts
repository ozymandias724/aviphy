import sharp from "sharp";

export type AnimationMetadata = {
  width: number;
  height: number;

  pages: number;

  hasAlpha: boolean;

  delays: number[];

  loop: number;
};

// Extract normalized animation metadata
export async function getAnimationMetadata(
  input: string
): Promise<AnimationMetadata> {

  // Sharp handles animated raster parsing
  const image = sharp(input, {
    animated: true
  });

  const metadata =
    await image.metadata();

  const width =
    metadata.width;

  const height =
    metadata.pageHeight;

  const pages =
    metadata.pages;

  // Conversion pipeline requires valid animation dimensions
  if (
    !width ||
    !height ||
    !pages
  ) {
    throw new Error(
      "Invalid animation metadata."
    );
  }

  // Normalize downstream metadata contract
  return {
    width,
    height,
    pages,

    hasAlpha:
      metadata.hasAlpha === true,

    delays:
      metadata.delay ?? [],

    loop:
      metadata.loop ?? 0
  };
}