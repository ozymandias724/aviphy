import { describe, expect, test, mock } from "bun:test";

import { buildY4MHeader, expandFrameTimings, writeFrame } from "../src/y4m";

describe("writeFrame", () => {
  test("writes frame data in correct Y4M order", () => {
    const mockStdin = {
      write: mock(),
    };

    const frame = {
      gPlane: Buffer.from("g"),

      bPlane: Buffer.from("b"),

      rPlane: Buffer.from("r"),

      aPlane: Buffer.from("a"),
    };

    writeFrame(mockStdin as any, frame);

    expect(mockStdin.write.mock.calls).toEqual([
      ["FRAME\n"],

      [frame.gPlane],

      [frame.bPlane],

      [frame.rPlane],

      [frame.aPlane],
    ]);
  });

  test("writes frame data without alpha plane", () => {
    const mockStdin = {
      write: mock(),
    };

    const frame = {
      gPlane: Buffer.from("g"),

      bPlane: Buffer.from("b"),

      rPlane: Buffer.from("r"),

      aPlane: null,
    };

    writeFrame(mockStdin as any, frame);

    expect(mockStdin.write.mock.calls).toEqual([
      ["FRAME\n"],

      [frame.gPlane],

      [frame.bPlane],

      [frame.rPlane],
    ]);
  });
});

describe("expandFrameTimings", () => {
  test("expands variable frame delays into normalized timeline", () => {
    const result = expandFrameTimings([100, 200, 100]);

    expect(result.expandedFrames).toEqual([0, 1, 1, 2]);

    expect(result.fps).toEqual({
      numerator: 1000,
      denominator: 100,
    });
  });
});

describe("buildY4MHeader", () => {
  test("builds Y4M header with alpha support", () => {
    const header = buildY4MHeader({
      width: 640,
      height: 480,

      hasAlpha: true,

      delays: [100],
    });

    expect(header).toContain("W640");

    expect(header).toContain("H480");

    expect(header).toContain("F1000:100");

    expect(header).toContain("C444alpha");
  });

  test("builds Y4M header without alpha support", () => {
    const header = buildY4MHeader({
      width: 320,
      height: 240,

      hasAlpha: false,

      delays: [100],
    });

    expect(header).toContain("W320");

    expect(header).toContain("H240");

    expect(header).toContain("F1000:100");

    expect(header).toContain("C444");

    expect(header).not.toContain("C444alpha");
  });
});
