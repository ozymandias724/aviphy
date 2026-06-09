import fs from "node:fs";
import { describe, expect, test } from "bun:test";

import { getAnimationMetadata } from "../src/metadata";

// Metadata extraction tests validate
// real animated fixture behavior.
//
// These tests intentionally focus on:
// - animation detection
// - frame metadata integrity
// - alpha support
// - filesystem failure behavior
//
// Avoid over-asserting exact metadata blobs.
// Sharp internals and codec behavior may
// evolve slightly across environments.

describe("getAnimationMetadata", () => {
  test("extracts metadata from animated GIF", async () => {
    // Core animated GIF fixture
    const metadata = await getAnimationMetadata("fixtures/test.gif");

    // Basic animation dimensions
    expect(metadata.width).toBeGreaterThan(0);

    expect(metadata.height).toBeGreaterThan(0);

    // Animated inputs should
    // contain one or more frames
    expect(metadata.pages).toBeGreaterThan(0);

    // Delay timeline should exist
    expect(metadata.delays.length).toBeGreaterThan(0);

    // Delay count should align
    // with source frame count
    expect(metadata.delays.length).toBe(metadata.pages);
  });

  test("extracts metadata from animated WebP", async () => {
    // Animated WebP support is now
    // a core engine capability
    const metadata = await getAnimationMetadata("fixtures/test.webp");

    expect(metadata.width).toBeGreaterThan(0);

    expect(metadata.height).toBeGreaterThan(0);

    expect(metadata.pages).toBeGreaterThan(0);

    expect(metadata.delays.length).toBeGreaterThan(0);
  });

  test("detects alpha channel support", async () => {
    // Alpha preservation is an
    // important engine feature
    const metadata = await getAnimationMetadata("fixtures/test.gif");

    expect(typeof metadata.hasAlpha).toBe("boolean");
  });

  test("extracts metadata from animated GIF buffer", async () => {
    const payload = fs.readFileSync("fixtures/test.gif");

    const metadata = await getAnimationMetadata(payload);

    expect(metadata.pages).toBeGreaterThan(0);
    expect(metadata.delays.length).toBe(metadata.pages);
  });

  test("throws for nonexistent input file", async () => {
    // Invalid filesystem input
    // should fail cleanly
    expect(
      getAnimationMetadata("fixtures/does-not-exist.gif"),
    ).rejects.toThrow();
  });
});
