import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  COMMODITY_SCOPES,
  CONTROL_LABELS,
  DURATION_RANGE,
  MAGNITUDE_RANGE,
} from '../src/config/constants';
import { validateIntegerInRange, validateScenarioInput } from '../src/domain/validation';
import {
  ChokepointDeclarationSchema,
  CommodityDeclarationSchema,
  DatasetDeclarationSchema,
  DependencyShareSchema,
  EconomyDeclarationSchema,
  GraphEdgeSchema,
  GraphNodeSchema,
  HistoricalObservationSchema,
  QualitativeDependencySchema,
  SourceRecordSchema,
} from '../src/data/schema';
import {
  arbCommodityScope,
  arbDatePair,
  arbDeclaration,
  arbDependencyShare,
  arbDependencyShareInput,
  arbDuration,
  arbFlowInput,
  arbGraphEdge,
  arbGraphNode,
  arbHistoricalObservation,
  arbInvalidDatePair,
  arbInvalidNumericString,
  arbIsoDate,
  arbMagnitude,
  arbQualitativeDependency,
  arbSourceRecord,
  arbValidNumericString,
  arbValidScenarioInput,
  arbValidScenarioInputStrings,
} from './generators';
import { buildFcParameters } from './fc-config';

const isRealDate = (s: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(s) && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;

describe('scenario arbitraries', () => {
  it('stay within the shared constants', () => {
    fc.assert(
      fc.property(arbMagnitude, arbDuration, arbCommodityScope, (m, d, s) => {
        expect(m).toBeGreaterThanOrEqual(MAGNITUDE_RANGE.min);
        expect(m).toBeLessThanOrEqual(MAGNITUDE_RANGE.max);
        expect(d).toBeGreaterThanOrEqual(DURATION_RANGE.min);
        expect(d).toBeLessThanOrEqual(DURATION_RANGE.max);
        expect(COMMODITY_SCOPES).toContain(s);
      }),
    );
  });

  it('reach and are accepted at the range boundaries', () => {
    fc.assert(
      fc.property(arbMagnitude, arbDuration, (m, d) => m >= 0 && m <= 100 && d >= 1 && d <= 365),
      { examples: [[0, 1], [100, 365]] },
    );
    for (const [arb, bounds] of [
      [arbMagnitude, [MAGNITUDE_RANGE.min, MAGNITUDE_RANGE.max]],
      [arbDuration, [DURATION_RANGE.min, DURATION_RANGE.max]],
    ] as const) {
      const sample = new Set(fc.sample(arb, { numRuns: 3000, seed: 42 }));
      for (const b of bounds) expect(sample.has(b)).toBe(true);
    }
    for (const input of [
      { magnitudePercent: 0, durationDays: 1, commodityScope: 'oil' },
      { magnitudePercent: 100, durationDays: 365, commodityScope: 'both' },
    ]) {
      expect(validateScenarioInput(input).ok).toBe(true);
    }
  });

  it('valid scenario inputs (number and string forms) are accepted with the same values', () => {
    fc.assert(
      fc.property(arbValidScenarioInput, arbValidScenarioInputStrings, (n, s) => {
        const rn = validateScenarioInput(n);
        expect(rn.ok && rn.value).toEqual(n);
        const rs = validateScenarioInput({ ...s, magnitudePercent: s.magnitudePercent, durationDays: s.durationDays });
        expect(rs.ok).toBe(true);
      }),
    );
    fc.assert(
      fc.property(arbValidScenarioInput, (n) => {
        const rs = validateScenarioInput({
          magnitudePercent: String(n.magnitudePercent),
          durationDays: String(n.durationDays),
          commodityScope: n.commodityScope,
        });
        expect(rs.ok && rs.value).toEqual(n);
      }),
    );
  });
});

describe('numeric string arbitraries', () => {
  const label = CONTROL_LABELS.magnitudePercent;
  const { min, max } = MAGNITUDE_RANGE;

  it('valid strings are accepted and normalised', () => {
    fc.assert(
      fc.property(arbValidNumericString(min, max), ({ raw, expected }) => {
        const r = validateIntegerInRange(raw, min, max, label);
        expect(r.ok).toBe(true);
        expect(r.value).toBe(expected);
      }),
    );
    fc.assert(
      fc.property(arbValidNumericString(DURATION_RANGE.min, DURATION_RANGE.max), ({ raw, expected }) => {
        const r = validateIntegerInRange(raw, DURATION_RANGE.min, DURATION_RANGE.max, label);
        expect(r.value).toBe(expected);
      }),
    );
  });

  it('invalid strings are rejected with the exact message', () => {
    for (const [lo, hi] of [
      [min, max],
      [DURATION_RANGE.min, DURATION_RANGE.max],
    ]) {
      fc.assert(
        fc.property(arbInvalidNumericString(lo, hi), ({ raw }) => {
          const r = validateIntegerInRange(raw, lo, hi, label);
          expect(r.ok).toBe(false);
          expect(r.errorMessage).toBe(`${label} must be a whole number from ${lo} to ${hi}.`);
        }),
      );
    }
  });

  it('covers every invalid kind', () => {
    const kinds = new Set(fc.sample(arbInvalidNumericString(min, max), { numRuns: 1000, seed: 7 }).map((x) => x.kind));
    expect([...kinds].sort()).toEqual(
      ['above-max', 'below-min', 'decimal', 'empty', 'internal-whitespace', 'non-numeric'].sort(),
    );
  });
});

describe('engine input arbitraries', () => {
  it('flow inputs carry periodDayCount only on the per-year branch', () => {
    fc.assert(
      fc.property(arbFlowInput, (f) => {
        expect(Number.isFinite(f.baselineTransitFlow) && f.baselineTransitFlow >= 0).toBe(true);
        if (f.timeBasis === 'per-year') {
          expect(Number.isInteger(f.periodDayCount)).toBe(true);
          expect(f.periodDayCount).toBeGreaterThan(0);
        } else {
          expect('periodDayCount' in f).toBe(false);
        }
      }),
    );
    const sample = fc.sample(arbFlowInput, { numRuns: 500, seed: 3 });
    expect(new Set(sample.map((f) => f.timeBasis))).toEqual(new Set(['per-day', 'per-year']));
  });

  it('dependency shares are within 0..100', () => {
    fc.assert(
      fc.property(arbDependencyShareInput, (d) => {
        expect(d.chokepointTransitImportSharePercent).toBeGreaterThanOrEqual(0);
        expect(d.chokepointTransitImportSharePercent).toBeLessThanOrEqual(100);
      }),
    );
  });
});

describe('dates', () => {
  it('iso dates are real; pairs are ordered; invalid pairs are reversed', () => {
    fc.assert(fc.property(arbIsoDate, (d) => isRealDate(d)));
    fc.assert(
      fc.property(arbDatePair, (p) => isRealDate(p.start) && isRealDate(p.end) && p.end >= p.start),
    );
    fc.assert(fc.property(arbInvalidDatePair, (p) => p.end < p.start));
  });
});

describe('dataset record arbitraries satisfy the Zod schemas', () => {
  const cases = [
    ['SourceRecord', arbSourceRecord, SourceRecordSchema],
    ['HistoricalObservation', arbHistoricalObservation, HistoricalObservationSchema],
    ['DependencyShare', arbDependencyShare, DependencyShareSchema],
    ['QualitativeDependency', arbQualitativeDependency, QualitativeDependencySchema],
    ['GraphNode', arbGraphNode, GraphNodeSchema],
    ['GraphEdge', arbGraphEdge, GraphEdgeSchema],
    ['DatasetDeclaration', arbDeclaration, DatasetDeclarationSchema],
    ['ChokepointDeclaration', arbDeclaration, ChokepointDeclarationSchema],
    ['CommodityDeclaration', arbDeclaration, CommodityDeclarationSchema],
    ['EconomyDeclaration', arbDeclaration, EconomyDeclarationSchema],
  ] as const;
  for (const [name, arb, schema] of cases) {
    it(name, () => {
      fc.assert(
        fc.property(arb as fc.Arbitrary<unknown>, (rec) => {
          const r = schema.safeParse(rec);
          if (!r.success) throw new Error(JSON.stringify(r.error.issues));
        }),
      );
    });
  }
});

describe('fast-check configuration', () => {
  it('defaults to at least 100 runs and reads FC_SEED', () => {
    expect(buildFcParameters({}).numRuns).toBeGreaterThanOrEqual(100);
    expect(buildFcParameters({ FC_SEED: '123' })).toMatchObject({ seed: 123 });
    expect(fc.readConfigureGlobal().numRuns).toBeGreaterThanOrEqual(100);
  });
});

describe('dev-only dependency boundary', () => {
  it('no file under src/ imports fast-check or tests/', () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((n) => {
        const p = join(dir, n);
        return statSync(p).isDirectory() ? walk(p) : [p];
      });
    const offenders = walk('src')
      .filter((f) => /\.(ts|tsx)$/.test(f))
      .filter((f) => /from\s+['"]fast-check['"]|from\s+['"][./]*\/?tests\/|require\(['"]fast-check/.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
