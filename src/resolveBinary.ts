import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function resolveAvifencBinary(): string {
  const platform = os.platform();
  const arch = os.arch();

  const binDir = path.resolve(__dirname, "../bin");

  let resolvedPath: string;

  if (platform === "darwin" && arch === "arm64") {
    resolvedPath = path.join(binDir, "darwin-arm64", "avifenc");
  } else if (platform === "darwin" && arch === "x64") {
    resolvedPath = path.join(binDir, "darwin-x64", "avifenc");
  } else if (platform === "linux" && arch === "x64") {
    resolvedPath = path.join(binDir, "linux-x64", "avifenc");
  } else if (platform === "win32" && arch === "x64") {
    resolvedPath = path.join(binDir, "win32-x64", "avifenc.exe");
  } else {
    throw new Error(
      `Unsupported platform: ${platform}/${arch}`
    );
  }

  console.log("Resolved avifenc:", resolvedPath);

  return resolvedPath;
}