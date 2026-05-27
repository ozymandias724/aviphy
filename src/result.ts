// Structured conversion result contract
// Returned by the conversion engine

export type ConversionResult = {

  inputSize: number;

  outputSize: number;

  reductionPercent: number;

  sourceFrameCount: number;

  durationMs: number;
};