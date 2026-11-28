/**
 * Property 12: Scenario input validation accept/reject (Task 4.2).
 *
 * Valid strings (optionally padded, zero-prefixed) are accepted and normalised; invalid-case strings
 * are rejected with the exact message "<label> must be a whole number from <min> to <max>.".
 */
import fc from 'fast-check';
import { describe, it } from 'vitest';
import { CONTROL_LABELS, DURATION_RANGE, MAGNITUDE_RANGE } from '../../src/config/constants';
import { validateIntegerInRange, validateScenarioInput } from '../../src/domain/validation';
import { arbInvalidNumericString, arbValidNumericString } from '../generators';

const CONTROLS = [
  { name: 'magnitude', field: 'magnitudePercent', range: MAGNITUDE_RANGE, label: CONTROL_LABELS.magnitudePercent },
  { name: 'duration', field: 'durationDays', range: DURATION_RANGE, label: CONTROL_LABELS.durationDays },
] as const;

for (const c of CONTROLS) {
  const { min, max } = c.range;
  const message = `${c.label} must be a whole number from ${min} to ${max}.`;

  describe(`Property 12: ${c.name} input validation`, () => {
    // Feature: ripple-hormuz-intelligence-terminal, Property 12
    // **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
    it('accepts valid strings and returns the normalised integer', () => {
      fc.assert(
        fc.property(arbValidNumericString(min, max), ({ raw, expected }) => {
          const r = validateIntegerInRange(raw, min, max, c.label);
          return r.ok === true && r.value === expected && r.errorMessage === undefined;
        }),
        {
          examples: [
            [{ raw: String(min), expected: min }],
            [{ raw: String(max), expected: max }],
            [{ raw: ` 00${min} `, expected: min }],
          ],
        },
      );
    });

    // Feature: ripple-hormuz-intelligence-terminal, Property 12
    // **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
    it('rejects invalid strings with the exact error message', () => {
      fc.assert(
        fc.property(arbInvalidNumericString(min, max), ({ raw }) => {
          const r = validateIntegerInRange(raw, min, max, c.label);
          return r.ok === false && r.value === undefined && r.errorMessage === message;
        }),
        {
          examples: [
            [{ raw: '', kind: 'empty' }],
            [{ raw: '5.0', kind: 'decimal' }],
            [{ raw: '+5', kind: 'non-numeric' }],
            [{ raw: '-1', kind: 'below-min' }],
            [{ raw: String(max + 1), kind: 'above-max' }],
          ],
        },
      );
    });

    // Feature: ripple-hormuz-intelligence-terminal, Property 12
    // **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
    it('gives the same outcome through validateScenarioInput string fields', () => {
      const other = { magnitudePercent: '50', durationDays: '30', commodityScope: 'both' };
      fc.assert(
        fc.property(
          fc.oneof(
            arbValidNumericString(min, max).map((v) => ({ ...v, valid: true })),
            arbInvalidNumericString(min, max).map((v) => ({ raw: v.raw, expected: 0, valid: false })),
          ),
          ({ raw, expected, valid }) => {
            const r = validateScenarioInput({ ...other, [c.field]: raw });
            if (valid) {
              return r.ok === true && r.value[c.field] === expected;
            }
            return r.ok === false && r.errors[c.field] === message;
          },
        ),
      );
    });
  });
}
