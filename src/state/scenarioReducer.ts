/**
 * Pure Active_Scenario reducer (design: ScenarioProvider; Req 1.3, 5.5, 5.7, 6.x).
 * No DOM, network, clock or randomness. App_Mode is not part of this state.
 * Returns the same state object when an action changes nothing.
 */
import {
  CONTROL_LABELS,
  DURATION_RANGE,
  MAGNITUDE_RANGE,
  SCENARIO_DEFAULTS,
} from '../config/constants';
import { validateCommodityScope, validateIntegerInRange } from '../domain/validation';
import type { ActiveScenario } from '../engine/types';

export type ScenarioControl = 'magnitudePercent' | 'durationDays' | 'commodityScope';
export type NumericControl = 'magnitudePercent' | 'durationDays';

export interface ScenarioState {
  /** Last valid values. Calculated_Outcomes derive from this only. */
  scenario: ActiveScenario;
  /** Raw text last typed into a numeric control; kept visible when rejected (Req 6.5). */
  drafts: Partial<Record<NumericControl, string>>;
  /** Exact error message per control; absent when the control's input is valid. */
  errors: Partial<Record<ScenarioControl, string>>;
}

export type ScenarioAction =
  | { type: 'setMagnitude'; raw: string }
  | { type: 'setDuration'; raw: string }
  | { type: 'setScope'; raw: string }
  | { type: 'reset' };

export const scenarioActions = {
  setMagnitude: (raw: string): ScenarioAction => ({ type: 'setMagnitude', raw }),
  setDuration: (raw: string): ScenarioAction => ({ type: 'setDuration', raw }),
  setScope: (raw: string): ScenarioAction => ({ type: 'setScope', raw }),
  reset: (): ScenarioAction => ({ type: 'reset' }),
};

export function createInitialScenarioState(
  initial: ActiveScenario = SCENARIO_DEFAULTS,
): ScenarioState {
  return { scenario: { ...initial }, drafts: {}, errors: {} };
}

function withoutKey<T extends object>(obj: T, key: keyof T): T {
  if (!(key in obj)) return obj;
  const { [key]: _removed, ...rest } = obj;
  void _removed;
  return rest as T;
}

function applyNumeric(
  state: ScenarioState,
  field: NumericControl,
  raw: string,
  range: { min: number; max: number },
): ScenarioState {
  const r = validateIntegerInRange(raw, range.min, range.max, CONTROL_LABELS[field]);
  if (r.ok) {
    const value = r.value as number;
    if (state.scenario[field] === value && state.drafts[field] === raw && !(field in state.errors)) {
      return state;
    }
    return {
      scenario: state.scenario[field] === value ? state.scenario : { ...state.scenario, [field]: value },
      drafts: state.drafts[field] === raw ? state.drafts : { ...state.drafts, [field]: raw },
      errors: withoutKey(state.errors, field),
    };
  }
  if (state.drafts[field] === raw && state.errors[field] === r.errorMessage) return state;
  return {
    scenario: state.scenario,
    drafts: { ...state.drafts, [field]: raw },
    errors: { ...state.errors, [field]: r.errorMessage },
  };
}

export function scenarioReducer(state: ScenarioState, action: ScenarioAction): ScenarioState {
  switch (action.type) {
    case 'setMagnitude':
      return applyNumeric(state, 'magnitudePercent', action.raw, MAGNITUDE_RANGE);
    case 'setDuration':
      return applyNumeric(state, 'durationDays', action.raw, DURATION_RANGE);
    case 'setScope': {
      const r = validateCommodityScope(action.raw);
      if (r.ok) {
        const value = r.value as ActiveScenario['commodityScope'];
        if (state.scenario.commodityScope === value && !('commodityScope' in state.errors)) return state;
        return {
          ...state,
          scenario: { ...state.scenario, commodityScope: value },
          errors: withoutKey(state.errors, 'commodityScope'),
        };
      }
      if (state.errors.commodityScope === r.errorMessage) return state;
      return { ...state, errors: { ...state.errors, commodityScope: r.errorMessage } };
    }
    case 'reset': {
      const d = SCENARIO_DEFAULTS;
      const s = state.scenario;
      const atDefaults =
        s.magnitudePercent === d.magnitudePercent &&
        s.durationDays === d.durationDays &&
        s.commodityScope === d.commodityScope;
      if (
        atDefaults &&
        Object.keys(state.errors).length === 0 &&
        Object.keys(state.drafts).length === 0
      ) {
        return state;
      }
      return createInitialScenarioState(SCENARIO_DEFAULTS);
    }
    default:
      return state;
  }
}
