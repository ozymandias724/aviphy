import fs from "node:fs";
import { afterEach, describe, expect, test } from "bun:test";

import { convert } from "../src/convert";

// Integration tests validate the
// full conversion orchestration flow.
//
// These tests intentionally verify:
// - successful pipeline execution
// - output artifact creation
// - animated input compatibility
// - filesystem behavior
// - failure handling
//
// Lower-level subsystem tests already
// validate timing, metadata, and frame logic.
//
// These tests should remain broad and
// shallow. Avoid re-testing internal
// subsystem implementation details here.

const GIF_OUTPUT = "tmp/test-output-gif.avif";

const WEBP_OUTPUT = "tmp/test-output-webp.avif";

afterEach(async () => {
  // Integration tests generate
  // real filesystem artifacts.
  //
  // Cleanup must be resilient because:
  // - tests may fail early
  // - files may never get created
  // - only one output may exist

  const gifFile = Bun.file(GIF_OUTPUT);

  if (await gifFile.exists()) {
    await gifFile.delete();
  }

  const webpFile = Bun.file(WEBP_OUTPUT);

  if (await webpFile.exists()) {
    await webpFile.delete();
  }
});

describe("convert", () => {
  test("converts animated GIF to AVIF", async () => {
    // Core animated GIF pipeline
    const result = await convert({
      input: "fixtures/test.gif",

      output: GIF_OUTPUT,

      quality: 50,
      speed: 8,

      preserveAlpha: true,
    });

    // Bun-native output handle
    const outputFile = Bun.file(GIF_OUTPUT);

    // Output artifact should exist
    expect(await outputFile.exists()).toBe(true);

    // Output should contain data
    expect(outputFile.size).toBeGreaterThan(0);

    // Conversion should process
    // one or more frames
    expect(result.sourceFrameCount).toBeGreaterThan(0);
  });

  test("converts animated WebP to AVIF", async () => {
    // Animated WebP support is now
    // part of the engine contract
    const result = await convert({
      input: "fixtures/test.webp",

      output: WEBP_OUTPUT,

      quality: 50,
      speed: 8,

      preserveAlpha: true,
    });

    const outputFile = Bun.file(WEBP_OUTPUT);

    expect(await outputFile.exists()).toBe(true);

    expect(outputFile.size).toBeGreaterThan(0);

    expect(result.sourceFrameCount).toBeGreaterThan(0);
  });

  test("converts animated GIF buffer to AVIF", async () => {
    const payload = fs.readFileSync("fixtures/test.gif");

    const result = await convert({
      input: payload,

      output: GIF_OUTPUT,

      quality: 50,
      speed: 8,

      preserveAlpha: true,
    });

    const outputFile = Bun.file(GIF_OUTPUT);

    expect(await outputFile.exists()).toBe(true);
    expect(outputFile.size).toBeGreaterThan(0);
    expect(result.sourceFrameCount).toBeGreaterThan(0);
  });

  test("throws for nonexistent input file", async () => {
    // Invalid filesystem input
    // should fail cleanly
    expect(
      convert({
        input: "fixtures/does-not-exist.gif",

        output: GIF_OUTPUT,

        quality: 50,
        speed: 8,

        preserveAlpha: true,
      }),
    ).rejects.toThrow();
  });
});
