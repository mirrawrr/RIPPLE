/**
 * fast-check arbitraries for the Demo_Dataset (dev/test only; never imported from src/).
 *
 * Valid arbitraries satisfy DemoDatasetSchema and also the demo content rules that
 * build check D3 enforces (Task 2.7): `demo-` ids, "(fictional)" economy names,
 * units containing "demo", values and shares that are multiples of 10. Every
 * reference resolves inside the generated dataset. Invalid arbitraries start from a
 * valid record and break exactly one thing.
 */
import fc from 'fast-check';
import {
  DEMO_DATASET_KIND,
  DEMO_DATA_NOTICE,
  DEMO_FICTIONAL_MARKER,
  DEMO_ID_PREFIX,
  DEMO_UNIT_MARKER,
  DEMO_VALUE_MULTIPLE,
} from '../src/config/constants';

/* ---------- Building blocks ---------- */

const LETTERS = ['a', 'b', 'c', 'd'] as const;
const demoId = (...parts: string[]): string => `${DEMO_ID_PREFIX}${parts.join('-')}`;

/** Multiple of DEMO_VALUE_MULTIPLE, 0 to 1,000,000. */
export const arbDemoValue: fc.Arbitrary<number> = fc
  .integer({ min: 0, max: 100_000 })
  .map((n) => n * DEMO_VALUE_MULTIPLE);

/** Share: multiple of DEMO_VALUE_MULTIPLE in 0..100. */
export const arbDemoSharePercent: fc.Arbitrary<number> = fc
  .integer({ min: 0, max: 100 / DEMO_VALUE_MULTIPLE })
  .map((n) => n * DEMO_VALUE_MULTIPLE);

/** Unit text containing the demo marker. */
export const arbDemoUnit: fc.Arbitrary<string> = fc
  .constantFrom('oil', 'lng', 'gas', 'cargo')
  .map((w) => `${DEMO_UNIT_MARKER} ${w} units`);

/** Fictional assumption sentence naming no publisher. */
export const arbFictionalAssumption: fc.Arbitrary<string> = fc
  .stringMatching(/^[a-z]{3,10}( [a-z]{3,10}){0,4}$/)
  .map((s) => `Round synthetic value for ${s}; it is not an observation.`);

/** Day count for a per-year demo flow: any positive integer, no reference year. */
const arbDemoDays: fc.Arbitrary<number> = fc.oneof(
  fc.constantFrom(365, 366),
  fc.integer({ min: 1, max: 100_000 }),
);

/* ---------- Declarations ---------- */

export interface DemoDeclaration {
  id: string;
  name: string;
  description?: string;
}

export const arbDemoChokepointDeclaration: fc.Arbitrary<DemoDeclaration> = fc
  .stringMatching(/^[a-z]{1,8}$/)
  .map((s) => ({ id: demoId('chokepoint', s), name: `Demo chokepoint ${s} (illustrative scenario location)` }));

export const arbDemoCommodityDeclaration: fc.Arbitrary<DemoDeclaration> = fc
  .stringMatching(/^[a-z]{1,8}$/)
  .map((s) => ({ id: demoId('commodity', s), name: `Demo commodity ${s} (${DEMO_UNIT_MARKER} units)` }));

export const arbDemoEconomyDeclaration: fc.Arbitrary<DemoDeclaration> = fc
  .constantFrom(...LETTERS)
  .map((l) => ({
    id: demoId('economy', l),
    name: `Demo Economy ${l.toUpperCase()} ${DEMO_FICTIONAL_MARKER}`,
  }));

/** Any one valid demo declaration (chokepoint, commodity or economy). */
export const arbDemoDeclaration: fc.Arbitrary<DemoDeclaration> = fc.oneof(
  arbDemoChokepointDeclaration,
  arbDemoCommodityDeclaration,
  arbDemoEconomyDeclaration,
);

/** A non-empty list of valid declarations with distinct ids. */
export const arbDemoDeclarations: fc.Arbitrary<DemoDeclaration[]> = fc
  .array(arbDemoDeclaration, { minLength: 1, maxLength: 6 })
  .map((ds) => [...new Map(ds.map((d) => [d.id, d])).values()]);

/* ---------- Records ---------- */

export interface DemoFlowRecord {
  id: string;
  synthetic: true;
  chokepointId: string;
  commodityId: string;
  value: number;
  unit: string;
  timeBasis: 'per-day' | 'per-year';
  periodDayCount?: { days: number };
  fictionalAssumption: string;
}

export interface DemoShareRecord {
  id: string;
  synthetic: true;
  chokepointId: string;
  commodityId: string;
  economyId: string;
  chokepointTransitImportSharePercent: number;
  fictionalAssumption: string;
}

const arbFlowCore = fc.record({
  id: fc.stringMatching(/^[a-z0-9]{1,8}$/).map((s) => demoId('flow', s)),
  synthetic: fc.constant(true as const),
  chokepointId: fc.stringMatching(/^[a-z]{1,8}$/).map((s) => demoId('chokepoint', s)),
  commodityId: fc.stringMatching(/^[a-z]{1,8}$/).map((s) => demoId('commodity', s)),
  value: arbDemoValue,
  unit: arbDemoUnit,
  fictionalAssumption: arbFictionalAssumption,
});

export const arbDemoFlowPerDay: fc.Arbitrary<DemoFlowRecord> = arbFlowCore.map((c) => ({
  ...c,
  timeBasis: 'per-day' as const,
}));

export const arbDemoFlowPerYear: fc.Arbitrary<DemoFlowRecord> = fc
  .tuple(arbFlowCore, arbDemoDays)
  .map(([c, days]) => ({ ...c, timeBasis: 'per-year' as const, periodDayCount: { days } }));

export const arbDemoFlow: fc.Arbitrary<DemoFlowRecord> = fc.oneof(arbDemoFlowPerDay, arbDemoFlowPerYear);

export const arbDemoDependencyShare: fc.Arbitrary<DemoShareRecord> = fc.record({
  id: fc.stringMatching(/^[a-z0-9]{1,8}$/).map((s) => demoId('share', s)),
  synthetic: fc.constant(true as const),
  chokepointId: fc.stringMatching(/^[a-z]{1,8}$/).map((s) => demoId('chokepoint', s)),
  commodityId: fc.stringMatching(/^[a-z]{1,8}$/).map((s) => demoId('commodity', s)),
  economyId: fc.constantFrom(...LETTERS).map((l) => demoId('economy', l)),
  chokepointTransitImportSharePercent: arbDemoSharePercent,
  fictionalAssumption: arbFictionalAssumption,
});

/* ---------- Dataset ---------- */

export interface DemoDatasetRecord {
  kind: typeof DEMO_DATASET_KIND;
  synthetic: true;
  schemaVersion: string;
  datasetId: string;
  notice: typeof DEMO_DATA_NOTICE;
  chokepoints: DemoDeclaration[];
  commodities: DemoDeclaration[];
  economies: DemoDeclaration[];
  flows: DemoFlowRecord[];
  dependencyShares: DemoShareRecord[];
  assumptions: string[];
}

/**
 * Valid, internally consistent Demo_Dataset: one chokepoint, one or two commodities
 * with one flow each, one to four economies, and unique (commodity, economy) shares.
 * Every chokepointId, commodityId and economyId resolves inside the dataset.
 */
export const arbDemoDataset: fc.Arbitrary<DemoDatasetRecord> = fc
  .record({
    commodityCount: fc.integer({ min: 1, max: 2 }),
    economyCount: fc.integer({ min: 1, max: LETTERS.length }),
    flowShapes: fc.array(
      fc.record({ value: arbDemoValue, unit: arbDemoUnit, days: fc.option(arbDemoDays, { nil: undefined }) }),
      { minLength: 2, maxLength: 2 },
    ),
    shareValues: fc.array(arbDemoSharePercent, { minLength: 8, maxLength: 8 }),
    assumption: arbFictionalAssumption,
    assumptions: fc.array(arbFictionalAssumption, { minLength: 1, maxLength: 3 }),
    schemaVersion: fc.constantFrom('1', '2', '1.0.0'),
  })
  .map((s): DemoDatasetRecord => {
    const chokepointId = demoId('chokepoint', 'hormuz');
    const commodityIds = ['oil', 'lng'].slice(0, s.commodityCount).map((c) => demoId(c));
    const economyLetters = LETTERS.slice(0, s.economyCount);
    const flows = commodityIds.map((commodityId, i): DemoFlowRecord => {
      const shape = s.flowShapes[i];
      const base = {
        id: demoId('flow', commodityId.slice(DEMO_ID_PREFIX.length)),
        synthetic: true as const,
        chokepointId,
        commodityId,
        value: shape.value,
        unit: shape.unit,
        fictionalAssumption: s.assumption,
      };
      return shape.days === undefined
        ? { ...base, timeBasis: 'per-day' }
        : { ...base, timeBasis: 'per-year', periodDayCount: { days: shape.days } };
    });
    const dependencyShares = commodityIds.flatMap((commodityId, ci) =>
      economyLetters.map((l, ei): DemoShareRecord => ({
        id: demoId('share', commodityId.slice(DEMO_ID_PREFIX.length), l),
        synthetic: true,
        chokepointId,
        commodityId,
        economyId: demoId('economy', l),
        chokepointTransitImportSharePercent: s.shareValues[ci * LETTERS.length + ei],
        fictionalAssumption: s.assumption,
      })),
    );
    return {
      kind: DEMO_DATASET_KIND,
      synthetic: true,
      schemaVersion: s.schemaVersion,
      datasetId: demoId('dataset'),
      notice: DEMO_DATA_NOTICE,
      chokepoints: [{ id: chokepointId, name: 'Demo chokepoint (illustrative scenario location)' }],
      commodities: commodityIds.map((id) => ({ id, name: `Demo ${id.slice(DEMO_ID_PREFIX.length)} (${DEMO_UNIT_MARKER} units)` })),
      economies: economyLetters.map((l) => ({
        id: demoId('economy', l),
        name: `Demo Economy ${l.toUpperCase()} ${DEMO_FICTIONAL_MARKER}`,
      })),
      flows,
      dependencyShares,
      assumptions: s.assumptions,
    };
  });

/* ---------- Invalid cases ---------- */

/** Fields a Synthetic_Record must never carry (Req 22.10), each with a plausible historical value. */
export const HISTORICAL_FIELD_VALUES: Readonly<Record<string, unknown>> = {
  sourceRecordIds: ['test-source-1'],
  verificationStatus: 'verified',
  publicationDate: '2024-01-01',
  lastUpdatedDate: '2024-01-01',
  retrievalDate: '2024-01-01',
  url: 'https://example.org/x',
  sourceUrl: 'https://example.org/x',
  licence: 'test licence',
  attribution: 'test attribution',
};

export const HISTORICAL_FIELD_NAMES: readonly string[] = Object.keys(HISTORICAL_FIELD_VALUES);

export type DemoTarget = 'flow' | 'share' | 'dataset';

export interface InvalidDemoCase {
  target: DemoTarget;
  /** What was broken, for failure messages. */
  kind: string;
  record: unknown;
}

const arbTarget: fc.Arbitrary<DemoTarget> = fc.constantFrom('flow', 'share', 'dataset');

const validFor = (target: DemoTarget): fc.Arbitrary<Record<string, unknown>> =>
  (target === 'flow'
    ? arbDemoFlow
    : target === 'share'
      ? arbDemoDependencyShare
      : arbDemoDataset) as fc.Arbitrary<unknown> as fc.Arbitrary<Record<string, unknown>>;

/** A valid demo record or dataset with exactly one historical field injected. */
export const arbDemoWithHistoricalField: fc.Arbitrary<InvalidDemoCase & { field: string }> = fc
  .tuple(arbTarget, fc.constantFrom(...HISTORICAL_FIELD_NAMES))
  .chain(([target, field]) =>
    validFor(target).map((rec) => ({
      target,
      kind: `historical field ${field}`,
      field,
      record: { ...rec, [field]: HISTORICAL_FIELD_VALUES[field] },
    })),
  );

/** `synthetic` removed or not exactly true. */
export const arbDemoBadSynthetic: fc.Arbitrary<InvalidDemoCase> = fc
  .tuple(arbTarget, fc.constantFrom('missing', false, 'true', 1, null))
  .chain(([target, bad]) =>
    validFor(target).map((rec) => {
      const { synthetic: _drop, ...rest } = rec;
      void _drop;
      return {
        target,
        kind: `synthetic ${String(bad)}`,
        record: bad === 'missing' ? rest : { ...rest, synthetic: bad },
      };
    }),
  );

/** Dataset `kind` missing or not the demo kind. */
export const arbDemoBadKind: fc.Arbitrary<InvalidDemoCase> = fc
  .tuple(arbDemoDataset, fc.constantFrom('missing', 'curated', '', 'Illustrative-Demo', 7))
  .map(([ds, bad]) => {
    const { kind: _drop, ...rest } = ds;
    void _drop;
    return { target: 'dataset' as const, kind: `kind ${String(bad)}`, record: bad === 'missing' ? rest : { ...rest, kind: bad } };
  });

/** Dataset `notice` missing or different from the Demo_Data_Notice. */
export const arbDemoBadNotice: fc.Arbitrary<InvalidDemoCase> = fc
  .tuple(arbDemoDataset, fc.constantFrom('missing', '', `${DEMO_DATA_NOTICE} `, 'Other notice'))
  .map(([ds, bad]) => {
    const { notice: _drop, ...rest } = ds;
    void _drop;
    return { target: 'dataset' as const, kind: `notice ${JSON.stringify(bad)}`, record: bad === 'missing' ? rest : { ...rest, notice: bad } };
  });

const arbBadNumber = fc.constantFrom(-1, -0.5, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, '10', null);

/** Malformed numeric values and day counts on a flow or share. */
export const arbDemoMalformedValue: fc.Arbitrary<InvalidDemoCase> = fc.oneof(
  fc.tuple(arbDemoFlow, arbBadNumber).map(([f, bad]) => ({
    target: 'flow' as const,
    kind: `flow value ${String(bad)}`,
    record: { ...f, value: bad },
  })),
  fc
    .tuple(
      arbDemoDependencyShare,
      fc.oneof(
        arbBadNumber,
        fc.integer({ min: 101, max: 1_000_000 }),
        fc.double({ min: 100.0001, max: 1e6, noNaN: true }),
      ),
    )
    .map(([s, bad]) => ({
      target: 'share' as const,
      kind: `share ${String(bad)}`,
      record: { ...s, chokepointTransitImportSharePercent: bad },
    })),
  fc
    .tuple(arbDemoFlowPerYear, fc.constantFrom(0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 60, '365', null))
    .map(([f, bad]) => ({
      target: 'flow' as const,
      kind: `periodDayCount.days ${String(bad)}`,
      record: { ...f, periodDayCount: { days: bad } },
    })),
  fc.tuple(arbDemoFlowPerYear).map(([f]) => {
    const { periodDayCount: _drop, ...rest } = f;
    void _drop;
    return { target: 'flow' as const, kind: 'per-year without periodDayCount', record: rest };
  }),
  fc.tuple(arbDemoFlowPerYear).map(([f]) => ({
    target: 'flow' as const,
    kind: 'periodDayCount with an extra key',
    record: { ...f, periodDayCount: { ...f.periodDayCount, referenceYear: 2024 } },
  })),
  fc.tuple(arbDemoFlow).map(([f]) => ({
    target: 'flow' as const,
    kind: 'blank fictionalAssumption',
    record: { ...f, fictionalAssumption: '   ' },
  })),
);

/** Union of every invalid case; each must be rejected by its target's schema. */
export const arbInvalidDemoCase: fc.Arbitrary<InvalidDemoCase> = fc.oneof(
  arbDemoWithHistoricalField,
  arbDemoBadSynthetic,
  arbDemoBadKind,
  arbDemoBadNotice,
  arbDemoMalformedValue,
);
