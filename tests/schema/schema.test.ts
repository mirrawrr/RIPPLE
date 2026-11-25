import { describe, expect, expectTypeOf, it } from 'vitest';
import type { ZodType } from 'zod';
import {
  ChokepointDeclarationSchema,
  CommodityDeclarationSchema,
  DatasetDeclarationSchema,
  EconomyDeclarationSchema,
  CuratedDatasetSchema,
  DependencyShareSchema,
  GraphEdgeSchema,
  GraphNodeSchema,
  HistoricalObservationSchema,
  QualitativeDependencySchema,
  SchemaVersionFileSchema,
  SourceRecordSchema,
  type ChokepointId,
  type DatasetCommodityId,
  type DependencyShare,
  type SourceRecordId,
} from '../../src/data/schema';
import {
  syntheticChokepointDecl,
  syntheticCommodityDecl,
  syntheticDatasetDecl,
  syntheticEconomyDecl,
  syntheticDataset,
  syntheticEdge,
  syntheticNodeA,
  syntheticObservationPerDay,
  syntheticObservationPerYear,
  syntheticQualitative,
  syntheticShare,
  syntheticSourceRecord,
} from '../fixtures/dataset/synthetic';

type Rec = Record<string, unknown>;

const rejects = (schema: ZodType, value: unknown) => expect(schema.safeParse(value).success).toBe(false);
const accepts = (schema: ZodType, value: unknown) => expect(schema.safeParse(value).success).toBe(true);

/** Every top-level required key, removed one at a time, must be rejected. */
function missingFieldCases(schema: ZodType, fixture: Rec, optionalKeys: string[] = []) {
  for (const key of Object.keys(fixture).filter((k) => !optionalKeys.includes(k))) {
    it(`rejects missing "${key}"`, () => {
      const copy = { ...fixture };
      delete copy[key];
      rejects(schema, copy);
    });
  }
}

describe('valid synthetic fixtures', () => {
  it('parse', () => {
    accepts(SourceRecordSchema, syntheticSourceRecord);
    accepts(HistoricalObservationSchema, syntheticObservationPerDay);
    accepts(HistoricalObservationSchema, syntheticObservationPerYear);
    accepts(DependencyShareSchema, syntheticShare);
    accepts(QualitativeDependencySchema, syntheticQualitative);
    accepts(GraphNodeSchema, syntheticNodeA);
    accepts(GraphEdgeSchema, syntheticEdge);
    accepts(CuratedDatasetSchema, syntheticDataset);
    accepts(SchemaVersionFileSchema, { schemaVersion: 'test-1', buildDate: '2020-03-01' });
  });

  it('allows the design verificationStatus values', () => {
    accepts(SourceRecordSchema, { ...syntheticSourceRecord, verificationStatus: 'unverified' });
  });
});

describe('required fields', () => {
  describe('SourceRecord', () => missingFieldCases(SourceRecordSchema, syntheticSourceRecord));
  describe('HistoricalObservation', () =>
    missingFieldCases(HistoricalObservationSchema, syntheticObservationPerDay, ['periodDayCount']));
  describe('DependencyShare', () => missingFieldCases(DependencyShareSchema, syntheticShare));
  describe('QualitativeDependency', () => missingFieldCases(QualitativeDependencySchema, syntheticQualitative));
  describe('GraphNode', () => missingFieldCases(GraphNodeSchema, syntheticNodeA));
  describe('GraphEdge', () => missingFieldCases(GraphEdgeSchema, syntheticEdge));
  describe('Dataset', () => missingFieldCases(CuratedDatasetSchema, syntheticDataset));
  describe('version file', () =>
    missingFieldCases(SchemaVersionFileSchema, { schemaVersion: 'test-1', buildDate: '2020-03-01' }));
});

describe('malformed values', () => {
  it('rejects malformed and non-real dates', () => {
    for (const bad of ['2020-13-01', '2020-02-30', '20200101', '2020-1-1', '', 'not-a-date']) {
      rejects(SourceRecordSchema, { ...syntheticSourceRecord, publicationDate: bad });
    }
    rejects(SchemaVersionFileSchema, { schemaVersion: 'test-1', buildDate: '2021-02-29' });
  });

  it('rejects reference period with end before start', () => {
    rejects(SourceRecordSchema, { ...syntheticSourceRecord, referencePeriodEnd: '2018-12-31' });
    rejects(HistoricalObservationSchema, { ...syntheticObservationPerDay, referencePeriodEnd: '2018-01-01' });
    rejects(DependencyShareSchema, { ...syntheticShare, referencePeriod: { start: '2019-12-31', end: '2019-01-01' } });
  });

  it('rejects out-of-range or non-finite shares; accepts 0 and 100', () => {
    for (const bad of [-0.1, 100.1, Number.NaN, Infinity]) {
      rejects(DependencyShareSchema, { ...syntheticShare, chokepointTransitImportSharePercent: bad });
    }
    for (const ok of [0, 100]) {
      accepts(DependencyShareSchema, { ...syntheticShare, chokepointTransitImportSharePercent: ok });
    }
    rejects(DependencyShareSchema, { ...syntheticShare, unit: 'ratio' });
  });

  it('rejects negative or non-finite observation values; accepts 0', () => {
    for (const bad of [-1, Number.NaN, Infinity]) {
      rejects(HistoricalObservationSchema, { ...syntheticObservationPerDay, value: bad });
    }
    accepts(HistoricalObservationSchema, { ...syntheticObservationPerDay, value: 0 });
  });

  it('rejects invalid enums', () => {
    rejects(SourceRecordSchema, { ...syntheticSourceRecord, verificationStatus: 'maybe' });
    rejects(HistoricalObservationSchema, { ...syntheticObservationPerDay, timeBasis: 'per-week' });
    rejects(GraphNodeSchema, { ...syntheticNodeA, type: 'country' });
  });

  it('rejects non-https and invalid URLs', () => {
    rejects(SourceRecordSchema, { ...syntheticSourceRecord, url: 'http://example.org/x' });
    rejects(SourceRecordSchema, { ...syntheticSourceRecord, url: 'not a url' });
  });

  it('rejects empty, malformed identifiers and empty text', () => {
    rejects(HistoricalObservationSchema, { ...syntheticObservationPerDay, chokepointId: '' });
    rejects(HistoricalObservationSchema, { ...syntheticObservationPerDay, commodityId: 'has space' });
    rejects(SourceRecordSchema, { ...syntheticSourceRecord, licence: '  ' });
  });

  it('requires at least one source record id', () => {
    rejects(HistoricalObservationSchema, { ...syntheticObservationPerDay, sourceRecordIds: [] });
    rejects(DependencyShareSchema, { ...syntheticShare, sourceRecordIds: [] });
    rejects(GraphEdgeSchema, { ...syntheticEdge, sourceRecordIds: [] });
  });
});

describe('periodDayCount', () => {
  it('is required for per-year observations', () => {
    const { periodDayCount: _omit, ...noCount } = syntheticObservationPerYear;
    void _omit;
    rejects(HistoricalObservationSchema, noCount);
  });

  it('must be a positive integer with no upper cap', () => {
    for (const days of [0, -1, 365.5, Number.NaN, Infinity]) {
      rejects(HistoricalObservationSchema, { ...syntheticObservationPerYear, periodDayCount: { days } });
    }
    for (const days of [1, 91, 731, 1096]) {
      accepts(HistoricalObservationSchema, { ...syntheticObservationPerYear, periodDayCount: { days } });
    }
  });

  it('enforces 365/366 only for calendar years', () => {
    for (const [referenceYear, days] of [[2019, 366], [2019, 400], [2020, 365], [2020, 400]]) {
      rejects(HistoricalObservationSchema, {
        ...syntheticObservationPerYear,
        periodDayCount: { days, referenceYear },
      });
    }
    accepts(HistoricalObservationSchema, {
      ...syntheticObservationPerYear,
      periodDayCount: { days: 365, referenceYear: 2019 },
    });
  });

  it('must match leap-year status of a reference year', () => {
    accepts(HistoricalObservationSchema, {
      ...syntheticObservationPerYear,
      periodDayCount: { days: 366, referenceYear: 2020, isLeapYear: true },
    });
    rejects(HistoricalObservationSchema, {
      ...syntheticObservationPerYear,
      periodDayCount: { days: 365, referenceYear: 2020 },
    });
    rejects(HistoricalObservationSchema, {
      ...syntheticObservationPerYear,
      periodDayCount: { days: 365, referenceYear: 2019, isLeapYear: true },
    });
    rejects(HistoricalObservationSchema, {
      ...syntheticObservationPerYear,
      periodDayCount: { days: 366, referenceYear: 1900 },
    });
  });
});

describe('strict QualitativeDependency (acceptance)', () => {
  it('rejects an extra numeric key', () => {
    rejects(QualitativeDependencySchema, { ...syntheticQualitative, chokepointTransitImportSharePercent: 10 });
    rejects(QualitativeDependencySchema, { ...syntheticQualitative, exposure: 5 });
  });

  it('rejects any unknown key', () => {
    rejects(QualitativeDependencySchema, { ...syntheticQualitative, note: 'x' });
  });
});

describe('declarations', () => {
  const cases: [string, ZodType, Rec][] = [
    ['Dataset', DatasetDeclarationSchema, syntheticDatasetDecl],
    ['Chokepoint', ChokepointDeclarationSchema, syntheticChokepointDecl],
    ['Commodity', CommodityDeclarationSchema, syntheticCommodityDecl],
    ['Economy', EconomyDeclarationSchema, syntheticEconomyDecl],
  ];
  for (const [label, schema, fixture] of cases) {
    describe(label, () => {
      it('accepts a valid record', () => accepts(schema, fixture));
      it('rejects empty and badly patterned ids', () => {
        for (const id of ['', 'has space', '-lead']) rejects(schema, { ...fixture, id });
      });
      it('rejects missing or blank name', () => {
        const { name: _n, ...noName } = fixture;
        void _n;
        rejects(schema, noName);
        rejects(schema, { ...fixture, name: '  ' });
      });
      it('rejects missing id', () => {
        const { id: _i, ...noId } = fixture;
        void _i;
        rejects(schema, noId);
      });
      it('rejects extra keys', () => rejects(schema, { ...fixture, extra: 1 }));
    });
  }

  it('dataset requires all four collections but allows them empty', () => {
    for (const key of ['datasets', 'chokepoints', 'commodities', 'economies']) {
      const copy: Rec = { ...syntheticDataset };
      delete copy[key];
      rejects(CuratedDatasetSchema, copy);
      accepts(CuratedDatasetSchema, { ...syntheticDataset, [key]: [] });
    }
  });
});

describe('strict objects elsewhere', () => {
  it('reject unknown keys', () => {
    rejects(SourceRecordSchema, { ...syntheticSourceRecord, extra: 1 });
    rejects(DependencyShareSchema, { ...syntheticShare, extra: 1 });
    rejects(CuratedDatasetSchema, { ...syntheticDataset, extra: 1 });
  });
});

describe('branded types', () => {
  it('parse output is branded and not interchangeable with plain strings or other ids', () => {
    const share = DependencyShareSchema.parse(syntheticShare);
    expectTypeOf(share).toEqualTypeOf<DependencyShare>();
    expectTypeOf(share.chokepointId).toEqualTypeOf<ChokepointId>();
    expectTypeOf(share.commodityId).toEqualTypeOf<DatasetCommodityId>();
    expectTypeOf<string>().not.toExtend<ChokepointId>();
    expectTypeOf<DatasetCommodityId>().not.toExtend<SourceRecordId>();
    expectTypeOf<ChokepointId>().toExtend<string>();
  });
});
