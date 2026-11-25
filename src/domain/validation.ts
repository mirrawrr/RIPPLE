/**
 * Scenario_Input_Validation (Requirement 6). One canonical module used by
 * controls, URL parsing and tests. Depends only on src/config/constants.ts.
 *
 * No defaults are applied here. Substituting defaults (with corrections) is the
 * job of the URL codec and reset logic, never of validation.
 */
import {
  COMMODITY_SCOPES,
  COMMODITY_SCOPE_ERROR_MESSAGE,
  CONTROL_LABELS,
  DURATION_RANGE,
  MAGNITUDE_RANGE,
  type CommodityScope,
  type SCENARIO_DEFAULTS,
  SCENARIO_DEFAULTS as DEFAULTS_FOR_KEYS,
} from '../config/constants';

export interface ValidationResult<T> {
  ok: boolean;
  /** Present when ok. */
  value?: T;
  /** Present when not ok. */
  errorMessage?: string;
}

const ASCII_DIGITS = /^[0-9]+$/;

/**
 * Validates a whole-number text input in [min, max] inclusive.
 * Trims leading/trailing whitespace; internal whitespace is invalid; leading
 * zeros are accepted ("007" -> 7). Rejects empty, "+", "-", letters, symbols,
 * decimal separators ("5.0"), non-ASCII digits and out-of-range values.
 */
export function validateIntegerInRange(
  raw: string,
  min: number,
  max: number,
  controlLabel: string,
): ValidationResult<number> {
  const fail = (): ValidationResult<number> => ({
    ok: false,
    errorMessage: `${controlLabel} must be a whole number from ${min} to ${max}.`,
  });
  if (typeof raw !== 'string') return fail();
  const text = raw.trim();
  if (!ASCII_DIGITS.test(text)) return fail();
  const significant = text.replace(/^0+/, '');
  if (significant.length > 15) return fail(); // beyond safe precision, so out of range
  const value = significant === '' ? 0 : Number(significant);
  if (!Number.isSafeInteger(value) || value < min || value > max) return fail();
  return { ok: true, value };
}

/**
 * Accepts exactly 'oil', 'lng' or 'both'. Case-sensitive, no trimming: the URL
 * value must match exactly (Req 6.10).
 */
export function validateCommodityScope(raw: string): ValidationResult<CommodityScope> {
  if (typeof raw === 'string' && (COMMODITY_SCOPES as readonly string[]).includes(raw)) {
    return { ok: true, value: raw as CommodityScope };
  }
  return { ok: false, errorMessage: COMMODITY_SCOPE_ERROR_MESSAGE };
}

export type ScenarioField = keyof typeof SCENARIO_DEFAULTS;

export interface ValidScenarioInput {
  magnitudePercent: number;
  durationDays: number;
  commodityScope: CommodityScope;
}

export type ScenarioInputErrors = Partial<Record<ScenarioField | '_unexpected', string>>;

export type ScenarioInputResult =
  | { ok: true; value: ValidScenarioInput }
  | { ok: false; errors: ScenarioInputErrors };

const FIELDS = Object.keys(DEFAULTS_FOR_KEYS) as ScenarioField[];

/**
 * Validates a whole scenario object (addition beyond the design interface).
 * Requires a plain object with all three fields and no others. Numeric fields
 * accept strings, or finite safe-integer numbers; everything else is rejected.
 * Never substitutes defaults: missing fields are errors.
 */
export function validateScenarioInput(input: unknown): ScenarioInputResult {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { ok: false, errors: { _unexpected: 'Scenario input must be an object.' } };
  }
  const obj = input as Record<string, unknown>;
  const errors: ScenarioInputErrors = {};

  const unexpected = Object.keys(obj).filter((k) => !(FIELDS as string[]).includes(k));
  if (unexpected.length > 0) {
    errors._unexpected = unexpected.map((k) => `Unexpected field: ${k}.`).join(' ');
  }

  const numeric = (
    field: 'magnitudePercent' | 'durationDays',
    range: { min: number; max: number },
  ): number => {
    let v = obj[field];
    if (typeof v === 'number') v = Number.isSafeInteger(v) ? String(v) : '';
    const r = validateIntegerInRange(
      typeof v === 'string' ? v : '',
      range.min,
      range.max,
      CONTROL_LABELS[field],
    );
    if (!r.ok) errors[field] = r.errorMessage;
    return r.value ?? 0;
  };

  const magnitudePercent = numeric('magnitudePercent', MAGNITUDE_RANGE);
  const durationDays = numeric('durationDays', DURATION_RANGE);
  const scope = validateCommodityScope(
    typeof obj.commodityScope === 'string' ? obj.commodityScope : '',
  );
  if (!scope.ok) errors.commodityScope = scope.errorMessage;

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: { magnitudePercent, durationDays, commodityScope: scope.value as CommodityScope },
  };
}
