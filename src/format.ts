/**
 * Format byte counts for human-readable CLI output.
 */
export function formatBytes(bytes: number) {
  const mb = bytes / 1024 / 1024;

  return `${mb.toFixed(1)} MB`;
}

/**
 * Format milliseconds as seconds.
 */
export function formatDuration(durationMs: number) {
  return `${(durationMs / 1000).toFixed(1)}s`;
}

/**
 * Format percentage reduction values.
 */
export function formatReduction(reductionPercent: number) {
  return `${reductionPercent.toFixed(1)}%`;
}
