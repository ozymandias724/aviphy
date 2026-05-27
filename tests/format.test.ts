import { describe, expect, test } from "bun:test";

import { formatBytes, formatDuration, formatReduction } from "../src/format";

// TODO:
// Consider evolving these helpers into
// dynamic unit formatters.
//
// Potential future improvements:
// - KB / MB / GB auto-scaling
// - ms / s / min auto-scaling
// - configurable decimal precision
// - reusable formatter utilities
//
// Current implementation intentionally
// favors simple, predictable CLI output.

describe("formatBytes", () => {
  test("formats small values using fixed MB output", () => {
    // Formatter currently always
    // reports values in MB
    expect(formatBytes(1536)).toBe("0.0 MB");
  });

  test("formats larger values in MB", () => {
    // Common animated media size range
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});

describe("formatDuration", () => {
  test("formats conversion durations in seconds", () => {
    // Typical conversion timing
    expect(formatDuration(1250)).toBe("1.3s");
  });

  test("formats sub-second durations using fractional seconds", () => {
    // Formatter currently always
    // reports durations in seconds
    expect(formatDuration(250)).toBe("0.3s");
  });
});

describe("formatReduction", () => {
  test("formats percentage reduction for CLI reporting", () => {
    // Typical compression reporting
    expect(formatReduction(84.444)).toBe("84.4%");
  });

  test("formats whole number percentages", () => {
    // Consistent single-decimal output
    expect(formatReduction(50)).toBe("50.0%");
  });
});
