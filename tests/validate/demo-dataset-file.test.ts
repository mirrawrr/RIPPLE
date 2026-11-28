/**
 * Task 2.8: the authored public/data/demo/demo-dataset.json (approved content), the new duplicate-id (D5)
 * and unexpected-file (D3) checks, and corrupted temporary copies of the real file.
 * Corrupted copies live in os.tmpdir() and are removed after each test.
 */
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import {
  checkDemoContent,
  checkDemoDirFiles,
  checkDemoDuplicateIds,
  checkDemoParses,
  checkDemoReferences,
  checkDemoSeparation,
  findForbiddenSourceNames,
  formatViolation,
  runValidation,
  SUPPORTED_SCHEMA_VERSIONS,
  type Violation,
} from '../../scripts/validate-dataset.ts';
import { DEMO_DATA_NOTICE, DEMO_DATASET_KIND } from '../../src/config/constants';
import { DemoDatasetSchema } from '../../src/data/schema';

const REPO = fileURLToPath(new URL('../..', import.meta.url));
const REAL = join(REPO, 'public', 'data', 'demo', 'demo-dataset.json');
const script = join(REPO, 'scripts', 'validate-dataset.ts');
const DEMO_FILE = 'demo/demo-dataset.json';

type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const real = (): Json => JSON.parse(readFileSync(REAL, 'utf8')) as Json;
const hit = (vs: Violation[], collection: string, recordId: string, field: string): Violation | undefined =>
  vs.find((v) => v.collection === collection && v.recordId === recordId && v.field === field);

describe('public/data/demo/demo-dataset.json', () => {
  it('parses with DemoDatasetSchema and carries the approved root fields', () => {
    const d = real();
    expect(DemoDatasetSchema.safeParse(d).success).toBe(true);
    expect(d.kind).toBe(DEMO_DATASET_KIND);
    expect(d.synthetic).toBe(true);
    expect(d.notice).toBe(DEMO_DATA_NOTICE);
    expect(SUPPORTED_SCHEMA_VERSIONS).toContain(d.schemaVersion);
    expect(d.datasetId).toBe('demo-dataset');
  });

  it('has exactly the approved content', () => {
    const d = real();
    expect(d.chokepoints).toEqual([
      { id: 'demo-chokepoint-hormuz', name: 'Strait of Hormuz (illustrative scenario location, synthetic flows)' },
    ]);
    expect(d.commodities).toEqual([
      { id: 'demo-oil', name: 'Demo oil (fictional units)' },
      { id: 'demo-lng', name: 'Demo LNG (fictional units)' },
    ]);
    expect(d.economies).toEqual(
      ['a', 'b', 'c', 'd'].map((l) => ({ id: `demo-economy-${l}`, name: `Demo Economy ${l.toUpperCase()} (fictional)` })),
    );
    const flows = (d.flows as Json[]).map(({ fictionalAssumption: _a, synthetic, ...rest }) => {
      void _a;
      expect(synthetic).toBe(true);
      return rest;
    });
    expect(flows).toEqual([
      {
        id: 'demo-flow-oil',
        chokepointId: 'demo-chokepoint-hormuz',
        commodityId: 'demo-oil',
        value: 1000,
        unit: 'demo oil units per day',
        timeBasis: 'per-day',
      },
      {
        id: 'demo-flow-lng',
        chokepointId: 'demo-chokepoint-hormuz',
        commodityId: 'demo-lng',
        value: 73000,
        unit: 'demo LNG units per year',
        timeBasis: 'per-year',
        periodDayCount: { days: 365 },
      },
    ]);
    const shares = (d.dependencyShares as Json[]).map((s) => {
      expect(s.synthetic).toBe(true);
      return [s.id, s.commodityId, s.economyId, s.chokepointTransitImportSharePercent, s.chokepointId];
    });
    const hz = 'demo-chokepoint-hormuz';
    expect(shares).toEqual([
      ['demo-share-oil-a', 'demo-oil', 'demo-economy-a', 80, hz],
      ['demo-share-oil-b', 'demo-oil', 'demo-economy-b', 50, hz],
      ['demo-share-oil-c', 'demo-oil', 'demo-economy-c', 20, hz],
      ['demo-share-lng-a', 'demo-lng', 'demo-economy-a', 60, hz],
      ['demo-share-lng-d', 'demo-lng', 'demo-economy-d', 30, hz],
    ]);
    for (const r of [...d.flows, ...d.dependencyShares]) expect(String(r.fictionalAssumption).length).toBeGreaterThan(0);
  });

  it('contains no forbidden source name in any string (case-insensitive whole term)', () => {
    const texts = [...JSON.stringify(real()).matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);
    for (const t of texts) expect(findForbiddenSourceNames(t), t).toEqual([]);
  });

  it('passes D2, D3, D5 and the duplicate-id check', () => {
    const d = real();
    expect(checkDemoParses(d)).toEqual([]);
    expect(checkDemoContent(d)).toEqual([]);
    expect(checkDemoReferences(d, new Set())).toEqual([]);
    expect(checkDemoDuplicateIds(d)).toEqual([]);
    expect(checkDemoSeparation({}, d)).toEqual({ violations: [], notices: [] });
  });

  it('is the only file under public/data/demo/', () => {
    expect(checkDemoDirFiles(join(REPO, 'public', 'data'))).toEqual([]);
  });
});

describe('duplicate-id check (D5)', () => {
  it('reports a duplicate within a collection on the later record, field id', () => {
    const d = real();
    d.flows[1].id = 'demo-flow-oil';
    const v = hit(checkDemoDuplicateIds(d), 'flows', 'demo-flow-oil', 'id');
    expect(v?.file).toBe(DEMO_FILE);
    expect(v?.message).toContain('D5: duplicate id "demo-flow-oil" within flows');
  });

  it('reports an id reused across collections and the dataset id', () => {
    const d = real();
    d.economies[0].id = 'demo-oil';
    expect(hit(checkDemoDuplicateIds(d), 'economies', 'demo-oil', 'id')?.message).toContain('also used in commodities');
    const e = real();
    e.chokepoints[0].id = 'demo-dataset';
    const v = hit(checkDemoDuplicateIds(e), 'chokepoints', 'demo-dataset', 'id');
    expect(v?.message).toContain('also used in the dataset id');
  });

  it('is tolerant of malformed input', () => {
    expect(checkDemoDuplicateIds(null)).toEqual([]);
    expect(checkDemoDuplicateIds({ flows: 'x' })).toEqual([]);
  });
});

describe('unexpected files under demo/ (D3)', () => {
  const dirs: string[] = [];
  const tmp = (): string => {
    const dir = mkdtempSync(join(tmpdir(), 'r28-'));
    dirs.push(dir);
    return dir;
  };
  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  it('absent demo directory and absent file keep passing with the log line', () => {
    const dir = tmp();
    expect(checkDemoDirFiles(dir)).toEqual([]);
    mkdirSync(join(dir, 'demo'));
    const res = runValidation(dir);
    expect(res.violations).toEqual([]);
    expect(res.notices).toContain('demo dataset not present');
  });

  it('reports every other file, recursively and of any type, including .gitkeep', () => {
    const dir = tmp();
    mkdirSync(join(dir, 'demo', 'sub'), { recursive: true });
    cpSync(REAL, join(dir, DEMO_FILE));
    writeFileSync(join(dir, 'demo', 'notes.txt'), 'x');
    writeFileSync(join(dir, 'demo', '.gitkeep'), '');
    writeFileSync(join(dir, 'demo', 'sub', 'other.json'), '{}');
    const vs = checkDemoDirFiles(dir);
    expect(vs.map((v) => v.file).sort()).toEqual(['demo/.gitkeep', 'demo/notes.txt', 'demo/sub/other.json']);
    for (const v of vs) {
      expect(v.field).toBe('(file)');
      expect(v.message).toContain('unexpected file under demo/');
    }
  });
});

describe('corrupted temporary copies of the real demo file', () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });
  const setup = (mutate: (d: Json) => void, extra?: (dir: string) => void): string => {
    const dir = mkdtempSync(join(tmpdir(), 'r28-'));
    dirs.push(dir);
    mkdirSync(join(dir, 'demo'));
    const d = real();
    mutate(d);
    writeFileSync(join(dir, DEMO_FILE), JSON.stringify(d, null, 2));
    extra?.(dir);
    return dir;
  };
  const cli = (dir: string) => spawnSync(process.execPath, [script, '--data-dir', dir], { cwd: REPO, encoding: 'utf8' });

  // [label, mutation, expected "file:collection:recordId:field:" prefix after the demo file name]
  const cases: [string, (d: Json) => void, string][] = [
    ['id without demo- prefix', (d) => (d.flows[0].id = 'flow-oil'), 'flows:flow-oil:id: D3'],
    ['verificationStatus added', (d) => (d.dependencyShares[0].verificationStatus = 'verified'), 'dependencyShares:demo-share-oil-a:verificationStatus: D2'],
    ['value 15', (d) => (d.flows[0].value = 15), 'flows:demo-flow-oil:value: D3'],
    ['publisher name in an assumption', (d) => (d.flows[0].fictionalAssumption = 'Scaled from Vortexa data.'), 'flows:demo-flow-oil:fictionalAssumption: D3: text names "VORTEXA"'],
    ['synthetic dropped', (d) => delete d.flows[1].synthetic, 'flows:demo-flow-lng:synthetic: D2'],
    ['share references an undeclared economy', (d) => (d.dependencyShares[2].economyId = 'demo-economy-z'), 'dependencyShares:demo-share-oil-c:economyId: D5'],
    ['duplicate id', (d) => (d.economies[3].id = 'demo-economy-a'), 'economies:demo-economy-a:id: D5: duplicate id'],
  ];

  for (const [label, mutate, expected] of cases) {
    it(`fails and names the record and field: ${label}`, () => {
      const dir = setup(mutate);
      const res = runValidation(dir);
      const lines = res.violations.map(formatViolation);
      expect(lines.some((l) => l.startsWith(`${DEMO_FILE}:${expected}`)), lines.join('\n')).toBe(true);
      const out = cli(dir);
      expect(out.status).toBe(1);
      expect(out.stderr).toContain(`${DEMO_FILE}:${expected}`);
    });
  }

  it('fails when an extra file sits under demo/', () => {
    const dir = setup(
      () => undefined,
      (d) => writeFileSync(join(d, 'demo', 'extra.json'), '{}'),
    );
    expect(existsSync(join(dir, 'demo', 'extra.json'))).toBe(true);
    const res = runValidation(dir);
    expect(res.violations.map(formatViolation)).toEqual([
      'demo/extra.json:demo:-:(file): D3: unexpected file under demo/ (only demo-dataset.json is allowed)',
    ]);
    const out = cli(dir);
    expect(out.status).toBe(1);
    expect(out.stderr).toContain('demo/extra.json:demo:-:(file): D3: unexpected file under demo/');
  });

  it('an uncorrupted copy passes', () => {
    const dir = setup(() => undefined);
    expect(runValidation(dir).violations).toEqual([]);
    expect(cli(dir).status).toBe(0);
  });
});
