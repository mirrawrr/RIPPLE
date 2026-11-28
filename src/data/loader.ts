/**
 * Curated_Dataset runtime loader (Task 2.5; Req 4.10, 12.11, 16.7, 22.2).
 *
 * Fetches each Curated file separately (same-origin, `<baseUrl>data/<file>`), validates every
 * record with its Zod schema and assembles whatever is available. A failing file is named in
 * `fileErrors` and its collection is left empty; the other files stay available (Req 16.7).
 *
 * This module only ever builds URLs from COLLECTION_SPECS and VERSION_FILE, which are the Curated
 * files. It has no knowledge of the Demo_Dataset, which is loaded by a separate loader (Req 22.2).
 *
 * Absent files: an HTTP 404 means "file not present". The collection is empty and no error is
 * recorded, matching the build validator, which treats an absent file as empty. The production
 * build ships no historical files while the dataset is link-only, so a 404 must not break the app.
 * The SPA fallback (200 text/html index.html for a missing file) is treated the same way; see isSpaFallback.
 */
import { DATASET_VERSION_UNAVAILABLE_TEXT, SOURCE_UNAVAILABLE_TEXT } from '../config/constants';
import { COLLECTION_SPECS, VERSION_FILE } from './files.ts';
import type { CollectionKey } from './files.ts';
import { SchemaVersionFileSchema } from './schema.ts';
import type { CuratedDataset, HistoricalObservation, SourceRecord } from './schema.ts';

/** Minimal response surface the loader needs, so tests can supply plain objects. */
export interface FetchResponseLike {
  ok: boolean;
  status: number;
  headers: { get(name: string): string | null };
  text(): Promise<string>;
}
export type FetchLike = (url: string) => Promise<FetchResponseLike>;

export interface LoadOptions {
  /** Defaults to `globalThis.fetch`. */
  fetch?: FetchLike;
  /** Defaults to `import.meta.env.BASE_URL`. A missing trailing slash is added. */
  baseUrl?: string;
  /**
   * Commodity ids (dataset ids, e.g. from commodity declarations or the app's required set)
   * whose baseline must be reported as available or unavailable. Defaults to none.
   */
  requiredCommodityIds?: readonly string[];
}

export type FileStatus = 'loaded' | 'absent' | 'error';

export interface FileState {
  status: FileStatus;
  /** Present when `status` is 'error' (file-level failure). Record-level problems are in `fileErrors` only. */
  error?: string;
}

/** One problem, always naming the file; record id and field when known. */
export interface FileError {
  file: string;
  recordId?: string;
  field?: string;
  message: string;
}

/** Curated collections without the version fields, which may be unreadable. */
export type LoadedDataset = Omit<CuratedDataset, 'schemaVersion' | 'buildDate'>;

export type DatasetVersion =
  | { available: true; schemaVersion: string; buildDate: string }
  | { available: false; text: typeof DATASET_VERSION_UNAVAILABLE_TEXT };

export interface BaselineAvailability {
  commodityId: string;
  /** True when at least one sourced observation exists for the commodity. */
  available: boolean;
  /** Shown in place of the value when unavailable. */
  unavailableText?: typeof SOURCE_UNAVAILABLE_TEXT;
}

export type LoadStatus = 'ready' | 'partial' | 'error';

export interface LoadResult {
  /** 'ready': no file failed. 'partial': some file failed. 'error': every file failed. */
  status: LoadStatus;
  /**
   * Valid records only. `historicalObservations` holds just the engine-eligible observations
   * (each with at least one source and every referenced source loaded and verified).
   */
  dataset: LoadedDataset;
  fileErrors: FileError[];
  files: Record<string, FileState>;
  version: DatasetVersion;
  /** Observations excluded from engine input because they lack a loaded, verified Source_Record (Req 4.10). */
  sourceUnavailableObservations: HistoricalObservation[];
  /** Always SOURCE_UNAVAILABLE_TEXT; for rendering in place of the value of each excluded observation. */
  sourceUnavailableText: typeof SOURCE_UNAVAILABLE_TEXT;
  baselines: BaselineAvailability[];
}

const emptyDataset = (): LoadedDataset => ({
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
});

const normaliseBase = (base: string): string => (base.endsWith('/') ? base : `${base}/`);

const errMessage = (e: unknown): string => (e instanceof Error ? e.message : String(e));

/** Media type of a Content-Type header, lower-cased, parameters (e.g. charset) ignored. */
const mediaType = (contentType: string | null): string => (contentType ?? '').split(';')[0].trim().toLowerCase();

const isHtmlContentType = (contentType: string | null): boolean => mediaType(contentType) === 'text/html';

/** Root mount element id in index.html (the application-shell marker). */
const SHELL_MARKER = /\bid\s*=\s*["']root["']/i;

/**
 * True only for the SPA fallback: status 200, Content-Type exactly text/html, body (after BOM and
 * whitespace) starting with `<!doctype html` or `<html`, and containing the app's root mount element.
 */
export function isSpaFallback(status: number, contentType: string | null, body: string): boolean {
  if (status !== 200 || !isHtmlContentType(contentType)) return false;
  const head = body.replace(/^\uFEFF/, '').trimStart().toLowerCase();
  return (head.startsWith('<!doctype html') || head.startsWith('<html')) && SHELL_MARKER.test(body);
}

type RawFile = { kind: 'absent' } | { kind: 'error'; message: string } | { kind: 'json'; data: unknown };

async function fetchJson(fetchFn: FetchLike, url: string): Promise<RawFile> {
  let res: FetchResponseLike;
  try {
    res = await fetchFn(url);
  } catch (e) {
    return { kind: 'error', message: `network error: ${errMessage(e)}` };
  }
  if (res.status === 404) return { kind: 'absent' };
  if (!res.ok) return { kind: 'error', message: `HTTP ${res.status}` };
  let body: string;
  try {
    body = await res.text();
  } catch (e) {
    return { kind: 'error', message: `network error: ${errMessage(e)}` };
  }
  if (isHtmlContentType(res.headers.get('content-type'))) {
    // A static host (Vite dev server, Cloudflare Pages SPA rewrite) answers a missing file with
    // the app's index.html and status 200. That means "file not present"; any other HTML is an error.
    return isSpaFallback(res.status, res.headers.get('content-type'), body)
      ? { kind: 'absent' }
      : { kind: 'error', message: 'unexpected HTML response' };
  }
  try {
    return { kind: 'json', data: JSON.parse(body) as unknown };
  } catch {
    return { kind: 'error', message: 'invalid JSON' };
  }
}

const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

const recordIdOf = (item: unknown, index: number): string =>
  isRecord(item) && typeof item.id === 'string' && item.id !== '' ? item.id : `[${index}]`;

export async function loadCuratedDataset(options: LoadOptions = {}): Promise<LoadResult> {
  const fetchFn: FetchLike = options.fetch ?? ((url) => globalThis.fetch(url));
  const base = `${normaliseBase(options.baseUrl ?? import.meta.env.BASE_URL)}data/`;

  const names = [VERSION_FILE, ...COLLECTION_SPECS.map((s) => s.file)];
  const raws = await Promise.all(names.map((name) => fetchJson(fetchFn, `${base}${name}`)));
  const rawOf = new Map(names.map((name, i) => [name, raws[i]]));

  const fileErrors: FileError[] = [];
  const files: Record<string, FileState> = {};
  const fail = (file: string, message: string): void => {
    files[file] = { status: 'error', error: `${file}: ${message}` };
    fileErrors.push({ file, message: `${file}: ${message}` });
  };

  // Version file.
  let version: DatasetVersion = { available: false, text: DATASET_VERSION_UNAVAILABLE_TEXT };
  const rawVersion = rawOf.get(VERSION_FILE) as RawFile;
  if (rawVersion.kind === 'absent') {
    files[VERSION_FILE] = { status: 'absent' };
  } else if (rawVersion.kind === 'error') {
    fail(VERSION_FILE, rawVersion.message);
  } else {
    const parsed = SchemaVersionFileSchema.safeParse(rawVersion.data);
    if (parsed.success) {
      files[VERSION_FILE] = { status: 'loaded' };
      version = { available: true, schemaVersion: parsed.data.schemaVersion, buildDate: parsed.data.buildDate };
    } else {
      files[VERSION_FILE] = { status: 'error', error: `${VERSION_FILE}: schema validation failed` };
      for (const issue of parsed.error.issues) {
        const field = issue.path.length ? issue.path.map(String).join('.') : '(file)';
        fileErrors.push({ file: VERSION_FILE, field, message: `${VERSION_FILE}: ${field}: ${issue.message}` });
      }
    }
  }

  // Collections.
  const collected = emptyDataset() as Record<CollectionKey, unknown[]>;
  for (const spec of COLLECTION_SPECS) {
    const raw = rawOf.get(spec.file) as RawFile;
    if (raw.kind === 'absent') {
      files[spec.file] = { status: 'absent' };
      continue;
    }
    if (raw.kind === 'error') {
      fail(spec.file, raw.message);
      continue;
    }
    if (!Array.isArray(raw.data)) {
      fail(spec.file, 'file content must be a JSON array');
      continue;
    }
    files[spec.file] = { status: 'loaded' };
    raw.data.forEach((item, index) => {
      const res = spec.schema.safeParse(item);
      if (res.success) {
        collected[spec.key].push(res.data);
        return;
      }
      const recordId = recordIdOf(item, index);
      for (const issue of res.error.issues) {
        const field = issue.path.length ? issue.path.map(String).join('.') : '(record)';
        fileErrors.push({
          file: spec.file,
          recordId,
          field,
          message: `${spec.file}: record ${recordId}: ${field}: ${issue.message}`,
        });
      }
    });
  }
  const dataset = collected as unknown as LoadedDataset;

  // Req 4.10: observations without a loaded, verified Source_Record are excluded from engine input.
  const verifiedSources = new Map<string, SourceRecord>(
    dataset.sourceRecords.filter((s) => s.verificationStatus === 'verified').map((s) => [s.id as string, s]),
  );
  const engineObservations: HistoricalObservation[] = [];
  const sourceUnavailableObservations: HistoricalObservation[] = [];
  for (const o of dataset.historicalObservations) {
    const sourced = o.sourceRecordIds.length > 0 && o.sourceRecordIds.every((id) => verifiedSources.has(id));
    (sourced ? engineObservations : sourceUnavailableObservations).push(o);
  }
  dataset.historicalObservations = engineObservations;

  const baselines: BaselineAvailability[] = (options.requiredCommodityIds ?? []).map((commodityId) => {
    const available = engineObservations.some((o) => o.commodityId === commodityId);
    return available ? { commodityId, available } : { commodityId, available, unavailableText: SOURCE_UNAVAILABLE_TEXT };
  });

  const errored = new Set(fileErrors.map((e) => e.file));
  const status: LoadStatus = errored.size === 0 ? 'ready' : errored.size === names.length ? 'error' : 'partial';

  return {
    status,
    dataset,
    fileErrors,
    files,
    version,
    sourceUnavailableObservations,
    sourceUnavailableText: SOURCE_UNAVAILABLE_TEXT,
    baselines,
  };
}
