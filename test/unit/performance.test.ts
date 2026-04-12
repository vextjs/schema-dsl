/**
 * 性能测试
 * 确保验证性能在合理范围内
 */

import { describe, it, expect } from 'vitest';
import { dsl, validate } from '../../src/index.js';

describe('性能测试', () => {

  it('应该快速验证大量数据', () => {
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

    console.log(`      ${iterations} 次验证耗时: ${elapsed}ms`);
    console.log(`      平均每次: ${avgTime.toFixed(3)}ms`);

    // 断言：1000次验证应在5秒内完成（平均5ms/次）
    expect(elapsed).toBeLessThan(5000);

    // 断言：平均每次验证应在10ms内
    expect(avgTime).toBeLessThan(10);
  });

  it('应该快速验证复杂Schema', () => {
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

    console.log(`      ${iterations} 次复杂验证耗时: ${elapsed}ms`);
    console.log(`      平均每次: ${avgTime.toFixed(3)}ms`);

    // 断言：500次复杂验证应在5秒内完成（平均10ms/次）
    expect(elapsed).toBeLessThan(5000);

    // 断言：平均每次验证应在15ms内
    expect(avgTime).toBeLessThan(15);
  });

  it('应该快速验证精确长度（v1.0.3新特性）', () => {
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

    console.log(`      ${iterations} 次精确长度验证耗时: ${elapsed}ms`);

    // 断言：应与普通验证性能一致
    expect(elapsed).toBeLessThan(5000);
  });
});
