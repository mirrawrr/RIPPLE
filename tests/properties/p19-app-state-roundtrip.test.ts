/**
 * Property 19: App state URL round-trip (Task 4.20).
 */
import fc from 'fast-check';
import { describe, it } from 'vitest';
import { APP_MODES, SCENARIO_DEFAULTS } from '../../src/config/constants';
import {
  decodeAppStateFromSearchParams,
  encodeAppStateToSearchParams,
  type AppState,
} from '../../src/domain/urlCodec';
import { arbValidScenarioInput } from '../generators';

const arbAppState: fc.Arbitrary<AppState> = fc.record({
  scenario: arbValidScenarioInput,
  mode: fc.constantFrom(...APP_MODES),
});

const defaults: AppState = { scenario: { ...SCENARIO_DEFAULTS }, mode: 'historical' };

describe('Property 19: App state URL round-trip', () => {
  // Feature: ripple-hormuz-intelligence-terminal, Property 19
  // **Validates: Requirements 22.13**
  it('decode(encode(s)) equals s with zero corrections, and mode=demo is present iff mode is demo', () => {
    fc.assert(
      fc.property(arbAppState, (s) => {
        const params = encodeAppStateToSearchParams(s);
        const r = decodeAppStateFromSearchParams(params, defaults);
        const deepEqual = JSON.stringify(r.state) === JSON.stringify(s);
        const hasDemo = params.getAll('mode').length === 1 && params.get('mode') === 'demo';
        const noMode = !params.has('mode');
        return (
          deepEqual &&
          r.corrections.length === 0 &&
          (s.mode === 'demo' ? hasDemo : noMode)
        );
      }),
      { numRuns: 100 },
    );
  });
});
