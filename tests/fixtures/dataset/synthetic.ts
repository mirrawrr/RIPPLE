/**
 * SYNTHETIC TEST FIXTURES ONLY. Every id, name, URL and number below is fake
 * and exists solely to exercise schema validation. Not real data.
 */

export const syntheticSourceRecord = {
  id: 'test-source-1',
  publisher: 'Example Publisher',
  title: 'Synthetic Test Publication',
  url: 'https://example.org/synthetic',
  publicationDate: '2020-01-15',
  referencePeriodStart: '2019-01-01',
  referencePeriodEnd: '2019-12-31',
  unit: 'test-unit',
  retrievalDate: '2020-02-01',
  licence: 'Synthetic test licence',
  attributionRequirement: 'Synthetic attribution text',
  verificationStatus: 'verified',
  verificationDate: '2020-02-02',
};

export const syntheticObservationPerDay = {
  id: 'test-obs-day',
  datasetId: 'test-dataset',
  chokepointId: 'test-chokepoint',
  commodityId: 'test-commodity-a',
  verificationStatus: 'verified',
  value: 123.5,
  unit: 'test-unit',
  timeBasis: 'per-day',
  referencePeriodStart: '2019-01-01',
  referencePeriodEnd: '2019-12-31',
  sourceRecordIds: ['test-source-1'],
};

export const syntheticObservationPerYear = {
  ...syntheticObservationPerDay,
  id: 'test-obs-year',
  commodityId: 'test-commodity-b',
  timeBasis: 'per-year',
  periodDayCount: { days: 365, referenceYear: 2019, isLeapYear: false },
};

export const syntheticShare = {
  id: 'test-share-1',
  datasetId: 'test-dataset',
  chokepointId: 'test-chokepoint',
  commodityId: 'test-commodity-a',
  economyId: 'test-economy-1',
  chokepointTransitImportSharePercent: 42,
  unit: 'percent',
  referencePeriod: { start: '2019-01-01', end: '2019-12-31' },
  verificationStatus: 'verified',
  sourceRecordIds: ['test-source-1'],
};

export const syntheticQualitative = {
  id: 'test-qual-1',
  datasetId: 'test-dataset',
  chokepointId: 'test-chokepoint',
  commodityId: 'test-commodity-b',
  economyId: 'test-economy-2',
  description: 'Synthetic words-only dependency description.',
  referencePeriod: { start: '2019-01-01', end: '2019-12-31' },
  verificationStatus: 'verified',
  sourceRecordIds: ['test-source-1'],
};

export const syntheticNodeA = { id: 'test-node-a', type: 'transport', name: 'Test Node A' };
export const syntheticNodeB = { id: 'test-node-b', type: 'commodity', name: 'Test Node B' };

export const syntheticEdge = {
  id: 'test-edge-1',
  sourceNodeId: 'test-node-a',
  targetNodeId: 'test-node-b',
  relationshipDescription: 'Synthetic documented relationship',
  sourceRecordIds: ['test-source-1'],
};

export const syntheticDatasetDecl = { id: 'test-dataset', name: 'Synthetic Dataset', description: 'Synthetic.' };
export const syntheticChokepointDecl = { id: 'test-chokepoint', name: 'Synthetic Chokepoint' };
export const syntheticCommodityDecl = { id: 'test-commodity-a', name: 'Synthetic Commodity A' };
export const syntheticEconomyDecl = { id: 'test-economy-1', name: 'Synthetic Economy 1' };

export const syntheticDataset = {
  schemaVersion: 'test-1',
  buildDate: '2020-03-01',
  datasets: [syntheticDatasetDecl],
  chokepoints: [syntheticChokepointDecl],
  commodities: [syntheticCommodityDecl, { id: 'test-commodity-b', name: 'Synthetic Commodity B' }],
  economies: [syntheticEconomyDecl, { id: 'test-economy-2', name: 'Synthetic Economy 2' }],
  sourceRecords: [syntheticSourceRecord],
  historicalObservations: [syntheticObservationPerDay, syntheticObservationPerYear],
  dependencyShares: [syntheticShare],
  qualitativeDependencies: [syntheticQualitative],
  graphNodes: [syntheticNodeA, syntheticNodeB],
  graphEdges: [syntheticEdge],
};
