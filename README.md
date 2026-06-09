# aviphy

Convert animated GIF and WebP images into animated AVIF.

Aviphy is a JavaScript library designed for automated image conversion workflows, media pipelines, build tooling, and batch processing.

Platform-specific `avifenc` binaries are bundled automatically, so no additional system dependencies are required.

## Features

- Animated GIF input
- Animated WebP input
- Animated AVIF output
- Alpha transparency support
- Quality and speed controls
- Built-in encoder presets
- In-memory `Buffer` input support
- Progress callbacks
- Normal and debug logging
- Packaged CLI command
- Bundled macOS, Linux, and Windows binaries
- Node.js and Bun compatible

## Installation

```bash
npm install @ozymandias724/aviphy
```

or

```bash
bun add @ozymandias724/aviphy
```

> Note: Bun is used for development and building the package, but the published library and CLI are usable without Bun.

## Quick Start

```ts
import { convert } from "@ozymandias724/aviphy";

const result = await convert({
  input: "./input.gif",
  output: "./output.avif",
});

console.log(result);
```

## Basic Example

```ts
import { convert } from "@ozymandias724/aviphy";

const result = await convert({
  input: "./input.webp",
  output: "./output.avif",

  preset: "balanced",

  quality: 60,
  speed: 6,

  logLevel: "normal",
});

console.log(result);
```

## Buffer Input

```ts
import fs from "node:fs";
import { convert } from "@ozymandias724/aviphy";

const inputBuffer = fs.readFileSync("./input.gif");

const result = await convert({
  input: inputBuffer,
  output: "./output.avif",
});

console.log(result);
```

## Logging

### normal (default)

Human-friendly conversion progress.

Includes:

- metadata loading
- conversion settings
- encoder startup
- conversion progress

### debug

Includes all normal logging plus:

- frame processing details
- encoder diagnostics
- subprocess lifecycle information
- binary resolution information

Example:

```ts
await convert({
  input: "./input.webp",
  output: "./output.avif",

  logLevel: "debug",
});
```

## API

### convert(options)

```ts
const result = await convert({
  input: "./input.gif",
  output: "./output.avif",
});
```

### ConvertOptions

```ts
type ConvertOptions = {
  input: string | Buffer;
  output: string;

  preset?: "fast" | "balanced" | "high-quality" | "lossless";

  quality?: number;
  speed?: number;

  preserveAlpha?: boolean;

  logLevel?: "normal" | "debug";

  onProgress?: (event: ConversionProgressEvent) => void;
};
```

## Presets

```ts
preset: "fast";
preset: "balanced";
preset: "high-quality";
preset: "lossless";
```

Presets provide sensible quality and speed defaults while still allowing explicit overrides.

## Result Object

```ts
{
  inputSize: number;
  outputSize: number;

  reductionPercent: number;

  sourceFrameCount: number;

  durationMs: number;
}
```

## Progress Events

Aviphy supports progress callbacks for:

- progress bars
- spinners
- telemetry
- custom logging
- UI updates

Example:

```ts
await convert({
  input: "./input.gif",
  output: "./output.avif",

  onProgress(event) {
    console.log(event);
  },
});
```

## CLI Utility

A lightweight CLI utility is included for:

- local testing
- debugging
- development workflows
- installed package usage

### Supported CLI options

- `--preset <fast|balanced|high-quality|lossless>`
- `--quality <0-100>`
- `--speed <0-10>`
- `--no-alpha` to disable alpha preservation
- `--debug` for verbose logging

Example (development):

```bash
bun run src/cli.ts fixtures/test.gif tmp/output.avif --debug
```

Example (packaged CLI):

```bash
npx aviphy fixtures/test.gif tmp/output.avif --quality 70 --speed 5
```

Or after a global install:

```bash
npm install -g @ozymandias724/aviphy
aviphy fixtures/test.gif tmp/output.avif
```

## Development

Install dependencies:

```bash
bun install
```

Run tests:

```bash
bun test
```

Build the package:

```bash
bun run build
```

Create an npm package (build first):

```bash
bun run build
npm pack
```

## License

MIT
