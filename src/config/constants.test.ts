import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CLASS_LABELS,
  DURATION_RANGE,
  MAGNITUDE_RANGE,
  OLDER_PERIOD_NOTICE,
  QUALITATIVE_LABEL,
  REFERENCE_STATEMENT,
  SCENARIO_DEFAULTS,
  SCENARIO_EXPOSURE_DISCLAIMER,
  STALE_THRESHOLD_MONTHS,
  TAGLINE,
  TOP_N_EXPOSURE,
} from './constants';

const root = resolve(__dirname, '..', '..');
const requirements = readFileSync(
  join(root, '.kiro/specs/ripple-hormuz-intelligence-terminal/requirements.md'),
  'utf8',
);

const exactStrings: Record<string, [string, string]> = {
  TAGLINE: [TAGLINE, 'One event. A thousand consequences.'],
  REFERENCE_STATEMENT: [
    REFERENCE_STATEMENT,
    'Figures describe the stated reference period. They are not a claim about current conditions or current flows.',
  ],
  SCENARIO_EXPOSURE_DISCLAIMER: [
    SCENARIO_EXPOSURE_DISCLAIMER,
    'Simplified, illustrative dependency indicator. Not a prediction of supply loss, economic damage, or commodity price changes.',
  ],
  OLDER_PERIOD_NOTICE: [
    OLDER_PERIOD_NOTICE,
    'Older reference period - check it is still appropriate for your purpose.',
  ],
  QUALITATIVE_LABEL: [
    QUALITATIVE_LABEL,
    'Qualitative documented dependency - not quantified',
  ],
};

describe('numeric constants', () => {
  it('has the specified defaults', () => {
    expect(SCENARIO_DEFAULTS).toEqual({
      magnitudePercent: 25,
      durationDays: 7,
      commodityScope: 'both',
    });
  });

  it('has the specified ranges as integers containing the defaults', () => {
    expect(MAGNITUDE_RANGE).toEqual({ min: 0, max: 100 });
    expect(DURATION_RANGE).toEqual({ min: 1, max: 365 });
    for (const v of [...Object.values(MAGNITUDE_RANGE), ...Object.values(DURATION_RANGE)]) {
      expect(Number.isInteger(v)).toBe(true);
    }
    expect(SCENARIO_DEFAULTS.magnitudePercent).toBeGreaterThanOrEqual(MAGNITUDE_RANGE.min);
    expect(SCENARIO_DEFAULTS.magnitudePercent).toBeLessThanOrEqual(MAGNITUDE_RANGE.max);
    expect(SCENARIO_DEFAULTS.durationDays).toBeGreaterThanOrEqual(DURATION_RANGE.min);
    expect(SCENARIO_DEFAULTS.durationDays).toBeLessThanOrEqual(DURATION_RANGE.max);
  });

  it('has the stale threshold and top-N', () => {
    expect(STALE_THRESHOLD_MONTHS).toBe(12);
    expect(TOP_N_EXPOSURE).toBe(5);
  });

  it('has the Class_Label names', () => {
    expect(CLASS_LABELS).toEqual({
      historical: 'Historical',
      hypothetical: 'Hypothetical',
      calculated: 'Calculated',
    });
  });
});

describe('exact strings', () => {
  for (const [name, [actual, expected]] of Object.entries(exactStrings)) {
    it(`${name} equals the expected literal and appears verbatim in requirements.md`, () => {
      expect(actual).toBe(expected);
      expect(requirements).toContain(actual);
    });
  }
});

function listSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...listSourceFiles(full));
    else out.push(full);
  }
  return out;
}

describe('no hard-coded copies', () => {
  it('no other src file contains the exact strings', () => {
    const files = listSourceFiles(join(root, 'src')).filter(
      (f) =>
        !/[\\/]config[\\/]constants\.ts$/.test(f) &&
        !/\.test\.(ts|tsx)$/.test(f),
    );
    const offenders: string[] = [];
    for (const f of files) {
      const text = readFileSync(f, 'utf8');
      for (const [name, [actual]] of Object.entries(exactStrings)) {
        if (text.includes(actual)) offenders.push(`${f}: ${name}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
