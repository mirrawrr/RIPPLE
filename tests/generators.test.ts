import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  COMMODITY_SCOPES,
  CONTROL_LABELS,
  DEMO_FICTIONAL_MARKER,
  DEMO_ID_PREFIX,
  DEMO_UNIT_MARKER,
  DEMO_VALUE_MULTIPLE,
  DURATION_RANGE,
  MAGNITUDE_RANGE,
} from '../src/config/constants';
import {
  HISTORICAL_FIELD_NAMES,
  arbDemoDataset,
  arbDemoDeclaration,
  arbDemoDeclarations,
  arbDemoDependencyShare,
  arbDemoFlow,
  arbDemoWithHistoricalField,
  arbInvalidDemoCase,
} from './generators.demo';
import { validateIntegerInRange, validateScenarioInput } from '../src/domain/validation';
import {
  ChokepointDeclarationSchema,
  CommodityDeclarationSchema,
  DatasetDeclarationSchema,
  DemoDatasetSchema,
  DemoDependencyShareSchema,
  DemoFlowSchema,
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

describe('demo arbitraries', () => {
  const ID_OK = (s: string) => s.startsWith(DEMO_ID_PREFIX);

  it('valid demo records, declarations and datasets satisfy the demo schemas', () => {
    fc.assert(fc.property(arbDemoFlow, (r) => DemoFlowSchema.safeParse(r).success));
    fc.assert(fc.property(arbDemoDependencyShare, (r) => DemoDependencyShareSchema.safeParse(r).success));
    fc.assert(fc.property(arbDemoDeclaration, (r) => ChokepointDeclarationSchema.safeParse(r).success));
    fc.assert(
      fc.property(arbDemoDeclarations, (ds) => ds.length > 0 && ds.every((d) => ChokepointDeclarationSchema.safeParse(d).success)),
    );
    fc.assert(
      fc.property(arbDemoDataset, (d) => {
        const r = DemoDatasetSchema.safeParse(d);
        if (!r.success) throw new Error(JSON.stringify(r.error.issues));
      }),
    );
  });

  it('valid demo datasets follow the demo content rules and resolve their references', () => {
    fc.assert(
      fc.property(arbDemoDataset, (d) => {
        const chokepoints = new Set(d.chokepoints.map((x) => x.id));
        const commodities = new Set(d.commodities.map((x) => x.id));
        const economies = new Set(d.economies.map((x) => x.id));
        const ids = [
          d.datasetId,
          ...d.chokepoints.map((x) => x.id),
          ...d.commodities.map((x) => x.id),
          ...d.economies.map((x) => x.id),
          ...d.flows.map((x) => x.id),
          ...d.dependencyShares.map((x) => x.id),
        ];
        expect(ids.every(ID_OK)).toBe(true);
        expect(new Set(ids).size).toBe(ids.length);
        expect(d.economies.every((e) => e.name.includes(DEMO_FICTIONAL_MARKER))).toBe(true);
        expect(d.flows.every((f) => f.unit.toLowerCase().includes(DEMO_UNIT_MARKER))).toBe(true);
        expect(d.flows.every((f) => f.value % DEMO_VALUE_MULTIPLE === 0)).toBe(true);
        expect(
          d.dependencyShares.every((s) => s.chokepointTransitImportSharePercent % DEMO_VALUE_MULTIPLE === 0),
        ).toBe(true);
        expect(d.flows.every((f) => chokepoints.has(f.chokepointId) && commodities.has(f.commodityId))).toBe(true);
        expect(
          d.dependencyShares.every(
            (s) => chokepoints.has(s.chokepointId) && commodities.has(s.commodityId) && economies.has(s.economyId),
          ),
        ).toBe(true);
      }),
    );
  });

  it('invalid demo cases are rejected, and every historical field is covered', () => {
    fc.assert(
      fc.property(arbInvalidDemoCase, (c) => {
        const schema = c.target === 'flow' ? DemoFlowSchema : c.target === 'share' ? DemoDependencyShareSchema : DemoDatasetSchema;
        expect(schema.safeParse(c.record).success, c.kind).toBe(false);
      }),
    );
    const fields = new Set(fc.sample(arbDemoWithHistoricalField, { numRuns: 1000, seed: 11 }).map((c) => c.field));
    expect([...fields].sort()).toEqual([...HISTORICAL_FIELD_NAMES].sort());
  });
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
