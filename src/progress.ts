// Structured conversion pipeline progress events

export type ConversionProgressEvent =

  // High-level pipeline stages
  | {
      type: "stage";
      stage: string;
    }

  // Frame processing progress
  | {
      type: "frame";
      current: number;
      total: number;
    };