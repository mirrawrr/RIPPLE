/**
 * Shared fast-check configuration (dev/test only). Loaded through Vitest
 * `setupFiles`. Minimum 100 runs everywhere; a failure's seed and path can be
 * replayed with the FC_SEED environment variable (docs/testing.md).
 */
import fc from 'fast-check';

export const MIN_NUM_RUNS = 100;

export function buildFcParameters(env: Record<string, string | undefined>): fc.GlobalParameters {
  const params: fc.GlobalParameters = { numRuns: MIN_NUM_RUNS };
  if (env.FC_SEED !== undefined && env.FC_SEED.trim() !== '') {
    const seed = Number(env.FC_SEED);
    if (!Number.isInteger(seed)) throw new Error(`FC_SEED must be an integer, got "${env.FC_SEED}".`);
    params.seed = seed;
  }
  // `path` is not accepted by fast-check's global parameters (per-assert only), so FC_PATH is unsupported.
  return params;
}

export function configureFastCheck(env: Record<string, string | undefined> = process.env): void {
  fc.configureGlobal(buildFcParameters(env));
}
