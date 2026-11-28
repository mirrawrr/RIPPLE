/**
 * Demo_Dataset runtime loader (Task 2.9; Req 22.2, 22.12).
 *
 * Fetches `<baseUrl>data/demo/demo-dataset.json` only when invoked in demo mode, validates it with
 * DemoDatasetSchema and reports `{ status, demo, file }`. It shares no code with the Curated loader
 * and never reads a Curated value (Req 22.2); the Curated loader never calls it. Any failure is an
 * error naming the file: the file ships in production, so absence (404, SPA fallback) is not tolerated.
 * Build checks D3/D5 are authoritative for content rules; they are not repeated here.
 */
import { DEMO_DATA_UNAVAILABLE_TEXT } from '../config/constants';
import type { AppMode } from '../config/constants';
import { DemoDatasetSchema } from './schema.ts';
import type { DemoDataset } from './schema.ts';

/** Path of the Demo_Dataset file relative to `<baseUrl>data/`. */
export const DEMO_FILE = 'demo/demo-dataset.json';

export interface DemoFetchResponse {
  ok: boolean;
  status: number;
  headers: { get(name: string): string | null };
  text(): Promise<string>;
}
export type DemoFetch = (url: string) => Promise<DemoFetchResponse>;

export interface DemoLoadOptions {
  /** Defaults to `globalThis.fetch`. */
  fetch?: DemoFetch;
  /** Defaults to `import.meta.env.BASE_URL`. A missing trailing slash is added. */
  baseUrl?: string;
}

export type DemoState =
  | { status: 'idle'; demo?: undefined; file: typeof DEMO_FILE }
  | { status: 'loading'; demo?: undefined; file: typeof DEMO_FILE }
  | { status: 'ready'; demo: DemoDataset; file: typeof DEMO_FILE }
  | {
      status: 'error';
      demo?: undefined;
      file: typeof DEMO_FILE;
      error: string;
      /** Shown in place of each demo figure (Req 22.12). */
      unavailableText: typeof DEMO_DATA_UNAVAILABLE_TEXT;
    };

export const DEMO_IDLE: DemoState = { status: 'idle', file: DEMO_FILE };
export const DEMO_LOADING: DemoState = { status: 'loading', file: DEMO_FILE };

const errMessage = (e: unknown): string => (e instanceof Error ? e.message : String(e));

const failure = (message: string): DemoState => ({
  status: 'error',
  file: DEMO_FILE,
  error: `${DEMO_FILE}: ${message}`,
  unavailableText: DEMO_DATA_UNAVAILABLE_TEXT,
});

const isHtml = (contentType: string | null): boolean =>
  (contentType ?? '').split(';')[0].trim().toLowerCase() === 'text/html';

/** Fetches and validates the Demo_Dataset. Never throws; failures resolve to an 'error' state. */
export async function loadDemoDataset(options: DemoLoadOptions = {}): Promise<DemoState> {
  const fetchFn: DemoFetch = options.fetch ?? ((url) => globalThis.fetch(url));
  const rawBase = options.baseUrl ?? import.meta.env.BASE_URL;
  const url = `${rawBase.endsWith('/') ? rawBase : `${rawBase}/`}data/${DEMO_FILE}`;

  let res: DemoFetchResponse;
  try {
    res = await fetchFn(url);
  } catch (e) {
    return failure(`network error: ${errMessage(e)}`);
  }
  if (res.status === 404) return failure('file not found (HTTP 404)');
  if (!res.ok) return failure(`HTTP ${res.status}`);
  let body: string;
  try {
    body = await res.text();
  } catch (e) {
    return failure(`network error: ${errMessage(e)}`);
  }
  if (isHtml(res.headers.get('content-type'))) {
    return failure('unexpected HTML response (file not found or SPA fallback)');
  }
  let data: unknown;
  try {
    data = JSON.parse(body);
  } catch {
    return failure('invalid JSON');
  }
  const parsed = DemoDatasetSchema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .slice(0, 3)
      .map((i) => `${i.path.length ? i.path.map(String).join('.') : '(file)'}: ${i.message}`)
      .join('; ');
    return failure(`schema validation failed (${issues})`);
  }
  return { status: 'ready', demo: parsed.data, file: DEMO_FILE };
}

/** Mode gate: historical mode is 'idle' and makes no request; demo mode loads. */
export async function loadDemoForMode(mode: AppMode, options: DemoLoadOptions = {}): Promise<DemoState> {
  return mode === 'demo' ? loadDemoDataset(options) : DEMO_IDLE;
}
