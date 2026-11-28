/**
 * Property 20: Dataset separation (Task 2.7).
 *
 * For all valid Curated_Datasets with any single record replaced by a Synthetic_Record (or given a
 * `demo-` id), the separation checks fail and name that record. For all valid Demo_Datasets with any
 * source reference, Verification_Status, URL, date, or forbidden source name (IEA, EIA, UNCTAD,
 * Vortexa, Kpler, OPEC) added to any record, the separation checks fail and name that record and field.
 *
 * Also: the two datasets cannot be exchanged, a valid pair with disjoint ids passes together, and any
 * shared id fails build check D5.
 */
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  COLLECTION_SPECS,
  SUPPORTED_SCHEMA_VERSIONS,
  checkCuratedClean,
  checkDemoReferences,
  checkDemoSeparation,
  collectCuratedIds,
  validateRawDataset,
  type CollectionKey,
  type JsonFiles,
  type Violation,
} from '../../scripts/validate-dataset.ts';
import { DEMO_FORBIDDEN_SOURCE_NAMES } from '../../src/config/constants';
import { syntheticDataset } from '../fixtures/dataset/synthetic';
import {
  HISTORICAL_FIELD_NAMES,
  HISTORICAL_FIELD_VALUES,
  arbDemoDataset,
  arbDemoDependencyShare,
  arbDemoFlow,
  type DemoDatasetRecord,
} from '../generators.demo';

/* ---------- Curated side: valid datasets as raw JSON files ---------- */

type Rec = Record<string, unknown>;
type Files = Record<string, unknown>;

const FILE_OF = Object.fromEntries(COLLECTION_SPECS.map((s) => [s.key, s.file])) as Record<CollectionKey, string>;
const COLLECTION_KEYS = COLLECTION_SPECS.map((s) => s.key);

/** A valid Curated dataset as raw files: the synthetic fixture with every `test-` id made unique by `suffix`. */
function curatedFiles(suffix: string): Files {
  const renamed = JSON.parse(JSON.stringify(syntheticDataset).replaceAll('test-', `test-${suffix}-`)) as Rec;
  const files: Files = {
    'schema-version.json': { schemaVersion: SUPPORTED_SCHEMA_VERSIONS[0], buildDate: renamed.buildDate },
  };
  for (const key of COLLECTION_KEYS) files[FILE_OF[key]] = renamed[key];
  return files;
}

const arbSuffix = fc.stringMatching(/^[a-z0-9]{1,6}$/);

/** The historical validator alone (unchanged pathway). */
function historicalViolations(files: Files): Violation[] {
  const collections: Partial<Record<CollectionKey, unknown>> = {};
  for (const key of COLLECTION_KEYS) if (files[FILE_OF[key]] !== undefined) collections[key] = files[FILE_OF[key]];
  return validateRawDataset({ version: files['schema-version.json'], collections }).violations;
}

/** The historical validator plus D1 over the raw Curated files. */
function curatedViolations(files: Files): Violation[] {
  return [...historicalViolations(files), ...checkCuratedClean(files as JsonFiles)];
}

const names = (vs: Violation[], collection: string, recordId: string): boolean =>
  vs.some((v) => v.collection === collection && v.recordId === recordId);

/* ---------- Demo side ---------- */

/** Valid demo datasets. The generator uses a fixed vocabulary, so no filtering is needed. */
const arbValidDemo: fc.Arbitrary<DemoDatasetRecord> = arbDemoDataset;

const cloneDemo = (d: DemoDatasetRecord): Rec => JSON.parse(JSON.stringify(d)) as Rec;
const demoViolations = (curated: Files, demo: unknown): Violation[] => checkDemoSeparation(curated as JsonFiles, demo).violations;

describe('Property 20: Dataset separation', () => {
  it('sanity: the valid generators pass their own checks', () => {
    fc.assert(
      fc.property(arbSuffix, arbValidDemo, (suffix, demo) => {
        const files = curatedFiles(suffix);
        expect(curatedViolations(files)).toEqual([]);
        expect(demoViolations(files, demo)).toEqual([]);
      }),
    );
  });

  // Feature: ripple-hormuz-intelligence-terminal, Property 20
  // **Validates: Requirements 22.10, 22.11**
  it('(a) a Curated dataset with one record replaced by a Synthetic_Record, given a synthetic key or a demo- id, fails and names that record', () => {
    fc.assert(
      fc.property(
        arbSuffix,
        fc.constantFrom(...COLLECTION_KEYS),
        fc.nat(),
        fc.constantFrom('replace-flow', 'replace-share', 'add-synthetic-key', 'demo-id'),
        arbDemoFlow,
        arbDemoDependencyShare,
        (suffix, key, rawIndex, mutation, flow, share) => {
          const files = curatedFiles(suffix);
          const list = [...(files[FILE_OF[key]] as Rec[])];
          const index = rawIndex % list.length;
          const original = list[index];
          let expectedId: string;
          if (mutation === 'replace-flow') {
            list[index] = { ...flow };
            expectedId = flow.id;
          } else if (mutation === 'replace-share') {
            list[index] = { ...share };
            expectedId = share.id;
          } else if (mutation === 'add-synthetic-key') {
            list[index] = { ...original, synthetic: true };
            expectedId = String(original.id);
          } else {
            expectedId = `demo-${String(original.id)}`;
            list[index] = { ...original, id: expectedId };
          }
          const mutated: Files = { ...files, [FILE_OF[key]]: list };

          // The separation checks fail and name the record.
          const sep = checkCuratedClean(mutated as JsonFiles);
          expect(names(sep, key, expectedId)).toBe(true);
          // The combined Curated validation fails and names it too.
          expect(names(curatedViolations(mutated), key, expectedId)).toBe(true);
          // A record carrying `synthetic` or a Synthetic_Record shape never passes historical validation either.
          if (mutation !== 'demo-id') expect(names(historicalViolations(mutated), key, expectedId)).toBe(true);
        },
      ),
    );
  });

  // Feature: ripple-hormuz-intelligence-terminal, Property 20
  // **Validates: Requirements 22.10, 22.11**
  it('(b) a Demo_Dataset with a source, status, URL, date or licence field added to any record fails and names the record and field', () => {
    fc.assert(
      fc.property(
        arbSuffix,
        arbValidDemo,
        fc.constantFrom('flows', 'dependencyShares', 'dataset'),
        fc.nat(),
        fc.constantFrom(...HISTORICAL_FIELD_NAMES),
        (suffix, demo, target, rawIndex, field) => {
          const ds = cloneDemo(demo);
          let collection = 'demo';
          let recordId = '-';
          if (target === 'dataset') {
            ds[field] = HISTORICAL_FIELD_VALUES[field];
          } else {
            const list = ds[target] as Rec[];
            const rec = list[rawIndex % list.length];
            rec[field] = HISTORICAL_FIELD_VALUES[field];
            collection = target;
            recordId = String(rec.id);
          }
          const vs = demoViolations(curatedFiles(suffix), ds);
          const hit = vs.find((v) => v.collection === collection && v.recordId === recordId && v.field === field);
          expect(hit, `${collection}:${recordId}:${field}`).toBeDefined();
          expect(hit?.message).toContain(`"${field}"`);
        },
      ),
    );
  });

  // Feature: ripple-hormuz-intelligence-terminal, Property 20
  // **Validates: Requirements 22.10, 22.11**
  it('(b) a Demo_Dataset with a forbidden source name inserted into any text field fails and names the record and field', () => {
    const textFields = ['flows.fictionalAssumption', 'dependencyShares.fictionalAssumption', 'economies.name', 'commodities.name', 'chokepoints.name', 'flows.unit', 'assumptions'] as const;
    fc.assert(
      fc.property(
        arbSuffix,
        arbValidDemo,
        fc.constantFrom(...textFields),
        fc.nat(),
        fc.constantFrom(...DEMO_FORBIDDEN_SOURCE_NAMES),
        fc.constantFrom<(s: string) => string>(
          (s) => s,
          (s) => s.toUpperCase(),
          (s) => s.toLowerCase(),
        ),
        fc.constantFrom<(t: string) => string>(
          (t) => ` ${t} data.`,
          (t) => ` (${t})`,
          (t) => ` per ${t}, 2020`,
        ),
        (suffix, demo, textField, rawIndex, term, recase, wrap) => {
          const ds = cloneDemo(demo);
          const [listName, fieldName] = textField.split('.') as [string, string | undefined];
          const list = ds[listName] as unknown[];
          const index = rawIndex % list.length;
          const inserted = wrap(recase(term));
          let collection = 'demo';
          let recordId = '-';
          let field: string;
          if (fieldName === undefined) {
            list[index] = `${String(list[index])}${inserted}`;
            field = `${listName}.${index}`;
          } else {
            const rec = list[index] as Rec;
            rec[fieldName] = `${String(rec[fieldName])}${inserted}`;
            collection = listName;
            recordId = String(rec.id);
            field = fieldName;
          }
          const vs = demoViolations(curatedFiles(suffix), ds);
          const hit = vs.find(
            (v) => v.collection === collection && v.recordId === recordId && v.field === field && v.message.includes(`"${term.toUpperCase()}"`),
          );
          expect(hit, `${collection}:${recordId}:${field}`).toBeDefined();
        },
      ),
    );
  });

  // Feature: ripple-hormuz-intelligence-terminal, Property 20
  // **Validates: Requirements 22.10, 22.11**
  it('(c) a valid Demo_Dataset is rejected as Curated data and a valid Curated dataset is rejected as the demo file', () => {
    fc.assert(
      fc.property(arbSuffix, arbValidDemo, (suffix, demo) => {
        // Demo content presented as Curated files.
        const asCurated: Files = {
          'demo-dataset.json': demo,
          [FILE_OF.chokepoints]: demo.chokepoints,
          [FILE_OF.commodities]: demo.commodities,
          [FILE_OF.economies]: demo.economies,
          [FILE_OF.historicalObservations]: demo.flows,
          [FILE_OF.dependencyShares]: demo.dependencyShares,
        };
        const vs = curatedViolations(asCurated);
        for (const flow of demo.flows) expect(names(vs, 'historicalObservations', flow.id), flow.id).toBe(true);
        for (const share of demo.dependencyShares) expect(names(vs, 'dependencyShares', share.id), share.id).toBe(true);
        expect(vs.some((v) => v.file === 'demo-dataset.json' && v.field === 'synthetic')).toBe(true);

        // Curated content presented as the demo file.
        const curated = curatedFiles(suffix);
        const asDemo: Rec = { schemaVersion: 'test-1', buildDate: '2020-03-01' };
        for (const key of COLLECTION_KEYS) asDemo[key] = curated[FILE_OF[key]];
        expect(checkDemoSeparation({}, asDemo).violations.length).toBeGreaterThan(0);
        expect(checkDemoSeparation({}, curated[FILE_OF.historicalObservations]).violations.length).toBeGreaterThan(0);
      }),
    );
  });

  // Feature: ripple-hormuz-intelligence-terminal, Property 20
  // **Validates: Requirements 22.10, 22.11**
  it('(d) a valid Demo_Dataset and a valid Curated dataset with disjoint ids pass together; any shared id fails D5', () => {
    fc.assert(
      fc.property(arbSuffix, arbValidDemo, fc.nat(), (suffix, demo, rawIndex) => {
        const files = curatedFiles(suffix);
        expect(curatedViolations(files)).toEqual([]);
        expect(demoViolations(files, demo)).toEqual([]);

        const record = (collection: string, r: { id: string }) => ({ id: r.id, collection, recordId: r.id, field: 'id' });
        const entries = [
          { id: demo.datasetId, collection: 'demo', recordId: '-', field: 'datasetId' },
          ...demo.chokepoints.map((r) => record('chokepoints', r)),
          ...demo.commodities.map((r) => record('commodities', r)),
          ...demo.economies.map((r) => record('economies', r)),
          ...demo.flows.map((r) => record('flows', r)),
          ...demo.dependencyShares.map((r) => record('dependencyShares', r)),
        ];
        const shared = entries[rawIndex % entries.length];

        // A Curated record that reuses the demo id: D5 (id sets) names the demo record.
        const withShared: Files = {
          ...files,
          [FILE_OF.chokepoints]: [...(files[FILE_OF.chokepoints] as Rec[]), { id: shared.id, name: 'Synthetic Reused Id' }],
        };
        const d5 = checkDemoReferences(demo, collectCuratedIds(withShared as JsonFiles));
        expect(d5.length).toBe(1);
        expect(d5[0].collection).toBe(shared.collection);
        expect(d5[0].recordId).toBe(shared.recordId);
        expect(d5[0].field).toBe(shared.field);
        expect(d5[0].message).toContain(`"${shared.id}"`);

        // And the combined run fails.
        const combined = demoViolations(withShared, demo);
        expect(combined.some((v) => v.message.startsWith('D5:') && v.message.includes(`"${shared.id}"`))).toBe(true);
      }),
    );
  });
});
