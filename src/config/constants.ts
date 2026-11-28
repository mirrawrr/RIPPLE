/**
 * Shared constants and exact-copy strings. These are the only place the
 * exact texts below may appear in src/ (tested in constants.test.ts).
 */

/** Commodity identifiers (design: Scenario domain types). */
export type CommodityId = 'oil' | 'lng';

/** Commodity_Scope URL values (Req 6.10). */
export type CommodityScope = CommodityId | 'both';

/** Accepted Commodity_Scope values (Req 6.10). Canonical list. */
export const COMMODITY_SCOPES = ['oil', 'lng', 'both'] as const satisfies readonly CommodityScope[];

// Compile-time check: every CommodityScope member appears in COMMODITY_SCOPES.
type _ScopesCoverType = CommodityScope extends (typeof COMMODITY_SCOPES)[number] ? true : never;
const _scopesCoverType: _ScopesCoverType = true;
void _scopesCoverType;

/** Control labels, verbatim from Requirement 5 criteria 1 and 2 (plus scope label). */
export const CONTROL_LABELS = {
  magnitudePercent: 'Hypothetical percentage reduction in baseline transit flow',
  durationDays: 'Hypothetical duration (days)',
  commodityScope: 'Commodity scope',
} as const;

/** Error shown for an invalid Commodity_Scope (Req 6.10). */
export const COMMODITY_SCOPE_ERROR_MESSAGE = 'Commodity scope must be one of oil, lng or both.';

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

/* ---------- Illustrative Demo Mode (Req 22) ---------- */

/** The two App_Modes (Req 22.1). URL values of the `mode` parameter. */
export const APP_MODES = ['historical', 'demo'] as const;
export type AppMode = (typeof APP_MODES)[number];

/** Historical_Mode is the default App_Mode (Req 22.1). */
export const DEFAULT_APP_MODE = 'historical' as const satisfies AppMode;

/** Illustrative_Label: the fourth Class_Label, demo mode only (Req 22.6). Not part of CLASS_LABELS. */
export const ILLUSTRATIVE_LABEL = 'Illustrative';

/** Class_Label values permitted in demo mode: no "Historical" (design: Illustrative Demo Mode). */
export type DemoClassLabel =
  | typeof ILLUSTRATIVE_LABEL
  | (typeof CLASS_LABELS)['hypothetical']
  | (typeof CLASS_LABELS)['calculated'];

/** Demo_Marker: not a Class_Label (Req 22.6). */
export const DEMO_MARKER = 'Illustrative demo';

/** Demo_Banner_Text (Req 22.5). */
export const DEMO_BANNER_TEXT =
  'ILLUSTRATIVE DEMO MODE - synthetic data and fictional assumptions. Not historical, not current, not a prediction.';

/** Demo_Data_Notice (Req 22.14). Also the literal value of `notice` in the Demo_Dataset. */
export const DEMO_DATA_NOTICE =
  'Synthetic illustrative data for demonstration only. No Source_Record exists for these values. They are not Historical Observations and make no claim about any real flow, economy, or dependency.';

/** Demo_No_Source_Text (Req 22.6, 22.14). */
export const DEMO_NO_SOURCE_TEXT = 'No Source_Record - synthetic illustrative value';

/** Demo_Reference_Statement (Req 22.8). */
export const DEMO_REFERENCE_STATEMENT =
  'Demo figures have no reference period. They describe no real conditions, flows, or economies.';

/** Demo_Brief_Header (Req 22.15). */
export const DEMO_BRIEF_HEADER = 'ILLUSTRATIVE DEMO BRIEF - synthetic data, not historical or predictive';

/** Demo_Brief_Footer (Req 22.15). */
export const DEMO_BRIEF_FOOTER = 'End of illustrative demo brief. Every figure above is synthetic and fictional.';

/** Statement that replaces the Qualitative_Label section of the demo brief (Req 22.15). */
export const DEMO_NO_QUALITATIVE_TEXT = 'No qualitative dependencies are defined in the demo data.';

/** Demo_Title_Prefix for chart titles and data-table captions, trailing space included (Req 22.7). */
export const DEMO_TITLE_PREFIX = 'Illustrative demo - ';

/** Document-title prefix in demo mode, trailing space included (Req 22.7). */
export const DEMO_DOCUMENT_TITLE_PREFIX = '[Illustrative demo] ';

/** Prefix of every scenario-result announcement in demo mode (Req 22.7). */
export const DEMO_ANNOUNCEMENT_PREFIX = 'Illustrative demo.';

/** Mode_Toggle labels (glossary). `toDemo` shows in Historical_Mode, `toHistorical` in demo mode. */
export const MODE_TOGGLE_LABELS = {
  toDemo: 'Switch to Illustrative demo mode',
  toHistorical: 'Return to Historical mode',
} as const;

/** Label of the Demo_Banner control (Req 22.4). Same text as the Mode_Toggle label in demo mode. */
export const DEMO_BANNER_RETURN_LABEL = MODE_TOGGLE_LABELS.toHistorical;

/** Mode_Announcements, keyed by the mode just entered (Req 22.3). */
export const MODE_ANNOUNCEMENTS = {
  demo: 'Illustrative demo mode on. Figures are synthetic and not historical.',
  historical: 'Historical mode on.',
} as const;

/** Shown in place of each demo figure when the Demo_Dataset is not ready (Req 22.12). */
export const DEMO_DATA_UNAVAILABLE_TEXT = 'Demo data unavailable';

/** Required prefix of every Demo_Dataset identifier (Req 22.10). Content rule, enforced by build check D3. */
export const DEMO_ID_PREFIX = 'demo-';

/** Value of `kind` in the Demo_Dataset (design: Demo_Dataset). */
export const DEMO_DATASET_KIND = 'illustrative-demo';

/** Marker every fictional economy name must contain (Req 22.10). Enforced by build check D3. */
export const DEMO_FICTIONAL_MARKER = '(fictional)';

/** Text every demo unit must contain, case-insensitive (Req 22.10). Enforced by build check D3. */
export const DEMO_UNIT_MARKER = 'demo';

/** Demo flow values and shares must be multiples of this number (Req 22.10). Enforced by build check D3. */
export const DEMO_VALUE_MULTIPLE = 10;

/**
 * Publisher names that must not appear in any string of the Demo_Dataset (Req 22.10).
 * Matched case-insensitively as whole terms by build check D3.
 */
export const DEMO_FORBIDDEN_SOURCE_NAMES = ['EIA', 'IEA', 'UNCTAD', 'Vortexa', 'Kpler', 'OPEC'] as const;

/* ---------- Dataset availability texts ---------- */

/** Shown in place of a value whose required Historical_Observation has no Source_Record (Req 4.10). */
export const SOURCE_UNAVAILABLE_TEXT = 'Source unavailable';

/** Footer text when the Curated_Dataset version or Build_Date cannot be read (Req 12.11; design: Error Handling). */
export const DATASET_VERSION_UNAVAILABLE_TEXT = 'Dataset version unavailable';
