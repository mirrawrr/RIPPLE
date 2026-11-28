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
  CONTROL_LABELS,
  DURATION_RANGE,
  MAGNITUDE_RANGE,
} from '../config/constants';
import type { ActiveScenario } from '../engine/types';
import { validateCommodityScope, validateIntegerInRange } from './validation';

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
