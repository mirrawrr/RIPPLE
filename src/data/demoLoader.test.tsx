import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DEMO_DATA_UNAVAILABLE_TEXT } from '../config/constants';
import { DemoDatasetProvider, useDemoDataset } from './DemoDatasetProvider';
import { DEMO_FILE, loadDemoDataset, loadDemoForMode } from './demoLoader';
import type { DemoFetch, DemoFetchResponse } from './demoLoader';

const demoText = readFileSync(join(__dirname, '../../public/data/demo/demo-dataset.json'), 'utf8');
const demoJson = JSON.parse(demoText) as Record<string, unknown>;

const res = (status: number, body: string, contentType = 'application/json'): DemoFetchResponse => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: (n) => (n.toLowerCase() === 'content-type' ? contentType : null) },
  text: async () => body,
});

function mock(r: DemoFetchResponse | Error) {
  const urls: string[] = [];
  const fetch: DemoFetch = async (url) => {
    urls.push(url);
    if (r instanceof Error) throw r;
    return r;
  };
  return { urls, fetch };
}

const expectError = (s: Awaited<ReturnType<typeof loadDemoDataset>>) => {
  expect(s.status).toBe('error');
  if (s.status !== 'error') return;
  expect(s.demo).toBeUndefined();
  expect(s.error).toContain('demo/demo-dataset.json');
  expect(s.unavailableText).toBe(DEMO_DATA_UNAVAILABLE_TEXT);
  expect(s.file).toBe(DEMO_FILE);
};

describe('loadDemoDataset', () => {
  it('historical mode is idle and makes zero requests', async () => {
    const { urls, fetch } = mock(res(200, demoText));
    const s = await loadDemoForMode('historical', { fetch, baseUrl: '/' });
    expect(s).toMatchObject({ status: 'idle', file: DEMO_FILE });
    expect(s.demo).toBeUndefined();
    expect(urls).toHaveLength(0);
  });

  it('demo mode is ready with the parsed real demo file, requesting exactly one URL', async () => {
    const { urls, fetch } = mock(res(200, demoText));
    const s = await loadDemoForMode('demo', { fetch, baseUrl: '/' });
    expect(s.status).toBe('ready');
    expect(s.demo?.kind).toBe(demoJson.kind);
    expect(s.demo?.synthetic).toBe(true);
    expect(urls).toEqual(['/data/demo/demo-dataset.json']);
  });

  it.each([
    ['/', '/data/demo/demo-dataset.json'],
    ['/RIPPLE/', '/RIPPLE/data/demo/demo-dataset.json'],
    ['/RIPPLE', '/RIPPLE/data/demo/demo-dataset.json'],
  ])('base %s builds URL %s', async (baseUrl, expected) => {
    const { urls, fetch } = mock(res(200, demoText));
    await loadDemoDataset({ fetch, baseUrl });
    expect(urls).toEqual([expected]);
  });

  it('404 is an error naming the file', async () => {
    expectError(await loadDemoDataset({ fetch: mock(res(404, 'x')).fetch, baseUrl: '/' }));
  });

  it('SPA fallback is an error naming the file', async () => {
    const html = '<!doctype html><html><body><div id="root"></div></body></html>';
    expectError(await loadDemoDataset({ fetch: mock(res(200, html, 'text/html; charset=utf-8')).fetch, baseUrl: '/' }));
  });

  it('500 is an error naming the file', async () => {
    expectError(await loadDemoDataset({ fetch: mock(res(500, 'x')).fetch, baseUrl: '/' }));
  });

  it('network failure is an error naming the file', async () => {
    expectError(await loadDemoDataset({ fetch: mock(new Error('offline')).fetch, baseUrl: '/' }));
  });

  it('invalid JSON is an error naming the file', async () => {
    expectError(await loadDemoDataset({ fetch: mock(res(200, '{nope')).fetch, baseUrl: '/' }));
  });

  it.each([
    ['verificationStatus added', { ...demoJson, verificationStatus: 'verified' }],
    ['sourceRecordIds added', { ...demoJson, sourceRecordIds: ['x'] }],
    ['publicationDate added', { ...demoJson, publicationDate: '2020-01-01' }],
    ['synthetic false', { ...demoJson, synthetic: false }],
    ['non-demo kind', { ...demoJson, kind: 'curated' }],
  ])('schema failure (%s) is an error naming the file', async (_n, data) => {
    const s = await loadDemoDataset({ fetch: mock(res(200, JSON.stringify(data))).fetch, baseUrl: '/' });
    expectError(s);
    if (s.status === 'error') expect(s.error).toContain('schema validation failed');
  });
});

describe('isolation', () => {
  const src = readFileSync(join(__dirname, 'demoLoader.ts'), 'utf8');
  it('demo loader imports neither the Curated loader nor the Curated file list', () => {
    expect(src).not.toMatch(/from\s+['"]\.\/(loader|files)/);
    expect(src).not.toContain('COLLECTION_SPECS');
  });
  it('Curated loader does not import the demo loader', () => {
    for (const f of ['loader.ts', 'files.ts', 'DatasetProvider.tsx']) {
      expect(readFileSync(join(__dirname, f), 'utf8')).not.toMatch(/demoLoader|DemoDatasetProvider/);
    }
  });
});

describe('DemoDatasetProvider', () => {
  const Probe = () => <span>{useDemoDataset().status}</span>;
  it('is idle in historical mode and loading in demo mode on first render', () => {
    expect(renderToString(<DemoDatasetProvider mode="historical"><Probe /></DemoDatasetProvider>)).toContain('idle');
    expect(renderToString(<DemoDatasetProvider mode="demo"><Probe /></DemoDatasetProvider>)).toContain('loading');
  });
});
