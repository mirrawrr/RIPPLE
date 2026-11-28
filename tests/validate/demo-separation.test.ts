/**
 * Task 2.7: unit and integration tests for the demo separation checks (D1, D2, D3, D5).
 * SYNTHETIC FIXTURES ONLY: fake ids, example.org URLs, no historical figures.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  DEMO_ABSENT_NOTICE,
  checkCuratedClean,
  checkDemoContent,
  checkDemoParses,
  checkDemoReferences,
  checkDemoSeparation,
  findForbiddenSourceNames,
  formatViolation,
  runValidation,
  type Violation,
} from '../../scripts/validate-dataset.ts';

const REPO = fileURLToPath(new URL('../..', import.meta.url));
const FIXTURES = resolve(REPO, 'tests', 'fixtures', 'validate');
const script = join(REPO, 'scripts', 'validate-dataset.ts');

type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const readJson = (...parts: string[]): Json => JSON.parse(readFileSync(join(...parts), 'utf8')) as Json;
const goodDemo = (): Json => readJson(FIXTURES, 'demo-good', 'demo', 'demo-dataset.json');

const lines = (vs: Violation[]): string[] => vs.map(formatViolation);
const find = (vs: Violation[], m: Partial<Violation> & { messageIncludes?: string }): Violation | undefined =>
  vs.find(
    (v) =>
      (m.file === undefined || v.file === m.file) &&
      (m.collection === undefined || v.collection === m.collection) &&
      (m.recordId === undefined || v.recordId === m.recordId) &&
      (m.field === undefined || v.field === m.field) &&
      (m.messageIncludes === undefined || v.message.includes(m.messageIncludes)),
  );

const cli = (dataDir: string) => spawnSync(process.execPath, [script, '--data-dir', dataDir], { cwd: REPO, encoding: 'utf8' });

const DEMO_FILE = 'demo/demo-dataset.json';

describe('forbidden source name matching', () => {
  it('matches whole terms, case-insensitively', () => {
    for (const text of ['IEA data', '(IEA)', 'per eia, 2020', 'UNCTAD.', 'vortexa', 'KPLER-like', 'Opec+', 'x/OPEC/y', 'demo-eia-flow']) {
      expect(findForbiddenSourceNames(text), text).not.toEqual([]);
    }
    expect(findForbiddenSourceNames('IEA data, EIA and opec').map((t) => t.toLowerCase())).toEqual(['iea', 'eia', 'opec']);
  });

  it('does not match inside longer words', () => {
    for (const text of ['PIEAR', 'fieAld', 'Leia', 'ieas', '2eia', 'OPECS', 'xKpler', 'Vortexas', 'dataunctad', 'Demo Economy A (fictional)']) {
      expect(findForbiddenSourceNames(text), text).toEqual([]);
    }
  });
});

describe('D1: Curated is clean (raw scan)', () => {
  it('passes the good fixture files', () => {
    const files = { 'chokepoints.json': readJson(FIXTURES, 'good', 'chokepoints.json') };
    expect(checkCuratedClean(files)).toEqual([]);
  });

  it('reports a demo- id with file, collection, record id and field', () => {
    const vs = checkCuratedClean({ 'chokepoints.json': [{ id: 'demo-x', name: 'n' }] });
    expect(lines(vs)).toEqual([expect.stringMatching(/^chokepoints\.json:chokepoints:demo-x:id: D1:/)]);
  });

  it('reports a synthetic key at the top and nested, naming the record and field path', () => {
    const vs = checkCuratedClean({
      'historical-observations.json': [
        { id: 'obs-a', synthetic: true },
        { id: 'obs-b', periodDayCount: { days: 1, synthetic: true } },
      ],
    });
    expect(find(vs, { collection: 'historicalObservations', recordId: 'obs-a', field: 'synthetic' })).toBeDefined();
    expect(find(vs, { recordId: 'obs-b', field: 'periodDayCount.synthetic' })).toBeDefined();
  });

  it('reports a kind key equal to the demo kind, and ignores other kind values', () => {
    const vs = checkCuratedClean({ 'economies.json': [{ id: 'e1', kind: 'illustrative-demo' }, { id: 'e2', kind: 'other' }] });
    expect(find(vs, { recordId: 'e1', field: 'kind' })).toBeDefined();
    expect(find(vs, { recordId: 'e2' })).toBeUndefined();
  });

  it('scans non-collection JSON files outside demo/ but never demo/', () => {
    const vs = checkCuratedClean({
      'extra/notes.json': { inner: { synthetic: true } },
      [DEMO_FILE]: { synthetic: true },
    });
    expect(lines(vs)).toEqual([expect.stringMatching(/^extra\/notes\.json:extra\/notes\.json:-:inner\.synthetic: /)]);
  });

  it('runValidation reports the curated-synthetic fixture and the historical validator never lets it pass', () => {
    const res = runValidation(join(FIXTURES, 'curated-synthetic'));
    const out = lines(res.violations);
    expect(out.some((l) => l.startsWith('chokepoints.json:chokepoints:demo-leaked-chokepoint:id: D1:'))).toBe(true);
    expect(out.some((l) => l.startsWith('historical-observations.json:historicalObservations:bad-obs-synthetic:synthetic: '))).toBe(true);
    expect(out.some((l) => l.startsWith('historical-observations.json:historicalObservations:bad-obs-nested:periodDayCount.synthetic: '))).toBe(true);
    expect(out.some((l) => l.startsWith('historical-observations.json:historicalObservations:bad-obs-kind:kind: '))).toBe(true);
    expect(out.some((l) => l.startsWith('extra/notes.json:extra/notes.json:-:inner.synthetic: '))).toBe(true);
    // The strict historical schema also rejects the extra keys on its own.
    expect(find(res.violations, { recordId: 'bad-obs-synthetic', messageIncludes: 'synthetic' })).toBeDefined();
  });
});

describe('D2: demo parses with DemoDatasetSchema', () => {
  it('passes the good demo fixture', () => {
    expect(checkDemoParses(goodDemo())).toEqual([]);
  });

  const HISTORICAL_FIELDS: Record<string, unknown> = {
    sourceRecordIds: ['test-source-1'],
    verificationStatus: 'verified',
    url: 'https://example.org/x',
    sourceUrl: 'https://example.org/x',
    publicationDate: '2024-01-01',
    lastUpdatedDate: '2024-01-01',
    retrievalDate: '2024-01-01',
    licence: 'test licence',
    attribution: 'test attribution',
  };

  for (const [field, value] of Object.entries(HISTORICAL_FIELDS)) {
    it(`rejects "${field}" on a flow, a share and the dataset, naming the key and the record`, () => {
      const flowDs = goodDemo();
      flowDs.flows[0][field] = value;
      const flow = checkDemoParses(flowDs);
      expect(find(flow, { collection: 'flows', recordId: 'demo-flow-oil', field, messageIncludes: `"${field}"` })).toBeDefined();

      const shareDs = goodDemo();
      shareDs.dependencyShares[1][field] = value;
      const share = checkDemoParses(shareDs);
      expect(find(share, { collection: 'dependencyShares', recordId: 'demo-share-lng-b', field, messageIncludes: `"${field}"` })).toBeDefined();

      const rootDs = goodDemo();
      rootDs[field] = value;
      const root = checkDemoParses(rootDs);
      expect(find(root, { collection: 'demo', recordId: '-', field, messageIncludes: `"${field}"` })).toBeDefined();
    });
  }

  it('names the file, collection, record and field for an ordinary schema issue', () => {
    const ds = goodDemo();
    ds.flows[1].periodDayCount = { days: 0 };
    const vs = checkDemoParses(ds);
    expect(find(vs, { file: DEMO_FILE, collection: 'flows', recordId: 'demo-flow-lng', field: 'periodDayCount.days' })).toBeDefined();
  });

  it('rejects a Curated-shaped file and a non-object', () => {
    expect(checkDemoParses({ schemaVersion: '1', buildDate: '2020-01-01', datasets: [] })).not.toEqual([]);
    expect(checkDemoParses([])).not.toEqual([]);
    expect(checkDemoParses(null)).not.toEqual([]);
  });
});

describe('D3: demo content rules', () => {
  it('passes the good demo fixture', () => {
    expect(checkDemoContent(goodDemo())).toEqual([]);
  });

  it('reports ids without the demo- prefix in every record kind and the dataset id', () => {
    const ds = goodDemo();
    ds.datasetId = 'plain-dataset';
    ds.chokepoints[0].id = 'plain-cp';
    ds.commodities[0].id = 'plain-co';
    ds.economies[0].id = 'plain-ec';
    ds.flows[0].id = 'plain-flow';
    ds.dependencyShares[0].id = 'plain-share';
    const vs = checkDemoContent(ds);
    expect(find(vs, { recordId: 'plain-dataset', field: 'datasetId' })).toBeDefined();
    for (const [collection, id] of [
      ['chokepoints', 'plain-cp'],
      ['commodities', 'plain-co'],
      ['economies', 'plain-ec'],
      ['flows', 'plain-flow'],
      ['dependencyShares', 'plain-share'],
    ] as const) {
      expect(find(vs, { collection, recordId: id, field: 'id' }), collection).toBeDefined();
    }
  });

  it('reports an economy name without "(fictional)"', () => {
    const ds = goodDemo();
    ds.economies[0].name = 'Demo Economy A';
    expect(find(checkDemoContent(ds), { collection: 'economies', recordId: 'demo-economy-a', field: 'name' })).toBeDefined();
  });

  it('reports a flow unit without "demo" and accepts any case', () => {
    const ds = goodDemo();
    ds.flows[0].unit = 'barrels per day';
    ds.flows[1].unit = 'DEMO units';
    const vs = checkDemoContent(ds);
    expect(find(vs, { collection: 'flows', recordId: 'demo-flow-oil', field: 'unit' })).toBeDefined();
    expect(find(vs, { recordId: 'demo-flow-lng', field: 'unit' })).toBeUndefined();
  });

  it('reports flow and share values that are not integer multiples of 10', () => {
    for (const bad of [15, 2.5, 10.5, 1e-9, 1000.0000001]) {
      const ds = goodDemo();
      ds.flows[0].value = bad;
      ds.dependencyShares[0].chokepointTransitImportSharePercent = bad;
      const vs = checkDemoContent(ds);
      expect(find(vs, { collection: 'flows', recordId: 'demo-flow-oil', field: 'value' }), String(bad)).toBeDefined();
      expect(find(vs, { collection: 'dependencyShares', recordId: 'demo-share-oil-a', field: 'chokepointTransitImportSharePercent' }), String(bad)).toBeDefined();
    }
    const ds = goodDemo();
    ds.flows[0].value = 0;
    ds.dependencyShares[0].chokepointTransitImportSharePercent = 100;
    expect(checkDemoContent(ds)).toEqual([]);
  });

  it('reports a forbidden name in any string, with record and field', () => {
    const cases: [string, (d: Json, t: string) => void, string, string, string][] = [
      ['flow assumption', (d, t) => (d.flows[0].fictionalAssumption = `Based on ${t} data.`), 'flows', 'demo-flow-oil', 'fictionalAssumption'],
      ['share assumption', (d, t) => (d.dependencyShares[0].fictionalAssumption = `(${t})`), 'dependencyShares', 'demo-share-oil-a', 'fictionalAssumption'],
      ['economy name', (d, t) => (d.economies[0].name = `Demo Economy A (fictional) ${t}`), 'economies', 'demo-economy-a', 'name'],
      ['commodity description', (d, t) => (d.commodities[0].description = t), 'commodities', 'demo-oil', 'description'],
      ['flow unit', (d, t) => (d.flows[0].unit = `demo ${t} units`), 'flows', 'demo-flow-oil', 'unit'],
      ['assumptions', (d, t) => (d.assumptions[0] = `See ${t}.`), 'demo', '-', 'assumptions.0'],
      ['schemaVersion', (d, t) => (d.schemaVersion = t), 'demo', '-', 'schemaVersion'],
    ];
    for (const term of ['EIA', 'iea', 'Unctad', 'VORTEXA', 'kpler', 'Opec']) {
      for (const [label, mutate, collection, recordId, field] of cases) {
        const ds = goodDemo();
        mutate(ds, term);
        const v = find(checkDemoContent(ds), { collection, recordId, field, messageIncludes: term.toUpperCase() });
        expect(v, `${label} / ${term}`).toBeDefined();
      }
    }
  });

  it('does not flag a name embedded in a longer word', () => {
    const ds = goodDemo();
    ds.flows[0].fictionalAssumption = 'PIEAR fieAld Leia are not publishers.';
    expect(checkDemoContent(ds)).toEqual([]);
  });
});

describe('D5: references resolve and ids stay separate', () => {
  it('passes the good demo fixture against disjoint Curated ids', () => {
    expect(checkDemoReferences(goodDemo(), new Set(['test-chokepoint']))).toEqual([]);
  });

  it('reports unresolved chokepoint, commodity and economy references', () => {
    const ds = goodDemo();
    ds.flows[0].chokepointId = 'demo-nope-cp';
    ds.flows[0].commodityId = 'demo-nope-co';
    ds.dependencyShares[0].economyId = 'demo-nope-ec';
    ds.dependencyShares[1].commodityId = 'demo-nope-co2';
    const vs = checkDemoReferences(ds, new Set());
    expect(find(vs, { collection: 'flows', recordId: 'demo-flow-oil', field: 'chokepointId', messageIncludes: 'demo-nope-cp' })).toBeDefined();
    expect(find(vs, { collection: 'flows', recordId: 'demo-flow-oil', field: 'commodityId' })).toBeDefined();
    expect(find(vs, { collection: 'dependencyShares', recordId: 'demo-share-oil-a', field: 'economyId' })).toBeDefined();
    expect(find(vs, { collection: 'dependencyShares', recordId: 'demo-share-lng-b', field: 'commodityId' })).toBeDefined();
  });

  it('does not accept a Curated declaration as the target of a demo reference', () => {
    const ds = goodDemo();
    ds.flows[0].chokepointId = 'test-chokepoint';
    expect(find(checkDemoReferences(ds, new Set(['test-chokepoint'])), { recordId: 'demo-flow-oil', field: 'chokepointId' })).toBeDefined();
  });

  it('reports every demo id that is also a Curated id', () => {
    const shared = ['demo-dataset', 'demo-chokepoint-a', 'demo-oil', 'demo-economy-a', 'demo-flow-oil', 'demo-share-oil-a'];
    const vs = checkDemoReferences(goodDemo(), new Set(shared));
    expect(vs).toHaveLength(shared.length);
    expect(find(vs, { field: 'datasetId', messageIncludes: 'demo-dataset' })).toBeDefined();
    expect(find(vs, { collection: 'flows', recordId: 'demo-flow-oil', field: 'id' })).toBeDefined();
  });
});

describe('the two pathways stay separate', () => {
  it('a demo file placed among the Curated files is rejected by the Curated side', () => {
    const demo = goodDemo();
    const files = {
      'demo-dataset.json': demo,
      'chokepoints.json': demo.chokepoints,
      'historical-observations.json': demo.flows,
    };
    const vs = checkCuratedClean(files);
    expect(find(vs, { file: 'demo-dataset.json', field: 'synthetic' })).toBeDefined();
    expect(find(vs, { file: 'chokepoints.json', recordId: 'demo-chokepoint-a', field: 'id' })).toBeDefined();
    expect(find(vs, { file: 'historical-observations.json', recordId: 'demo-flow-oil', field: 'synthetic' })).toBeDefined();
  });

  it('a Curated-shaped file is rejected as the demo file', () => {
    const res = checkDemoSeparation({}, { schemaVersion: 'test-1', buildDate: '2020-03-01', datasets: [], chokepoints: [] });
    expect(res.violations.length).toBeGreaterThan(0);
  });
});

describe('absent and present demo file', () => {
  it('absent: passes and notes "demo dataset not present"; D1 still runs', () => {
    const ok = checkDemoSeparation({ 'chokepoints.json': [{ id: 'test-x', name: 'n' }] }, undefined);
    expect(ok.violations).toEqual([]);
    expect(ok.notices).toEqual([DEMO_ABSENT_NOTICE]);
    expect(DEMO_ABSENT_NOTICE).toBe('demo dataset not present');

    const bad = checkDemoSeparation({ 'chokepoints.json': [{ id: 'demo-x', name: 'n' }] }, undefined);
    expect(bad.violations).toHaveLength(1);
  });

  it('absent on disk: the CLI exits 0 and logs the line', () => {
    const dir = mkdtempSync(join(tmpdir(), 'r27-'));
    try {
      const res = cli(dir);
      expect(res.status).toBe(0);
      expect(res.stdout).toContain('validate-dataset: demo dataset not present');
      expect(readdirSync(dir)).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('present and valid: passes with no absent notice', () => {
    const res = runValidation(join(FIXTURES, 'demo-good'));
    expect(res.violations).toEqual([]);
    expect(res.notices).not.toContain(DEMO_ABSENT_NOTICE);
    const out = cli(join(FIXTURES, 'demo-good'));
    expect(out.status).toBe(0);
    expect(out.stdout).not.toContain('demo dataset not present');
    expect(out.stdout).toContain('validate-dataset: OK');
  });

  it('present and invalid: fails and names the offending records and fields', () => {
    const res = cli(join(FIXTURES, 'demo-bad'));
    expect(res.status).toBe(1);
    const out = res.stderr;
    const expected = [
      `${DEMO_FILE}:flows:demo-flow-historical-fields:sourceRecordIds: D2: unrecognized key "sourceRecordIds"`,
      `${DEMO_FILE}:flows:demo-flow-historical-fields:verificationStatus: D2: unrecognized key "verificationStatus"`,
      `${DEMO_FILE}:economies:bad-economy-b:id: D3:`,
      `${DEMO_FILE}:economies:bad-economy-b:name: D3:`,
      `${DEMO_FILE}:flows:demo-flow-bad-content:unit: D3:`,
      `${DEMO_FILE}:flows:demo-flow-bad-content:value: D3:`,
      `${DEMO_FILE}:flows:demo-flow-bad-content:fictionalAssumption: D3: text names "IEA"`,
      `${DEMO_FILE}:flows:demo-flow-bad-content:commodityId: D5:`,
      `${DEMO_FILE}:flows:test-shared-id:id: D3:`,
      `${DEMO_FILE}:flows:test-shared-id:id: D5:`,
      `${DEMO_FILE}:flows:test-shared-id:value: D3:`,
      `${DEMO_FILE}:dependencyShares:demo-share-bad-economy:economyId: D5:`,
      `${DEMO_FILE}:dependencyShares:demo-share-bad-economy:chokepointTransitImportSharePercent: D3:`,
    ];
    for (const line of expected) expect(out, line).toContain(line);
  });

  it('present but not valid JSON: reported once as invalid JSON', () => {
    const dir = mkdtempSync(join(tmpdir(), 'r27-'));
    try {
      mkdirSync(join(dir, 'demo'));
      writeFileSync(join(dir, 'demo', 'demo-dataset.json'), '{ not json');
      const res = runValidation(dir);
      expect(res.violations.filter((v) => v.file === DEMO_FILE)).toHaveLength(1);
      expect(res.violations[0].message).toContain('invalid JSON');
      expect(res.notices).not.toContain(DEMO_ABSENT_NOTICE);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('the real public/data directory passes with the demo file present and no "demo dataset not present" line (Task 2.8)', () => {
    expect(existsSync(join(REPO, 'public', 'data', DEMO_FILE))).toBe(true);
    const res = spawnSync(process.execPath, [script], { cwd: REPO, encoding: 'utf8' });
    expect(res.status).toBe(0);
    expect(res.stdout).not.toContain('demo dataset not present');
    expect(res.stdout).toContain('validate-dataset: OK');
  });

  it('CLI exits 1 on the curated-synthetic fixture and names the leaks', () => {
    const res = cli(join(FIXTURES, 'curated-synthetic'));
    expect(res.status).toBe(1);
    expect(res.stderr).toContain('chokepoints.json:chokepoints:demo-leaked-chokepoint:id: D1:');
    expect(res.stderr).toContain('bad-obs-synthetic:synthetic:');
  });
});
