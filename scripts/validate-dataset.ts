/**
 * Build-time Curated_Dataset validator (Task 2.2; Req 4.3, 4.11, 4.12, 4.13, 4.14, 9.3, 17.2).
 *
 * Run as `node scripts/validate-dataset.ts [--data-dir <path>]` (Node native type stripping,
 * so no extra dependency: only erasable TypeScript syntax and explicit `.ts` import
 * extensions are used here). Wired as `prebuild` in package.json.
 *
 * The script never writes any file. On any violation it prints one line per violation,
 *   <file>:<collection>:<recordId>:<field>: <message>
 * and exits with code 1, so `npm run build` stops before tsc/vite produce dist/.
 *
 * Two separate pathways over separate files (Task 2.7; Req 22.10, 22.11):
 *  - historical validation (`validateRawDataset`) over the Curated files, unchanged;
 *  - demo separation checks over the raw JSON files, as exported functions:
 *      D1 `checkCuratedClean`     Curated files carry no `synthetic` key (any depth), no `kind` key equal to the
 *                                 demo kind and no `demo-` id. The same raw scan is the "no `synthetic` key in any
 *                                 JSON outside demo/" rule of D3, so it is implemented once.
 *      D2 `checkDemoParses`       demo/demo-dataset.json parses with DemoDatasetSchema.
 *      D3 `checkDemoContent`      demo- ids, "(fictional)" economies, "demo" units, multiples of 10,
 *                                 no forbidden source name in any string.
 *      D5 `checkDemoReferences`   demo references resolve inside the demo file; no id shared with the Curated files.
 *    The demo file is never merged into the Curated dataset. If it is absent the checks pass and
 *    "demo dataset not present" is logged (D1 still runs). Task 17.4 adds the strict "file required" flag.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  DEMO_DATASET_KIND,
  DEMO_FICTIONAL_MARKER,
  DEMO_FORBIDDEN_SOURCE_NAMES,
  DEMO_ID_PREFIX,
  DEMO_UNIT_MARKER,
  DEMO_VALUE_MULTIPLE,
} from '../src/config/constants.ts';
import { DemoDatasetSchema, SchemaVersionFileSchema } from '../src/data/schema.ts';
import type { CuratedDataset } from '../src/data/schema.ts';
import { COLLECTION_SPECS, CURRENT_SCHEMA_VERSION, VERSION_FILE } from '../src/data/files.ts';
import type { CollectionKey, CollectionSpec } from '../src/data/files.ts';

// Shared with the runtime loader (src/data/loader.ts); re-exported so existing importers keep working.
export { COLLECTION_SPECS, VERSION_FILE };
export type { CollectionKey };

/* ---------- Public types and constants ---------- */

/** Allow-list of supported schema versions (Req 17.2). Extend when a new version ships. */
export const SUPPORTED_SCHEMA_VERSIONS: readonly string[] = [CURRENT_SCHEMA_VERSION];

export interface Violation {
  file: string;
  collection: string;
  recordId: string;
  field: string;
  message: string;
}

export const formatViolation = (v: Violation): string =>
  `${v.file}:${v.collection}:${v.recordId}:${v.field}: ${v.message}`;

export type Collections = Pick<CuratedDataset, CollectionKey>;

/* Dataset file layout (design: "Dataset file layout"): COLLECTION_SPECS, imported from src/data/files.ts. */

const FILE_OF = Object.fromEntries(COLLECTION_SPECS.map((s) => [s.key, s.file])) as Record<CollectionKey, string>;

export interface ValidateOptions {
  /** When true, a missing schema-version.json is a violation. Default false until Task 3.5/17.4. */
  requireVersionFile?: boolean;
  /** Override the supported-version allow-list (tests). */
  supportedSchemaVersions?: readonly string[];
  /** Comparison date (YYYY-MM-DD) used when no version file supplies a buildDate. Default: today, UTC. */
  today?: string;
}

/** Raw (unparsed) input: what was read from disk. `undefined` means the file is absent. */
export interface RawDataset {
  version?: unknown;
  collections: Partial<Record<CollectionKey, unknown>>;
}

export interface ValidationResult {
  violations: Violation[];
  notices: string[];
}

/* ---------- Helpers ---------- */

const todayUtc = (): string => new Date().toISOString().slice(0, 10);

const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

const idOf = (x: unknown, index: number): string =>
  isRecord(x) && typeof x.id === 'string' && x.id !== '' ? x.id : `[${index}]`;

export function isValidIsoDate(s: unknown): s is string {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

const issueField = (path: readonly PropertyKey[]): string => (path.length ? path.map(String).join('.') : '(record)');

/* ---------- Schema-level parsing (per record, so every violation names its record) ---------- */

/**
 * Parses each record with its Zod schema. Returns the records that passed, and the ids of
 * every record that had a string id (used so a record failing its schema does not also
 * cause "dangling reference" noise elsewhere).
 */
function parseCollection(
  spec: CollectionSpec,
  raw: unknown,
  violations: Violation[],
): { valid: unknown[]; allIds: Set<string> } {
  const valid: unknown[] = [];
  const allIds = new Set<string>();
  if (raw === undefined) return { valid, allIds };
  if (!Array.isArray(raw)) {
    violations.push({
      file: spec.file,
      collection: spec.key,
      recordId: '-',
      field: '(file)',
      message: 'file content must be a JSON array',
    });
    return { valid, allIds };
  }
  raw.forEach((item, index) => {
    if (isRecord(item) && typeof item.id === 'string') allIds.add(item.id);
    const res = spec.schema.safeParse(item);
    if (res.success) {
      valid.push(res.data);
      return;
    }
    for (const issue of res.error.issues) {
      violations.push({
        file: spec.file,
        collection: spec.key,
        recordId: idOf(item, index),
        field: issueField(issue.path),
        message: issue.message,
      });
    }
  });
  return { valid, allIds };
}

/* ---------- Cross-record checks ---------- */

const SOURCE_DATE_FIELDS = ['publicationDate', 'lastUpdatedDate', 'retrievalDate', 'verificationDate'] as const;
const PUBLICATION_KIND_FIELDS = ['publicationDate', 'lastUpdatedDate'] as const;

/**
 * Cross-record checks over records that already passed their own schema.
 * `unparsedIds` optionally lists ids of records that failed their schema, so references
 * to them are not reported as dangling a second time.
 */
export function crossCheckDataset(
  data: Collections,
  buildDate: string,
  unparsedIds: Partial<Record<CollectionKey, ReadonlySet<string>>> = {},
): Violation[] {
  const out: Violation[] = [];
  const add = (key: CollectionKey, recordId: string, field: string, message: string): void => {
    out.push({ file: FILE_OF[key], collection: key, recordId, field, message });
  };

  // Unique ids per collection.
  const ids = {} as Record<CollectionKey, Set<string>>;
  for (const spec of COLLECTION_SPECS) {
    const seen = new Set<string>();
    for (const rec of data[spec.key] as { id: string }[]) {
      if (seen.has(rec.id)) add(spec.key, rec.id, 'id', `duplicate id "${rec.id}" in ${spec.key}`);
      seen.add(rec.id);
    }
    ids[spec.key] = new Set([...seen, ...(unparsedIds[spec.key] ?? [])]);
  }

  const sourceById = new Map(data.sourceRecords.map((s) => [s.id as string, s]));

  const checkDeclared = (
    key: CollectionKey,
    recordId: string,
    field: string,
    value: string,
    declaredIn: CollectionKey,
  ): void => {
    if (!ids[declaredIn].has(value)) {
      add(key, recordId, field, `"${value}" is not declared in ${FILE_OF[declaredIn]}`);
    }
  };

  const checkSources = (key: CollectionKey, recordId: string, sourceIds: readonly string[]): void => {
    for (const sid of sourceIds) {
      const src = sourceById.get(sid);
      if (src === undefined) {
        if (!ids.sourceRecords.has(sid)) add(key, recordId, 'sourceRecordIds', `source record "${sid}" does not exist`);
      } else if (src.verificationStatus !== 'verified') {
        add(key, recordId, 'sourceRecordIds', `source record "${sid}" is not verified`);
      }
    }
  };

  const checkVerified = (key: CollectionKey, recordId: string, status: string): void => {
    if (status !== 'verified') add(key, recordId, 'verificationStatus', `must be "verified", found "${status}"`);
  };

  for (const o of data.historicalObservations) {
    checkVerified('historicalObservations', o.id, o.verificationStatus);
    checkDeclared('historicalObservations', o.id, 'datasetId', o.datasetId, 'datasets');
    checkDeclared('historicalObservations', o.id, 'chokepointId', o.chokepointId, 'chokepoints');
    checkDeclared('historicalObservations', o.id, 'commodityId', o.commodityId, 'commodities');
    checkSources('historicalObservations', o.id, o.sourceRecordIds);
  }

  for (const s of data.dependencyShares) {
    checkVerified('dependencyShares', s.id, s.verificationStatus);
    checkDeclared('dependencyShares', s.id, 'datasetId', s.datasetId, 'datasets');
    checkDeclared('dependencyShares', s.id, 'chokepointId', s.chokepointId, 'chokepoints');
    checkDeclared('dependencyShares', s.id, 'commodityId', s.commodityId, 'commodities');
    checkDeclared('dependencyShares', s.id, 'economyId', s.economyId, 'economies');
    checkSources('dependencyShares', s.id, s.sourceRecordIds);
  }

  for (const q of data.qualitativeDependencies) {
    checkVerified('qualitativeDependencies', q.id, q.verificationStatus);
    checkDeclared('qualitativeDependencies', q.id, 'datasetId', q.datasetId, 'datasets');
    checkDeclared('qualitativeDependencies', q.id, 'chokepointId', q.chokepointId, 'chokepoints');
    checkDeclared('qualitativeDependencies', q.id, 'commodityId', q.commodityId, 'commodities');
    checkDeclared('qualitativeDependencies', q.id, 'economyId', q.economyId, 'economies');
    checkSources('qualitativeDependencies', q.id, q.sourceRecordIds);
  }

  // A (economy, commodity, chokepoint) combination is either numeric or qualitative, never both (Req 4.8).
  const comboKey = (r: { economyId: string; commodityId: string; chokepointId: string }): string =>
    JSON.stringify([r.economyId, r.commodityId, r.chokepointId]);
  const shareByCombo = new Map(data.dependencyShares.map((s) => [comboKey(s), s.id as string]));
  for (const q of data.qualitativeDependencies) {
    const shareId = shareByCombo.get(comboKey(q));
    if (shareId !== undefined) {
      add(
        'qualitativeDependencies',
        q.id,
        'economyId',
        `economy, commodity and chokepoint also have numeric dependency share "${shareId}"; use one or the other`,
      );
    }
  }

  // Graph (Req 9.3).
  for (const e of data.graphEdges) {
    checkDeclared('graphEdges', e.id, 'sourceNodeId', e.sourceNodeId, 'graphNodes');
    checkDeclared('graphEdges', e.id, 'targetNodeId', e.targetNodeId, 'graphNodes');
    checkSources('graphEdges', e.id, e.sourceRecordIds);
  }

  // Dates on source records, generic over whichever date fields are present.
  for (const src of data.sourceRecords) {
    const rec = src as unknown as Record<string, unknown>;
    if (!PUBLICATION_KIND_FIELDS.some((f) => rec[f] !== undefined)) {
      add('sourceRecords', src.id, 'publicationDate', 'no publicationDate or lastUpdatedDate');
    }
    for (const f of SOURCE_DATE_FIELDS) {
      const v = rec[f];
      if (v === undefined) continue;
      if (!isValidIsoDate(v)) {
        add('sourceRecords', src.id, f, `"${String(v)}" is not a valid YYYY-MM-DD date`);
      } else if (v > buildDate) {
        add('sourceRecords', src.id, f, `${v} is later than buildDate ${buildDate}`);
      }
    }
    const start = rec.referencePeriodStart;
    const end = rec.referencePeriodEnd;
    if (isValidIsoDate(start) && isValidIsoDate(end) && end < start) {
      add('sourceRecords', src.id, 'referencePeriodEnd', 'referencePeriodEnd must not precede referencePeriodStart');
    }
  }

  return out;
}

/* ---------- Whole-dataset validation ---------- */

export function validateRawDataset(raw: RawDataset, options: ValidateOptions = {}): ValidationResult {
  const violations: Violation[] = [];
  const notices: string[] = [];
  const supported = options.supportedSchemaVersions ?? SUPPORTED_SCHEMA_VERSIONS;

  // Version file.
  let buildDate: string;
  if (raw.version === undefined) {
    buildDate = options.today ?? todayUtc();
    if (options.requireVersionFile) {
      violations.push({
        file: VERSION_FILE,
        collection: 'schemaVersion',
        recordId: '-',
        field: '(file)',
        message: 'file is required but not present',
      });
    } else {
      notices.push(`${VERSION_FILE} not present (created in Task 3.5) - version check skipped`);
    }
    notices.push(`buildDate unavailable; comparing dates against today (UTC) ${buildDate}`);
  } else {
    const parsed = SchemaVersionFileSchema.safeParse(raw.version);
    if (parsed.success) {
      buildDate = parsed.data.buildDate;
      if (!supported.includes(parsed.data.schemaVersion)) {
        violations.push({
          file: VERSION_FILE,
          collection: 'schemaVersion',
          recordId: '-',
          field: 'schemaVersion',
          message: `unsupported schemaVersion "${parsed.data.schemaVersion}" (supported: ${supported.join(', ')})`,
        });
      }
    } else {
      buildDate = options.today ?? todayUtc();
      for (const issue of parsed.error.issues) {
        violations.push({
          file: VERSION_FILE,
          collection: 'schemaVersion',
          recordId: '-',
          field: issueField(issue.path),
          message: issue.message,
        });
      }
    }
  }

  // Per-record schema parsing.
  const valid = {} as Record<CollectionKey, unknown[]>;
  const unparsedIds: Partial<Record<CollectionKey, ReadonlySet<string>>> = {};
  for (const spec of COLLECTION_SPECS) {
    const res = parseCollection(spec, raw.collections[spec.key], violations);
    valid[spec.key] = res.valid;
    unparsedIds[spec.key] = res.allIds;
  }

  violations.push(...crossCheckDataset(valid as unknown as Collections, buildDate, unparsedIds));
  return { violations, notices };
}

/* ---------- Demo separation checks (Task 2.7: D1, D2, D3, D5) ---------- */

/** Parsed JSON files keyed by path relative to the data directory, with `/` separators. */
export type JsonFiles = Readonly<Record<string, unknown>>;

export const DEMO_DIR = 'demo';
export const DEMO_FILE = 'demo/demo-dataset.json';
/** Logged (as `validate-dataset: demo dataset not present`) when the demo file is absent. */
export const DEMO_ABSENT_NOTICE = 'demo dataset not present';

const COLLECTION_OF_FILE = new Map<string, CollectionKey>(COLLECTION_SPECS.map((s) => [s.file, s.key]));

const DEMO_RECORD_COLLECTIONS = ['chokepoints', 'commodities', 'economies', 'flows', 'dependencyShares'] as const;

/** Where a path inside the demo file belongs: the record that holds it and the field inside that record. */
function locateInDemo(raw: unknown, path: readonly PropertyKey[]): { collection: string; recordId: string; field: string } {
  const top = path[0];
  if (isRecord(raw) && typeof top === 'string' && typeof path[1] === 'number') {
    const list = raw[top];
    if (Array.isArray(list) && isRecord(list[path[1]])) {
      return { collection: top, recordId: idOf(list[path[1]], path[1]), field: issueField(path.slice(2)) };
    }
  }
  return { collection: 'demo', recordId: '-', field: issueField(path) };
}

const demoViolation = (loc: { collection: string; recordId: string; field: string }, message: string): Violation => ({
  file: DEMO_FILE,
  ...loc,
  message,
});

/* --- D1 (and the Curated-side `synthetic` scan of D3) --- */

/**
 * D1/D3: inspects the RAW JSON of every file outside demo/ (before and independently of Zod parsing).
 * Reports a `synthetic` key at any depth, a `kind` key equal to the demo kind, and any record or
 * declaration id that begins with `demo-`.
 */
export function checkCuratedClean(files: JsonFiles): Violation[] {
  const out: Violation[] = [];
  for (const [file, content] of Object.entries(files)) {
    if (file === DEMO_DIR || file.startsWith(`${DEMO_DIR}/`)) continue;
    const key = COLLECTION_OF_FILE.get(file);
    const collection: string = key ?? file;

    const scan = (node: unknown, path: (string | number)[], recordId: string): void => {
      if (Array.isArray(node)) {
        node.forEach((item, i) => scan(item, [...path, i], recordId));
        return;
      }
      if (!isRecord(node)) return;
      for (const [k, v] of Object.entries(node)) {
        const here = [...path, k];
        if (k === 'synthetic') {
          out.push({
            file,
            collection,
            recordId,
            field: issueField(here),
            message: 'D1/D3: "synthetic" key is not allowed in any JSON file outside public/data/demo/ (Curated files must contain no Synthetic_Record marker)',
          });
        } else if (k === 'kind' && v === DEMO_DATASET_KIND) {
          out.push({
            file,
            collection,
            recordId,
            field: issueField(here),
            message: `D1: "kind" equal to "${DEMO_DATASET_KIND}" marks a Demo_Dataset and is not allowed outside public/data/demo/`,
          });
        }
        scan(v, here, recordId);
      }
    };

    if (key !== undefined && Array.isArray(content)) {
      content.forEach((item, index) => {
        const recordId = idOf(item, index);
        if (isRecord(item) && typeof item.id === 'string' && item.id.startsWith(DEMO_ID_PREFIX)) {
          out.push({
            file,
            collection,
            recordId,
            field: 'id',
            message: `D1: Curated id "${item.id}" begins with "${DEMO_ID_PREFIX}", which is reserved for the Demo_Dataset`,
          });
        }
        scan(item, [], recordId);
      });
    } else {
      scan(content, [], '-');
    }
  }
  return out;
}

/* --- D2 --- */

/** D2: the demo file parses with `DemoDatasetSchema`. Unrecognized keys are named in the message. */
export function checkDemoParses(raw: unknown): Violation[] {
  const res = DemoDatasetSchema.safeParse(raw);
  if (res.success) return [];
  const out: Violation[] = [];
  for (const issue of res.error.issues) {
    const loc = locateInDemo(raw, issue.path);
    if (issue.code === 'unrecognized_keys') {
      for (const k of issue.keys) {
        out.push(
          demoViolation(
            { ...loc, field: loc.field === '(record)' ? k : `${loc.field}.${k}` },
            `D2: unrecognized key "${k}" is not allowed in a demo record (demo data carries no source, verification, URL, date, licence or attribution fields)`,
          ),
        );
      }
    } else {
      out.push(demoViolation(loc, `D2: ${issue.message}`));
    }
  }
  return out;
}

/* --- D3 --- */

const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Whole-term, case-insensitive match of the forbidden publisher names. Letters and digits count as
 * word characters, so "IEA data" and "(IEA)" match, while "PIEAR", "fieAld" and "Leia" do not.
 */
const FORBIDDEN_NAME_PATTERN = new RegExp(
  `(?<![A-Za-z0-9])(?:${DEMO_FORBIDDEN_SOURCE_NAMES.map(escapeRegExp).join('|')})(?![A-Za-z0-9])`,
  'gi',
);

/** Forbidden publisher names found in `text`, as written in the text. */
export function findForbiddenSourceNames(text: string): string[] {
  return [...text.matchAll(FORBIDDEN_NAME_PATTERN)].map((m) => m[0]);
}

function scanStrings(node: unknown, path: (string | number)[], visit: (value: string, path: (string | number)[]) => void): void {
  if (typeof node === 'string') visit(node, path);
  else if (Array.isArray(node)) node.forEach((item, i) => scanStrings(item, [...path, i], visit));
  else if (isRecord(node)) for (const [k, v] of Object.entries(node)) scanStrings(v, [...path, k], visit);
}

const isDemoValue = (v: number): boolean => Number.isInteger(v) && v % DEMO_VALUE_MULTIPLE === 0;

/** D3: demo content rules. Tolerant of malformed structure (D2 reports that). Only runs on an object. */
export function checkDemoContent(raw: unknown): Violation[] {
  if (!isRecord(raw)) return [];
  const out: Violation[] = [];
  const add = (path: (string | number)[], message: string): void => {
    out.push(demoViolation(locateInDemo(raw, path), `D3: ${message}`));
  };

  const checkId = (path: (string | number)[], value: unknown): void => {
    if (typeof value === 'string' && !value.startsWith(DEMO_ID_PREFIX)) {
      add(path, `id "${value}" must begin with "${DEMO_ID_PREFIX}"`);
    }
  };

  if (typeof raw.datasetId === 'string' && !raw.datasetId.startsWith(DEMO_ID_PREFIX)) {
    out.push(demoViolation({ collection: 'demo', recordId: raw.datasetId, field: 'datasetId' }, `D3: id "${raw.datasetId}" must begin with "${DEMO_ID_PREFIX}"`));
  }

  for (const name of DEMO_RECORD_COLLECTIONS) {
    const list = raw[name];
    if (!Array.isArray(list)) continue;
    list.forEach((rec, i) => {
      if (!isRecord(rec)) return;
      checkId([name, i, 'id'], rec.id);
      if (name === 'economies' && typeof rec.name === 'string' && !rec.name.includes(DEMO_FICTIONAL_MARKER)) {
        add([name, i, 'name'], `economy name "${rec.name}" must contain "${DEMO_FICTIONAL_MARKER}"`);
      }
      if (name === 'flows') {
        if (typeof rec.unit === 'string' && !rec.unit.toLowerCase().includes(DEMO_UNIT_MARKER)) {
          add([name, i, 'unit'], `unit "${rec.unit}" must contain "${DEMO_UNIT_MARKER}" (case-insensitive)`);
        }
        if (typeof rec.value === 'number' && !isDemoValue(rec.value)) {
          add([name, i, 'value'], `value ${rec.value} must be an integer multiple of ${DEMO_VALUE_MULTIPLE}`);
        }
      }
      if (name === 'dependencyShares') {
        const v = rec.chokepointTransitImportSharePercent;
        if (typeof v === 'number' && !isDemoValue(v)) {
          add([name, i, 'chokepointTransitImportSharePercent'], `share ${v} must be an integer multiple of ${DEMO_VALUE_MULTIPLE}`);
        }
      }
    });
  }

  // Every string value in the file: no forbidden publisher name.
  scanStrings(raw, [], (value, path) => {
    for (const term of new Set(findForbiddenSourceNames(value).map((t) => t.toLowerCase()))) {
      add(path, `text names "${term.toUpperCase()}", a forbidden source name (the demo carries no third-party attribution)`);
    }
  });

  return out;
}

/* --- D5 --- */

const demoIdEntries = (raw: Record<string, unknown>): { path: (string | number)[]; id: string }[] => {
  const out: { path: (string | number)[]; id: string }[] = [];
  if (typeof raw.datasetId === 'string') out.push({ path: ['datasetId'], id: raw.datasetId });
  for (const name of DEMO_RECORD_COLLECTIONS) {
    const list = raw[name];
    if (!Array.isArray(list)) continue;
    list.forEach((rec, i) => {
      if (isRecord(rec) && typeof rec.id === 'string') out.push({ path: [name, i, 'id'], id: rec.id });
    });
  }
  return out;
};

/** Ids of every record and declaration in the Curated collection files (raw JSON). */
export function collectCuratedIds(files: JsonFiles): Set<string> {
  const ids = new Set<string>();
  for (const [file, content] of Object.entries(files)) {
    if (!COLLECTION_OF_FILE.has(file) || !Array.isArray(content)) continue;
    for (const rec of content) if (isRecord(rec) && typeof rec.id === 'string') ids.add(rec.id);
  }
  return ids;
}

/**
 * D5: every chokepointId, commodityId and economyId in the demo flows and shares resolves to a demo
 * declaration, and no demo id is also a Curated id.
 */
export function checkDemoReferences(raw: unknown, curatedIds: ReadonlySet<string>): Violation[] {
  if (!isRecord(raw)) return [];
  const out: Violation[] = [];
  const add = (path: (string | number)[], message: string): void => {
    out.push(demoViolation(locateInDemo(raw, path), `D5: ${message}`));
  };
  const declared = (name: string): Set<string> => {
    const ids = new Set<string>();
    const list = raw[name];
    if (Array.isArray(list)) for (const rec of list) if (isRecord(rec) && typeof rec.id === 'string') ids.add(rec.id);
    return ids;
  };
  const refs = [
    { list: 'flows', field: 'chokepointId', declaredIn: 'chokepoints' },
    { list: 'flows', field: 'commodityId', declaredIn: 'commodities' },
    { list: 'dependencyShares', field: 'chokepointId', declaredIn: 'chokepoints' },
    { list: 'dependencyShares', field: 'commodityId', declaredIn: 'commodities' },
    { list: 'dependencyShares', field: 'economyId', declaredIn: 'economies' },
  ] as const;
  for (const { list, field, declaredIn } of refs) {
    const items = raw[list];
    if (!Array.isArray(items)) continue;
    const ids = declared(declaredIn);
    items.forEach((rec, i) => {
      if (isRecord(rec) && typeof rec[field] === 'string' && !ids.has(rec[field])) {
        add([list, i, field], `"${rec[field]}" is not declared in the demo ${declaredIn}`);
      }
    });
  }
  for (const { path, id } of demoIdEntries(raw)) {
    if (curatedIds.has(id)) add(path, `id "${id}" is also used in the Curated_Dataset; the two datasets must share no id`);
  }
  return out;
}

/**
 * D5 (Task 2.8): ids are unique within each demo collection and across the whole demo file
 * (the dataset id included). Every later occurrence of an id is reported on its own record, field "id".
 */
export function checkDemoDuplicateIds(raw: unknown): Violation[] {
  if (!isRecord(raw)) return [];
  const out: Violation[] = [];
  const firstSeen = new Map<string, string>(); // id -> collection of first occurrence
  for (const { path, id } of demoIdEntries(raw)) {
    const collection = String(path[0]);
    const first = firstSeen.get(id);
    if (first === undefined) {
      firstSeen.set(id, collection);
      continue;
    }
    const message =
      first === collection
        ? `D5: duplicate id "${id}" within ${collection}`
        : `D5: id "${id}" is also used in ${first === 'datasetId' ? 'the dataset id' : first}; demo ids must be unique across the file`;
    out.push(demoViolation(locateInDemo(raw, path), message));
  }
  return out;
}

/**
 * D3 (Task 2.8): demo-dataset.json is the only file allowed under <data-dir>/demo/. Any other file,
 * of any type and at any depth (nothing is ignored, .gitkeep included), is a violation.
 * An absent demo directory yields no violation.
 */
export function checkDemoDirFiles(dataDir: string): Violation[] {
  const out: Violation[] = [];
  const root = join(dataDir, DEMO_DIR);
  if (!existsSync(root)) return out;
  const walk = (rel: string): void => {
    const entries = readdirSync(join(root, rel), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const entryRel = rel === '' ? entry.name : `${rel}/${entry.name}`;
      if (entry.isDirectory()) walk(entryRel);
      else if (`${DEMO_DIR}/${entryRel}` !== DEMO_FILE) {
        out.push({
          file: `${DEMO_DIR}/${entryRel}`,
          collection: 'demo',
          recordId: '-',
          field: '(file)',
          message: `D3: unexpected file under ${DEMO_DIR}/ (only demo-dataset.json is allowed)`,
        });
      }
    }
  };
  walk('');
  return out;
}

/* --- Combined separation check --- */

/**
 * Runs D1 over the Curated JSON files and, when the demo file is present, D2, D3 and D5 over it.
 * `demo === undefined` means the file is absent: that passes and is noted.
 */
export function checkDemoSeparation(curatedFiles: JsonFiles, demo: unknown): ValidationResult {
  const violations: Violation[] = checkCuratedClean(curatedFiles);
  const notices: string[] = [];
  if (demo === undefined) {
    notices.push(DEMO_ABSENT_NOTICE);
    return { violations, notices };
  }
  violations.push(...checkDemoParses(demo));
  violations.push(...checkDemoContent(demo));
  violations.push(...checkDemoReferences(demo, collectCuratedIds(curatedFiles)));
  violations.push(...checkDemoDuplicateIds(demo));
  return { violations, notices };
}

/* ---------- Disk loading and CLI ---------- */

/** Recursively reads every .json file under `dataDir` outside demo/ as raw JSON. Invalid JSON is reported once. */
export function readCuratedJsonFiles(dataDir: string, violations: Violation[]): Record<string, unknown> {
  const files: Record<string, unknown> = {};
  const walk = (relDir: string): void => {
    const abs = relDir === '' ? dataDir : join(dataDir, relDir);
    if (!existsSync(abs)) return;
    const entries = readdirSync(abs, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const rel = relDir === '' ? entry.name : `${relDir}/${entry.name}`;
      if (entry.isDirectory()) {
        if (rel !== DEMO_DIR) walk(rel);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        try {
          files[rel] = JSON.parse(readFileSync(join(dataDir, rel), 'utf8')) as unknown;
        } catch (err) {
          // Collection and version files are reported by loadRawDataset; report any other file here.
          if (!COLLECTION_OF_FILE.has(rel) && rel !== VERSION_FILE) {
            violations.push({
              file: rel,
              collection: rel,
              recordId: '-',
              field: '(file)',
              message: `invalid JSON: ${err instanceof Error ? err.message : String(err)}`,
            });
          }
        }
      }
    }
  };
  walk('');
  return files;
}

/** Reads the demo file. `present: false` means absent. Unparseable JSON is a violation. */
export function readDemoFile(dataDir: string, violations: Violation[]): { present: boolean; content?: unknown } {
  const path = resolve(dataDir, DEMO_FILE);
  if (!existsSync(path)) return { present: false };
  try {
    return { present: true, content: JSON.parse(readFileSync(path, 'utf8')) as unknown };
  } catch (err) {
    violations.push({
      file: DEMO_FILE,
      collection: 'demo',
      recordId: '-',
      field: '(file)',
      message: `invalid JSON: ${err instanceof Error ? err.message : String(err)}`,
    });
    return { present: true };
  }
}

export function loadRawDataset(dataDir: string, notices: string[], violations: Violation[]): RawDataset {
  const readJson = (file: string, collection: string): unknown => {
    const path = resolve(dataDir, file);
    if (!existsSync(path)) return undefined;
    try {
      return JSON.parse(readFileSync(path, 'utf8')) as unknown;
    } catch (err) {
      violations.push({
        file,
        collection,
        recordId: '-',
        field: '(file)',
        message: `invalid JSON: ${err instanceof Error ? err.message : String(err)}`,
      });
      return null; // present but unusable: do not also report it as absent
    }
  };

  const collections: Partial<Record<CollectionKey, unknown>> = {};
  for (const spec of COLLECTION_SPECS) {
    const content = readJson(spec.file, spec.key);
    if (content === undefined) notices.push(`${spec.file} not present - treated as empty`);
    else if (content !== null) collections[spec.key] = content;
  }
  const version = readJson(VERSION_FILE, 'schemaVersion');
  return { version: version === null ? undefined : version, collections };
}

export function runValidation(dataDir: string, options: ValidateOptions = {}): ValidationResult {
  const notices: string[] = [];
  const loadViolations: Violation[] = [];
  const raw = loadRawDataset(dataDir, notices, loadViolations);
  const result = validateRawDataset(raw, options);

  // Separate pathway: demo separation checks over the raw files (never merged into the Curated dataset).
  const curatedFiles = readCuratedJsonFiles(dataDir, loadViolations);
  const demo = readDemoFile(dataDir, loadViolations);
  const separation = checkDemoSeparation(curatedFiles, demo.present ? demo.content : undefined);
  // Present but unparseable (already reported as invalid JSON): D2/D3/D5 have nothing to check.
  const separationViolations = demo.present && demo.content === undefined ? checkCuratedClean(curatedFiles) : separation.violations;
  const separationNotices = demo.present ? [] : separation.notices;

  return {
    violations: [...loadViolations, ...result.violations, ...separationViolations, ...checkDemoDirFiles(dataDir)],
    notices: [...notices, ...result.notices, ...separationNotices],
  };
}

export function parseArgs(argv: readonly string[]): { dataDir?: string; requireVersionFile: boolean } {
  const i = argv.indexOf('--data-dir');
  const dataDir = i >= 0 ? argv[i + 1] : undefined;
  return { dataDir, requireVersionFile: argv.includes('--require-version-file') };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const defaultDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data');
  const dataDir = args.dataDir !== undefined ? resolve(process.cwd(), args.dataDir) : defaultDir;
  const { violations, notices } = runValidation(dataDir, { requireVersionFile: args.requireVersionFile });
  console.log(`validate-dataset: checking ${dataDir}`);
  for (const n of notices) console.log(`validate-dataset: ${n}`);
  if (violations.length > 0) {
    for (const v of violations) console.error(formatViolation(v));
    console.error(`validate-dataset: FAILED with ${violations.length} violation(s)`);
    process.exitCode = 1;
    return;
  }
  console.log('validate-dataset: OK');
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main();
}
