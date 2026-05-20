/**
 * Performance Tests
 * Ensure validation performance is within acceptable range
 */

import { describe, it, expect } from 'vitest';
import { dsl, validate } from '../../src/index.js';

describe('Performance Tests', () => {

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
    const start = Date.now();

    for (let i = 0; i < iterations; i++) {
      validate(schema, validData);
    }

    const elapsed = Date.now() - start;
    const avgTime = elapsed / iterations;

    console.log(`      ${iterations} validations elapsed: ${elapsed}ms`);
    console.log(`      average per validation: ${avgTime.toFixed(3)}ms`);

    // assert: 1000 validations should complete within 5 seconds (avg 5ms each)
    expect(elapsed).toBeLessThan(5000);

    // assert: average per validation should be under 10ms
    expect(avgTime).toBeLessThan(10);
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
    const start = Date.now();

    for (let i = 0; i < iterations; i++) {
      validate(schema, validData);
    }

    const elapsed = Date.now() - start;
    const avgTime = elapsed / iterations;

    console.log(`      ${iterations} complex validations elapsed: ${elapsed}ms`);
    console.log(`      average per validation: ${avgTime.toFixed(3)}ms`);

    // assert: 500 complex validations should complete within 5 seconds (avg 10ms each)
    expect(elapsed).toBeLessThan(5000);

    // assert: average per validation should be under 15ms
    expect(avgTime).toBeLessThan(15);
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
    const start = Date.now();

    for (let i = 0; i < iterations; i++) {
      validate(schema, validData);
    }

    const elapsed = Date.now() - start;

    console.log(`      ${iterations} exact length validations elapsed: ${elapsed}ms`);

    // assert: should be consistent with regular validation performance
    expect(elapsed).toBeLessThan(5000);
  });
});
