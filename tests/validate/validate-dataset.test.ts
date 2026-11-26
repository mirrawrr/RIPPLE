/**
 * Task 2.2: unit and integration tests for scripts/validate-dataset.ts.
 * SYNTHETIC FIXTURES ONLY: fake ids, example.org URLs, no historical figures.
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  COLLECTION_SPECS,
  SUPPORTED_SCHEMA_VERSIONS,
  crossCheckDataset,
  formatViolation,
  parseArgs,
  runValidation,
  validateRawDataset,
  type Collections,
  type RawDataset,
  type Violation,
} from '../../scripts/validate-dataset.ts';
import {
  syntheticChokepointDecl,
  syntheticDataset,
  syntheticEdge,
  syntheticObservationPerYear,
  syntheticQualitative,
  syntheticShare,
  syntheticSourceRecord,
} from '../fixtures/dataset/synthetic.ts';

const REPO = fileURLToPath(new URL('../..', import.meta.url));
const FIXTURES = resolve(REPO, 'tests', 'fixtures', 'validate');
const VERSION = SUPPORTED_SCHEMA_VERSIONS[0];

type Mutable = Record<string, unknown[]>;

/** Raw dataset built from the synthetic fixture, with a supported version file. */
function goodRaw(overrides: Partial<Mutable> = {}, version: unknown = { schemaVersion: VERSION, buildDate: syntheticDataset.buildDate }): RawDataset {
  const collections: Mutable = {};
  for (const spec of COLLECTION_SPECS) {
    collections[spec.key] = overrides[spec.key] ?? [...(syntheticDataset[spec.key] as unknown[])];
  }
  return { version, collections };
}

const run = (raw: RawDataset): Violation[] => validateRawDataset(raw).violations;

const has = (vs: Violation[], match: Partial<Violation> & { messageIncludes?: string }): boolean =>
  vs.some(
    (v) =>
      (match.file === undefined || v.file === match.file) &&
      (match.collection === undefined || v.collection === match.collection) &&
      (match.recordId === undefined || v.recordId === match.recordId) &&
      (match.field === undefined || v.field === match.field) &&
      (match.messageIncludes === undefined || v.message.includes(match.messageIncludes)),
  );

describe('validateRawDataset', () => {
  it('passes an empty-but-valid dataset (every collection absent)', () => {
    const res = validateRawDataset({ collections: {} }, { today: '2020-03-01' });
    expect(res.violations).toEqual([]);
    expect(res.notices.some((n) => n.includes('schema-version.json not present (created in Task 3.5) - version check skipped'))).toBe(true);
    expect(res.notices.some((n) => n.includes('2020-03-01'))).toBe(true);
  });

  it('passes the good synthetic dataset', () => {
    expect(run(goodRaw())).toEqual([]);
  });

  it('fails when the version file is required but absent', () => {
    const res = validateRawDataset({ collections: {} }, { requireVersionFile: true, today: '2020-03-01' });
    expect(has(res.violations, { file: 'schema-version.json', field: '(file)' })).toBe(true);
  });

  it('reports an unsupported schemaVersion with the value', () => {
    const vs = run(goodRaw({}, { schemaVersion: 'test-1', buildDate: '2020-03-01' }));
    expect(has(vs, { file: 'schema-version.json', field: 'schemaVersion', messageIncludes: '"test-1"' })).toBe(true);
  });

  it('reports a missing schemaVersion in a present version file', () => {
    const vs = run(goodRaw({}, { buildDate: '2020-03-01' }));
    expect(has(vs, { file: 'schema-version.json', field: 'schemaVersion' })).toBe(true);
  });

  it('reports a dangling source reference', () => {
    const vs = run(goodRaw({ dependencyShares: [{ ...syntheticShare, sourceRecordIds: ['test-missing'] }] }));
    expect(has(vs, { collection: 'dependencyShares', recordId: 'test-share-1', field: 'sourceRecordIds', messageIncludes: 'does not exist' })).toBe(true);
  });

  it('reports a reference to an unverified source', () => {
    const unverified = { ...syntheticSourceRecord, id: 'test-source-u', verificationStatus: 'unverified' };
    const vs = run(
      goodRaw({
        sourceRecords: [syntheticSourceRecord, unverified],
        graphEdges: [{ ...syntheticEdge, sourceRecordIds: ['test-source-u'] }],
      }),
    );
    expect(has(vs, { collection: 'graphEdges', recordId: 'test-edge-1', field: 'sourceRecordIds', messageIncludes: 'not verified' })).toBe(true);
  });

  it('reports an unverified figure', () => {
    const vs = run(goodRaw({ dependencyShares: [{ ...syntheticShare, verificationStatus: 'unverified' }] }));
    expect(has(vs, { recordId: 'test-share-1', field: 'verificationStatus' })).toBe(true);
  });

  it('reports duplicate ids in every collection', () => {
    for (const spec of COLLECTION_SPECS) {
      const list = syntheticDataset[spec.key] as unknown[];
      const vs = run(goodRaw({ [spec.key]: [...list, list[0]] }));
      const id = (list[0] as { id: string }).id;
      expect(has(vs, { collection: spec.key, recordId: id, field: 'id', messageIncludes: 'duplicate' }), spec.key).toBe(true);
    }
  });

  it('reports undeclared dataset, chokepoint, commodity and economy ids', () => {
    const vs = run(
      goodRaw({
        dependencyShares: [
          { ...syntheticShare, datasetId: 'test-x-ds', chokepointId: 'test-x-cp', commodityId: 'test-x-co', economyId: 'test-x-ec' },
        ],
      }),
    );
    for (const field of ['datasetId', 'chokepointId', 'commodityId', 'economyId']) {
      expect(has(vs, { recordId: 'test-share-1', field, messageIncludes: 'not declared' }), field).toBe(true);
    }
  });

  it('reports a dangling graph edge node', () => {
    const vs = run(goodRaw({ graphEdges: [{ ...syntheticEdge, targetNodeId: 'test-node-missing' }] }));
    expect(has(vs, { collection: 'graphEdges', recordId: 'test-edge-1', field: 'targetNodeId', messageIncludes: 'graph-nodes.json' })).toBe(true);
  });

  it('reports an unsourced graph edge', () => {
    const vs = run(goodRaw({ graphEdges: [{ ...syntheticEdge, sourceRecordIds: [] }] }));
    expect(has(vs, { collection: 'graphEdges', recordId: 'test-edge-1', field: 'sourceRecordIds', messageIncludes: 'at least one source record' })).toBe(true);
  });

  it('reports a share and qualitative record for the same combination', () => {
    const conflict = { ...syntheticQualitative, commodityId: syntheticShare.commodityId, economyId: syntheticShare.economyId };
    const vs = run(goodRaw({ qualitativeDependencies: [conflict] }));
    expect(has(vs, { collection: 'qualitativeDependencies', recordId: 'test-qual-1', messageIncludes: 'test-share-1' })).toBe(true);
  });

  it('reports publication and retrieval dates later than buildDate', () => {
    const vs = run(goodRaw({ sourceRecords: [{ ...syntheticSourceRecord, publicationDate: '2020-03-02', retrievalDate: '2021-01-01' }] }));
    expect(has(vs, { recordId: 'test-source-1', field: 'publicationDate', messageIncludes: 'later than buildDate 2020-03-01' })).toBe(true);
    expect(has(vs, { recordId: 'test-source-1', field: 'retrievalDate', messageIncludes: 'later than buildDate' })).toBe(true);
  });

  it('reports an invalid date string with id and field', () => {
    const vs = run(goodRaw({ sourceRecords: [{ ...syntheticSourceRecord, retrievalDate: '2020-02-30' }] }));
    expect(has(vs, { recordId: 'test-source-1', field: 'retrievalDate' })).toBe(true);
  });

  it('reports end < start with id and field', () => {
    const vs = run(
      goodRaw({
        sourceRecords: [{ ...syntheticSourceRecord, referencePeriodStart: '2019-12-31', referencePeriodEnd: '2019-01-01' }],
        dependencyShares: [{ ...syntheticShare, referencePeriod: { start: '2019-12-31', end: '2019-01-01' } }],
      }),
    );
    expect(has(vs, { recordId: 'test-source-1', field: 'referencePeriodEnd' })).toBe(true);
    expect(has(vs, { recordId: 'test-share-1', field: 'referencePeriod.end' })).toBe(true);
  });

  it('reports a per-year observation without periodDayCount and with a wrong leap count', () => {
    const { periodDayCount: _omit, ...noCount } = syntheticObservationPerYear;
    void _omit;
    const wrongLeap = { ...syntheticObservationPerYear, id: 'test-obs-leap', periodDayCount: { days: 365, referenceYear: 2020, isLeapYear: true } };
    const vs = run(goodRaw({ historicalObservations: [noCount, wrongLeap] }));
    expect(has(vs, { recordId: 'test-obs-year', field: 'periodDayCount' })).toBe(true);
    expect(has(vs, { recordId: 'test-obs-leap', field: 'periodDayCount.days', messageIncludes: '366' })).toBe(true);
  });

  it('does not report references to a record that already failed its schema as dangling', () => {
    const vs = run(goodRaw({ sourceRecords: [{ ...syntheticSourceRecord, url: 'http://example.org/x' }] }));
    expect(vs.filter((v) => v.field === 'sourceRecordIds')).toEqual([]);
    expect(has(vs, { recordId: 'test-source-1', field: 'url' })).toBe(true);
  });

  it('reports every violation, not only the first', () => {
    const vs = run(
      goodRaw({
        chokepoints: [syntheticChokepointDecl, syntheticChokepointDecl],
        graphEdges: [{ ...syntheticEdge, sourceNodeId: 'test-node-missing' }],
        sourceRecords: [{ ...syntheticSourceRecord, retrievalDate: '2030-01-01' }],
      }),
    );
    expect(vs.length).toBeGreaterThanOrEqual(3);
  });

  it('formats one line as <file>:<collection>:<recordId>:<field>: <message>', () => {
    expect(
      formatViolation({ file: 'graph-edges.json', collection: 'graphEdges', recordId: 'test-edge-1', field: 'targetNodeId', message: 'm' }),
    ).toBe('graph-edges.json:graphEdges:test-edge-1:targetNodeId: m');
  });
});

describe('crossCheckDataset (direct)', () => {
  it('reports a source record with neither publicationDate nor lastUpdatedDate', () => {
    // Deliberately bypasses the schema (which today requires publicationDate) to prove the
    // generic date rule that must keep working after the Task 3.2 date-kind change.
    const { publicationDate: _omit, ...noDate } = syntheticSourceRecord;
    void _omit;
    const data = { ...syntheticDataset, sourceRecords: [noDate] } as unknown as Collections;
    const vs = crossCheckDataset(data, '2020-03-01');
    expect(has(vs, { recordId: 'test-source-1', messageIncludes: 'no publicationDate or lastUpdatedDate' })).toBe(true);
  });

  it('applies the buildDate rule to a lastUpdatedDate when present', () => {
    // Also bypasses the schema: lastUpdatedDate is not a field until Task 3.2 is approved.
    const { publicationDate: _omit, ...rest } = syntheticSourceRecord;
    void _omit;
    const data = { ...syntheticDataset, sourceRecords: [{ ...rest, lastUpdatedDate: '2020-04-01' }] } as unknown as Collections;
    const vs = crossCheckDataset(data, '2020-03-01');
    expect(has(vs, { recordId: 'test-source-1', field: 'lastUpdatedDate', messageIncludes: 'later than buildDate' })).toBe(true);
    expect(has(vs, { messageIncludes: 'no publicationDate' })).toBe(false);
  });
});

describe('fixture directories and CLI', () => {
  it('parses --data-dir', () => {
    expect(parseArgs(['--data-dir', 'x']).dataDir).toBe('x');
    expect(parseArgs([]).dataDir).toBeUndefined();
  });

  it('runValidation: good and empty fixtures pass; bad fixture fails', () => {
    expect(runValidation(join(FIXTURES, 'good')).violations).toEqual([]);
    expect(runValidation(join(FIXTURES, 'empty')).violations).toEqual([]);
    const bad = runValidation(join(FIXTURES, 'bad')).violations.map(formatViolation);
    expect(bad).toContain('historical-observations.json:historicalObservations:bad-obs-dangling:sourceRecordIds: source record "bad-missing-source" does not exist');
    expect(bad.some((l) => l.startsWith('graph-edges.json:graphEdges:bad-edge-dangling:targetNodeId:'))).toBe(true);
    expect(bad.some((l) => l.startsWith('qualitative-dependencies.json:qualitativeDependencies:bad-qual-conflict:'))).toBe(true);
  });

  const script = join(REPO, 'scripts', 'validate-dataset.ts');
  const cli = (dataDir: string) =>
    spawnSync(process.execPath, [script, '--data-dir', dataDir], { cwd: REPO, encoding: 'utf8' });

  it('CLI exits non-zero on the bad fixture, names the record, and writes nothing', () => {
    const before = readdirSync(join(FIXTURES, 'bad')).sort();
    const res = cli(join(FIXTURES, 'bad'));
    expect(res.status).toBe(1);
    expect(res.stdout + res.stderr).toContain('bad-obs-dangling');
    expect(readdirSync(join(FIXTURES, 'bad')).sort()).toEqual(before);
  });

  it('CLI exits 0 on the good and empty fixtures', () => {
    expect(cli(join(FIXTURES, 'good')).status).toBe(0);
    expect(cli(join(FIXTURES, 'empty')).status).toBe(0);
  });

  it('CLI exits 0 on an empty directory, logs absent files and writes nothing', () => {
    const dir = mkdtempSync(join(tmpdir(), 'r22-'));
    try {
      const res = cli(dir);
      expect(res.status).toBe(0);
      expect(res.stdout).toContain('source-records.json not present - treated as empty');
      expect(res.stdout).toContain('schema-version.json not present (created in Task 3.5) - version check skipped');
      expect(readdirSync(dir)).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
