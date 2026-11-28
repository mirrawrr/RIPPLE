/**
 * Shared fast-check arbitraries (dev/test only; never imported from src/).
 * All ids, names, units and numbers are synthetic.
 */
import fc from 'fast-check';
import {
  COMMODITY_SCOPES,
  DURATION_RANGE,
  MAGNITUDE_RANGE,
  type CommodityScope,
} from '../src/config/constants';
import type { DependencyShareInput, FlowInput } from '../src/engine/types';

/* ---------- Scenario inputs ---------- */

export const arbMagnitude: fc.Arbitrary<number> = fc.integer({
  min: MAGNITUDE_RANGE.min,
  max: MAGNITUDE_RANGE.max,
});

export const arbDuration: fc.Arbitrary<number> = fc.integer({
  min: DURATION_RANGE.min,
  max: DURATION_RANGE.max,
});

export const arbCommodityScope: fc.Arbitrary<CommodityScope> = fc.constantFrom(...COMMODITY_SCOPES);

/*
 * Field names follow src/config/constants.ts and src/domain/validation.ts
 * (magnitudePercent, durationDays, commodityScope). design.md's ActiveScenario
 * uses disruptionMagnitude / disruptionDuration: a naming discrepancy.
 */
export interface ScenarioInputNumbers {
  magnitudePercent: number;
  durationDays: number;
  commodityScope: CommodityScope;
}
export interface ScenarioInputStrings {
  magnitudePercent: string;
  durationDays: string;
  commodityScope: CommodityScope;
}

/** Number form of a valid scenario input. */
export const arbValidScenarioInput: fc.Arbitrary<ScenarioInputNumbers> = fc.record({
  magnitudePercent: arbMagnitude,
  durationDays: arbDuration,
  commodityScope: arbCommodityScope,
});

/** String form (what controls and the URL produce) of a valid scenario input. */
export const arbValidScenarioInputStrings: fc.Arbitrary<ScenarioInputStrings> = arbValidScenarioInput.map(
  (s) => ({
    magnitudePercent: String(s.magnitudePercent),
    durationDays: String(s.durationDays),
    commodityScope: s.commodityScope,
  }),
);

/* ---------- Numeric strings (Property 12) ---------- */

const WS_CHARS = [' ', '\t', '\n', '\r'] as const;
const arbWhitespace = fc.stringMatching(/^[ \t\n\r]{0,3}$/);
const arbDigits = (min: number, max: number) => fc.stringMatching(new RegExp(`^[0-9]{${min},${max}}$`));

export interface ValidNumericString {
  raw: string;
  expected: number;
}

/** In-range integer text, optionally padded with ASCII whitespace and leading zeros. */
export function arbValidNumericString(min: number, max: number): fc.Arbitrary<ValidNumericString> {
  return fc
    .record({
      value: fc.integer({ min, max }),
      zeros: fc.integer({ min: 0, max: 3 }),
      lead: arbWhitespace,
      trail: arbWhitespace,
    })
    .map(({ value, zeros, lead, trail }) => ({
      raw: `${lead}${'0'.repeat(zeros)}${value}${trail}`,
      expected: value,
    }));
}

export type InvalidNumericKind =
  | 'empty'
  | 'internal-whitespace'
  | 'non-numeric'
  | 'decimal'
  | 'below-min'
  | 'above-max';

export interface InvalidNumericString {
  raw: string;
  kind: InvalidNumericKind;
}

/** Text that validateIntegerInRange(raw, min, max, ...) must reject. */
export function arbInvalidNumericString(min: number, max: number): fc.Arbitrary<InvalidNumericString> {
  const empty = fc
    .stringMatching(/^[ \t\n\r]{0,4}$/)
    .map((raw): InvalidNumericString => ({ raw, kind: 'empty' }));

  const internalWhitespace = fc
    .tuple(arbWhitespace, arbDigits(1, 4), fc.constantFrom(...WS_CHARS), arbDigits(1, 4), arbWhitespace)
    .map(([a, d1, ws, d2, b]): InvalidNumericString => ({
      raw: `${a}${d1}${ws}${d2}${b}`,
      kind: 'internal-whitespace',
    }));

  const fixedNonNumeric = ['NaN', 'Infinity', '-Infinity', '+', '-', '+5', '-0', '1e3', '0x10', '$', '5%', '\u0663'];
  const nonNumeric = fc
    .oneof(
      fc.constantFrom(...fixedNonNumeric),
      fc.stringMatching(/^[A-Za-z!@#$%^&*()_=<>?/]{1,6}$/),
      fc.tuple(arbDigits(1, 3), fc.stringMatching(/^[A-Za-z]{1,3}$/)).map(([d, l]) => `${d}${l}`),
    )
    .map((raw): InvalidNumericString => ({ raw, kind: 'non-numeric' }));

  const decimal = fc
    .oneof(
      fc.tuple(arbDigits(1, 3), fc.constantFrom('.', ','), arbDigits(0, 3)).map(([a, s, b]) => `${a}${s}${b}`),
      fc.tuple(fc.constantFrom('.', ','), arbDigits(1, 3)).map(([s, b]) => `${s}${b}`),
      fc.integer({ min, max }).map((v) => `${v}.0`),
    )
    .map((raw): InvalidNumericString => ({ raw, kind: 'decimal' }));

  const belowCandidates: fc.Arbitrary<string>[] = [
    fc.integer({ min: 1, max: 1_000_000 }).map((n) => `-${n}`),
  ];
  if (min > 0) belowCandidates.push(fc.integer({ min: 0, max: min - 1 }).map(String));
  const belowMin = fc
    .oneof(...belowCandidates)
    .map((raw): InvalidNumericString => ({ raw, kind: 'below-min' }));

  const aboveMax = fc
    .oneof(
      fc.integer({ min: max + 1, max: max + 1_000_000 }).map(String),
      arbDigits(16, 25).map((d) => `9${d}`),
    )
    .map((raw): InvalidNumericString => ({ raw, kind: 'above-max' }));

  return fc.oneof(empty, internalWhitespace, nonNumeric, decimal, belowMin, aboveMax);
}

/* ---------- Engine inputs (test-only mirror of design.md) ---------- */

export type { DependencyShareInput, FlowInput };

const arbSynthId = (prefix: string) =>
  fc.stringMatching(/^[a-z0-9]{1,8}$/).map((s) => `test-${prefix}-${s}`);

const arbFlowValue = fc.double({ min: 0, max: 1e9, noNaN: true, noDefaultInfinity: true });
const arbUnit = fc.constantFrom('test-unit-a', 'test-unit-b', 'test-unit-c');

/** Calendar-year day counts and multi-year / arbitrary positive integers. */
export const arbPeriodDayCount: fc.Arbitrary<number> = fc.oneof(
  fc.constantFrom(365, 366),
  fc.integer({ min: 1, max: 5 * 366 }),
  fc.integer({ min: 1, max: 100_000 }),
);

const arbFlowBase = fc.record({
  chokepointId: arbSynthId('chokepoint'),
  commodityId: arbSynthId('commodity'),
  baselineTransitFlow: arbFlowValue,
  unit: arbUnit,
});

export const arbFlowInputPerDay: fc.Arbitrary<FlowInput> = arbFlowBase.map((b) => ({
  ...b,
  timeBasis: 'per-day' as const,
}));

export const arbFlowInputPerYear: fc.Arbitrary<FlowInput> = fc
  .tuple(arbFlowBase, arbPeriodDayCount)
  .map(([b, periodDayCount]) => ({ ...b, timeBasis: 'per-year' as const, periodDayCount }));

export const arbFlowInput: fc.Arbitrary<FlowInput> = fc.oneof(arbFlowInputPerDay, arbFlowInputPerYear);

export const arbSharePercent: fc.Arbitrary<number> = fc.oneof(
  fc.constantFrom(0, 100),
  fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
);

export const arbDependencyShareInput: fc.Arbitrary<DependencyShareInput> = fc.record({
  chokepointId: arbSynthId('chokepoint'),
  commodityId: arbSynthId('commodity'),
  economyId: arbSynthId('economy'),
  economyName: fc.stringMatching(/^[A-Za-z]{1,10}$/).map((s) => `Test ${s}`),
  chokepointTransitImportSharePercent: arbSharePercent,
});

/* ---------- Dates ---------- */

const DATE_MIN_MS = Date.UTC(2000, 0, 1);
const DATE_MAX_MS = Date.UTC(2030, 11, 31);
const DAY_MS = 86_400_000;
const DAY_COUNT = (DATE_MAX_MS - DATE_MIN_MS) / DAY_MS;

const dayIndexToIso = (i: number): string => new Date(DATE_MIN_MS + i * DAY_MS).toISOString().slice(0, 10);

/** Real calendar date YYYY-MM-DD between 2000-01-01 and 2030-12-31. */
export const arbIsoDate: fc.Arbitrary<string> = fc.integer({ min: 0, max: DAY_COUNT }).map(dayIndexToIso);

export interface DatePair {
  start: string;
  end: string;
}

/** end >= start (equal allowed). */
export const arbDatePair: fc.Arbitrary<DatePair> = fc
  .tuple(arbIsoDate, arbIsoDate)
  .map(([a, b]) => (a <= b ? { start: a, end: b } : { start: b, end: a }));

/** end < start, for negative tests. */
export const arbInvalidDatePair: fc.Arbitrary<DatePair> = fc
  .tuple(arbIsoDate, arbIsoDate)
  .filter(([a, b]) => a !== b)
  .map(([a, b]) => (a < b ? { start: b, end: a } : { start: a, end: b }));

/* ---------- Dataset records (satisfy src/data/schema.ts) ---------- */

const arbRecId = (prefix: string) =>
  fc.stringMatching(/^[a-z0-9]{1,8}$/).map((s) => `test-${prefix}-${s}`);

const arbText = fc.stringMatching(/^[A-Za-z][A-Za-z0-9 ]{0,15}$/).map((s) => `Synthetic ${s}`);
const arbVerification = fc.constantFrom('verified', 'unverified');
const arbUrl = fc.stringMatching(/^[a-z0-9]{1,10}$/).map((s) => `https://example.org/${s}`);

export const arbSourceRecord = fc
  .record({
    id: arbRecId('source'),
    publisher: arbText,
    title: arbText,
    url: arbUrl,
    publicationDate: arbIsoDate,
    period: arbDatePair,
    unit: arbUnit,
    retrievalDate: arbIsoDate,
    licence: arbText,
    attributionRequirement: arbText,
    verificationStatus: arbVerification,
    verificationDate: arbIsoDate,
  })
  .map(({ period, ...rest }) => ({
    ...rest,
    referencePeriodStart: period.start,
    referencePeriodEnd: period.end,
  }));

const arbSourceIds = fc.array(arbRecId('source'), { minLength: 1, maxLength: 3 });

const arbObservationCommon = fc.record({
  id: arbRecId('obs'),
  datasetId: arbRecId('dataset'),
  chokepointId: arbRecId('chokepoint'),
  commodityId: arbRecId('commodity'),
  verificationStatus: arbVerification,
  value: fc.double({ min: 0, max: 1e9, noNaN: true, noDefaultInfinity: true }),
  unit: arbUnit,
  sourceRecordIds: arbSourceIds,
});

const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

export const arbHistoricalObservation = fc.oneof(
  fc.tuple(arbObservationCommon, arbDatePair).map(([c, p]) => ({
    ...c,
    timeBasis: 'per-day' as const,
    referencePeriodStart: p.start,
    referencePeriodEnd: p.end,
  })),
  // Calendar-year per-year observation: days match the leap-year status.
  fc.tuple(arbObservationCommon, fc.integer({ min: 2000, max: 2030 })).map(([c, year]) => ({
    ...c,
    timeBasis: 'per-year' as const,
    referencePeriodStart: `${year}-01-01`,
    referencePeriodEnd: `${year}-12-31`,
    periodDayCount: { days: isLeap(year) ? 366 : 365, referenceYear: year, isLeapYear: isLeap(year) },
  })),
  // Non-calendar per-year observation: any positive integer, no referenceYear.
  fc.tuple(arbObservationCommon, arbDatePair, fc.integer({ min: 1, max: 100_000 })).map(([c, p, days]) => ({
    ...c,
    timeBasis: 'per-year' as const,
    referencePeriodStart: p.start,
    referencePeriodEnd: p.end,
    periodDayCount: { days },
  })),
);

export const arbDependencyShare = fc
  .record({
    id: arbRecId('share'),
    datasetId: arbRecId('dataset'),
    chokepointId: arbRecId('chokepoint'),
    commodityId: arbRecId('commodity'),
    economyId: arbRecId('economy'),
    chokepointTransitImportSharePercent: arbSharePercent,
    unit: fc.constant('percent' as const),
    referencePeriod: arbDatePair,
    verificationStatus: arbVerification,
    sourceRecordIds: arbSourceIds,
  });

export const arbQualitativeDependency = fc.record({
  id: arbRecId('qual'),
  datasetId: arbRecId('dataset'),
  chokepointId: arbRecId('chokepoint'),
  commodityId: arbRecId('commodity'),
  economyId: arbRecId('economy'),
  description: arbText,
  referencePeriod: arbDatePair,
  verificationStatus: arbVerification,
  sourceRecordIds: arbSourceIds,
});

export const arbGraphNode = fc.record({
  id: arbRecId('node'),
  type: fc.constantFrom('transport', 'commodity', 'industry', 'economy'),
  name: arbText,
});

export const arbGraphEdge = fc.record({
  id: arbRecId('edge'),
  sourceNodeId: arbRecId('node'),
  targetNodeId: arbRecId('node'),
  relationshipDescription: arbText,
  sourceRecordIds: arbSourceIds,
});

/** Declaration shared by dataset, chokepoint, commodity and economy collections. */
export const arbDeclaration = fc.record({
  id: arbRecId('decl'),
  name: arbText,
  description: fc.option(arbText, { nil: undefined }),
});
