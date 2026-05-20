/**
 * Object/Array/Date/Pattern validator tests (new in v1.0.2)
 *
 * Combined test file covering:
 * - Object: requireAll, strict
 * - Array: noSparse, includesRequired
 * - Date: dateFormat, after, before
 * - Pattern: domain, ip, base64, jwt, json
 */

import { describe, it, expect } from 'vitest';
import { dsl, validate, DslBuilder } from '../../../src/index.js';

describe('Combined Validators Test - v1.0.2', () => {

  describe('Object.requireAll() - require all properties', () => {
    it('should require object to contain all defined properties', () => {
      const builder = new DslBuilder('object');
      builder._baseSchema.properties = { name: { type: 'string' }, age: { type: 'number' } };
      builder.requireAll();

      const schema = { type: 'object', properties: builder._baseSchema.properties, requiredAll: true };
      const result = validate(schema, { name: 'John' });

      expect(result.valid).toBe(false);
    });
  });

  describe('Object.strict() - strict mode', () => {
    it('should reject additional properties', () => {
      const builder = new DslBuilder('object');
      builder._baseSchema.properties = { name: { type: 'string' } };
      builder.strict();

      const schema = { type: 'object', properties: builder._baseSchema.properties, strictSchema: true };
      const result = validate(schema, { name: 'John', extra: 'value' });

      expect(result.valid).toBe(false);
    });
  });

  describe('Array.noSparse() - disallow sparse arrays', () => {
    it('should reject sparse arrays', () => {
      const arr = new Array(5);
      arr[0] = 1;
      arr[4] = 5;
      // arr[1], arr[2], arr[3] are undefined (sparse)

      const schema = dsl({ items: dsl('array').noSparse() });
      const result = validate(schema, { items: arr });

      expect(result.valid).toBe(false);
    });

    it('should accept non-sparse arrays', () => {
      const schema = dsl({ items: dsl('array').noSparse() });

      expect(validate(schema, { items: [1, 2, 3] }).valid).toBe(true);
      expect(validate(schema, { items: [] }).valid).toBe(true);
    });
  });

  describe('Array.includesRequired() - must include elements', () => {
    it('should validate array contains all required elements', () => {
      const schema = dsl({ roles: dsl('array<string>').includesRequired(['admin', 'user']) });

      expect(validate(schema, { roles: ['admin', 'user', 'guest'] }).valid).toBe(true);
      expect(validate(schema, { roles: ['admin'] }).valid).toBe(false);
      expect(validate(schema, { roles: ['guest'] }).valid).toBe(false);
    });
  });

  describe('Date.dateFormat() - date format', () => {
    it('should validate YYYY-MM-DD format', () => {
      const schema = dsl({ date: dsl('string!').dateFormat('YYYY-MM-DD') });

      expect(validate(schema, { date: '2024-12-31' }).valid).toBe(true);
      expect(validate(schema, { date: '2024/12/31' }).valid).toBe(false);
      expect(validate(schema, { date: '31-12-2024' }).valid).toBe(false);
    });

    it('should validate ISO8601 format', () => {
      const schema = dsl({ datetime: dsl('string!').dateFormat('ISO8601') });

      expect(validate(schema, { datetime: '2024-12-31T10:30:00Z' }).valid).toBe(true);
      expect(validate(schema, { datetime: '2024-12-31T10:30:00.123Z' }).valid).toBe(true);
    });
  });

  describe('Date.after() - after a specified date', () => {
    it('should validate date is after the specified date', () => {
      const schema = dsl({ startDate: dsl('date!').after('2024-01-01') });

      expect(validate(schema, { startDate: '2024-01-02' }).valid).toBe(true);
      expect(validate(schema, { startDate: '2024-12-31' }).valid).toBe(true);
      expect(validate(schema, { startDate: '2024-01-01' }).valid).toBe(false);
      expect(validate(schema, { startDate: '2023-12-31' }).valid).toBe(false);
    });
  });

  describe('Date.before() - before a specified date', () => {
    it('should validate date is before the specified date', () => {
      const schema = dsl({ endDate: dsl('date!').before('2025-12-31') });

      expect(validate(schema, { endDate: '2025-12-30' }).valid).toBe(true);
      expect(validate(schema, { endDate: '2025-01-01' }).valid).toBe(true);
      expect(validate(schema, { endDate: '2025-12-31' }).valid).toBe(false);
      expect(validate(schema, { endDate: '2026-01-01' }).valid).toBe(false);
    });
  });

  describe('Pattern.domain() - domain validation', () => {
    it('should validate valid domain names', () => {
      const schema = dsl({ website: dsl('string!').domain() });

      expect(validate(schema, { website: 'example.com' }).valid).toBe(true);
      expect(validate(schema, { website: 'sub.example.com' }).valid).toBe(true);
      expect(validate(schema, { website: 'a.b.c.example.com' }).valid).toBe(true);
    });

    it('should reject invalid domain names', () => {
      const schema = dsl({ website: dsl('string!').domain() });

      expect(validate(schema, { website: 'invalid domain' }).valid).toBe(false);
      expect(validate(schema, { website: '-example.com' }).valid).toBe(false);
    });
  });

  describe('Pattern.ip() - IP address validation', () => {
    it('should validate IPv4 addresses', () => {
      const schema = dsl({ server: dsl('string!').ip() });

      expect(validate(schema, { server: '192.168.1.1' }).valid).toBe(true);
      expect(validate(schema, { server: '10.0.0.1' }).valid).toBe(true);
      expect(validate(schema, { server: '255.255.255.255' }).valid).toBe(true);
    });

    it('should validate IPv6 addresses', () => {
      const schema = dsl({ server: dsl('string!').ip() });

      expect(validate(schema, { server: '2001:0db8:85a3::8a2e:0370:7334' }).valid).toBe(true);
      expect(validate(schema, { server: '::1' }).valid).toBe(true);
    });

    it('should reject invalid IP addresses', () => {
      const schema = dsl({ server: dsl('string!').ip() });

      expect(validate(schema, { server: '256.1.1.1' }).valid).toBe(false);
      expect(validate(schema, { server: 'not-an-ip' }).valid).toBe(false);
    });
  });

  describe('Pattern.base64() - Base64 validation', () => {
    it('should validate valid Base64 strings', () => {
      const schema = dsl({ data: dsl('string!').base64() });

      expect(validate(schema, { data: 'SGVsbG8gV29ybGQ=' }).valid).toBe(true);
      expect(validate(schema, { data: 'YWJjMTIz' }).valid).toBe(true);
    });

    it('should reject invalid Base64 strings', () => {
      const schema = dsl({ data: dsl('string!').base64() });

      expect(validate(schema, { data: 'Invalid Base64!' }).valid).toBe(false);
    });
  });

  describe('Pattern.jwt() - JWT token validation', () => {
    it('should validate valid JWT format', () => {
      const schema = dsl({ token: dsl('string!').jwt() });

      const validJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

      expect(validate(schema, { token: validJWT }).valid).toBe(true);
    });

    it('should reject invalid JWT format', () => {
      const schema = dsl({ token: dsl('string!').jwt() });

      expect(validate(schema, { token: 'invalid-jwt' }).valid).toBe(false); // only 1 dot
      expect(validate(schema, { token: 'only.one' }).valid).toBe(false); // only 1 dot
      expect(validate(schema, { token: 'no-dots-at-all' }).valid).toBe(false); // no dots
      expect(validate(schema, { token: 'too.many.dots.here' }).valid).toBe(false); // more than 2 dots
    });
  });

  describe('Pattern.json() - JSON string validation', () => {
    it('should validate valid JSON strings', () => {
      const schema = dsl({ config: dsl('string!').json() });

      expect(validate(schema, { config: '{"name":"John"}' }).valid).toBe(true);
      expect(validate(schema, { config: '["a","b","c"]' }).valid).toBe(true);
      expect(validate(schema, { config: '123' }).valid).toBe(true);
      expect(validate(schema, { config: 'true' }).valid).toBe(true);
    });

    it('should reject invalid JSON strings', () => {
      const schema = dsl({ config: dsl('string!').json() });

      expect(validate(schema, { config: '{invalid}' }).valid).toBe(false);
      expect(validate(schema, { config: 'not json' }).valid).toBe(false);
    });
  });
});
