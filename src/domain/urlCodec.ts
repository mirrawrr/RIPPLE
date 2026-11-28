/**
 * URL codec for the Active_Scenario (Req 1.4, 1.5, 6.10; design: Scenario query
 * parameters and state/URL synchronisation). Pure: no DOM, React, data or engine
 * runtime code. Parameters: m (magnitudePercent), d (durationDays), c (commodityScope).
 *
 * Rules:
 * - A missing parameter means its default and produces no correction (design: "Omitted
 *   parameters mean defaults"). Only a present-but-rejected parameter is corrected.
 * - A repeated parameter uses its first value (URLSearchParams.get).
 * - Unrelated parameters are ignored; carrying them is the sync hook's job, not the codec's.
 * - Encoding is canonical: order m, d, c; base-10 integers without leading zeros.
 */
import {
  APP_MODES,
  CONTROL_LABELS,
  DEFAULT_APP_MODE,
  DURATION_RANGE,
  MAGNITUDE_RANGE,
  type AppMode,
} from '../config/constants';
import type { ActiveScenario } from '../engine/types';
import {
  validateCommodityScope,
  validateIntegerInRange,
  type ValidationResult,
} from './validation';

export const URL_PARAM_MAGNITUDE = 'm';
export const URL_PARAM_DURATION = 'd';
export const URL_PARAM_SCOPE = 'c';

export function encodeScenarioToSearchParams(scenario: ActiveScenario): URLSearchParams {
  const params = new URLSearchParams();
  params.set(URL_PARAM_MAGNITUDE, String(scenario.magnitudePercent));
  params.set(URL_PARAM_DURATION, String(scenario.durationDays));
  params.set(URL_PARAM_SCOPE, scenario.commodityScope);
  return params;
}

/** Correction entry: `<param> (<control label>) reset to <default>`. */
function correction(param: string, label: string, def: number | string): string {
  return `${param} (${label}) reset to ${def}`;
}

export function decodeScenarioFromSearchParams(
  params: URLSearchParams,
  defaults: ActiveScenario,
): { scenario: ActiveScenario; corrections: string[] } {
  const corrections: string[] = [];

  const integer = (
    param: string,
    range: { min: number; max: number },
    label: string,
    def: number,
  ): number => {
    const raw = params.get(param);
    if (raw === null) return def;
    const r = validateIntegerInRange(raw, range.min, range.max, label);
    if (r.ok && r.value !== undefined) return r.value;
    corrections.push(correction(param, label, def));
    return def;
  };

  const magnitudePercent = integer(
    URL_PARAM_MAGNITUDE,
    MAGNITUDE_RANGE,
    CONTROL_LABELS.magnitudePercent,
    defaults.magnitudePercent,
  );
  const durationDays = integer(
    URL_PARAM_DURATION,
    DURATION_RANGE,
    CONTROL_LABELS.durationDays,
    defaults.durationDays,
  );

  let commodityScope = defaults.commodityScope;
  const rawScope = params.get(URL_PARAM_SCOPE);
  if (rawScope !== null) {
    const r = validateCommodityScope(rawScope);
    if (r.ok && r.value !== undefined) {
      commodityScope = r.value;
    } else {
      corrections.push(correction(URL_PARAM_SCOPE, CONTROL_LABELS.commodityScope, defaults.commodityScope));
    }
  }

  return { scenario: { magnitudePercent, durationDays, commodityScope }, corrections };
}

/* ---------- App mode (Req 22.13; task 4.20) ---------- */

export const URL_PARAM_MODE = 'mode';

/** Scenario plus App_Mode. ActiveScenario itself does not contain the mode. */
export interface AppState {
  scenario: ActiveScenario;
  mode: AppMode;
}

/** Exact, case-sensitive: only 'historical' and 'demo' are accepted. */
export function validateAppMode(raw: string): ValidationResult<AppMode> {
  if (typeof raw === 'string' && (APP_MODES as readonly string[]).includes(raw)) {
    return { ok: true, value: raw as AppMode };
  }
  return { ok: false, errorMessage: 'Mode must be historical or demo.' };
}

/** Scenario parameters (m, d, c), then mode=demo only in demo mode. Historical omits mode. */
export function encodeAppStateToSearchParams(s: AppState): URLSearchParams {
  const params = encodeScenarioToSearchParams(s.scenario);
  if (s.mode === 'demo') params.set(URL_PARAM_MODE, 'demo');
  return params;
}

/**
 * Absent `mode` or 'historical' gives historical with no correction. 'demo' gives demo.
 * Any other value gives historical with one correction `mode reset to historical`.
 * A repeated `mode` uses its first value (URLSearchParams.get), as for the scenario parameters.
 */
export function decodeAppStateFromSearchParams(
  params: URLSearchParams,
  defaults: AppState,
): { state: AppState; corrections: string[] } {
  const { scenario, corrections } = decodeScenarioFromSearchParams(params, defaults.scenario);
  let mode: AppMode = defaults.mode;
  const raw = params.get(URL_PARAM_MODE);
  if (raw !== null) {
    const r = validateAppMode(raw);
    if (r.ok && r.value !== undefined) {
      mode = r.value;
    } else {
      mode = DEFAULT_APP_MODE;
      corrections.push(`${URL_PARAM_MODE} reset to ${DEFAULT_APP_MODE}`);
    }
  }
  return { state: { scenario, mode }, corrections };
}