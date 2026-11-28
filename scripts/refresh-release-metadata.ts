/**
 * Release-metadata refresh (Task 3.5; Req 12.7, 17.2).
 *
 * Run as `node scripts/refresh-release-metadata.ts [--data-dir <path>] [--build-date YYYY-MM-DD]`
 * (Node native type stripping; no extra dependency). Wired in package.json `prebuild`, before
 * scripts/validate-dataset.ts.
 *
 * Writes exactly one file, `<data-dir>/schema-version.json`:
 *   { "schemaVersion": CURRENT_SCHEMA_VERSION, "buildDate": <UTC date of the build, YYYY-MM-DD> }
 * `schemaVersion` is the Curated_Dataset version identifier (glossary: Schema_Version).
 * The output is checked with SchemaVersionFileSchema before it is written. If the file already
 * holds identical content it is left untouched. It never writes any other collection file.
 */
import { existsSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SchemaVersionFileSchema } from '../src/data/schema.ts';
import { CURRENT_SCHEMA_VERSION, VERSION_FILE } from '../src/data/files.ts';

export const isValidBuildDate = (s: unknown): s is string => {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};

/** Current UTC date, YYYY-MM-DD (same basis as the validator's "today (UTC)" fallback). */
export const todayUtc = (): string => new Date().toISOString().slice(0, 10);

export interface RefreshResult {
  path: string;
  content: string;
  /** false when the file already held identical content and was not rewritten. */
  written: boolean;
}

/** Serialised file content, validated against SchemaVersionFileSchema. Throws on an invalid build date. */
export function buildVersionFileContent(buildDate: string): string {
  if (!isValidBuildDate(buildDate)) throw new Error(`invalid build date "${buildDate}" (expected a real YYYY-MM-DD date)`);
  const parsed = SchemaVersionFileSchema.safeParse({ schemaVersion: CURRENT_SCHEMA_VERSION, buildDate });
  if (!parsed.success) {
    throw new Error(`generated ${VERSION_FILE} is invalid: ${parsed.error.issues.map((i) => i.message).join('; ')}`);
  }
  return `${JSON.stringify(parsed.data, null, 2)}\n`;
}

export function refreshReleaseMetadata(dataDir: string, buildDate: string = todayUtc()): RefreshResult {
  const content = buildVersionFileContent(buildDate);
  if (!existsSync(dataDir) || !statSync(dataDir).isDirectory()) throw new Error(`data directory not found: ${dataDir}`);
  const path = join(dataDir, VERSION_FILE);
  if (existsSync(path) && readFileSync(path, 'utf8') === content) return { path, content, written: false };
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, content, 'utf8');
  renameSync(tmp, path);
  return { path, content, written: true };
}

export function parseArgs(argv: readonly string[]): { dataDir?: string; buildDate?: string; error?: string } {
  const out: { dataDir?: string; buildDate?: string; error?: string } = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--data-dir' || a === '--build-date') {
      const v = argv[i + 1];
      if (v === undefined || v.startsWith('--')) return { error: `${a} requires a value` };
      if (a === '--data-dir') out.dataDir = v;
      else out.buildDate = v;
      i++;
    } else {
      return { error: `unknown argument "${a}"` };
    }
  }
  return out;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const fail = (msg: string): void => {
    console.error(`refresh-release-metadata: ${msg}`);
    process.exitCode = 1;
  };
  if (args.error !== undefined) return fail(args.error);
  if (args.buildDate !== undefined && !isValidBuildDate(args.buildDate)) {
    return fail(`invalid --build-date "${args.buildDate}" (expected a real YYYY-MM-DD date)`);
  }
  const defaultDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data');
  const dataDir = args.dataDir !== undefined ? resolve(process.cwd(), args.dataDir) : defaultDir;
  try {
    const res = refreshReleaseMetadata(dataDir, args.buildDate);
    const { schemaVersion, buildDate } = JSON.parse(res.content) as { schemaVersion: string; buildDate: string };
    console.log(
      `refresh-release-metadata: ${res.written ? 'wrote' : 'unchanged'} ${res.path} (schemaVersion ${schemaVersion}, buildDate ${buildDate})`,
    );
  } catch (err) {
    fail(err instanceof Error ? err.message : String(err));
  }
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main();
}
