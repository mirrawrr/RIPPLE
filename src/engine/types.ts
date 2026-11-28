/**
 * Scenario_Engine contract (design: Key module interfaces, Scenario_Engine).
 * Generic ids only: no chokepoint or commodity literal appears in this module (Req 17.3).
 */
import type { CommodityScope } from '../config/constants';

/** The scenario the engine evaluates. `commodityScope` is carried through; the caller supplies only in-scope flows. */
export interface ActiveScenario {
  magnitudePercent: number; // integer 0-100
  durationDays: number; // integer 1-365
  commodityScope: CommodityScope;
}

export interface FlowInput {
  chokepointId: string;
  commodityId: string;
  baselineTransitFlow: number;
  unit: string;
  timeBasis: 'per-day' | 'per-year';
  periodDayCount?: number; // required iff timeBasis === 'per-year'
}

export interface DependencyShareInput {
  chokepointId: string;
  commodityId: string;
  economyId: string;
  economyName: string;
  chokepointTransitImportSharePercent: number; // 0-100
}

export interface EngineInput {
  scenario: ActiveScenario;
  flows: FlowInput[]; // one per commodity in scope
  dependencyShares: DependencyShareInput[]; // Quantified_Economy records only
}

export type CalculatedValue =
  | { status: 'calculated'; value: number; unit: string }
  | { status: 'not-calculable'; missingInputs: string[] };

export interface CommodityFlowResult {
  commodityId: string;
  unit: string;
  baselineDailyFlow: CalculatedValue;
  periodDayCountUsed?: { value: number; referenceYear?: number; isLeapYear?: boolean };
  dailyReducedFlow: CalculatedValue;
  cumulativeReducedFlow: CalculatedValue;
}

export interface ExposureResult {
  economyId: string;
  economyName: string;
  commodityId: string;
  scenarioExposureIndex: CalculatedValue; // percent
}

export interface EngineResult {
  perCommodity: Record<string, CommodityFlowResult>; // never a combined/summed entry
  exposureByCommodity: Record<string, ExposureResult[]>; // input order; ranking lives in the domain layer
}
