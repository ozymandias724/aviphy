# aviphy

Animated image → AVIF conversion pipeline built with Bun, Sharp, and `avifenc`.

Supports:

- Animated GIF input
- Animated WebP input
- Animated AVIF output
- Alpha transparency preservation
- Typed conversion APIs
- Progress callbacks
- Consumer-side orchestration

---

## Why This Exists

Most existing AVIF tooling is either:

- CLI-only
- image-only
- tightly coupled to app logic
- difficult to embed into pipelines
- not focused on animated assets

`animated-image-to-avif` is designed as:

- reusable infrastructure
- Bun-native TypeScript tooling
- composable conversion primitives
- lightweight pipeline integration

The goal is to make animated AVIF conversion easy to integrate into:

- apps
- APIs
- media pipelines
- queue systems
- batch processors
- optimization workflows

---

## Features

### Animated Input Support

- GIF → AVIF
- Animated WebP → AVIF

### Typed API Surface

- Fully typed conversion options
- Typed result contracts
- Typed progress events

### Timing Preservation

Animation frame delays are normalized into a timing-safe Y4M stream before encoding.

### Alpha Transparency

Preserves transparency by default.

### Bun + Sharp Workflow

Designed around:

- Bun runtime
- Sharp image decoding
- `avifenc` encoding

---

## Requirements

This package requires:

- Bun
- `avifenc`
- Sharp-compatible environment

### Install `avifenc`

macOS (Homebrew):

```bash
brew install libavif
```

Verify:

```bash
avifenc --version
```

---

## Installation

```bash
bun add animated-image-to-avif
```

---

## Basic Usage

```ts
import { convert } from "animated-image-to-avif";

await convert({
  input: "./fixtures/test.gif",
  output: "./tmp/output.avif",
});
```

---

## Advanced Usage

```ts
import { convert } from "animated-image-to-avif";

const result = await convert({
  input: "./fixtures/test.webp",
  output: "./tmp/output.avif",

  quality: 60,
  speed: 6,

  preserveAlpha: true,

  onProgress(event) {
    if (event.type === "stage") {
      console.log("Stage:", event.stage);
    }

    if (event.type === "frame") {
      console.log(`Frame ${event.current}/${event.total}`);
    }
  },
});

console.log(result);
```

---

## Convert Options

```ts
type ConvertOptions = {
  input: string;
  output: string;

  preset?: PresetName;

  quality?: number;
  speed?: number;

  preserveAlpha?: boolean;
  debug?: boolean;

  onProgress?: (event: ConversionProgressEvent) => void;
};
```

---

## Progress Events

```ts
type ConversionProgressEvent =
  | {
      type: "stage";
      stage: string;
    }
  | {
      type: "frame";
      current: number;
      total: number;
    };
```

---

## Conversion Result

```ts
type ConversionResult = {
  inputSize: number;
  outputSize: number;

  reductionPercent: number;

  sourceFrameCount: number;

  durationMs: number;
};
```

---

## Presets

Available presets:

- `fast`
- `balanced`
- `high-quality`
- `lossless`

Example:

```ts
await convert({
  input: "input.gif",
  output: "output.avif",

  preset: "balanced",
});
```

---

## Example Batch Pipeline

The repository includes an example consumer-side batch processor:

```text
examples/batch.ts
```

Batch orchestration intentionally lives outside the core engine so downstream applications can decide:

- concurrency
- queue systems
- workers
- retry behavior
- scheduling

---

## Design Philosophy

This package intentionally separates:

### Public API

Stable consumer-facing conversion contracts.

### Internal Engine

Frame extraction, metadata handling, Y4M generation, and encoder orchestration remain internal implementation details.

This allows the engine to evolve without breaking consumer integrations.

---

## Testing

The project includes:

- subsystem tests
- metadata extraction tests
- frame extraction tests
- timing normalization tests
- integration conversion tests
- packaged consumer validation

Run tests:

```bash
bun test
```

---

## Development

Build:

```bash
bun run build
```

Generate package tarball:

```bash
npm pack
```

---

## Status

Early alpha.

The public API is stabilizing, but internal implementation details may continue evolving.

---

## License

MIT
