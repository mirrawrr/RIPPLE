/**
 * Shared constants and exact-copy strings. These are the only place the
 * exact texts below may appear in src/ (tested in constants.test.ts).
 */

/** Commodity identifiers (design: Scenario domain types). */
export type CommodityId = 'oil' | 'lng';

/** Commodity_Scope URL values (Req 6.10). */
export type CommodityScope = CommodityId | 'both';

/** Scenario defaults (Req 5.1, 5.2, 5.3, 5.7). */
export const SCENARIO_DEFAULTS = {
  magnitudePercent: 25,
  durationDays: 7,
  commodityScope: 'both',
} as const satisfies {
  magnitudePercent: number;
  durationDays: number;
  commodityScope: CommodityScope;
};

/** Disruption_Magnitude whole-number range, inclusive (Req 6.1). */
export const MAGNITUDE_RANGE = { min: 0, max: 100 } as const;

/** Disruption_Duration whole-number range in days, inclusive (Req 6.1). */
export const DURATION_RANGE = { min: 1, max: 365 } as const;

/** Stale_Threshold in months (Req 12.9). Configurable constant. */
export const STALE_THRESHOLD_MONTHS = 12;

/** Maximum economies in ranked Scenario_Exposure_Index lists (Req 8.2). */
export const TOP_N_EXPOSURE = 5;

/** RIPPLE tagline (Req 2.1). */
export const TAGLINE = 'One event. A thousand consequences.';

/** Reference_Statement, shown on every View (Req 12.10). */
export const REFERENCE_STATEMENT =
  'Figures describe the stated reference period. They are not a claim about current conditions or current flows.';

/** Scenario_Exposure_Disclaimer (Req 12.5). */
export const SCENARIO_EXPOSURE_DISCLAIMER =
  'Simplified, illustrative dependency indicator. Not a prediction of supply loss, economic damage, or commodity price changes.';

/** Older_Period_Notice (Req 12.9). */
export const OLDER_PERIOD_NOTICE =
  'Older reference period - check it is still appropriate for your purpose.';

/** Qualitative_Label (Req 9.7, 11.4). */
export const QUALITATIVE_LABEL = 'Qualitative documented dependency - not quantified';

/** Class_Label names (Req 12.1). */
export const CLASS_LABELS = {
  historical: 'Historical',
  hypothetical: 'Hypothetical',
  calculated: 'Calculated',
} as const;

export type ClassLabel = (typeof CLASS_LABELS)[keyof typeof CLASS_LABELS];
