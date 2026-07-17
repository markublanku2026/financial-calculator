import { describe, expect, it } from 'vitest';

import { creditCardShareSchema, loanShareSchema } from '../data/shareSchemas';
import type { ShareSchema } from '../types/share';
import {
  buildShareCalculationUrl,
  parseShareCalculation,
  serializeShareValues,
} from '../utils/shareCalculation';

type ExampleShareState = {
  principal: string;
  rate: string;
  years: string;
  rateType: string;
};

const exampleSchema: ShareSchema<ExampleShareState> = {
  fields: [
    { key: 'principal', param: 'principal', type: 'number', min: 0 },
    { key: 'rate', param: 'rate', type: 'number', min: 0, max: 100 },
    { key: 'years', param: 'years', type: 'number', min: 0, max: 50, integer: true },
    { key: 'rateType', param: 'type', type: 'enum', options: ['fixed', 'variable'] },
  ],
};

describe('share calculation utilities', () => {
  it('serializes approved values in deterministic schema order and removes unnecessary trailing zeroes', () => {
    const params = serializeShareValues(exampleSchema, {
      principal: '25000.00',
      rate: '6.500',
      years: '5.0',
      rateType: 'fixed',
    });

    expect(params.toString()).toBe('principal=25000&rate=6.5&years=5&type=fixed');
  });

  it('builds a share URL from the provided origin and route', () => {
    const url = buildShareCalculationUrl(
      '/calculators/loan-payment',
      loanShareSchema,
      {
        loanAmount: '15000.5',
        interestRate: '7.25',
        loanYears: '4',
      },
      'https://calculator.test',
    );

    expect(url).toBe('https://calculator.test/calculators/loan-payment?principal=15000.5&rate=7.25&years=4');
  });

  it('ignores unknown parameters and handles missing parameters safely', () => {
    const parsed = parseShareCalculation(exampleSchema, '?principal=12000&unknown=value');

    expect(parsed.loaded).toBe(true);
    expect(parsed.ignoredInvalid).toBe(false);
    expect(parsed.values).toEqual({ principal: '12000' });
  });

  it('rejects invalid numeric values including NaN, Infinity, negatives where invalid, and over-maximum values', () => {
    const parsed = parseShareCalculation(exampleSchema, '?principal=NaN&rate=Infinity&years=51');

    expect(parsed.loaded).toBe(false);
    expect(parsed.ignoredInvalid).toBe(true);
    expect(parsed.values).toEqual({});

    const negative = parseShareCalculation(exampleSchema, '?principal=-5');
    expect(negative.loaded).toBe(false);
    expect(negative.ignoredInvalid).toBe(true);
  });

  it('accepts valid zero values when the schema allows them and parses supported enums only', () => {
    const parsed = parseShareCalculation(exampleSchema, '?principal=0&rate=0&years=0&type=fixed');

    expect(parsed.values).toEqual({
      principal: '0',
      rate: '0',
      years: '0',
      rateType: 'fixed',
    });

    const invalidEnum = parseShareCalculation(exampleSchema, '?type=teaser');
    expect(invalidEnum.loaded).toBe(false);
    expect(invalidEnum.ignoredInvalid).toBe(true);
  });

  it('excludes inactive credit-card payoff fields from serialized URLs and ignores them when parsing', () => {
    const monthsMode = serializeShareValues(creditCardShareSchema, {
      balance: '8000',
      annualRate: '19.99',
      mode: 'months',
      monthlyPaymentAmount: '250',
      targetMonths: '36',
    });
    expect(monthsMode.toString()).toBe('balance=8000&apr=19.99&mode=months&months=36');

    const paymentMode = serializeShareValues(creditCardShareSchema, {
      balance: '8000',
      annualRate: '19.99',
      mode: 'payment',
      monthlyPaymentAmount: '250',
      targetMonths: '36',
    });
    expect(paymentMode.toString()).toBe('balance=8000&apr=19.99&mode=payment&payment=250');

    const parsed = parseShareCalculation(
      creditCardShareSchema,
      '?balance=8000&apr=19.99&mode=months&payment=250&months=36',
    );
    expect(parsed.values).toEqual({
      balance: '8000',
      annualRate: '19.99',
      mode: 'months',
      targetMonths: '36',
    });
  });

  it('rejects unsafe numeric values outside the supported JavaScript safe-number range', () => {
    const parsed = parseShareCalculation(exampleSchema, `?principal=${Number.MAX_SAFE_INTEGER + 1}`);

    expect(parsed.loaded).toBe(false);
    expect(parsed.ignoredInvalid).toBe(true);
  });
});
