import { describe, expect, it } from 'vitest';
import { CONTROL_LABELS } from '../config/constants';
import {
  validateCommodityScope,
  validateIntegerInRange,
  validateScenarioInput,
} from './validation';

const mag = (s: string) => validateIntegerInRange(s, 0, 100, 'Magnitude');
const dur = (s: string) => validateIntegerInRange(s, 1, 365, 'Duration');

describe('validateIntegerInRange', () => {
  it.each([
    ['0', 0], ['100', 100], ['007', 7], ['  42  ', 42], ['\t5\n', 5],
    ['0000000000000000000005', 5], ['0000000000000000000000', 0],
  ])('accepts %j', (raw, value) => {
    expect(mag(raw)).toEqual({ ok: true, value });
  });

  it('applies duration boundaries', () => {
    expect(dur('1').value).toBe(1);
    expect(dur('365').value).toBe(365);
    expect(dur('0').ok).toBe(false);
    expect(dur('366').ok).toBe(false);
  });

  it.each([
    '', '   ', '+5', '-1', '-0', '101', '5.0', '5.', '.5', '5,0', '1e2', '0x10',
    '1_000', '5 0', 'abc', 'NaN', 'Infinity', '５', '99999999999999999999',
  ])('rejects %j', (raw) => {
    const r = mag(raw);
    expect(r.ok).toBe(false);
    expect(r.value).toBeUndefined();
  });

  it('uses the exact error text', () => {
    expect(mag('x').errorMessage).toBe('Magnitude must be a whole number from 0 to 100.');
    expect(dur('366').errorMessage).toBe('Duration must be a whole number from 1 to 365.');
  });
});

describe('validateCommodityScope', () => {
  it.each(['oil', 'lng', 'both'])('accepts %s', (s) => {
    expect(validateCommodityScope(s)).toEqual({ ok: true, value: s });
  });
  it.each(['OIL', ' oil', 'both ', 'gas', ''])('rejects %j', (s) => {
    const r = validateCommodityScope(s);
    expect(r.ok).toBe(false);
    expect(r.errorMessage).toBe('Commodity scope must be one of oil, lng or both.');
  });
});

describe('validateScenarioInput', () => {
  const good = { magnitudePercent: '25', durationDays: 7, commodityScope: 'both' };

  it('accepts a valid object', () => {
    expect(validateScenarioInput(good)).toEqual({
      ok: true,
      value: { magnitudePercent: 25, durationDays: 7, commodityScope: 'both' },
    });
  });

  it('rejects unexpected keys with a field-specific error', () => {
    const r = validateScenarioInput({ ...good, extra: 1 });
    expect(r).toEqual({ ok: false, errors: { _unexpected: 'Unexpected field: extra.' } });
  });

  it.each([null, undefined, 5, 'x', []])('rejects non-object %j', (v) => {
    expect(validateScenarioInput(v).ok).toBe(false);
  });

  it.each([NaN, Infinity, 1.5, -1])('rejects number %s', (n) => {
    const r = validateScenarioInput({ ...good, magnitudePercent: n });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.magnitudePercent).toContain(CONTROL_LABELS.magnitudePercent);
  });

  it('reports multiple errors and never substitutes defaults', () => {
    const r = validateScenarioInput({});
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(
      ['commodityScope', 'durationDays', 'magnitudePercent'],
    );
  });
});
