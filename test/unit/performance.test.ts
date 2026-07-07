/**
 * Performance Tests
 * Fast smoke checks that catch order-of-magnitude regressions.
 *
 * Formal rankings live in test/benchmarks/*.js. These tests intentionally keep
 * broad thresholds so CI noise does not fail normal development, while still
 * blocking a return to second-scale validation loops.
 */

import { describe, it, expect } from 'vitest';
import { dsl, validate } from '../../src/index.js';

describe('Performance Tests', () => {
  function measure(iterations: number, fn: () => void): { elapsedMs: number; opsPerSecond: number } {
    const startedAt = performance.now();
    for (let i = 0; i < iterations; i++) fn();
    const elapsedMs = performance.now() - startedAt;
    return {
      elapsedMs,
      opsPerSecond: iterations / (elapsedMs / 1000)
    };
  }

  it('should quickly validate large amounts of data', () => {
    const schema = dsl({
      name: 'string!',
      age: 'number!',
      email: 'email'
    });

    const validData = {
      name: 'John Doe',
      age: 25,
      email: 'john@example.com'
    };

    const iterations = 1000;
    const { elapsedMs, opsPerSecond } = measure(iterations, () => {
      validate(schema, validData);
    });
    const avgTime = elapsedMs / iterations;

    console.log(`      ${iterations} validations elapsed: ${elapsedMs.toFixed(1)}ms`);
    console.log(`      average per validation: ${avgTime.toFixed(3)}ms`);
    console.log(`      throughput: ${opsPerSecond.toFixed(0)} ops/s`);

    expect(elapsedMs).toBeLessThan(1000);
    expect(opsPerSecond).toBeGreaterThan(5_000);
    expect(avgTime).toBeLessThan(1);
  });

  it('should quickly validate complex Schema', () => {
    const schema = dsl({
      username: 'string:3-32!',
      email: 'email!',
      age: 'number:18-120!',
      address: {
        type: 'object',
        properties: {
          street: { type: 'string' },
          city: { type: 'string' },
          zipCode: { type: 'string', pattern: '^\\d{6}$' }
        }
      },
      tags: 'array:1-10<string>'
    });

    const validData = {
      username: 'john_doe',
      email: 'john@example.com',
      age: 25,
      address: {
        street: '123 Main St',
        city: 'Beijing',
        zipCode: '100000'
      },
      tags: ['javascript', 'nodejs']
    };

    const iterations = 500;
    const { elapsedMs, opsPerSecond } = measure(iterations, () => {
      validate(schema, validData);
    });
    const avgTime = elapsedMs / iterations;

    console.log(`      ${iterations} complex validations elapsed: ${elapsedMs.toFixed(1)}ms`);
    console.log(`      average per validation: ${avgTime.toFixed(3)}ms`);
    console.log(`      throughput: ${opsPerSecond.toFixed(0)} ops/s`);

    expect(elapsedMs).toBeLessThan(1000);
    expect(opsPerSecond).toBeGreaterThan(5_000);
    expect(avgTime).toBeLessThan(2);
  });

  it('should quickly validate exact length (v1.0.3 new feature)', () => {
    const schema = dsl({
      code: 'string:6!',
      country: 'string:2!'
    });

    const validData = {
      code: 'ABC123',
      country: 'CN'
    };

    const iterations = 1000;
    const { elapsedMs, opsPerSecond } = measure(iterations, () => {
      validate(schema, validData);
    });

    console.log(`      ${iterations} exact length validations elapsed: ${elapsedMs.toFixed(1)}ms`);
    console.log(`      throughput: ${opsPerSecond.toFixed(0)} ops/s`);

    expect(elapsedMs).toBeLessThan(1000);
    expect(opsPerSecond).toBeGreaterThan(5_000);
  });
});
