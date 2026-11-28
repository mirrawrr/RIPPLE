/**
 * Curated_Dataset file layout (design: "Dataset file layout"). Single source of truth for the
 * file-name-to-collection-to-schema mapping, shared by the build-time validator
 * (scripts/validate-dataset.ts) and the runtime loader (src/data/loader.ts).
 *
 * Only erasable TypeScript syntax and explicit `.ts` import extensions are used, because the
 * validator loads this file under Node's type stripping.
 */
import type { z } from 'zod';
import {
  ChokepointDeclarationSchema,
  CommodityDeclarationSchema,
  DatasetDeclarationSchema,
  DependencyShareSchema,
  EconomyDeclarationSchema,
  GraphEdgeSchema,
  GraphNodeSchema,
  HistoricalObservationSchema,
  QualitativeDependencySchema,
  SourceRecordSchema,
} from './schema.ts';
import type { CuratedDataset } from './schema.ts';

export type CollectionKey = Exclude<keyof CuratedDataset, 'schemaVersion' | 'buildDate'>;

export interface CollectionSpec {
  key: CollectionKey;
  file: string;
  schema: z.ZodType;
}

/** Name of the version file: `{ schemaVersion, buildDate }`. */
export const VERSION_FILE = 'schema-version.json';

/** Curated collection files, in design order. */
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
