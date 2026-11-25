/**
 * Curated_Dataset Zod schemas (design: "Key module interfaces" and "Data Models").
 *
 * One source of truth for TypeScript types (via z.infer) and runtime validation,
 * shared by the build-time validator (Task 2.2) and the dataset loader (Task 2.4).
 *
 * Identifiers are generic branded strings, not closed enums, so a new chokepoint,
 * commodity or economy is additive (Req 17). No chokepoint, commodity or figure
 * is named here. Cross-record rules (reference resolution, 'verified' status
 * gating, build-date ordering, graph-edge endpoints, share/qualitative overlap)
 * belong to scripts/validate-dataset.ts, not to this file.
 */
import { z } from 'zod';

/* ---------- Primitives ---------- */

/** Identifier pattern: starts alphanumeric, then letters, digits, `.`, `_`, `:`, `-`. */
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;

const idString = z
  .string()
  .min(1, 'identifier must not be empty')
  .regex(ID_PATTERN, 'identifier must start with a letter or digit and contain only letters, digits, ".", "_", ":" or "-"');

/** ISO 8601 calendar date, YYYY-MM-DD, and a real calendar date (Req 4.4). */
const isoDate = z.iso.date();

/** https-only URL (Req 4.2). */
const httpsUrl = z
  .url()
  .refine((u) => u.startsWith('https://'), { message: 'URL must use https' });

const nonEmptyText = z.string().trim().min(1, 'must not be empty');

/* ---------- Branded identifiers ---------- */

export const DatasetIdSchema = idString.brand<'DatasetId'>();
export const ChokepointIdSchema = idString.brand<'ChokepointId'>();
export const CommodityIdSchema = idString.brand<'CommodityId'>();
export const EconomyIdSchema = idString.brand<'EconomyId'>();
export const SourceRecordIdSchema = idString.brand<'SourceRecordId'>();
export const GraphNodeIdSchema = idString.brand<'GraphNodeId'>();
export const GraphEdgeIdSchema = idString.brand<'GraphEdgeId'>();

/** Dataset-level ids. Distinct from the engine-facing `CommodityId` literal union in src/config/constants.ts. */
export type DatasetId = z.infer<typeof DatasetIdSchema>;
export type ChokepointId = z.infer<typeof ChokepointIdSchema>;
export type DatasetCommodityId = z.infer<typeof CommodityIdSchema>;
export type EconomyId = z.infer<typeof EconomyIdSchema>;
export type SourceRecordId = z.infer<typeof SourceRecordIdSchema>;
export type GraphNodeId = z.infer<typeof GraphNodeIdSchema>;
export type GraphEdgeId = z.infer<typeof GraphEdgeIdSchema>;

/* ---------- Shared shapes ---------- */

/** Allowed values; the build (Task 2.2) additionally requires 'verified'. */
export const VerificationStatusSchema = z.enum(['verified', 'unverified']);
export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;

export const TimeBasisSchema = z.enum(['per-day', 'per-year']);
export type TimeBasis = z.infer<typeof TimeBasisSchema>;

export const ReferencePeriodSchema = z
  .strictObject({
    start: isoDate,
    end: isoDate,
  })
  .refine((p) => p.end >= p.start, {
    message: 'reference period end must not precede start',
    path: ['end'],
  });
export type ReferencePeriod = z.infer<typeof ReferencePeriodSchema>;

const sourceRecordIds = z.array(SourceRecordIdSchema).min(1, 'at least one source record is required');

const isLeapYear = (year: number): boolean =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

/* ---------- SourceRecord (Req 4.2) ---------- */

export const SourceRecordSchema = z
  .strictObject({
    id: SourceRecordIdSchema,
    publisher: nonEmptyText,
    title: nonEmptyText,
    url: httpsUrl,
    publicationDate: isoDate,
    referencePeriodStart: isoDate,
    referencePeriodEnd: isoDate,
    unit: nonEmptyText,
    retrievalDate: isoDate,
    licence: nonEmptyText,
    attributionRequirement: nonEmptyText,
    verificationStatus: VerificationStatusSchema,
    verificationDate: isoDate,
  })
  .refine((r) => r.referencePeriodEnd >= r.referencePeriodStart, {
    message: 'referencePeriodEnd must not precede referencePeriodStart',
    path: ['referencePeriodEnd'],
  });
export type SourceRecord = z.infer<typeof SourceRecordSchema>;

/* ---------- HistoricalObservation (Req 4.4, 4.13, 4.14) ---------- */

export const PeriodDayCountSchema = z
  .strictObject({
    // Positive safe integer, no universal maximum: multi-year and other non-calendar
    // periods are legitimate. The schema never infers or defaults this value; it is the
    // verified number of days the source period represents.
    days: z.number().int().safe().min(1),
    referenceYear: z.number().int().optional(),
    isLeapYear: z.boolean().optional(),
  })
  .superRefine((p, ctx) => {
    // Calendar-year case: a reference year means 365/366 matching its leap-year status (Req 4.14).
    if (p.referenceYear !== undefined) {
      const leap = isLeapYear(p.referenceYear);
      if (p.days !== (leap ? 366 : 365)) {
        ctx.addIssue({
          code: 'custom',
          path: ['days'],
          message: `days must be ${leap ? 366 : 365} for reference year ${p.referenceYear}`,
        });
      }
      if (p.isLeapYear !== undefined && p.isLeapYear !== leap) {
        ctx.addIssue({
          code: 'custom',
          path: ['isLeapYear'],
          message: `isLeapYear does not match reference year ${p.referenceYear}`,
        });
      }
    }
  });
export type PeriodDayCount = z.infer<typeof PeriodDayCountSchema>;

export const HistoricalObservationSchema = z
  .strictObject({
    id: idString,
    datasetId: DatasetIdSchema,
    chokepointId: ChokepointIdSchema,
    commodityId: CommodityIdSchema,
    verificationStatus: VerificationStatusSchema,
    value: z.number().min(0),
    unit: nonEmptyText,
    timeBasis: TimeBasisSchema,
    referencePeriodStart: isoDate,
    referencePeriodEnd: isoDate,
    periodDayCount: PeriodDayCountSchema.optional(),
    sourceRecordIds,
  })
  .superRefine((o, ctx) => {
    if (o.referencePeriodEnd < o.referencePeriodStart) {
      ctx.addIssue({
        code: 'custom',
        path: ['referencePeriodEnd'],
        message: 'referencePeriodEnd must not precede referencePeriodStart',
      });
    }
    if (o.timeBasis === 'per-year' && o.periodDayCount === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['periodDayCount'],
        message: 'periodDayCount is required for a per-year observation',
      });
    }
  });
export type HistoricalObservation = z.infer<typeof HistoricalObservationSchema>;

/* ---------- DependencyShare (Req 4.6) ---------- */

export const DependencyShareSchema = z.strictObject({
  id: idString,
  datasetId: DatasetIdSchema,
  chokepointId: ChokepointIdSchema,
  commodityId: CommodityIdSchema,
  economyId: EconomyIdSchema,
  chokepointTransitImportSharePercent: z.number().min(0).max(100),
  unit: z.literal('percent'),
  referencePeriod: ReferencePeriodSchema,
  verificationStatus: VerificationStatusSchema,
  sourceRecordIds,
});
export type DependencyShare = z.infer<typeof DependencyShareSchema>;

/* ---------- QualitativeDependency (Req 4.8): words only, strict ---------- */

export const QualitativeDependencySchema = z.strictObject({
  id: idString,
  datasetId: DatasetIdSchema,
  chokepointId: ChokepointIdSchema,
  commodityId: CommodityIdSchema,
  economyId: EconomyIdSchema,
  description: nonEmptyText,
  referencePeriod: ReferencePeriodSchema,
  verificationStatus: VerificationStatusSchema,
  sourceRecordIds,
});
export type QualitativeDependency = z.infer<typeof QualitativeDependencySchema>;

/* ---------- Graph (Req 9) ---------- */

export const GraphNodeTypeSchema = z.enum(['transport', 'commodity', 'industry', 'economy']);
export type GraphNodeType = z.infer<typeof GraphNodeTypeSchema>;

export const GraphNodeSchema = z.strictObject({
  id: GraphNodeIdSchema,
  type: GraphNodeTypeSchema,
  name: nonEmptyText,
});
export type GraphNode = z.infer<typeof GraphNodeSchema>;

export const GraphEdgeSchema = z.strictObject({
  id: GraphEdgeIdSchema,
  sourceNodeId: GraphNodeIdSchema,
  targetNodeId: GraphNodeIdSchema,
  relationshipDescription: nonEmptyText,
  sourceRecordIds,
});
export type GraphEdge = z.infer<typeof GraphEdgeSchema>;

/* ---------- Declarations (stable ids that records reference; Task 2.2 resolves them) ---------- */

export const DatasetDeclarationSchema = z.strictObject({
  id: DatasetIdSchema,
  name: nonEmptyText,
  description: nonEmptyText.optional(),
});
export type DatasetDeclaration = z.infer<typeof DatasetDeclarationSchema>;

export const ChokepointDeclarationSchema = z.strictObject({
  id: ChokepointIdSchema,
  name: nonEmptyText,
  description: nonEmptyText.optional(),
});
export type ChokepointDeclaration = z.infer<typeof ChokepointDeclarationSchema>;

export const CommodityDeclarationSchema = z.strictObject({
  id: CommodityIdSchema,
  name: nonEmptyText,
  description: nonEmptyText.optional(),
});
export type CommodityDeclaration = z.infer<typeof CommodityDeclarationSchema>;

export const EconomyDeclarationSchema = z.strictObject({
  id: EconomyIdSchema,
  name: nonEmptyText,
  description: nonEmptyText.optional(),
});
export type EconomyDeclaration = z.infer<typeof EconomyDeclarationSchema>;

/* ---------- Dataset and version file (Req 17.2) ---------- */

/** `schema-version.json`: unsupported values are rejected by the build (Task 2.2), not here. */
export const SchemaVersionFileSchema = z.strictObject({
  schemaVersion: nonEmptyText,
  buildDate: isoDate,
});
export type SchemaVersionFile = z.infer<typeof SchemaVersionFileSchema>;

export const CuratedDatasetSchema = z.strictObject({
  schemaVersion: nonEmptyText,
  buildDate: isoDate,
  datasets: z.array(DatasetDeclarationSchema),
  chokepoints: z.array(ChokepointDeclarationSchema),
  commodities: z.array(CommodityDeclarationSchema),
  economies: z.array(EconomyDeclarationSchema),
  sourceRecords: z.array(SourceRecordSchema),
  historicalObservations: z.array(HistoricalObservationSchema),
  dependencyShares: z.array(DependencyShareSchema),
  qualitativeDependencies: z.array(QualitativeDependencySchema),
  graphNodes: z.array(GraphNodeSchema),
  graphEdges: z.array(GraphEdgeSchema),
});
export type CuratedDataset = z.infer<typeof CuratedDatasetSchema>;
