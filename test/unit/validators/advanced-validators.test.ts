/**
 * Object/Array/Date/Pattern 验证器测试（v1.0.2新增）
 *
 * 综合测试文件，包含：
 * - Object: requireAll, strict
 * - Array: noSparse, includesRequired
 * - Date: dateFormat, after, before
 * - Pattern: domain, ip, base64, jwt, json
 */

import { describe, it, expect } from 'vitest';
import { dsl, validate, DslBuilder } from '../../../src/index.js';

describe('综合验证器测试 - v1.0.2', () => {

  describe('Object.requireAll() - 要求所有属性', () => {
    it('应该要求对象包含所有定义的属性', () => {
      const builder = new DslBuilder('object');
      builder._baseSchema.properties = { name: { type: 'string' }, age: { type: 'number' } };
      builder.requireAll();

      const schema = { type: 'object', properties: builder._baseSchema.properties, requiredAll: true };
      const result = validate(schema, { name: 'John' });

      expect(result.valid).toBe(false);
    });
  });

  describe('Object.strict() - 严格模式', () => {
    it('应该拒绝额外的属性', () => {
      const builder = new DslBuilder('object');
      builder._baseSchema.properties = { name: { type: 'string' } };
      builder.strict();

      const schema = { type: 'object', properties: builder._baseSchema.properties, strictSchema: true };
      const result = validate(schema, { name: 'John', extra: 'value' });

      expect(result.valid).toBe(false);
    });
  });

  describe('Array.noSparse() - 禁止稀疏数组', () => {
    it('应该拒绝稀疏数组', () => {
      const arr = new Array(5);
      arr[0] = 1;
      arr[4] = 5;
      // arr[1], arr[2], arr[3] 是 undefined (稀疏)

      const schema = dsl({ items: dsl('array').noSparse() });
      const result = validate(schema, { items: arr });

      expect(result.valid).toBe(false);
    });

    it('应该接受非稀疏数组', () => {
      const schema = dsl({ items: dsl('array').noSparse() });

      expect(validate(schema, { items: [1, 2, 3] }).valid).toBe(true);
      expect(validate(schema, { items: [] }).valid).toBe(true);
    });
  });

  describe('Array.includesRequired() - 必须包含元素', () => {
    it('应该验证数组包含所有必需元素', () => {
      const schema = dsl({ roles: dsl('array<string>').includesRequired(['admin', 'user']) });

      expect(validate(schema, { roles: ['admin', 'user', 'guest'] }).valid).toBe(true);
      expect(validate(schema, { roles: ['admin'] }).valid).toBe(false);
      expect(validate(schema, { roles: ['guest'] }).valid).toBe(false);
    });
  });

  describe('Date.dateFormat() - 日期格式', () => {
    it('应该验证YYYY-MM-DD格式', () => {
      const schema = dsl({ date: dsl('string!').dateFormat('YYYY-MM-DD') });

      expect(validate(schema, { date: '2024-12-31' }).valid).toBe(true);
      expect(validate(schema, { date: '2024/12/31' }).valid).toBe(false);
      expect(validate(schema, { date: '31-12-2024' }).valid).toBe(false);
    });

    it('应该验证ISO8601格式', () => {
      const schema = dsl({ datetime: dsl('string!').dateFormat('ISO8601') });

      expect(validate(schema, { datetime: '2024-12-31T10:30:00Z' }).valid).toBe(true);
      expect(validate(schema, { datetime: '2024-12-31T10:30:00.123Z' }).valid).toBe(true);
    });
  });

  describe('Date.after() - 晚于指定日期', () => {
    it('应该验证日期晚于指定日期', () => {
      const schema = dsl({ startDate: dsl('date!').after('2024-01-01') });

      expect(validate(schema, { startDate: '2024-01-02' }).valid).toBe(true);
      expect(validate(schema, { startDate: '2024-12-31' }).valid).toBe(true);
      expect(validate(schema, { startDate: '2024-01-01' }).valid).toBe(false);
      expect(validate(schema, { startDate: '2023-12-31' }).valid).toBe(false);
    });
  });

  describe('Date.before() - 早于指定日期', () => {
    it('应该验证日期早于指定日期', () => {
      const schema = dsl({ endDate: dsl('date!').before('2025-12-31') });

      expect(validate(schema, { endDate: '2025-12-30' }).valid).toBe(true);
      expect(validate(schema, { endDate: '2025-01-01' }).valid).toBe(true);
      expect(validate(schema, { endDate: '2025-12-31' }).valid).toBe(false);
      expect(validate(schema, { endDate: '2026-01-01' }).valid).toBe(false);
    });
  });

  describe('Pattern.domain() - 域名验证', () => {
    it('应该验证有效的域名', () => {
      const schema = dsl({ website: dsl('string!').domain() });

      expect(validate(schema, { website: 'example.com' }).valid).toBe(true);
      expect(validate(schema, { website: 'sub.example.com' }).valid).toBe(true);
      expect(validate(schema, { website: 'a.b.c.example.com' }).valid).toBe(true);
    });

    it('应该拒绝无效的域名', () => {
      const schema = dsl({ website: dsl('string!').domain() });

      expect(validate(schema, { website: 'invalid domain' }).valid).toBe(false);
      expect(validate(schema, { website: '-example.com' }).valid).toBe(false);
    });
  });

  describe('Pattern.ip() - IP地址验证', () => {
    it('应该验证IPv4地址', () => {
      const schema = dsl({ server: dsl('string!').ip() });

      expect(validate(schema, { server: '192.168.1.1' }).valid).toBe(true);
      expect(validate(schema, { server: '10.0.0.1' }).valid).toBe(true);
      expect(validate(schema, { server: '255.255.255.255' }).valid).toBe(true);
    });

    it('应该验证IPv6地址', () => {
      const schema = dsl({ server: dsl('string!').ip() });

      expect(validate(schema, { server: '2001:0db8:85a3::8a2e:0370:7334' }).valid).toBe(true);
      expect(validate(schema, { server: '::1' }).valid).toBe(true);
    });

    it('应该拒绝无效的IP地址', () => {
      const schema = dsl({ server: dsl('string!').ip() });

      expect(validate(schema, { server: '256.1.1.1' }).valid).toBe(false);
      expect(validate(schema, { server: 'not-an-ip' }).valid).toBe(false);
    });
  });

  describe('Pattern.base64() - Base64验证', () => {
    it('应该验证有效的Base64字符串', () => {
      const schema = dsl({ data: dsl('string!').base64() });

      expect(validate(schema, { data: 'SGVsbG8gV29ybGQ=' }).valid).toBe(true);
      expect(validate(schema, { data: 'YWJjMTIz' }).valid).toBe(true);
    });

    it('应该拒绝无效的Base64字符串', () => {
      const schema = dsl({ data: dsl('string!').base64() });

      expect(validate(schema, { data: 'Invalid Base64!' }).valid).toBe(false);
    });
  });

  describe('Pattern.jwt() - JWT令牌验证', () => {
    it('应该验证有效的JWT格式', () => {
      const schema = dsl({ token: dsl('string!').jwt() });

      const validJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

      expect(validate(schema, { token: validJWT }).valid).toBe(true);
    });

    it('应该拒绝无效的JWT格式', () => {
      const schema = dsl({ token: dsl('string!').jwt() });

      expect(validate(schema, { token: 'invalid-jwt' }).valid).toBe(false); // 只有1个点
      expect(validate(schema, { token: 'only.one' }).valid).toBe(false); // 只有1个点
      expect(validate(schema, { token: 'no-dots-at-all' }).valid).toBe(false); // 没有点
      expect(validate(schema, { token: 'too.many.dots.here' }).valid).toBe(false); // 超过2个点
    });
  });

  describe('Pattern.json() - JSON字符串验证', () => {
    it('应该验证有效的JSON字符串', () => {
      const schema = dsl({ config: dsl('string!').json() });

      expect(validate(schema, { config: '{"name":"John"}' }).valid).toBe(true);
      expect(validate(schema, { config: '["a","b","c"]' }).valid).toBe(true);
      expect(validate(schema, { config: '123' }).valid).toBe(true);
      expect(validate(schema, { config: 'true' }).valid).toBe(true);
    });

    it('应该拒绝无效的JSON字符串', () => {
      const schema = dsl({ config: dsl('string!').json() });

      expect(validate(schema, { config: '{invalid}' }).valid).toBe(false);
      expect(validate(schema, { config: 'not json' }).valid).toBe(false);
    });
  });
});
