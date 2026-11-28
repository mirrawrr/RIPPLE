/**
 * Scenario_Engine: pure and deterministic. No I/O, no clock, no RNG, no mode,
 * no dataset access. Every figure keeps the unit of its input (Req 7.7).
 */
import { DURATION_RANGE, MAGNITUDE_RANGE } from '../config/constants';
import type {
  CalculatedValue,
  CommodityFlowResult,
  DependencyShareInput,
  EngineInput,
  EngineResult,
  ExposureResult,
  FlowInput,
} from './types';

/** Unit of every Scenario_Exposure_Index value. */
export const EXPOSURE_UNIT = 'percent';

const notCalculable = (missingInputs: string[]): CalculatedValue => ({
  status: 'not-calculable',
  missingInputs: [...new Set(missingInputs)],
});

const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

const isIntegerInRange = (v: unknown, range: { min: number; max: number }): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= range.min && v <= range.max;

/** Names of the scenario inputs that are missing or outside their range (Req 7.16). */
function invalidMagnitude(v: unknown): string[] {
  return isIntegerInRange(v, MAGNITUDE_RANGE) ? [] : ['magnitudePercent'];
}
function invalidDuration(v: unknown): string[] {
  return isIntegerInRange(v, DURATION_RANGE) ? [] : ['durationDays'];
}

/** Inputs that block the baseline daily flow (Req 7.15, 7.18). Empty when it can be calculated. */
function baselineProblems(flow: FlowInput): string[] {
  const problems: string[] = [];
  if (!isFiniteNumber(flow.baselineTransitFlow) || flow.baselineTransitFlow < 0) {
    problems.push('baselineTransitFlow');
  }
  if (typeof flow.unit !== 'string') problems.push('unit');
  if (flow.timeBasis === 'per-year') {
    const d = flow.periodDayCount;
    if (typeof d !== 'number' || !Number.isSafeInteger(d) || d < 1) problems.push('periodDayCount');
  } else if (flow.timeBasis !== 'per-day') {
    problems.push('timeBasis');
  }
  return problems;
}

function calculateFlow(flow: FlowInput, magnitudePercent: unknown, durationDays: unknown): CommodityFlowResult {
  const unit = typeof flow.unit === 'string' ? flow.unit : '';
  const baseProblems = baselineProblems(flow);

  let baselineDailyFlow: CalculatedValue;
  if (baseProblems.length > 0) {
    baselineDailyFlow = notCalculable(baseProblems);
  } else {
    // Annual_To_Daily_Step for per-year; per-day is used as is (Req 7.1, 7.2).
    const value =
      flow.timeBasis === 'per-year'
        ? flow.baselineTransitFlow / (flow.periodDayCount as number)
        : flow.baselineTransitFlow;
    baselineDailyFlow = { status: 'calculated', value, unit };
  }

  const dailyProblems = [
    ...(baselineDailyFlow.status === 'not-calculable' ? baselineDailyFlow.missingInputs : []),
    ...invalidMagnitude(magnitudePercent),
  ];
  const dailyReducedFlow: CalculatedValue =
    dailyProblems.length > 0 || baselineDailyFlow.status !== 'calculated'
      ? notCalculable(dailyProblems)
      : {
          status: 'calculated',
          value: (baselineDailyFlow.value * (magnitudePercent as number)) / 100,
          unit,
        };

  const cumulativeProblems = [
    ...(dailyReducedFlow.status === 'not-calculable' ? dailyReducedFlow.missingInputs : []),
    ...invalidDuration(durationDays),
  ];
  const cumulativeReducedFlow: CalculatedValue =
    cumulativeProblems.length > 0 || dailyReducedFlow.status !== 'calculated'
      ? notCalculable(cumulativeProblems)
      : {
          status: 'calculated',
          value: dailyReducedFlow.value * (durationDays as number),
          unit,
        };

  const result: CommodityFlowResult = {
    commodityId: flow.commodityId,
    unit,
    baselineDailyFlow,
    dailyReducedFlow,
    cumulativeReducedFlow,
  };
  if (flow.timeBasis === 'per-year' && baseProblems.length === 0) {
    result.periodDayCountUsed = { value: flow.periodDayCount as number };
  }
  return result;
}

function calculateExposure(share: DependencyShareInput, magnitudePercent: unknown): ExposureResult {
  const s = share.chokepointTransitImportSharePercent;
  const problems = [
    ...(isFiniteNumber(s) && s >= 0 && s <= 100 ? [] : ['chokepointTransitImportSharePercent']),
    ...invalidMagnitude(magnitudePercent),
  ];
  return {
    economyId: share.economyId,
    economyName: share.economyName,
    commodityId: share.commodityId,
    scenarioExposureIndex:
      problems.length > 0
        ? notCalculable(problems)
        : {
            status: 'calculated',
            value: ((s as number) * (magnitudePercent as number)) / 100,
            unit: EXPOSURE_UNIT,
          },
  };
}

/**
 * Evaluates the scenario for every flow supplied (the caller passes only the
 * commodities in scope). One result per commodity id; if a commodity id repeats,
 * the first flow wins. Shares are matched to a flow by commodity and chokepoint id.
 */
export function calculate(input: EngineInput): EngineResult {
  const { magnitudePercent, durationDays } = input.scenario;
  const perCommodity: Record<string, CommodityFlowResult> = {};
  const exposureByCommodity: Record<string, ExposureResult[]> = {};
  const used = new Map<string, FlowInput>();

  for (const flow of input.flows) {
    if (used.has(flow.commodityId)) continue;
    used.set(flow.commodityId, flow);
    perCommodity[flow.commodityId] = calculateFlow(flow, magnitudePercent, durationDays);
    exposureByCommodity[flow.commodityId] = [];
  }

  for (const share of input.dependencyShares) {
    const flow = used.get(share.commodityId);
    if (flow === undefined || flow.chokepointId !== share.chokepointId) continue;
    exposureByCommodity[share.commodityId]!.push(calculateExposure(share, magnitudePercent));
  }

  return { perCommodity, exposureByCommodity };
}
