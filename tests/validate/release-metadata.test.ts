/**
 * Task 3.5: tests for scripts/refresh-release-metadata.ts and the version-file cases of the validator.
 * Temp directories only; nothing under public/data is touched. No historical figures.
 * Validates: Requirements 12.7, 17.2
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { buildVersionFileContent, isValidBuildDate, refreshReleaseMetadata } from '../../scripts/refresh-release-metadata.ts';
import { SUPPORTED_SCHEMA_VERSIONS, runValidation, validateRawDataset } from '../../scripts/validate-dataset.ts';
import { CURRENT_SCHEMA_VERSION, VERSION_FILE } from '../../src/data/files.ts';
import { SchemaVersionFileSchema } from '../../src/data/schema.ts';

const REPO = fileURLToPath(new URL('../..', import.meta.url));
const script = join(REPO, 'scripts', 'refresh-release-metadata.ts');
const cli = (args: string[]) => spawnSync(process.execPath, [script, ...args], { cwd: REPO, encoding: 'utf8' });

const dirs: string[] = [];
const tmp = (): string => {
  const d = mkdtempSync(join(tmpdir(), 'r35-'));
  dirs.push(d);
  return d;
};
afterEach(() => {
  while (dirs.length) rmSync(dirs.pop() as string, { recursive: true, force: true });
});

describe('refresh-release-metadata', () => {
  it('writes the expected JSON for an injected date, valid under SchemaVersionFileSchema', () => {
    const dir = tmp();
    const res = cli(['--data-dir', dir, '--build-date', '2021-02-03']);
    expect(res.status).toBe(0);
    const text = readFileSync(join(dir, VERSION_FILE), 'utf8');
    expect(text.endsWith('\n')).toBe(true);
    expect(JSON.parse(text)).toEqual({ schemaVersion: CURRENT_SCHEMA_VERSION, buildDate: '2021-02-03' });
    expect(SchemaVersionFileSchema.safeParse(JSON.parse(text)).success).toBe(true);
    expect(SUPPORTED_SCHEMA_VERSIONS).toContain(CURRENT_SCHEMA_VERSION);
    expect(readdirSync(dir)).toEqual([VERSION_FILE]);
  });

  it('defaults to the current UTC date', () => {
    const before = new Date().toISOString().slice(0, 10);
    const dir = tmp();
    expect(cli(['--data-dir', dir]).status).toBe(0);
    const after = new Date().toISOString().slice(0, 10);
    const { buildDate } = JSON.parse(readFileSync(join(dir, VERSION_FILE), 'utf8')) as { buildDate: string };
    expect([before, after]).toContain(buildDate);
  });

  it('rejects an invalid --build-date with a non-zero exit and writes nothing', () => {
    for (const bad of ['2021-13-01', '2021-02-30', '21-02-03', 'today', '']) {
      const dir = tmp();
      const res = cli(['--data-dir', dir, '--build-date', bad]);
      expect(res.status, bad).not.toBe(0);
      expect(readdirSync(dir), bad).toEqual([]);
    }
    expect(isValidBuildDate('2024-02-29')).toBe(true);
    expect(() => buildVersionFileContent('2023-02-29')).toThrow();
  });

  it('is idempotent: unchanged content is not rewritten', () => {
    const dir = tmp();
    expect(refreshReleaseMetadata(dir, '2021-02-03').written).toBe(true);
    const path = join(dir, VERSION_FILE);
    const old = new Date('2000-01-01T00:00:00Z');
    utimesSync(path, old, old);
    const mtime = statSync(path).mtimeMs;
    const second = refreshReleaseMetadata(dir, '2021-02-03');
    expect(second.written).toBe(false);
    expect(statSync(path).mtimeMs).toBe(mtime);
    expect(refreshReleaseMetadata(dir, '2021-02-04').written).toBe(true);
    expect(readdirSync(dir)).toEqual([VERSION_FILE]);
  });

  it('leaves other files in the data directory untouched', () => {
    const dir = tmp();
    writeFileSync(join(dir, 'datasets.json'), '[]\n');
    refreshReleaseMetadata(dir, '2021-02-03');
    expect(readdirSync(dir).sort()).toEqual(['datasets.json', VERSION_FILE]);
    expect(readFileSync(join(dir, 'datasets.json'), 'utf8')).toBe('[]\n');
  });

  it('fails when the data directory does not exist', () => {
    expect(cli(['--data-dir', join(tmpdir(), 'r35-does-not-exist'), '--build-date', '2021-02-03']).status).not.toBe(0);
  });
});

describe('validator: schema-version.json cases', () => {
  const versionViolations = (version: unknown) =>
    validateRawDataset({ version, collections: {} }, { today: '2021-02-03' }).violations.filter((v) => v.file === VERSION_FILE);

  it('accepts the file this script writes and reads buildDate from it', () => {
    const dir = tmp();
    refreshReleaseMetadata(dir, '2021-02-03');
    const res = runValidation(dir);
    expect(res.violations).toEqual([]);
    expect(res.notices.some((n) => n.includes(VERSION_FILE))).toBe(false);
    expect(res.notices.some((n) => n.includes('buildDate unavailable'))).toBe(false);
  });

  it('reports a missing buildDate, a malformed date and an extra key by field', () => {
    expect(versionViolations({ schemaVersion: '1' }).some((v) => v.field === 'buildDate')).toBe(true);
    expect(versionViolations({ schemaVersion: '1', buildDate: '2021/02/03' }).some((v) => v.field === 'buildDate')).toBe(true);
    expect(versionViolations({ schemaVersion: '1', buildDate: '2021-02-30' }).some((v) => v.field === 'buildDate')).toBe(true);
    expect(versionViolations({ schemaVersion: '1', buildDate: '2021-02-03', extra: 1 }).length).toBeGreaterThan(0);
  });

  it('reports unsupported schemaVersion "2" with the file and field', () => {
    const vs = versionViolations({ schemaVersion: '2', buildDate: '2021-02-03' });
    expect(vs).toHaveLength(1);
    expect(vs[0]).toMatchObject({ file: VERSION_FILE, field: 'schemaVersion' });
    expect(vs[0].message).toContain('"2"');
  });

  it('reports invalid JSON in the version file', () => {
    const dir = tmp();
    writeFileSync(join(dir, VERSION_FILE), '{ not json');
    const vs = runValidation(dir).violations;
    expect(vs.some((v) => v.file === VERSION_FILE && v.field === '(file)' && v.message.includes('invalid JSON'))).toBe(true);
  });
});
