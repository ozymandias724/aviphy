import fs from "node:fs";
import { describe, expect, test } from "bun:test";

import { extractFrame } from "../src/frame";

// Frame extraction tests validate
// raw planar channel extraction.
//
// These tests intentionally focus on:
// - frame extraction integrity
// - planar buffer generation
// - alpha channel handling
// - animated input compatibility
//
// Avoid over-asserting exact pixel data.
// These tests should validate structure
// and behavior rather than codec internals.

describe("extractFrame", () => {
  test("extracts planar frame data from animated GIF", async () => {
    // Extract first animation frame
    const frame = await extractFrame({
      input: "fixtures/test.gif",

      frame: 0,

      hasAlpha: true,
    });

    // Core planar buffers
    // should always exist
    expect(frame.gPlane).toBeInstanceOf(Buffer);

    expect(frame.bPlane).toBeInstanceOf(Buffer);

    expect(frame.rPlane).toBeInstanceOf(Buffer);

    // Alpha-enabled extraction
    // should include alpha plane
    expect(frame.aPlane).toBeInstanceOf(Buffer);

    // All channel planes should align
    expect(frame.gPlane.length).toBe(frame.bPlane.length);

    expect(frame.gPlane.length).toBe(frame.rPlane.length);
    expect(frame.gPlane.length).toBe(frame.aPlane!.length);

    expect(frame.aPlane).toBeInstanceOf(Buffer);
  });

  test("extracts planar frame data without alpha channel", async () => {
    // Alpha-disabled extraction
    // should omit alpha plane
    const frame = await extractFrame({
      input: "fixtures/test.gif",

      frame: 0,

      hasAlpha: false,
    });

    expect(frame.gPlane).toBeInstanceOf(Buffer);

    expect(frame.bPlane).toBeInstanceOf(Buffer);

    expect(frame.rPlane).toBeInstanceOf(Buffer);

    expect(frame.aPlane).toBeNull();
  });

  test("extracts frame data from animated WebP", async () => {
    // Animated WebP support is now
    // part of the engine contract
    const frame = await extractFrame({
      input: "fixtures/test.webp",

      frame: 0,

      hasAlpha: true,
    });

    expect(frame.gPlane.length).toBeGreaterThan(0);

    expect(frame.bPlane.length).toBeGreaterThan(0);

    expect(frame.rPlane.length).toBeGreaterThan(0);
  });

  test("extracts planar frame data from animated GIF buffer", async () => {
    const payload = fs.readFileSync("fixtures/test.gif");

    const frame = await extractFrame({
      input: payload,

      frame: 0,

      hasAlpha: true,
    });

    expect(frame.gPlane).toBeInstanceOf(Buffer);
    expect(frame.bPlane).toBeInstanceOf(Buffer);
    expect(frame.rPlane).toBeInstanceOf(Buffer);
    expect(frame.aPlane).toBeInstanceOf(Buffer);
  });

  test("throws for nonexistent input file", async () => {
    // Invalid filesystem input
    // should fail cleanly
    expect(
      extractFrame({
        input: "fixtures/does-not-exist.gif",

        frame: 0,

        hasAlpha: true,
      }),
    ).rejects.toThrow();
  });
});
