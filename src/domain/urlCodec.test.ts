import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { COMMODITY_SCOPES, CONTROL_LABELS, SCENARIO_DEFAULTS } from '../config/constants';
import type { ActiveScenario } from '../engine/types';
import { decodeScenarioFromSearchParams, encodeScenarioToSearchParams } from './urlCodec';

const defaults: ActiveScenario = { ...SCENARIO_DEFAULTS };
const decode = (q: string) => decodeScenarioFromSearchParams(new URLSearchParams(q), defaults);

describe('decodeScenarioFromSearchParams', () => {
  it('uses defaults silently when parameters are absent', () => {
    expect(decode('')).toEqual({ scenario: defaults, corrections: [] });
  });

  it('decodes valid values, including padded and leading-zero values', () => {
    expect(decode('m=10&d=30&c=oil').scenario).toEqual({ magnitudePercent: 10, durationDays: 30, commodityScope: 'oil' });
    expect(decode('m=007&d=%2042%20&c=lng')).toEqual({
      scenario: { magnitudePercent: 7, durationDays: 42, commodityScope: 'lng' },
      corrections: [],
    });
  });

  it('keeps a lone valid parameter and defaults the others silently', () => {
    expect(decode('d=9')).toEqual({ scenario: { ...defaults, durationDays: 9 }, corrections: [] });
  });

  const badM = ['m=', 'm=abc', 'm=5.0', 'm=101', 'm=-1', 'm=1%202', 'm=%2B5'];
  it.each(badM)('rejects %s with one correction naming m and its default', (q) => {
    const r = decode(`${q}&d=30&c=oil`);
    expect(r.scenario).toEqual({ magnitudePercent: 25, durationDays: 30, commodityScope: 'oil' });
    expect(r.corrections).toEqual([`m (${CONTROL_LABELS.magnitudePercent}) reset to 25`]);
  });

  it.each(['d=', 'd=x', 'd=1.5', 'd=0', 'd=366', 'd=1%202'])('rejects %s', (q) => {
    const r = decode(`m=10&${q}&c=oil`);
    expect(r.scenario).toEqual({ magnitudePercent: 10, durationDays: 7, commodityScope: 'oil' });
    expect(r.corrections).toEqual([`d (${CONTROL_LABELS.durationDays}) reset to 7`]);
  });

  it.each(['c=', 'c=Oil', 'c=BOTH', 'c=%20oil', 'c=gas'])('rejects %s', (q) => {
    const r = decode(`m=10&d=30&${q}`);
    expect(r.scenario).toEqual({ magnitudePercent: 10, durationDays: 30, commodityScope: 'both' });
    expect(r.corrections).toEqual([`c (${CONTROL_LABELS.commodityScope}) reset to both`]);
  });

  it('reports one correction per invalid parameter', () => {
    const r = decode('m=x&d=0&c=zz');
    expect(r.scenario).toEqual(defaults);
    expect(r.corrections).toHaveLength(3);
  });

  it('uses the first value of a duplicated parameter', () => {
    expect(decode('m=10&m=20').scenario.magnitudePercent).toBe(10);
    expect(decode('m=bad&m=20').corrections).toHaveLength(1);
  });

  it('ignores unknown parameters', () => {
    expect(decode('x=1&mode=demo&m=5')).toEqual({ scenario: { ...defaults, magnitudePercent: 5 }, corrections: [] });
  });

  it('accepts "m=+5" because URLSearchParams turns "+" into a space (documented limitation)', () => {
    expect(decode('m=+5')).toEqual({ scenario: { ...defaults, magnitudePercent: 5 }, corrections: [] });
  });
});

describe('encodeScenarioToSearchParams', () => {
  it('writes m, d, c in canonical order', () => {
    expect(encodeScenarioToSearchParams({ magnitudePercent: 0, durationDays: 365, commodityScope: 'lng' }).toString()).toBe(
      'm=0&d=365&c=lng',
    );
  });

  it.each([0, 100])('round-trips boundary magnitude %i for every scope', (m) => {
    for (const c of COMMODITY_SCOPES) {
      for (const d of [1, 365]) {
        const s: ActiveScenario = { magnitudePercent: m, durationDays: d, commodityScope: c };
        expect(decodeScenarioFromSearchParams(encodeScenarioToSearchParams(s), defaults)).toEqual({
          scenario: s,
          corrections: [],
        });
      }
    }
  });

  it('normalisation is idempotent', () => {
    const first = decode('c=oil&m=007&d=%2012%20&junk=1&m=9');
    const enc1 = encodeScenarioToSearchParams(first.scenario).toString();
    const second = decode(enc1);
    expect(second.corrections).toEqual([]);
    expect(second.scenario).toEqual(first.scenario);
    expect(encodeScenarioToSearchParams(second.scenario).toString()).toBe(enc1);
    expect(enc1).toBe('m=7&d=12&c=oil');
  });
});

describe('urlCodec module purity', () => {
  it('imports nothing from react, src/data or engine runtime', () => {
    const src = readFileSync(new URL('./urlCodec.ts', import.meta.url), 'utf8');
    const imports = [...src.matchAll(/^import\s+(type\s+)?[^;]*?from\s+'([^']+)'/gms)];
    for (const [, typeOnly, spec] of imports) {
      expect(spec).not.toMatch(/react|\/data\//);
      if (/engine/.test(spec)) expect(typeOnly).toBeTruthy();
    }
    expect(src).not.toMatch(/\b(window|document|location)\./);
  });
});
