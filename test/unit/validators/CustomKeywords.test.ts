/**
 * CustomKeywords v1.0.2 new validator tests
 *
 * Tests for the 15 custom validators added in v1.0.2
 */

import { describe, it, expect } from 'vitest';
import { dsl, validate } from '../../../src/index.js';

describe('CustomKeywords - v1.0.2 new validators', () => {

  // ==================== String Validators ====================

  describe('String validators', () => {

    describe('1. exactLength - exact length validation', () => {
      it('should pass exact length validation', () => {
        const schema = {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              exactLength: 6
            }
          }
        };

        const result = validate(schema, { code: 'ABC123' });
        expect(result.valid).toBe(true);
      });

      it('should reject insufficient length', () => {
        const schema = {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              exactLength: 6
            }
          }
        };

        const result = validate(schema, { code: 'ABC12' });
        expect(result.valid).toBe(false);
        expect(Array.isArray(result.errors)).toBe(true);
        expect(result.errors!.length).toBeGreaterThanOrEqual(1);
      });

      it('should reject length exceeded', () => {
        const schema = {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              exactLength: 6
            }
          }
        };

        const result = validate(schema, { code: 'ABC1234' });
        expect(result.valid).toBe(false);
      });

      it('should handle edge case - length 0', () => {
        const schema = {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              exactLength: 0
            }
          }
        };

        const result = validate(schema, { code: '' });
        expect(result.valid).toBe(true);
      });

      it('should handle edge case - length 100', () => {
        const schema = {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              exactLength: 100
            }
          }
        };

        const longString = 'A'.repeat(100);
        const result = validate(schema, { code: longString });
        expect(result.valid).toBe(true);
      });
    });

    describe('2. alphanum - letters and numbers', () => {
      it('should pass strings containing only letters and numbers', () => {
        const schema = {
          type: 'object',
          properties: {
            username: {
              type: 'string',
              alphanum: true
            }
          }
        };

        const result = validate(schema, { username: 'user123' });
        expect(result.valid).toBe(true);
      });

      it('should pass strings containing only letters', () => {
        const schema = {
          type: 'object',
          properties: {
            username: {
              type: 'string',
              alphanum: true
            }
          }
        };

        const result = validate(schema, { username: 'ABC' });
        expect(result.valid).toBe(true);
      });

      it('should pass strings containing only numbers', () => {
        const schema = {
          type: 'object',
          properties: {
            username: {
              type: 'string',
              alphanum: true
            }
          }
        };

        const result = validate(schema, { username: '123' });
        expect(result.valid).toBe(true);
      });

      it('should reject strings containing special characters', () => {
        const schema = {
          type: 'object',
          properties: {
            username: {
              type: 'string',
              alphanum: true
            }
          }
        };

        const result = validate(schema, { username: 'user_123' });
        expect(result.valid).toBe(false);
      });

      it('should reject strings containing spaces', () => {
        const schema = {
          type: 'object',
          properties: {
            username: {
              type: 'string',
              alphanum: true
            }
          }
        };

        const result = validate(schema, { username: 'user 123' });
        expect(result.valid).toBe(false);
      });
    });

    describe('3. trim - leading/trailing whitespace check', () => {
      it('should pass strings with no leading/trailing whitespace', () => {
        const schema = {
          type: 'object',
          properties: {
            keyword: {
              type: 'string',
              trim: true
            }
          }
        };

        const result = validate(schema, { keyword: 'search' });
        expect(result.valid).toBe(true);
      });

      it('should pass strings with internal spaces', () => {
        const schema = {
          type: 'object',
          properties: {
            keyword: {
              type: 'string',
              trim: true
            }
          }
        };

        const result = validate(schema, { keyword: 'hello world' });
        expect(result.valid).toBe(true);
      });

      it('should reject leading whitespace', () => {
        const schema = {
          type: 'object',
          properties: {
            keyword: {
              type: 'string',
              trim: true
            }
          }
        };

        const result = validate(schema, { keyword: ' search' });
        expect(result.valid).toBe(false);
      });

      it('should reject trailing whitespace', () => {
        const schema = {
          type: 'object',
          properties: {
            keyword: {
              type: 'string',
              trim: true
            }
          }
        };

        const result = validate(schema, { keyword: 'search ' });
        expect(result.valid).toBe(false);
      });

      it('should reject leading and trailing whitespace', () => {
        const schema = {
          type: 'object',
          properties: {
            keyword: {
              type: 'string',
              trim: true
            }
          }
        };

        const result = validate(schema, { keyword: ' search ' });
        expect(result.valid).toBe(false);
      });
    });

    describe('4. lowercase - lowercase check', () => {
      it('should pass all-lowercase strings', () => {
        const schema = {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              lowercase: true
            }
          }
        };

        const result = validate(schema, { email: 'user@example.com' });
        expect(result.valid).toBe(true);
      });

      it('should pass strings containing only lowercase letters and numbers', () => {
        const schema = {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              lowercase: true
            }
          }
        };

        const result = validate(schema, { email: 'test123' });
        expect(result.valid).toBe(true);
      });

      it('should reject strings containing uppercase letters', () => {
        const schema = {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              lowercase: true
            }
          }
        };

        const result = validate(schema, { email: 'User@example.com' });
        expect(result.valid).toBe(false);
      });

      it('should reject all-uppercase strings', () => {
        const schema = {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              lowercase: true
            }
          }
        };

        const result = validate(schema, { email: 'TEST' });
        expect(result.valid).toBe(false);
      });

      it('should pass empty string', () => {
        const schema = {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              lowercase: true
            }
          }
        };

        const result = validate(schema, { email: '' });
        expect(result.valid).toBe(true);
      });
    });

    describe('5. uppercase - uppercase check', () => {
      it('should pass all-uppercase strings', () => {
        const schema = {
          type: 'object',
          properties: {
            countryCode: {
              type: 'string',
              uppercase: true
            }
          }
        };

        const result = validate(schema, { countryCode: 'CN' });
        expect(result.valid).toBe(true);
      });

      it('should pass strings containing only uppercase letters and numbers', () => {
        const schema = {
          type: 'object',
          properties: {
            countryCode: {
              type: 'string',
              uppercase: true
            }
          }
        };

        const result = validate(schema, { countryCode: 'TEST123' });
        expect(result.valid).toBe(true);
      });

      it('should reject strings containing lowercase letters', () => {
        const schema = {
          type: 'object',
          properties: {
            countryCode: {
              type: 'string',
              uppercase: true
            }
          }
        };

        const result = validate(schema, { countryCode: 'Cn' });
        expect(result.valid).toBe(false);
      });

      it('should reject all-lowercase strings', () => {
        const schema = {
          type: 'object',
          properties: {
            countryCode: {
              type: 'string',
              uppercase: true
            }
          }
        };

        const result = validate(schema, { countryCode: 'test' });
        expect(result.valid).toBe(false);
      });

      it('should pass empty string', () => {
        const schema = {
          type: 'object',
          properties: {
            countryCode: {
              type: 'string',
              uppercase: true
            }
          }
        };

        const result = validate(schema, { countryCode: '' });
        expect(result.valid).toBe(true);
      });
    });

    describe('6. jsonString - JSON string validation', () => {
      it('should pass valid JSON objects', () => {
        const schema = {
          type: 'object',
          properties: {
            config: {
              type: 'string',
              jsonString: true
            }
          }
        };

        const result = validate(schema, { config: '{"key":"value"}' });
        expect(result.valid).toBe(true);
      });

      it('should pass valid JSON arrays', () => {
        const schema = {
          type: 'object',
          properties: {
            config: {
              type: 'string',
              jsonString: true
            }
          }
        };

        const result = validate(schema, { config: '[1,2,3]' });
        expect(result.valid).toBe(true);
      });

      it('should pass valid JSON primitive values', () => {
        const schema = {
          type: 'object',
          properties: {
            config: {
              type: 'string',
              jsonString: true
            }
          }
        };

        expect(validate(schema, { config: '"string"' }).valid).toBe(true);
        expect(validate(schema, { config: '123' }).valid).toBe(true);
        expect(validate(schema, { config: 'true' }).valid).toBe(true);
        expect(validate(schema, { config: 'null' }).valid).toBe(true);
      });

      it('should reject invalid JSON - unquoted key', () => {
        const schema = {
          type: 'object',
          properties: {
            config: {
              type: 'string',
              jsonString: true
            }
          }
        };

        const result = validate(schema, { config: '{key:value}' });
        expect(result.valid).toBe(false);
      });

      it('should reject invalid JSON - single quotes', () => {
        const schema = {
          type: 'object',
          properties: {
            config: {
              type: 'string',
              jsonString: true
            }
          }
        };

        const result = validate(schema, { config: "{'key':'value'}" });
        expect(result.valid).toBe(false);
      });
    });
  });

  // ==================== Number Validators ====================

  describe('Number validators', () => {

    describe('7. precision - decimal places limit', () => {
      it('should pass numbers meeting precision requirements', () => {
        const schema = {
          type: 'object',
          properties: {
            price: {
              type: 'number',
              precision: 2
            }
          }
        };

        const result = validate(schema, { price: 99.99 });
        expect(result.valid).toBe(true);
      });

      it('should pass integers (0 decimal places)', () => {
        const schema = {
          type: 'object',
          properties: {
            price: {
              type: 'number',
              precision: 2
            }
          }
        };

        const result = validate(schema, { price: 100 });
        expect(result.valid).toBe(true);
      });

      it('should pass 1 decimal place', () => {
        const schema = {
          type: 'object',
          properties: {
            price: {
              type: 'number',
              precision: 2
            }
          }
        };

        const result = validate(schema, { price: 99.9 });
        expect(result.valid).toBe(true);
      });

      it('should reject decimal places exceeded', () => {
        const schema = {
          type: 'object',
          properties: {
            price: {
              type: 'number',
              precision: 2
            }
          }
        };

        const result = validate(schema, { price: 99.999 });
        expect(result.valid).toBe(false);
      });

      it('should reject far-exceeded decimal places', () => {
        const schema = {
          type: 'object',
          properties: {
            price: {
              type: 'number',
              precision: 2
            }
          }
        };

        const result = validate(schema, { price: 99.123456 });
        expect(result.valid).toBe(false);
      });
    });

    describe('8. port - port number validation', () => {
      it('should pass valid port numbers', () => {
        const schema = {
          type: 'object',
          properties: {
            port: {
              type: 'integer',
              port: true
            }
          }
        };

        expect(validate(schema, { port: 80 }).valid).toBe(true);
        expect(validate(schema, { port: 443 }).valid).toBe(true);
        expect(validate(schema, { port: 3000 }).valid).toBe(true);
      });

      it('should pass boundary value - minimum port 1', () => {
        const schema = {
          type: 'object',
          properties: {
            port: {
              type: 'integer',
              port: true
            }
          }
        };

        const result = validate(schema, { port: 1 });
        expect(result.valid).toBe(true);
      });

      it('should pass boundary value - maximum port 65535', () => {
        const schema = {
          type: 'object',
          properties: {
            port: {
              type: 'integer',
              port: true
            }
          }
        };

        const result = validate(schema, { port: 65535 });
        expect(result.valid).toBe(true);
      });

      it('should reject port 0', () => {
        const schema = {
          type: 'object',
          properties: {
            port: {
              type: 'integer',
              port: true
            }
          }
        };

        const result = validate(schema, { port: 0 });
        expect(result.valid).toBe(false);
      });

      it('should reject port exceeding 65535', () => {
        const schema = {
          type: 'object',
          properties: {
            port: {
              type: 'integer',
              port: true
            }
          }
        };

        const result = validate(schema, { port: 65536 });
        expect(result.valid).toBe(false);
      });

      it('should reject negative port', () => {
        const schema = {
          type: 'object',
          properties: {
            port: {
              type: 'integer',
              port: true
            }
          }
        };

        const result = validate(schema, { port: -1 });
        expect(result.valid).toBe(false);
      });

      it('should reject non-integer port', () => {
        const schema = {
          type: 'object',
          properties: {
            port: {
              type: 'number',
              port: true
            }
          }
        };

        const result = validate(schema, { port: 80.5 });
        expect(result.valid).toBe(false);
      });
    });
  });

  // ==================== Object Validators ====================

  describe('Object validators', () => {

    describe('9. requiredAll - require all properties', () => {
      it('should pass when all properties exist', () => {
        const schema = {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' },
            email: { type: 'string' }
          },
          requiredAll: true
        };

        const result = validate(schema, {
          name: 'John',
          age: 30,
          email: 'john@example.com'
        });
        expect(result.valid).toBe(true);
      });

      it('should reject when one property is missing', () => {
        const schema = {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' },
            email: { type: 'string' }
          },
          requiredAll: true
        };

        const result = validate(schema, {
          name: 'John',
          age: 30
        });
        expect(result.valid).toBe(false);
      });

      it('should reject when multiple properties are missing', () => {
        const schema = {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' },
            email: { type: 'string' }
          },
          requiredAll: true
        };

        const result = validate(schema, {
          name: 'John'
        });
        expect(result.valid).toBe(false);
      });

      it('should reject empty object', () => {
        const schema = {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' }
          },
          requiredAll: true
        };

        const result = validate(schema, {});
        expect(result.valid).toBe(false);
      });

      it('should pass with extra properties', () => {
        const schema = {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' }
          },
          requiredAll: true
        };

        const result = validate(schema, {
          name: 'John',
          age: 30,
          extra: 'value'
        });
        expect(result.valid).toBe(true);
      });
    });

    describe('10. strictSchema - strict mode', () => {
      it('should pass with only defined properties', () => {
        const schema = {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' }
          },
          strictSchema: true
        };

        const result = validate(schema, {
          name: 'John',
          age: 30
        });
        expect(result.valid).toBe(true);
      });

      it('should reject with one extra property', () => {
        const schema = {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' }
          },
          strictSchema: true
        };

        const result = validate(schema, {
          name: 'John',
          age: 30,
          email: 'john@example.com'
        });
        expect(result.valid).toBe(false);
      });

      it('should reject with multiple extra properties', () => {
        const schema = {
          type: 'object',
          properties: {
            name: { type: 'string' }
          },
          strictSchema: true
        };

        const result = validate(schema, {
          name: 'John',
          age: 30,
          email: 'john@example.com'
        });
        expect(result.valid).toBe(false);
      });

      it('should pass with optional property missing', () => {
        const schema = {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' }
          },
          strictSchema: true
        };

        const result = validate(schema, {
          name: 'John'
        });
        expect(result.valid).toBe(true);
      });

      it('should pass with empty object', () => {
        const schema = {
          type: 'object',
          properties: {
            name: { type: 'string' }
          },
          strictSchema: true
        };

        const result = validate(schema, {});
        expect(result.valid).toBe(true);
      });
    });
  });

  // ==================== Array Validators ====================

  describe('Array validators', () => {

    describe('11. noSparse - disallow sparse arrays', () => {
      it('should pass dense arrays', () => {
        const schema = {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              noSparse: true
            }
          }
        };

        const result = validate(schema, { items: [1, 2, 3] });
        expect(result.valid).toBe(true);
      });

      it('should pass empty arrays', () => {
        const schema = {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              noSparse: true
            }
          }
        };

        const result = validate(schema, { items: [] });
        expect(result.valid).toBe(true);
      });

      it('should reject sparse arrays', () => {
        const schema = {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              noSparse: true
            }
          }
        };

        const sparseArray = [1, , 3];// eslint-disable-line no-sparse-arrays
        const result = validate(schema, { items: sparseArray });
        expect(result.valid).toBe(false);
      });

      it('should reject sparse arrays created with new Array', () => {
        const schema = {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              noSparse: true
            }
          }
        };

        const sparseArray = new Array(5);
        const result = validate(schema, { items: sparseArray });
        expect(result.valid).toBe(false);
      });

      it('should reject sparse arrays after delete', () => {
        const schema = {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              noSparse: true
            }
          }
        };

        const arr = [1, 2, 3];
        delete (arr as any)[1];
        const result = validate(schema, { items: arr });
        expect(result.valid).toBe(false);
      });
    });

    describe('12. includesRequired - must include elements', () => {
      it('should pass containing all required elements', () => {
        const schema = {
          type: 'object',
          properties: {
            tags: {
              type: 'array',
              includesRequired: ['featured', 'published']
            }
          }
        };

        const result = validate(schema, {
          tags: ['featured', 'published', 'tech']
        });
        expect(result.valid).toBe(true);
      });

      it('should pass containing required elements (order-independent)', () => {
        const schema = {
          type: 'object',
          properties: {
            tags: {
              type: 'array',
              includesRequired: ['featured', 'published']
            }
          }
        };

        const result = validate(schema, {
          tags: ['published', 'featured']
        });
        expect(result.valid).toBe(true);
      });

      it('should reject missing one required element', () => {
        const schema = {
          type: 'object',
          properties: {
            tags: {
              type: 'array',
              includesRequired: ['featured', 'published']
            }
          }
        };

        const result = validate(schema, {
          tags: ['featured']
        });
        expect(result.valid).toBe(false);
      });

      it('should reject missing all required elements', () => {
        const schema = {
          type: 'object',
          properties: {
            tags: {
              type: 'array',
              includesRequired: ['featured', 'published']
            }
          }
        };

        const result = validate(schema, {
          tags: ['tech', 'news']
        });
        expect(result.valid).toBe(false);
      });

      it('should reject empty array', () => {
        const schema = {
          type: 'object',
          properties: {
            tags: {
              type: 'array',
              includesRequired: ['featured', 'published']
            }
          }
        };

        const result = validate(schema, { tags: [] });
        expect(result.valid).toBe(false);
      });
    });
  });

  // ==================== Date Validators ====================

  describe('Date validators', () => {

    describe('13. dateFormat - date format validation', () => {
      it('should pass YYYY-MM-DD format', () => {
        const schema = {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              dateFormat: 'YYYY-MM-DD'
            }
          }
        };

        const result = validate(schema, { date: '2025-12-31' });
        expect(result.valid).toBe(true);
      });

      it('should pass YYYY/MM/DD format', () => {
        const schema = {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              dateFormat: 'YYYY/MM/DD'
            }
          }
        };

        const result = validate(schema, { date: '2025/12/31' });
        expect(result.valid).toBe(true);
      });

      it('should pass DD-MM-YYYY format', () => {
        const schema = {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              dateFormat: 'DD-MM-YYYY'
            }
          }
        };

        const result = validate(schema, { date: '31-12-2025' });
        expect(result.valid).toBe(true);
      });

      it('should pass DD/MM/YYYY format', () => {
        const schema = {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              dateFormat: 'DD/MM/YYYY'
            }
          }
        };

        const result = validate(schema, { date: '31/12/2025' });
        expect(result.valid).toBe(true);
      });

      it('should pass ISO8601 format', () => {
        const schema = {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              dateFormat: 'ISO8601'
            }
          }
        };

        expect(validate(schema, { date: '2025-12-31T15:30:00.000Z' }).valid).toBe(true);
        expect(validate(schema, { date: '2025-12-31T15:30:00Z' }).valid).toBe(true);
      });

      it('should reject format mismatch', () => {
        const schema = {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              dateFormat: 'YYYY-MM-DD'
            }
          }
        };

        const result = validate(schema, { date: '2025/12/31' });
        expect(result.valid).toBe(false);
      });
    });

    describe('14. dateGreater - date greater than', () => {
      it('should pass date after the specified date', () => {
        const schema = {
          type: 'object',
          properties: {
            endDate: {
              type: 'string',
              dateGreater: '2025-01-01'
            }
          }
        };

        const result = validate(schema, { endDate: '2025-12-31' });
        expect(result.valid).toBe(true);
      });

      it('should reject date equal to specified date', () => {
        const schema = {
          type: 'object',
          properties: {
            endDate: {
              type: 'string',
              dateGreater: '2025-01-01'
            }
          }
        };

        const result = validate(schema, { endDate: '2025-01-01' });
        expect(result.valid).toBe(false);
      });

      it('should reject date before the specified date', () => {
        const schema = {
          type: 'object',
          properties: {
            endDate: {
              type: 'string',
              dateGreater: '2025-01-01'
            }
          }
        };

        const result = validate(schema, { endDate: '2024-12-31' });
        expect(result.valid).toBe(false);
      });

      it('should reject invalid date', () => {
        const schema = {
          type: 'object',
          properties: {
            endDate: {
              type: 'string',
              dateGreater: '2025-01-01'
            }
          }
        };

        const result = validate(schema, { endDate: 'invalid-date' });
        expect(result.valid).toBe(false);
      });

      it('should handle timestamp comparison', () => {
        const schema = {
          type: 'object',
          properties: {
            endDate: {
              type: 'string',
              dateGreater: '2025-01-01T00:00:00Z'
            }
          }
        };

        const result = validate(schema, { endDate: '2025-01-01T00:00:01Z' });
        expect(result.valid).toBe(true);
      });
    });

    describe('15. dateLess - date less than', () => {
      it('should pass date before the specified date', () => {
        const schema = {
          type: 'object',
          properties: {
            startDate: {
              type: 'string',
              dateLess: '2025-12-31'
            }
          }
        };

        const result = validate(schema, { startDate: '2025-01-01' });
        expect(result.valid).toBe(true);
      });

      it('should reject date equal to specified date', () => {
        const schema = {
          type: 'object',
          properties: {
            startDate: {
              type: 'string',
              dateLess: '2025-12-31'
            }
          }
        };

        const result = validate(schema, { startDate: '2025-12-31' });
        expect(result.valid).toBe(false);
      });

      it('should reject date after the specified date', () => {
        const schema = {
          type: 'object',
          properties: {
            startDate: {
              type: 'string',
              dateLess: '2025-12-31'
            }
          }
        };

        const result = validate(schema, { startDate: '2026-01-01' });
        expect(result.valid).toBe(false);
      });

      it('should reject invalid date', () => {
        const schema = {
          type: 'object',
          properties: {
            startDate: {
              type: 'string',
              dateLess: '2025-12-31'
            }
          }
        };

        const result = validate(schema, { startDate: 'invalid-date' });
        expect(result.valid).toBe(false);
      });

      it('should handle timestamp comparison', () => {
        const schema = {
          type: 'object',
          properties: {
            startDate: {
              type: 'string',
              dateLess: '2025-12-31T23:59:59Z'
            }
          }
        };

        const result = validate(schema, { startDate: '2025-12-31T23:59:58Z' });
        expect(result.valid).toBe(true);
      });
    });
  });
});
