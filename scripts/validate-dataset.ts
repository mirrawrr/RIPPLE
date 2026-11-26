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
 * Historical dataset only. Extension point for Task 2.7: the demo separation checks
 * (D1, D2, D3, D5) are to be added as further exported functions and called from `runValidation`
 * below (see the marked comment). They are intentionally not implemented here, and the absence
 * of public/data/demo is not an error.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { z } from 'zod';
import {
  ChokepointDeclarationSchema,
  CommodityDeclarationSchema,
  DatasetDeclarationSchema,
  EconomyDeclarationSchema,
  GraphEdgeSchema,
  GraphNodeSchema,
  HistoricalObservationSchema,
  DependencyShareSchema,
  QualitativeDependencySchema,
  SchemaVersionFileSchema,
  SourceRecordSchema,
} from '../src/data/schema.ts';
import type { CuratedDataset } from '../src/data/schema.ts';

/* ---------- Public types and constants ---------- */

/** Allow-list of supported schema versions (Req 17.2). Extend when a new version ships. */
export const SUPPORTED_SCHEMA_VERSIONS: readonly string[] = ['1'];

export const VERSION_FILE = 'schema-version.json';

export interface Violation {
  file: string;
  collection: string;
  recordId: string;
  field: string;
  message: string;
}

export const formatViolation = (v: Violation): string =>
  `${v.file}:${v.collection}:${v.recordId}:${v.field}: ${v.message}`;

export type CollectionKey = Exclude<keyof CuratedDataset, 'schemaVersion' | 'buildDate'>;

export type Collections = Pick<CuratedDataset, CollectionKey>;

interface CollectionSpec {
  key: CollectionKey;
  file: string;
  schema: z.ZodType;
}

/** Dataset file layout (design: "Dataset file layout"). */
export const COLLECTION_SPECS: readonly CollectionSpec[] = [
  { key: 'datasets', file: 'datasets.json', schema: DatasetDeclarationSchema },
  { key: 'chokepoints', file: 'chokepoints.json', schema: ChokepointDeclarationSchema },
  { key: 'commodities', file: 'commodities.json', schema: CommodityDeclarationSchema },
  { key: 'economies', file: 'economies.json', schema: EconomyDeclarationSchema },
  { key: 'sourceRecords', file: 'source-records.json', schema: SourceRecordSchema },
  { key: 'historicalObservations', file: 'historical-observations.json', schema: HistoricalObservationSchema },
  { key: 'dependencyShares', file: 'dependency-shares.json', schema: DependencyShareSchema },
  { key: 'qualitativeDependencies', file: 'qualitative-dependencies.json', schema: QualitativeDependencySchema },
  { key: 'graphNodes', file: 'graph-nodes.json', schema: GraphNodeSchema },
  { key: 'graphEdges', file: 'graph-edges.json', schema: GraphEdgeSchema },
];

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

const issueField = (path: PropertyKey[]): string => (path.length ? path.map(String).join('.') : '(record)');

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

/* ---------- Disk loading and CLI ---------- */

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
  // Task 2.7 extension point: call the exported demo separation checks (D1, D2, D3, D5) here
  // and append their violations. Do not fail when public/data/demo is absent before Task 3.x.
  return { violations: [...loadViolations, ...result.violations], notices: [...notices, ...result.notices] };
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
