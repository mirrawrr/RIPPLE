import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CLASS_LABELS,
  COMMODITY_SCOPES,
  APP_MODES,
  COMMODITY_SCOPE_ERROR_MESSAGE,
  CONTROL_LABELS,
  DEFAULT_APP_MODE,
  DEMO_ANNOUNCEMENT_PREFIX,
  DEMO_BANNER_RETURN_LABEL,
  DEMO_BANNER_TEXT,
  DEMO_BRIEF_FOOTER,
  DEMO_BRIEF_HEADER,
  DEMO_DATASET_KIND,
  DEMO_DATA_NOTICE,
  DEMO_DATA_UNAVAILABLE_TEXT,
  DEMO_DOCUMENT_TITLE_PREFIX,
  DEMO_FICTIONAL_MARKER,
  DEMO_FORBIDDEN_SOURCE_NAMES,
  DEMO_ID_PREFIX,
  DEMO_MARKER,
  DEMO_NO_QUALITATIVE_TEXT,
  DEMO_NO_SOURCE_TEXT,
  DEMO_REFERENCE_STATEMENT,
  DEMO_TITLE_PREFIX,
  DEMO_UNIT_MARKER,
  DEMO_VALUE_MULTIPLE,
  ILLUSTRATIVE_LABEL,
  MODE_ANNOUNCEMENTS,
  MODE_TOGGLE_LABELS,
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

/** Demo strings long and distinctive enough to scan for hard-coded copies. */
const demoScanned: Record<string, [string, string]> = {
  DEMO_BANNER_TEXT: [
    DEMO_BANNER_TEXT,
    'ILLUSTRATIVE DEMO MODE - synthetic data and fictional assumptions. Not historical, not current, not a prediction.',
  ],
  DEMO_DATA_NOTICE: [
    DEMO_DATA_NOTICE,
    'Synthetic illustrative data for demonstration only. No Source_Record exists for these values. They are not Historical Observations and make no claim about any real flow, economy, or dependency.',
  ],
  DEMO_NO_SOURCE_TEXT: [DEMO_NO_SOURCE_TEXT, 'No Source_Record - synthetic illustrative value'],
  DEMO_REFERENCE_STATEMENT: [
    DEMO_REFERENCE_STATEMENT,
    'Demo figures have no reference period. They describe no real conditions, flows, or economies.',
  ],
  DEMO_BRIEF_HEADER: [
    DEMO_BRIEF_HEADER,
    'ILLUSTRATIVE DEMO BRIEF - synthetic data, not historical or predictive',
  ],
  DEMO_BRIEF_FOOTER: [
    DEMO_BRIEF_FOOTER,
    'End of illustrative demo brief. Every figure above is synthetic and fictional.',
  ],
  DEMO_NO_QUALITATIVE_TEXT: [
    DEMO_NO_QUALITATIVE_TEXT,
    'No qualitative dependencies are defined in the demo data.',
  ],
  DEMO_DOCUMENT_TITLE_PREFIX: [DEMO_DOCUMENT_TITLE_PREFIX, '[Illustrative demo] '],
  MODE_TOGGLE_TO_DEMO: [MODE_TOGGLE_LABELS.toDemo, 'Switch to Illustrative demo mode'],
  MODE_TOGGLE_TO_HISTORICAL: [MODE_TOGGLE_LABELS.toHistorical, 'Return to Historical mode'],
  MODE_ANNOUNCEMENT_DEMO: [
    MODE_ANNOUNCEMENTS.demo,
    'Illustrative demo mode on. Figures are synthetic and not historical.',
  ],
  MODE_ANNOUNCEMENT_HISTORICAL: [MODE_ANNOUNCEMENTS.historical, 'Historical mode on.'],
  DEMO_DATA_UNAVAILABLE_TEXT: [DEMO_DATA_UNAVAILABLE_TEXT, 'Demo data unavailable'],
};

/**
 * Demo strings checked for equality and presence in requirements.md but NOT scanned for
 * hard-coded copies: each is a short generic word or a prefix of a scanned string, so a
 * scan would give false positives (comments, other prefixes).
 */
const demoNotScanned: Record<string, [string, string]> = {
  ILLUSTRATIVE_LABEL: [ILLUSTRATIVE_LABEL, 'Illustrative'],
  DEMO_MARKER: [DEMO_MARKER, 'Illustrative demo'],
  DEMO_TITLE_PREFIX: [DEMO_TITLE_PREFIX, 'Illustrative demo - '],
  DEMO_ANNOUNCEMENT_PREFIX: [DEMO_ANNOUNCEMENT_PREFIX, 'Illustrative demo.'],
};

const scanStrings: Record<string, string> = {
  ...Object.fromEntries(Object.entries(exactStrings).map(([k, [a]]) => [k, a])),
  ...Object.fromEntries(Object.entries(demoScanned).map(([k, [a]]) => [k, a])),
  CONTROL_LABEL_MAGNITUDE: CONTROL_LABELS.magnitudePercent,
  CONTROL_LABEL_DURATION: CONTROL_LABELS.durationDays,
  COMMODITY_SCOPE_ERROR_MESSAGE,
};

describe('scenario control constants', () => {
  it('COMMODITY_SCOPES is exactly oil, lng, both', () => {
    expect([...COMMODITY_SCOPES]).toEqual(['oil', 'lng', 'both']);
  });

  it('numeric control labels equal their literals and appear verbatim in requirements.md', () => {
    expect(CONTROL_LABELS.magnitudePercent).toBe(
      'Hypothetical percentage reduction in baseline transit flow',
    );
    expect(CONTROL_LABELS.durationDays).toBe('Hypothetical duration (days)');
    expect(requirements).toContain(CONTROL_LABELS.magnitudePercent);
    expect(requirements).toContain(CONTROL_LABELS.durationDays);
  });

  it('commodity scope label and error message equal their literals', () => {
    expect(CONTROL_LABELS.commodityScope).toBe('Commodity scope');
    expect(COMMODITY_SCOPE_ERROR_MESSAGE).toBe(
      'Commodity scope must be one of oil, lng or both.',
    );
  });
});

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

describe('demo constants', () => {
  for (const [name, [actual, expected]] of [
    ...Object.entries(demoScanned),
    ...Object.entries(demoNotScanned),
  ]) {
    it(`${name} equals the expected literal and appears verbatim in requirements.md`, () => {
      expect(actual).toBe(expected);
      expect(requirements).toContain(actual);
    });
  }

  it('Return-to label is shared by the banner control and the Mode_Toggle', () => {
    expect(DEMO_BANNER_RETURN_LABEL).toBe(MODE_TOGGLE_LABELS.toHistorical);
  });

  it('has the App_Modes, default and demo content rule constants', () => {
    expect([...APP_MODES]).toEqual(['historical', 'demo']);
    expect(DEFAULT_APP_MODE).toBe('historical');
    expect(DEMO_ID_PREFIX).toBe('demo-');
    expect(DEMO_DATASET_KIND).toBe('illustrative-demo');
    expect(DEMO_FICTIONAL_MARKER).toBe('(fictional)');
    expect(DEMO_UNIT_MARKER).toBe('demo');
    expect(DEMO_VALUE_MULTIPLE).toBe(10);
    expect([...DEMO_FORBIDDEN_SOURCE_NAMES]).toEqual(['EIA', 'IEA', 'UNCTAD', 'Vortexa', 'Kpler', 'OPEC']);
    for (const name of DEMO_FORBIDDEN_SOURCE_NAMES) expect(requirements).toContain(name);
    expect(requirements).toContain(`\`${DEMO_ID_PREFIX}\``);
    expect(requirements).toContain(`"${DEMO_FICTIONAL_MARKER}"`);
  });

  it('keeps "Illustrative" out of the historical Class_Label set', () => {
    expect(Object.values(CLASS_LABELS)).not.toContain(ILLUSTRATIVE_LABEL);
  });
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
      for (const [name, actual] of Object.entries(scanStrings)) {
        if (text.includes(actual)) offenders.push(`${f}: ${name}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
