// Shared CLI / reporting format helpers

export function formatBytes(
  bytes: number
) {
  const mb =
    bytes / 1024 / 1024;

  return `${mb.toFixed(1)} MB`;
}

export function formatDuration(
  durationMs: number
) {
  return `${(
    durationMs / 1000
  ).toFixed(1)}s`;
}

export function formatReduction(
  reductionPercent: number
) {
  return `${reductionPercent.toFixed(1)}%`;
}