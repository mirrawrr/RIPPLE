/** App_Mode codec unit tests (Task 4.20; Requirement 22.13). */
import { describe, expect, it } from 'vitest';
import { SCENARIO_DEFAULTS } from '../src/config/constants';
import {
  decodeAppStateFromSearchParams,
  encodeAppStateToSearchParams,
  validateAppMode,
  type AppState,
} from '../src/domain/urlCodec';

const defaults: AppState = { scenario: { ...SCENARIO_DEFAULTS }, mode: 'historical' };
const scenario = { magnitudePercent: 37, durationDays: 90, commodityScope: 'lng' as const };
const decode = (q: string) => decodeAppStateFromSearchParams(new URLSearchParams(q), defaults);
const CORRECTION = 'mode reset to historical';

describe('App_Mode encoding', () => {
  it('writes mode=demo in demo mode, after m, d, c', () => {
    expect(encodeAppStateToSearchParams({ scenario, mode: 'demo' }).toString()).toBe('m=37&d=90&c=lng&mode=demo');
  });

  it('omits the mode parameter in Historical mode', () => {
    const p = encodeAppStateToSearchParams({ scenario, mode: 'historical' });
    expect(p.has('mode')).toBe(false);
    expect(p.toString()).toBe('m=37&d=90&c=lng');
  });
});

describe('App_Mode decoding', () => {
  it('decodes an absent mode as historical without correction', () => {
    expect(decode('m=5')).toEqual({
      state: { scenario: { ...defaults.scenario, magnitudePercent: 5 }, mode: 'historical' },
      corrections: [],
    });
  });

  it('decodes mode=historical without correction', () => {
    expect(decode('mode=historical')).toEqual({ state: defaults, corrections: [] });
  });

  it('decodes mode=demo without correction', () => {
    expect(decode('mode=demo')).toEqual({ state: { ...defaults, mode: 'demo' }, corrections: [] });
  });

  it.each([
    ['Demo', 'mode=Demo'],
    ['empty', 'mode='],
    ['unknown', 'mode=bogus'],
    ['leading space', 'mode=%20demo'],
    ['trailing space', 'mode=demo%20'],
  ])('replaces %s value with historical', (_n, q) => {
    expect(decode(q).state.mode).toBe('historical');
  });

  it('keeps every valid scenario parameter unchanged when mode is invalid', () => {
    const r = decode('m=37&d=90&c=lng&mode=Demo');
    expect(r.state).toEqual({ scenario, mode: 'historical' });
  });

  it('returns exactly one correction naming mode and its default historical', () => {
    const r = decode('mode=nope');
    expect(r.corrections).toEqual([CORRECTION]);
    expect(r.corrections[0]).toContain('mode');
    expect(r.corrections[0]).toContain('historical');
  });

  it('combines scenario corrections with the single mode correction', () => {
    const r = decode('m=x&mode=nope');
    expect(r.corrections).toHaveLength(2);
    expect(r.corrections[r.corrections.length - 1]).toBe(CORRECTION);
  });

  it('uses the first value of a repeated mode parameter', () => {
    expect(decode('mode=demo&mode=x').state.mode).toBe('demo');
    expect(decode('mode=x&mode=demo').state.mode).toBe('historical');
  });
});

describe('validateAppMode', () => {
  it('accepts exactly historical and demo', () => {
    expect(validateAppMode('historical')).toEqual({ ok: true, value: 'historical' });
    expect(validateAppMode('demo')).toEqual({ ok: true, value: 'demo' });
    for (const bad of ['Demo', 'HISTORICAL', '', ' demo', 'x']) expect(validateAppMode(bad).ok).toBe(false);
  });
});
