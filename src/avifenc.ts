import { spawn } from "node:child_process";

type AvifEncoderOptions = {
  output: string;
  quality: number;
  speed: number;
};

export function createAvifEncoder({
  output,
  quality,
  speed
}: AvifEncoderOptions) {

  // Spawn avifenc as a streaming child process
  const encoder = spawn("avifenc", [
    "--stdin",

    // BT.709 / sRGB signaling
    "--cicp",
    "1/13/0",

    "-q",
    String(quality),

    "--speed",
    String(speed),

    output
  ]);

  // Surface encoder stderr directly
  encoder.stderr.on("data", (data) => {
    process.stderr.write(data);
  });

  // Surface encoder stdout directly
  encoder.stdout.on("data", (data) => {
    process.stdout.write(data);
  });

  // Helpful during debugging / failure tracing
  encoder.on("close", (code) => {
    console.log(
      `\navifenc exited with code ${code}`
    );
  });

  // Child process launch/runtime failures
  encoder.on("error", (err) => {
    console.error(
      "\navifenc process error:"
    );

    console.error(err);
  });

  return encoder;
}