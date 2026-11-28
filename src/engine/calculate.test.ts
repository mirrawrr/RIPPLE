import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { calculate, ENGINE_ASSUMPTIONS, FORMULAS } from './index';
import type { CalculatedValue, DependencyShareInput, EngineInput, FlowInput } from './index';

// Synthetic ids, units and values only.
const flowDay = (over: Partial<FlowInput> = {}): FlowInput => ({
  chokepointId: 'cp-1',
  commodityId: 'com-a',
  baselineTransitFlow: 200,
  unit: 'test-unit-a',
  timeBasis: 'per-day',
  ...over,
});
const flowYear = (over: Partial<FlowInput> = {}): FlowInput =>
  flowDay({ commodityId: 'com-b', unit: 'test-unit-b', timeBasis: 'per-year', baselineTransitFlow: 7320, periodDayCount: 366, ...over });
const share = (over: Partial<DependencyShareInput> = {}): DependencyShareInput => ({
  chokepointId: 'cp-1',
  commodityId: 'com-a',
  economyId: 'eco-1',
  economyName: 'Test One',
  chokepointTransitImportSharePercent: 40,
  ...over,
});
const input = (over: Partial<EngineInput> & { m?: number; d?: number } = {}): EngineInput => ({
  scenario: { magnitudePercent: over.m ?? 25, durationDays: over.d ?? 7, commodityScope: 'both' },
  flows: over.flows ?? [flowDay()],
  dependencyShares: over.dependencyShares ?? [],
});
const calc = (v: CalculatedValue) => {
  if (v.status !== 'calculated') throw new Error('expected calculated');
  return v.value;
};

describe('baseline daily flow', () => {
  it('uses per-day flow as is', () => {
    const r = calculate(input()).perCommodity['com-a']!;
    expect(r.baselineDailyFlow).toEqual({ status: 'calculated', value: 200, unit: 'test-unit-a' });
    expect(r.periodDayCountUsed).toBeUndefined();
  });

  it.each([
    [7300, 365, 20],
    [7320, 366, 20],
    [7300, 730, 10],
    [1000, 4, 250],
  ])('per-year %d / %d days = %d', (flow, days, expected) => {
    const r = calculate(input({ flows: [flowYear({ baselineTransitFlow: flow, periodDayCount: days })] })).perCommodity['com-b']!;
    expect(calc(r.baselineDailyFlow)).toBe(expected);
    expect(r.periodDayCountUsed).toEqual({ value: days });
  });

  it('365 and 366 day counts give different results for the same annual flow', () => {
    const a = calculate(input({ flows: [flowYear({ periodDayCount: 365 })] })).perCommodity['com-b']!;
    const b = calculate(input({ flows: [flowYear({ periodDayCount: 366 })] })).perCommodity['com-b']!;
    expect(calc(a.baselineDailyFlow)).toBe(7320 / 365);
    expect(calc(b.baselineDailyFlow)).toBe(20);
  });
});

describe('reduced flow', () => {
  it('computes daily and cumulative values', () => {
    const r = calculate(input({ m: 25, d: 7 })).perCommodity['com-a']!;
    expect(calc(r.dailyReducedFlow)).toBe(50);
    expect(calc(r.cumulativeReducedFlow)).toBe(350);
  });

  it.each([
    [0, 1, 0, 0],
    [0, 365, 0, 0],
    [100, 1, 200, 200],
    [100, 365, 200, 73000],
  ])('magnitude %d duration %d', (m, d, daily, cumulative) => {
    const r = calculate(input({ m, d })).perCommodity['com-a']!;
    expect(calc(r.dailyReducedFlow)).toBe(daily);
    expect(calc(r.cumulativeReducedFlow)).toBe(cumulative);
  });

  it('passes units through unchanged', () => {
    const r = calculate(input({ flows: [flowDay({ unit: 'weird / unit  x' })] })).perCommodity['com-a']!;
    expect(r.unit).toBe('weird / unit  x');
    for (const v of [r.baselineDailyFlow, r.dailyReducedFlow, r.cumulativeReducedFlow]) {
      expect(v).toMatchObject({ unit: 'weird / unit  x' });
    }
  });
});

describe('exposure index', () => {
  it('computes share x magnitude / 100 independently per economy, without normalising', () => {
    const shares = [
      share({ economyId: 'e1', chokepointTransitImportSharePercent: 0 }),
      share({ economyId: 'e2', chokepointTransitImportSharePercent: 100 }),
      share({ economyId: 'e3', chokepointTransitImportSharePercent: 80 }),
      share({ economyId: 'e4', chokepointTransitImportSharePercent: 60 }),
    ];
    const list = calculate(input({ m: 50, dependencyShares: shares })).exposureByCommodity['com-a']!;
    expect(list.map((e) => e.economyId)).toEqual(['e1', 'e2', 'e3', 'e4']);
    expect(list.map((e) => calc(e.scenarioExposureIndex))).toEqual([0, 50, 40, 30]);
    expect(list[0]!.scenarioExposureIndex).toMatchObject({ unit: 'percent' });
  });

  it('is 0 at magnitude 0 and equals the share at magnitude 100', () => {
    const shares = [share({ chokepointTransitImportSharePercent: 37.5 })];
    const at0 = calculate(input({ m: 0, dependencyShares: shares })).exposureByCommodity['com-a']!;
    const at100 = calculate(input({ m: 100, dependencyShares: shares })).exposureByCommodity['com-a']!;
    expect(calc(at0[0]!.scenarioExposureIndex)).toBe(0);
    expect(calc(at100[0]!.scenarioExposureIndex)).toBe(37.5);
  });

  it('returns an empty list when a commodity has no Quantified_Economy, flows still calculated', () => {
    const r = calculate(input({ dependencyShares: [share({ commodityId: 'com-x' })] }));
    expect(r.exposureByCommodity['com-a']).toEqual([]);
    expect(calc(r.perCommodity['com-a']!.dailyReducedFlow)).toBe(50);
  });

  it('ignores shares for a different chokepoint', () => {
    const r = calculate(input({ dependencyShares: [share({ chokepointId: 'cp-other' })] }));
    expect(r.exposureByCommodity['com-a']).toEqual([]);
  });

  it('is not calculable for a share outside 0-100', () => {
    const list = calculate(
      input({ dependencyShares: [share({ chokepointTransitImportSharePercent: 101 }), share({ economyId: 'e2', chokepointTransitImportSharePercent: Number.NaN })] }),
    ).exposureByCommodity['com-a']!;
    for (const e of list) {
      expect(e.scenarioExposureIndex).toEqual({ status: 'not-calculable', missingInputs: ['chokepointTransitImportSharePercent'] });
    }
  });
});

describe('commodity separation', () => {
  it('returns one independent entry per commodity and no combined entry', () => {
    const r = calculate(input({ flows: [flowDay(), flowYear()], dependencyShares: [share(), share({ commodityId: 'com-b', chokepointTransitImportSharePercent: 10 })] }));
    expect(Object.keys(r.perCommodity).sort()).toEqual(['com-a', 'com-b']);
    expect(Object.keys(r.exposureByCommodity).sort()).toEqual(['com-a', 'com-b']);
    expect(Object.keys(r)).toEqual(['perCommodity', 'exposureByCommodity']);
    expect(calc(r.perCommodity['com-a']!.dailyReducedFlow)).toBe(50);
    expect(calc(r.perCommodity['com-b']!.dailyReducedFlow)).toBe(5);
    expect(r.perCommodity['com-a']!.unit).not.toBe(r.perCommodity['com-b']!.unit);
  });

  it('calculates only the flows supplied (scope is applied by the caller)', () => {
    const r = calculate(input({ flows: [flowYear()] }));
    expect(Object.keys(r.perCommodity)).toEqual(['com-b']);
  });
});

describe('not-calculable', () => {
  it('names a missing baseline and leaves the other commodity unaffected', () => {
    const bad = flowDay() as Partial<FlowInput>;
    delete bad.baselineTransitFlow;
    const r = calculate(input({ flows: [bad as FlowInput, flowYear()] }));
    const a = r.perCommodity['com-a']!;
    for (const v of [a.baselineDailyFlow, a.dailyReducedFlow, a.cumulativeReducedFlow]) {
      expect(v).toEqual({ status: 'not-calculable', missingInputs: ['baselineTransitFlow'] });
      expect('value' in v).toBe(false);
    }
    expect(r.perCommodity['com-b']!.baselineDailyFlow.status).toBe('calculated');
    expect(r.perCommodity['com-b']!.cumulativeReducedFlow.status).toBe('calculated');
  });

  it('names every missing input', () => {
    const bad = flowYear() as Partial<FlowInput>;
    delete bad.baselineTransitFlow;
    delete bad.periodDayCount;
    const a = calculate(input({ flows: [bad as FlowInput] })).perCommodity['com-b']!;
    expect(a.baselineDailyFlow).toEqual({ status: 'not-calculable', missingInputs: ['baselineTransitFlow', 'periodDayCount'] });
  });

  it.each([undefined, 0, -1, 1.5, Number.NaN])('rejects per-year periodDayCount %s without defaulting', (days) => {
    const r = calculate(input({ flows: [flowYear({ periodDayCount: days })] })).perCommodity['com-b']!;
    expect(r.baselineDailyFlow).toEqual({ status: 'not-calculable', missingInputs: ['periodDayCount'] });
    expect(r.dailyReducedFlow.status).toBe('not-calculable');
    expect(r.periodDayCountUsed).toBeUndefined();
  });

  it.each([-1, Number.NaN, Infinity])('rejects baseline %s', (v) => {
    const r = calculate(input({ flows: [flowDay({ baselineTransitFlow: v })] })).perCommodity['com-a']!;
    expect(r.baselineDailyFlow).toEqual({ status: 'not-calculable', missingInputs: ['baselineTransitFlow'] });
  });

  it.each([-1, 101, 1.5, Number.NaN])('rejects magnitude %s', (m) => {
    const r = calculate(input({ m, dependencyShares: [share()] }));
    const f = r.perCommodity['com-a']!;
    expect(f.baselineDailyFlow.status).toBe('calculated');
    expect(f.dailyReducedFlow).toEqual({ status: 'not-calculable', missingInputs: ['magnitudePercent'] });
    expect(f.cumulativeReducedFlow).toEqual({ status: 'not-calculable', missingInputs: ['magnitudePercent'] });
    expect(r.exposureByCommodity['com-a']![0]!.scenarioExposureIndex).toEqual({ status: 'not-calculable', missingInputs: ['magnitudePercent'] });
  });

  it.each([0, -1, 366, 2.5, Number.NaN])('rejects duration %s', (d) => {
    const f = calculate(input({ d })).perCommodity['com-a']!;
    expect(f.dailyReducedFlow.status).toBe('calculated');
    expect(f.cumulativeReducedFlow).toEqual({ status: 'not-calculable', missingInputs: ['durationDays'] });
  });
});

describe('determinism and transparency', () => {
  it('returns deep-equal output for equal input', () => {
    const i = input({ flows: [flowDay(), flowYear()], dependencyShares: [share(), share({ economyId: 'e2' })] });
    expect(calculate(i)).toEqual(calculate(structuredClone(i)));
  });

  it('exposes formula text and inputs with class labels', () => {
    expect(FORMULAS.annualToDailyStep.text).toBe('Baseline_Daily_Flow = Baseline_Transit_Flow / Period_Day_Count');
    expect(FORMULAS.annualToDailyStep.inputs.map((x) => x.classLabel)).toEqual(['Historical', 'Hypothetical']);
    expect(FORMULAS.scenarioExposureIndex.resultClassLabel).toBe('Calculated');
    expect(ENGINE_ASSUMPTIONS).toHaveLength(3);
  });
});

describe('engine source independence', () => {
  const dir = resolve(__dirname);
  const files = readdirSync(dir).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'));
  const sources = files.map((f) => ({ f, text: readFileSync(join(dir, f), 'utf8') }));

  it('has source files to scan', () => {
    expect(files).toEqual(expect.arrayContaining(['calculate.ts', 'formulas.ts', 'types.ts', 'index.ts']));
  });

  it('contains no chokepoint or commodity identifiers', () => {
    for (const { f, text } of sources) {
      expect(text.match(/\b(hormuz|oil|lng)\b/gi), f).toBeNull();
    }
  });

  it('imports only engine modules and config constants, and uses no DOM, network, clock or RNG', () => {
    for (const { f, text } of sources) {
      for (const m of text.matchAll(/from\s+'([^']+)'/g)) {
        expect(['./calculate', './formulas', './types', '../config/constants'], `${f}: ${m[1]}`).toContain(m[1]);
      }
      expect(text.match(/\b(fetch|XMLHttpRequest|document|window|localStorage|Math\.random|Date|setTimeout)\b/), f).toBeNull();
    }
  });
});
