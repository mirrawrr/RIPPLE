import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from 'react';
import type { ActiveScenario } from '../engine/types';
import {
  createInitialScenarioState,
  scenarioActions,
  scenarioReducer,
  type ScenarioState,
} from './scenarioReducer';

export interface ScenarioContextValue {
  scenario: ActiveScenario;
  errors: ScenarioState['errors'];
  drafts: ScenarioState['drafts'];
  setMagnitude: (raw: string) => void;
  setDuration: (raw: string) => void;
  setScope: (raw: string) => void;
  reset: () => void;
}

const ScenarioContext = createContext<ScenarioContextValue | null>(null);

export function ScenarioProvider({
  initialScenario,
  children,
}: {
  /** Optional starting scenario (URL hydration, task 5.3). Defaults to SCENARIO_DEFAULTS. */
  initialScenario?: ActiveScenario;
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(scenarioReducer, initialScenario, createInitialScenarioState);

  const setMagnitude = useCallback((raw: string) => dispatch(scenarioActions.setMagnitude(raw)), []);
  const setDuration = useCallback((raw: string) => dispatch(scenarioActions.setDuration(raw)), []);
  const setScope = useCallback((raw: string) => dispatch(scenarioActions.setScope(raw)), []);
  const reset = useCallback(() => dispatch(scenarioActions.reset()), []);

  const value = useMemo<ScenarioContextValue>(
    () => ({
      scenario: state.scenario,
      errors: state.errors,
      drafts: state.drafts,
      setMagnitude,
      setDuration,
      setScope,
      reset,
    }),
    [state, setMagnitude, setDuration, setScope, reset],
  );

  return <ScenarioContext.Provider value={value}>{children}</ScenarioContext.Provider>;
}

export function useScenario(): ScenarioContextValue {
  const ctx = useContext(ScenarioContext);
  if (ctx === null) throw new Error('useScenario must be used inside <ScenarioProvider>.');
  return ctx;
}
