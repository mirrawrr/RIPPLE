import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CONTROL_LABELS, SCENARIO_DEFAULTS } from '../config/constants';
import { ScenarioProvider, useScenario } from './ScenarioProvider';
import { createInitialScenarioState, scenarioActions, scenarioReducer } from './scenarioReducer';

describe('scenarioReducer smoke', () => {
  const init = createInitialScenarioState();

  it('starts at defaults with no errors', () => {
    expect(init.scenario).toEqual({ magnitudePercent: 25, durationDays: 7, commodityScope: 'both' });
    expect(init.errors).toEqual({});
  });

  it('applies a valid magnitude', () => {
    const s = scenarioReducer(init, scenarioActions.setMagnitude(' 040 '));
    expect(s.scenario.magnitudePercent).toBe(40);
    expect(s.errors).toEqual({});
  });

  it('keeps the last valid duration and sets the exact error on invalid input', () => {
    const s = scenarioReducer(init, scenarioActions.setDuration('400'));
    expect(s.scenario.durationDays).toBe(7);
    expect(s.drafts.durationDays).toBe('400');
    expect(s.errors.durationDays).toBe(`${CONTROL_LABELS.durationDays} must be a whole number from 1 to 365.`);
  });

  it('reset restores defaults and clears errors', () => {
    let s = scenarioReducer(init, scenarioActions.setMagnitude('60'));
    s = scenarioReducer(s, scenarioActions.setDuration('x'));
    s = scenarioReducer(s, scenarioActions.setScope('bad'));
    expect(Object.keys(s.errors)).toHaveLength(2);
    s = scenarioReducer(s, scenarioActions.reset());
    expect(s).toEqual(createInitialScenarioState(SCENARIO_DEFAULTS));
  });

  it('returns the same state object when nothing changes', () => {
    expect(scenarioReducer(init, scenarioActions.setScope('both'))).toBe(init);
    expect(scenarioReducer(init, scenarioActions.reset())).toBe(init);
  });
});

describe('ScenarioProvider', () => {
  it('exposes defaults through useScenario', () => {
    const Probe = () => {
      const { scenario } = useScenario();
      return createElement('span', null, JSON.stringify(scenario));
    };
    const html = renderToString(createElement(ScenarioProvider, null, createElement(Probe)));
    expect(html).toContain('magnitudePercent');
    expect(html).toContain('25');
  });

  it('throws outside the provider', () => {
    const Probe = () => {
      useScenario();
      return null;
    };
    expect(() => renderToString(createElement(Probe))).toThrow(/ScenarioProvider/);
  });
});

describe('state module purity', () => {
  it('imports no DOM, network, data or engine runtime', () => {
    for (const f of ['scenarioReducer.ts', 'ScenarioProvider.tsx']) {
      const src = readFileSync(new URL(`./${f}`, import.meta.url), 'utf8');
      for (const m of src.matchAll(/^import\s+(type\s+)?[^;]*?from\s+'([^']+)'/gms)) {
        const [, typeOnly, spec] = m;
        if (spec.startsWith('../data') || spec === 'react-dom' || spec.startsWith('react-dom/')) {
          throw new Error(`${f} imports ${spec}`);
        }
        if (spec.startsWith('../engine') && !typeOnly) throw new Error(`${f} runtime-imports ${spec}`);
      }
      expect(src).not.toMatch(/\b(fetch|document|window|localStorage|Math\.random|Date\.now)\b/);
    }
  });
});
