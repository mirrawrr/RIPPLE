import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DATASET_VERSION_UNAVAILABLE_TEXT, SOURCE_UNAVAILABLE_TEXT } from '../config/constants';
import { loadCuratedDataset } from './loader';
import type { FetchLike, FetchResponseLike } from './loader';
import { COLLECTION_SPECS, VERSION_FILE } from './files';

const root = resolve(__dirname, '..', '..');
const goodDir = join(root, 'tests', 'fixtures', 'validate', 'good');
const good = (file: string): unknown => JSON.parse(readFileSync(join(goodDir, file), 'utf8'));
const ALL_FILES = [VERSION_FILE, ...COLLECTION_SPECS.map((s) => s.file)];

type Behaviour = unknown | 'missing' | 'http500' | 'network' | 'badjson';

const resp = (status: number, contentType: string | null, body: string): FetchResponseLike => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: (n) => (n.toLowerCase() === 'content-type' ? contentType : null) },
  text: async () => body,
});
const json = (data: unknown): FetchResponseLike => resp(200, 'application/json', JSON.stringify(data));

/** Modelled on the repo's index.html (and the captured dev-server body). */
const INDEX_HTML = `<!doctype html>
<html lang="en">
  <head>
    <script type="module">import { injectIntoGlobalHook } from "/@react-refresh";</script>
    <meta charset="UTF-8" />
    <title>RIPPLE</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

/** Mock fetch serving the good fixtures, with per-file overrides. Records every requested URL. */
function mockFetch(overrides: Record<string, Behaviour> = {}, allMissing = false) {
  const urls: string[] = [];
  const fetchFn: FetchLike = async (url) => {
    urls.push(url);
    const file = url.slice(url.lastIndexOf('/') + 1);
    const b: Behaviour = file in overrides ? overrides[file] : allMissing ? 'missing' : good(file);
    if (b === 'missing') return resp(404, 'text/plain', 'not found');
    if (b === 'http500') return resp(500, 'text/plain', 'error');
    if (b === 'network') throw new Error('connection refused');
    if (b === 'badjson') return resp(200, 'application/json', '{ not json');
    if (b instanceof Function) return (b as () => FetchResponseLike)();
    return json(b);
  };
  return { fetchFn, urls };
}

const run = (overrides: Record<string, Behaviour> = {}, allMissing = false, extra: { baseUrl?: string } = {}) => {
  const m = mockFetch(overrides, allMissing);
  return loadCuratedDataset({
    fetch: m.fetchFn,
    baseUrl: extra.baseUrl ?? '/',
    requiredCommodityIds: ['test-commodity-a', 'test-commodity-b', 'test-commodity-missing'],
  }).then((result) => ({ result, urls: m.urls }));
};

describe('loadCuratedDataset', () => {
  it('loads every file, assembles the dataset and reads the version', async () => {
    const { result, urls } = await run();
    expect(result.status).toBe('ready');
    expect(result.fileErrors).toEqual([]);
    expect(Object.values(result.files).every((f) => f.status === 'loaded')).toBe(true);
    expect(Object.keys(result.files).sort()).toEqual([...ALL_FILES].sort());
    expect(result.dataset.historicalObservations).toHaveLength(2);
    expect(result.dataset.sourceRecords).toHaveLength(1);
    expect(result.version).toEqual({ available: true, schemaVersion: '1', buildDate: '2020-03-01' });
    expect(result.sourceUnavailableObservations).toEqual([]);
    expect(result.baselines.map((b) => [b.commodityId, b.available])).toEqual([
      ['test-commodity-a', true],
      ['test-commodity-b', true],
      ['test-commodity-missing', false],
    ]);
    expect(result.baselines[2].unavailableText).toBe(SOURCE_UNAVAILABLE_TEXT);
    expect(urls).toHaveLength(ALL_FILES.length);
  });

  it('treats a 404 on every file as absent: no errors, empty dataset, no baselines, version unavailable', async () => {
    const { result } = await run({}, true);
    expect(result.status).toBe('ready');
    expect(result.fileErrors).toEqual([]);
    expect(Object.values(result.files).every((f) => f.status === 'absent')).toBe(true);
    expect(result.dataset.historicalObservations).toEqual([]);
    expect(result.baselines.every((b) => !b.available && b.unavailableText === SOURCE_UNAVAILABLE_TEXT)).toBe(true);
    expect(result.version).toEqual({ available: false, text: DATASET_VERSION_UNAVAILABLE_TEXT });
  });

  const failures: [string, Behaviour, string][] = [
    ['HTTP 500', 'http500', 'HTTP 500'],
    ['network error', 'network', 'connection refused'],
    ['invalid JSON', 'badjson', 'invalid JSON'],
    ['non-array content', { not: 'an array' }, 'must be a JSON array'],
  ];
  for (const [label, behaviour, text] of failures) {
    it(`names the failing file on ${label} and keeps the other files available`, async () => {
      const { result } = await run({ 'economies.json': behaviour });
      expect(result.status).toBe('partial');
      expect(result.fileErrors).toHaveLength(1);
      expect(result.fileErrors[0].file).toBe('economies.json');
      expect(result.fileErrors[0].message).toContain('economies.json');
      expect(result.fileErrors[0].message).toContain(text);
      expect(result.files['economies.json'].status).toBe('error');
      expect(result.dataset.economies).toEqual([]);
      expect(result.dataset.historicalObservations).toHaveLength(2);
      expect(result.dataset.commodities).toHaveLength(2);
      expect(result.files['commodities.json'].status).toBe('loaded');
    });
  }

  it('excludes an invalid record, names its file, id and field, and keeps valid records', async () => {
    const obs = good('historical-observations.json') as Record<string, unknown>[];
    const bad = { ...obs[0], value: -5 };
    const { result } = await run({ 'historical-observations.json': [bad, obs[1]] });
    expect(result.status).toBe('partial');
    const e = result.fileErrors.find((x) => x.recordId === 'test-obs-day');
    expect(e).toMatchObject({ file: 'historical-observations.json', recordId: 'test-obs-day', field: 'value' });
    expect(e?.message).toContain('historical-observations.json');
    expect(result.dataset.historicalObservations.map((o) => o.id)).toEqual(['test-obs-year']);
  });

  it('excludes observations without a verified Source_Record from engine input and flags them', async () => {
    const obs = good('historical-observations.json') as Record<string, unknown>[];
    const dangling = { ...obs[0], sourceRecordIds: ['no-such-source'] };
    const { result } = await run({ 'historical-observations.json': [dangling, obs[1]] });
    expect(result.fileErrors).toEqual([]);
    expect(result.dataset.historicalObservations.map((o) => o.id)).toEqual(['test-obs-year']);
    expect(result.sourceUnavailableObservations.map((o) => o.id)).toEqual(['test-obs-day']);
    expect(result.sourceUnavailableText).toBe(SOURCE_UNAVAILABLE_TEXT);
    expect(result.baselines.find((b) => b.commodityId === 'test-commodity-a')).toEqual({
      commodityId: 'test-commodity-a',
      available: false,
      unavailableText: SOURCE_UNAVAILABLE_TEXT,
    });
  });

  it('excludes every observation when source-records.json is unavailable or its sources are unverified', async () => {
    const a = (await run({ 'source-records.json': 'http500' })).result;
    expect(a.dataset.historicalObservations).toEqual([]);
    expect(a.sourceUnavailableObservations).toHaveLength(2);
    const src = (good('source-records.json') as Record<string, unknown>[])[0];
    const b = (await run({ 'source-records.json': [{ ...src, verificationStatus: 'unverified' }] })).result;
    expect(b.dataset.historicalObservations).toEqual([]);
    expect(b.sourceUnavailableObservations).toHaveLength(2);
  });

  it('reports "Dataset version unavailable" for a missing, failing or invalid version file, never inventing one', async () => {
    for (const behaviour of ['missing', 'http500', 'badjson', { schemaVersion: '1' }, { schemaVersion: '1', buildDate: '2020-13-45' }] as Behaviour[]) {
      const { result } = await run({ [VERSION_FILE]: behaviour });
      expect(result.version).toEqual({ available: false, text: DATASET_VERSION_UNAVAILABLE_TEXT });
      expect(result.dataset.historicalObservations).toHaveLength(2);
      if (behaviour !== 'missing') {
        expect(result.fileErrors.length).toBeGreaterThan(0);
        expect(result.fileErrors.every((e) => e.file === VERSION_FILE)).toBe(true);
      }
    }
  });

  it('reports status "error" when every file fails', async () => {
    const all = Object.fromEntries(ALL_FILES.map((f) => [f, 'http500' as Behaviour]));
    const { result } = await run(all);
    expect(result.status).toBe('error');
    expect(result.fileErrors).toHaveLength(ALL_FILES.length);
  });

  it('builds URLs from baseUrl with or without a trailing slash', async () => {
    for (const [baseUrl, prefix] of [
      ['/', '/data/'],
      ['/RIPPLE/', '/RIPPLE/data/'],
      ['/RIPPLE', '/RIPPLE/data/'],
    ] as const) {
      const { urls } = await run({}, false, { baseUrl });
      expect(urls.sort()).toEqual(ALL_FILES.map((f) => `${prefix}${f}`).sort());
    }
  });

  it('never requests anything under data/demo/ and fetches only the Curated files', async () => {
    const scenarios: [Record<string, Behaviour>, boolean][] = [
      [{}, false],
      [{}, true],
      [{ 'economies.json': 'network', [VERSION_FILE]: 'badjson' }, false],
    ];
    for (const [overrides, allMissing] of scenarios) {
      const { urls } = await run(overrides, allMissing);
      expect(urls.some((u) => u.includes('/data/demo/') || u.includes('demo'))).toBe(false);
    }
  });

  it('loader and file-layout sources do not reference demo/', () => {
    for (const f of ['loader.ts', 'files.ts']) {
      const text = readFileSync(join(__dirname, f), 'utf8');
      expect(text).not.toContain('demo/');
    }
  });
});

describe('SPA fallback handling (missing file answered with index.html)', () => {
  const spa = (ct = 'text/html', status = 200, body = INDEX_HTML): Behaviour => () => resp(status, ct, body);
  const FILE = 'economies.json';

  it('(a) a fallback for one collection is absent: no error, other files load', async () => {
    const { result } = await run({ [FILE]: spa() });
    expect(result.status).toBe('ready');
    expect(result.fileErrors).toEqual([]);
    expect(result.files[FILE].status).toBe('absent');
    expect(result.dataset.economies).toEqual([]);
    expect(result.dataset.historicalObservations).toHaveLength(2);
  });

  it('(b) a fallback for schema-version.json leaves the version unavailable without an error', async () => {
    const { result } = await run({ [VERSION_FILE]: spa() });
    expect(result.version).toEqual({ available: false, text: DATASET_VERSION_UNAVAILABLE_TEXT });
    expect(result.fileErrors).toEqual([]);
    expect(result.files[VERSION_FILE].status).toBe('absent');
  });

  it('(c) fallback for every historical file: ready, empty dataset, no errors, baselines unavailable', async () => {
    const { result } = await run(Object.fromEntries(ALL_FILES.map((f) => [f, spa()])));
    expect(result.status).toBe('ready');
    expect(result.fileErrors).toEqual([]);
    expect(result.dataset.historicalObservations).toEqual([]);
    expect(result.dataset.sourceRecords).toEqual([]);
    expect(result.version.available).toBe(false);
    expect(result.baselines.every((b) => !b.available && b.unavailableText === SOURCE_UNAVAILABLE_TEXT)).toBe(true);
  });

  it('(d) 200 application/json with malformed JSON is an invalid-JSON error naming the file', async () => {
    const { result } = await run({ [FILE]: spa('application/json', 200, '{ "a": ') });
    expect(result.fileErrors).toHaveLength(1);
    expect(result.fileErrors[0].message).toContain(FILE);
    expect(result.fileErrors[0].message).toContain('invalid JSON');
  });

  it('(e) 200 text/html with a non-HTML body is an error', async () => {
    const { result } = await run({ [FILE]: spa('text/html', 200, 'oops') });
    expect(result.fileErrors).toHaveLength(1);
    expect(result.fileErrors[0].message).toContain(FILE);
    expect(result.fileErrors[0].message).toContain('unexpected HTML');
    expect(result.files[FILE].status).toBe('error');
  });

  it('(f) 200 text/html HTML document without the shell marker is an error', async () => {
    const { result } = await run({ [FILE]: spa('text/html', 200, '<!doctype html><html><body>Hi</body></html>') });
    expect(result.fileErrors).toHaveLength(1);
    expect(result.fileErrors[0].message).toContain('unexpected HTML');
  });

  for (const [label, ct] of [['(g) application/json', 'application/json'], ['(h) text/plain', 'text/plain']] as const) {
    it(`${label} with the index.html body is an error`, async () => {
      const { result } = await run({ [FILE]: spa(ct) });
      expect(result.fileErrors).toHaveLength(1);
      expect(result.fileErrors[0].file).toBe(FILE);
      expect(result.fileErrors[0].message).toContain('invalid JSON');
    });
  }

  it('(i) 500 text/html with the index.html body is an HTTP error', async () => {
    const { result } = await run({ [FILE]: spa('text/html', 500) });
    expect(result.fileErrors).toHaveLength(1);
    expect(result.fileErrors[0].message).toContain('HTTP 500');
  });

  it('(j) a network failure is an error', async () => {
    const { result } = await run({ [FILE]: 'network' });
    expect(result.fileErrors).toHaveLength(1);
    expect(result.fileErrors[0].message).toContain('connection refused');
  });

  it('(k) mixed fallbacks and one schema-invalid file report only the invalid one', async () => {
    const obs = good('historical-observations.json') as Record<string, unknown>[];
    const { result } = await run({
      'economies.json': spa(),
      'chokepoints.json': spa(),
      [VERSION_FILE]: spa(),
      'historical-observations.json': [{ ...obs[0], value: -5 }, obs[1]],
    });
    expect(new Set(result.fileErrors.map((e) => e.file))).toEqual(new Set(['historical-observations.json']));
    expect(result.status).toBe('partial');
  });

  it('(l) a content-type with charset and different case is still detected', async () => {
    for (const ct of ['text/html; charset=utf-8', 'Text/HTML;charset=UTF-8']) {
      const { result } = await run({ [FILE]: spa(ct, 200, `\uFEFF\n  ${INDEX_HTML}`) });
      expect(result.fileErrors).toEqual([]);
      expect(result.files[FILE].status).toBe('absent');
    }
  });

  it('(m) isolation holds: nothing under data/demo/ is requested in fallback scenarios', async () => {
    const { urls } = await run(Object.fromEntries(ALL_FILES.map((f) => [f, spa()])));
    expect(urls).toHaveLength(ALL_FILES.length);
    expect(urls.some((u) => u.includes('demo'))).toBe(false);
  });
});

describe('file layout shared with the build validator', () => {
  it('scripts/validate-dataset.ts uses the same COLLECTION_SPECS list', () => {
    const script = readFileSync(join(root, 'scripts', 'validate-dataset.ts'), 'utf8');
    expect(script).toContain("from '../src/data/files.ts'");
    expect(script).not.toMatch(/file: '[a-z-]+\.json'/);
    expect(COLLECTION_SPECS.map((s) => s.file)).toEqual([
      'datasets.json',
      'chokepoints.json',
      'commodities.json',
      'economies.json',
      'source-records.json',
      'historical-observations.json',
      'dependency-shares.json',
      'qualitative-dependencies.json',
      'graph-nodes.json',
      'graph-edges.json',
    ]);
  });
});
