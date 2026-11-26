import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { DEMO_DATASET_KIND, DEMO_DATA_NOTICE } from '../../src/config/constants';
import {
  ChokepointDeclarationSchema,
  CuratedDatasetSchema,
  DemoDatasetSchema,
  DemoDependencyShareSchema,
  DemoFlowSchema,
  DependencyShareSchema,
  HistoricalObservationSchema,
  QualitativeDependencySchema,
  SourceRecordSchema,
} from '../../src/data/schema';
import {
  HISTORICAL_FIELD_NAMES,
  HISTORICAL_FIELD_VALUES,
  arbDemoDataset,
  arbDemoDependencyShare,
  arbDemoFlow,
  arbDemoFlowPerYear,
  arbInvalidDemoCase,
} from '../generators.demo';
import { arbDependencyShare, arbHistoricalObservation, arbQualitativeDependency, arbSourceRecord } from '../generators';

const schemaFor = { flow: DemoFlowSchema, share: DemoDependencyShareSchema, dataset: DemoDatasetSchema } as const;

const emptyCurated = {
  schemaVersion: '1',
  buildDate: '2024-01-01',
  datasets: [],
  chokepoints: [],
  commodities: [],
  economies: [],
  sourceRecords: [],
  historicalObservations: [],
  dependencyShares: [],
  qualitativeDependencies: [],
  graphNodes: [],
  graphEdges: [],
};

/** The approved content of the design (Data Models, Demo_Dataset), built inline; not the public file. */
const approvedContent = {
  kind: DEMO_DATASET_KIND,
  synthetic: true,
  schemaVersion: '1',
  datasetId: 'demo-dataset',
  notice: DEMO_DATA_NOTICE,
  chokepoints: [{ id: 'demo-chokepoint-hormuz', name: 'Strait of Hormuz (illustrative scenario location, synthetic flows)' }],
  commodities: [
    { id: 'demo-oil', name: 'Demo oil (fictional units)' },
    { id: 'demo-lng', name: 'Demo LNG (fictional units)' },
  ],
  economies: ['A', 'B', 'C', 'D'].map((l) => ({ id: `demo-economy-${l.toLowerCase()}`, name: `Demo Economy ${l} (fictional)` })),
  flows: [
    {
      id: 'demo-flow-oil', synthetic: true, chokepointId: 'demo-chokepoint-hormuz', commodityId: 'demo-oil',
      value: 1000, unit: 'demo oil units per day', timeBasis: 'per-day', fictionalAssumption: 'Round synthetic value; not an observation.',
    },
    {
      id: 'demo-flow-lng', synthetic: true, chokepointId: 'demo-chokepoint-hormuz', commodityId: 'demo-lng',
      value: 73000, unit: 'demo LNG units per year', timeBasis: 'per-year', periodDayCount: { days: 365 },
      fictionalAssumption: 'Round synthetic value; not an observation.',
    },
  ],
  dependencyShares: [
    ['oil', 'a', 80], ['oil', 'b', 50], ['oil', 'c', 20], ['lng', 'a', 60], ['lng', 'd', 30],
  ].map(([c, e, v]) => ({
    id: `demo-share-${c}-${e}`, synthetic: true, chokepointId: 'demo-chokepoint-hormuz', commodityId: `demo-${c}`,
    economyId: `demo-economy-${e}`, chokepointTransitImportSharePercent: v, fictionalAssumption: 'Round synthetic share; not an observation.',
  })),
  assumptions: ['All values are fictional and chosen for demonstration.'],
};

describe('demo schemas accept valid synthetic data', () => {
  it('accepts the approved demo content', () => {
    expect(DemoDatasetSchema.safeParse(approvedContent).success).toBe(true);
  });

  it('accepts generated flows, shares and datasets', () => {
    fc.assert(fc.property(arbDemoFlow, (r) => DemoFlowSchema.safeParse(r).success));
    fc.assert(fc.property(arbDemoDependencyShare, (r) => DemoDependencyShareSchema.safeParse(r).success));
    fc.assert(fc.property(arbDemoDataset, (r) => DemoDatasetSchema.safeParse(r).success));
  });

  it('accepts share boundaries 0 and 100 and value 0', () => {
    const share = { ...approvedContent.dependencyShares[0] };
    for (const p of [0, 100]) {
      expect(DemoDependencyShareSchema.safeParse({ ...share, chokepointTransitImportSharePercent: p }).success).toBe(true);
    }
    expect(DemoFlowSchema.safeParse({ ...approvedContent.flows[0], value: 0 }).success).toBe(true);
  });
});

describe('demo schemas are strict and require their markers', () => {
  it('rejects every historical field on a flow, share and dataset', () => {
    for (const field of HISTORICAL_FIELD_NAMES) {
      const extra = { [field]: HISTORICAL_FIELD_VALUES[field] };
      expect(DemoFlowSchema.safeParse({ ...approvedContent.flows[0], ...extra }).success, `flow ${field}`).toBe(false);
      expect(DemoDependencyShareSchema.safeParse({ ...approvedContent.dependencyShares[0], ...extra }).success, `share ${field}`).toBe(false);
      expect(DemoDatasetSchema.safeParse({ ...approvedContent, ...extra }).success, `dataset ${field}`).toBe(false);
    }
  });

  it('rejects a reference period and a nested historical field on periodDayCount', () => {
    const flow = approvedContent.flows[1];
    expect(DemoFlowSchema.safeParse({ ...flow, referencePeriod: { start: '2024-01-01', end: '2024-12-31' } }).success).toBe(false);
    expect(DemoFlowSchema.safeParse({ ...flow, periodDayCount: { days: 365, referenceYear: 2023 } }).success).toBe(false);
  });

  it('rejects a historical field injected into a declaration', () => {
    expect(ChokepointDeclarationSchema.safeParse({ id: 'demo-x', name: 'x', url: 'https://example.org' }).success).toBe(false);
    const withBadDecl = { ...approvedContent, economies: [{ ...approvedContent.economies[0], sourceRecordIds: ['s'] }] };
    expect(DemoDatasetSchema.safeParse(withBadDecl).success).toBe(false);
  });

  it('requires synthetic: true, the demo kind and the exact notice', () => {
    expect(DemoDatasetSchema.safeParse({ ...approvedContent, synthetic: false }).success).toBe(false);
    expect(DemoDatasetSchema.safeParse({ ...approvedContent, kind: 'curated' }).success).toBe(false);
    expect(DemoDatasetSchema.safeParse({ ...approvedContent, notice: 'other' }).success).toBe(false);
    expect(DemoFlowSchema.safeParse({ ...approvedContent.flows[0], synthetic: false }).success).toBe(false);
    expect(DemoDependencyShareSchema.safeParse({ ...approvedContent.dependencyShares[0], synthetic: undefined }).success).toBe(false);
  });

  it('requires a fictional assumption and at least one dataset assumption', () => {
    const { fictionalAssumption: _a, ...noAssumption } = approvedContent.flows[0];
    void _a;
    expect(DemoFlowSchema.safeParse(noAssumption).success).toBe(false);
    expect(DemoDatasetSchema.safeParse({ ...approvedContent, assumptions: [] }).success).toBe(false);
  });

  it('rejects every generated invalid case', () => {
    fc.assert(
      fc.property(arbInvalidDemoCase, (c) => {
        expect(schemaFor[c.target].safeParse(c.record).success, c.kind).toBe(false);
      }),
    );
  });

  it('requires periodDayCount on a per-year flow only', () => {
    fc.assert(
      fc.property(arbDemoFlowPerYear, (f) => {
        const { periodDayCount: _d, ...rest } = f;
        void _d;
        expect(DemoFlowSchema.safeParse(rest).success).toBe(false);
        expect(DemoFlowSchema.safeParse({ ...rest, timeBasis: 'per-day' }).success).toBe(true);
      }),
    );
  });
});

describe('Curated and demo schemas stay separate', () => {
  it('historical record schemas reject a synthetic key', () => {
    fc.assert(
      fc.property(arbHistoricalObservation, arbDependencyShare, arbQualitativeDependency, arbSourceRecord, (o, s, q, r) => {
        expect(HistoricalObservationSchema.safeParse(o).success).toBe(true);
        expect(HistoricalObservationSchema.safeParse({ ...o, synthetic: true }).success).toBe(false);
        expect(DependencyShareSchema.safeParse({ ...s, synthetic: true }).success).toBe(false);
        expect(QualitativeDependencySchema.safeParse({ ...q, synthetic: true }).success).toBe(false);
        expect(SourceRecordSchema.safeParse({ ...r, synthetic: true }).success).toBe(false);
      }),
    );
  });

  it('a Curated dataset is rejected by the demo schema and carries no synthetic key', () => {
    expect(CuratedDatasetSchema.safeParse(emptyCurated).success).toBe(true);
    expect(DemoDatasetSchema.safeParse(emptyCurated).success).toBe(false);
    expect(CuratedDatasetSchema.safeParse({ ...emptyCurated, synthetic: true }).success).toBe(false);
    expect(CuratedDatasetSchema.safeParse({ ...emptyCurated, kind: DEMO_DATASET_KIND }).success).toBe(false);
  });

  it('a demo dataset is rejected by the Curated schema', () => {
    expect(CuratedDatasetSchema.safeParse(approvedContent).success).toBe(false);
    fc.assert(fc.property(arbDemoDataset, (d) => !CuratedDatasetSchema.safeParse(d).success));
  });
});
