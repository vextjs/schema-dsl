/**
 * Number Comparison Operators Tests (v1.1.2)
 *
 * Tests for number and integer type comparison operators: >, >=, <, <=, =
 */

import { describe, it, expect } from 'vitest';
import { dsl, validate } from '../../src/index.js';

describe('Number Comparison Operators (v1.1.2)', () => {

  describe('Greater Than Operator (>)', () => {
    it('should correctly validate number:>0', () => {
      const schema = dsl({ value: 'number:>0' });

      // boundary test
      expect(validate(schema, { value: 1 }).valid).toBe(true);
      expect(validate(schema, { value: 0.1 }).valid).toBe(true);
      expect(validate(schema, { value: 0 }).valid).toBe(false);
      expect(validate(schema, { value: -1 }).valid).toBe(false);
    });

    it('should support decimal number:>0.5', () => {
      const schema = dsl({ value: 'number:>0.5' });

      expect(validate(schema, { value: 0.6 }).valid).toBe(true);
      expect(validate(schema, { value: 1 }).valid).toBe(true);
      expect(validate(schema, { value: 0.5 }).valid).toBe(false);
      expect(validate(schema, { value: 0.4 }).valid).toBe(false);
    });

    it('should support negative boundary number:>-10', () => {
      const schema = dsl({ value: 'number:>-10' });

      expect(validate(schema, { value: -9 }).valid).toBe(true);
      expect(validate(schema, { value: 0 }).valid).toBe(true);
      expect(validate(schema, { value: -10 }).valid).toBe(false);
      expect(validate(schema, { value: -11 }).valid).toBe(false);
    });

    it('should support required marker number:>0!', () => {
      const schema = dsl({ value: 'number:>0!' });

      expect(validate(schema, { value: 1 }).valid).toBe(true);
      expect(validate(schema, {}).valid).toBe(false); // required
      expect(validate(schema, { value: 0 }).valid).toBe(false); // does not satisfy >0
    });

    it('should support integer type', () => {
      const schema = dsl({ count: 'integer:>0' });

      expect(validate(schema, { count: 1 }).valid).toBe(true);
      expect(validate(schema, { count: 0 }).valid).toBe(false);
    });
  });

  describe('Greater Than or Equal Operator (>=)', () => {
    it('should correctly validate number:>=18', () => {
      const schema = dsl({ age: 'number:>=18' });

      expect(validate(schema, { age: 18 }).valid).toBe(true);
      expect(validate(schema, { age: 19 }).valid).toBe(true);
      expect(validate(schema, { age: 17 }).valid).toBe(false);
      expect(validate(schema, { age: 17.9 }).valid).toBe(false);
    });

    it('should support decimal number:>=18.5', () => {
      const schema = dsl({ value: 'number:>=18.5' });

      expect(validate(schema, { value: 18.5 }).valid).toBe(true);
      expect(validate(schema, { value: 18.6 }).valid).toBe(true);
      expect(validate(schema, { value: 18.4 }).valid).toBe(false);
    });

    it('should support zero boundary number:>=0', () => {
      const schema = dsl({ value: 'number:>=0' });

      expect(validate(schema, { value: 0 }).valid).toBe(true);
      expect(validate(schema, { value: 0.1 }).valid).toBe(true);
      expect(validate(schema, { value: -0.1 }).valid).toBe(false);
    });
  });

  describe('Less Than Operator (<)', () => {
    it('should correctly validate number:<100', () => {
      const schema = dsl({ value: 'number:<100' });

      expect(validate(schema, { value: 99 }).valid).toBe(true);
      expect(validate(schema, { value: 99.9 }).valid).toBe(true);
      expect(validate(schema, { value: 100 }).valid).toBe(false);
      expect(validate(schema, { value: 101 }).valid).toBe(false);
    });

    it('should support decimal number:<99.99', () => {
      const schema = dsl({ price: 'number:<99.99' });

      expect(validate(schema, { price: 99.98 }).valid).toBe(true);
      expect(validate(schema, { price: 99.99 }).valid).toBe(false);
      expect(validate(schema, { price: 100 }).valid).toBe(false);
    });

    it('should support negative boundary number:<0', () => {
      const schema = dsl({ value: 'number:<0' });

      expect(validate(schema, { value: -1 }).valid).toBe(true);
      expect(validate(schema, { value: -0.1 }).valid).toBe(true);
      expect(validate(schema, { value: 0 }).valid).toBe(false);
      expect(validate(schema, { value: 1 }).valid).toBe(false);
    });
  });

  describe('Less Than or Equal Operator (<=)', () => {
    it('should correctly validate number:<=100', () => {
      const schema = dsl({ score: 'number:<=100' });

      expect(validate(schema, { score: 100 }).valid).toBe(true);
      expect(validate(schema, { score: 99 }).valid).toBe(true);
      expect(validate(schema, { score: 101 }).valid).toBe(false);
    });

    it('should support decimal number:<=100.5', () => {
      const schema = dsl({ value: 'number:<=100.5' });

      expect(validate(schema, { value: 100.5 }).valid).toBe(true);
      expect(validate(schema, { value: 100.4 }).valid).toBe(true);
      expect(validate(schema, { value: 100.6 }).valid).toBe(false);
    });
  });

  describe('Equal Operator (=)', () => {
    it('should correctly validate number:=100', () => {
      const schema = dsl({ score: 'number:=100' });

      expect(validate(schema, { score: 100 }).valid).toBe(true);
      expect(validate(schema, { score: 99 }).valid).toBe(false);
      expect(validate(schema, { score: 101 }).valid).toBe(false);
    });

    it('should support exact decimal match number:=99.99', () => {
      const schema = dsl({ price: 'number:=99.99' });

      expect(validate(schema, { price: 99.99 }).valid).toBe(true);
      expect(validate(schema, { price: 99.98 }).valid).toBe(false);
      expect(validate(schema, { price: 100 }).valid).toBe(false);
    });

    it('should support zero value number:=0', () => {
      const schema = dsl({ value: 'number:=0' });

      expect(validate(schema, { value: 0 }).valid).toBe(true);
      expect(validate(schema, { value: 0.1 }).valid).toBe(false);
      expect(validate(schema, { value: -0.1 }).valid).toBe(false);
    });
  });

  describe('Backward Compatibility', () => {
    it('should keep existing range syntax unchanged number:18-120', () => {
      const schema = dsl({ age: 'number:18-120' });

      expect(validate(schema, { age: 18 }).valid).toBe(true);
      expect(validate(schema, { age: 50 }).valid).toBe(true);
      expect(validate(schema, { age: 120 }).valid).toBe(true);
      expect(validate(schema, { age: 17 }).valid).toBe(false);
      expect(validate(schema, { age: 121 }).valid).toBe(false);
    });

    it('should keep one-sided range syntax unchanged number:18-', () => {
      const schema = dsl({ age: 'number:18-' });

      expect(validate(schema, { age: 18 }).valid).toBe(true);
      expect(validate(schema, { age: 100 }).valid).toBe(true);
      expect(validate(schema, { age: 17 }).valid).toBe(false);
    });

    it('should keep one-sided range syntax unchanged number:-100', () => {
      const schema = dsl({ score: 'number:-100' });

      expect(validate(schema, { score: 0 }).valid).toBe(true);
      expect(validate(schema, { score: 100 }).valid).toBe(true);
      expect(validate(schema, { score: 101 }).valid).toBe(false);
    });

    it('should keep single value syntax unchanged number:100', () => {
      const schema = dsl({ count: 'number:100' });

      expect(validate(schema, { count: 50 }).valid).toBe(true);
      expect(validate(schema, { count: 100 }).valid).toBe(true);
      expect(validate(schema, { count: 101 }).valid).toBe(false);
    });
  });

  describe('Real-world Scenarios', () => {
    it('scenario 1: age validation (must be at least 18)', () => {
      const schema = dsl({ age: 'number:>=18!' });

      expect(validate(schema, { age: 18 }).valid).toBe(true);
      expect(validate(schema, { age: 20 }).valid).toBe(true);
      expect(validate(schema, { age: 17 }).valid).toBe(false);
      expect(validate(schema, {}).valid).toBe(false);
    });

    it('scenario 2: price validation (greater than 0)', () => {
      const schema = dsl({ price: 'number:>0!' });

      expect(validate(schema, { price: 0.01 }).valid).toBe(true);
      expect(validate(schema, { price: 99.99 }).valid).toBe(true);
      expect(validate(schema, { price: 0 }).valid).toBe(false);
      expect(validate(schema, { price: -1 }).valid).toBe(false);
    });

    it('scenario 3: level validation (must equal specific value)', () => {
      const schema = dsl({ level: 'number:=5!' });

      expect(validate(schema, { level: 5 }).valid).toBe(true);
      expect(validate(schema, { level: 4 }).valid).toBe(false);
      expect(validate(schema, { level: 6 }).valid).toBe(false);
    });

    it('scenario 4: temperature upper limit (less than 100)', () => {
      const schema = dsl({ temperature: 'number:<100' });

      expect(validate(schema, { temperature: 50 }).valid).toBe(true);
      expect(validate(schema, { temperature: 99.9 }).valid).toBe(true);
      expect(validate(schema, { temperature: 100 }).valid).toBe(false);
    });

    it('scenario 5: minimum score (greater than or equal to 0)', () => {
      const schema = dsl({ score: 'number:>=0' });

      expect(validate(schema, { score: 0 }).valid).toBe(true);
      expect(validate(schema, { score: 50 }).valid).toBe(true);
      expect(validate(schema, { score: -1 }).valid).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should correctly handle floating point precision', () => {
      const schema = dsl({ value: 'number:>0.1' });

      expect(validate(schema, { value: 0.2 }).valid).toBe(true);
      expect(validate(schema, { value: 0.1 }).valid).toBe(false);
    });

    it('should correctly handle negative range', () => {
      const schema = dsl({ value: 'number:>-100' });

      expect(validate(schema, { value: -99 }).valid).toBe(true);
      expect(validate(schema, { value: 0 }).valid).toBe(true);
      expect(validate(schema, { value: -100 }).valid).toBe(false);
    });

    it('should correctly handle large values', () => {
      const schema = dsl({ value: 'number:>1000000' });

      expect(validate(schema, { value: 1000001 }).valid).toBe(true);
      expect(validate(schema, { value: 1000000 }).valid).toBe(false);
    });
  });
});
