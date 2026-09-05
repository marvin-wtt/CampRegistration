import { describe, expect, it } from 'vitest';
import { ExpressionEvaluator } from '@/components/ExpressionEvaluator';

describe('ExpressionEvaluator', () => {
  it('evaluates comparison operators against curly-brace variables', () => {
    expect(new ExpressionEvaluator('{age} > 5').evaluate({ age: 10 })).toBe(
      true,
    );
    expect(new ExpressionEvaluator('{age} > 5').evaluate({ age: 3 })).toBe(
      false,
    );
    expect(new ExpressionEvaluator('{age} = 5').evaluate({ age: 5 })).toBe(
      true,
    );
    expect(new ExpressionEvaluator('{age} != 5').evaluate({ age: 5 })).toBe(
      false,
    );
  });

  it('evaluates logical operators', () => {
    const evaluator = new ExpressionEvaluator('{a} > 0 and {b} > 0');
    expect(evaluator.evaluate({ a: 1, b: 1 })).toBe(true);
    expect(evaluator.evaluate({ a: 1, b: -1 })).toBe(false);

    const orEvaluator = new ExpressionEvaluator('{a} > 0 or {b} > 0');
    expect(orEvaluator.evaluate({ a: -1, b: 1 })).toBe(true);
    expect(orEvaluator.evaluate({ a: -1, b: -1 })).toBe(false);
  });

  it('evaluates arithmetic expressions', () => {
    expect(
      new ExpressionEvaluator('{a} + {b} = 10').evaluate({ a: 4, b: 6 }),
    ).toBe(true);
    expect(
      new ExpressionEvaluator('{a} - {b} = 2').evaluate({ a: 5, b: 3 }),
    ).toBe(true);
  });

  it('resolves nested member access via dot paths', () => {
    const evaluator = new ExpressionEvaluator('{address.city} = "Berlin"');
    expect(evaluator.evaluate({ address: { city: 'Berlin' } })).toBe(true);
    expect(evaluator.evaluate({ address: { city: 'Munich' } })).toBe(false);
  });

  it('resolves array indexing via dot paths', () => {
    const evaluator = new ExpressionEvaluator('{items[0]} = "first"');
    expect(evaluator.evaluate({ items: ['first', 'second'] })).toBe(true);
  });

  it('treats missing fields as falsy rather than throwing', () => {
    const evaluator = new ExpressionEvaluator('{missing} = 5');
    expect(evaluator.evaluate({})).toBe(false);
  });

  it('compares date strings chronologically', () => {
    const evaluator = new ExpressionEvaluator('{birthday} < "2020-01-01"');
    expect(evaluator.evaluate({ birthday: '2015-05-01' })).toBe(true);
    expect(evaluator.evaluate({ birthday: '2021-05-01' })).toBe(false);
  });

  it('resolves legacy $-prefixed variables', () => {
    expect(new ExpressionEvaluator('$age > 5').evaluate({ age: 10 })).toBe(
      true,
    );
    expect(new ExpressionEvaluator('$age > 5').evaluate({ age: 3 })).toBe(
      false,
    );
  });

  it('does not mangle identifiers that merely contain an underscore', () => {
    const evaluator = new ExpressionEvaluator('{first_name} = "Alice"');
    expect(evaluator.evaluate({ first_name: 'Alice' })).toBe(true);
    expect(evaluator.evaluate({ first_name: 'Bob' })).toBe(false);
  });

  it('mixes legacy and native variable syntax in the same expression', () => {
    const evaluator = new ExpressionEvaluator('$age > 5 and {name} = "Bob"');
    expect(evaluator.evaluate({ age: 10, name: 'Bob' })).toBe(true);
  });
});
