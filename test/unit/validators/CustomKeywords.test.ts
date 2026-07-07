/**
 * CustomKeywords v1.0.2 new validator tests
 *
 * Tests for the 15 custom validators added in v1.0.2
 */

import Ajv from 'ajv';
import { describe, it, expect } from 'vitest';
import { dsl, Locale, validate, validateAsync, Validator } from '../../../src/index.js';
import { CustomKeywords } from '../../../src/validators/CustomKeywords.js';

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

  describe('Additional branch coverage for custom keyword edge cases', () => {
    it('reports sync custom validator failures for all supported return shapes', () => {
      const validator = new Validator()

      expect(validator.validate({ type: 'string', _customValidators: [() => false] } as any, 'value').valid).toBe(false)
      expect(validator.validate({ type: 'string', _customValidators: [() => 'custom message'] } as any, 'value').errorMessage).toContain('custom message')
      expect(validator.validate({ type: 'string', _customValidators: [() => ({ error: true, message: 'object message' })] } as any, 'value').errorMessage).toContain('object message')
      expect(validator.validate({ type: 'string', _customValidators: [() => ({ error: true })] } as any, 'value').valid).toBe(false)
      expect(validator.validate({ type: 'string', _customValidators: [() => { throw new Error('validator exploded') }] } as any, 'value').errorMessage).toContain('validator exploded')
      expect(validator.validate({ type: 'string', _customValidators: [() => Promise.resolve(true)] } as any, 'value').errorMessage).toContain('Async validation not supported')
      expect(validator.validate({ type: 'string', _customValidators: ['ignored', () => true] } as any, 'value').valid).toBe(true)
      expect(validator.validate({ type: 'string', _customValidators: 'not-an-array' } as any, 'value').valid).toBe(true)
      expect(validate({ type: 'string', _customValidators: [(value: unknown) => value !== 'admin' || 'reserved'] } as any, 'alice').valid).toBe(true)
      expect(validate({ type: 'string', _customValidators: [() => Promise.resolve(true)] } as any, 'value').errorMessage).toContain('Async validation not supported')
    })

    it('uses global locale for root simple custom validator failures', async () => {
      Locale.setLocale('zh-CN')

      try {
        const syncResult = validate({ type: 'string', _customValidators: [() => false] } as any, 'value')
        expect(syncResult.valid).toBe(false)
        expect(syncResult.errorMessage).toBe('自定义验证失败')

        let asyncError: any
        try {
          await validateAsync({ type: 'string', _customValidators: [async () => false] } as any, 'value')
        } catch (error) {
          asyncError = error
        }

        expect(asyncError?.errors?.[0]?.message).toBe('自定义验证失败')
      } finally {
        Locale.setLocale('en-US')
      }
    })

    it('does not invoke declared async custom validators in sync validate()', async () => {
      const validator = new Validator()
      let syncCalls = 0
      let conditionalCalls = 0
      const schema = {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            _customValidators: [
              async () => {
                syncCalls += 1
                return true
              },
            ],
          },
        },
      } as any

      const syncResult = validator.validate(schema, { name: 'Ada' })
      expect(syncResult.valid).toBe(false)
      expect(syncResult.errorMessage).toContain('Async validation not supported')
      expect(syncCalls).toBe(0)

      await expect(validator.validateAsync(schema, { name: 'Ada' })).resolves.toEqual({ name: 'Ada' })
      expect(syncCalls).toBe(1)

      const conditional = dsl
        .if(() => true)
        .then({
          type: 'string',
          _customValidators: [
            async () => {
              conditionalCalls += 1
              return true
            },
          ],
        })
        .toSchema()

      const conditionalSync = validator.validate(conditional, 'ok')
      expect(conditionalSync.valid).toBe(false)
      expect(conditionalSync.errorMessage).toContain('Async validation not supported')
      expect(conditionalCalls).toBe(0)

      await expect(validator.validateAsync(conditional, 'ok')).resolves.toBe('ok')
      expect(conditionalCalls).toBe(1)
    })

    it('guards declared async custom validators across sync schema traversal paths', () => {
      const validator = new Validator()

      const cases: Array<{ name: string; schema: any; data: unknown }> = [
        {
          name: 'toSchema',
          schema: {
            toSchema: () => ({
              type: 'string',
              _customValidators: [async () => true],
            }),
          },
          data: 'ok',
        },
        {
          name: 'nested properties',
          schema: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    _customValidators: [async () => true],
                  },
                },
              },
            },
          },
          data: { user: { name: 'Ada' } },
        },
        {
          name: 'composition',
          schema: {
            allOf: [{
              type: 'string',
              _customValidators: [async () => true],
            }],
          },
          data: 'ok',
        },
        {
          name: 'tuple items',
          schema: {
            type: 'array',
            items: [{
              type: 'string',
              _customValidators: [async () => true],
            }],
          },
          data: ['ok'],
        },
        {
          name: 'prefixItems',
          schema: {
            type: 'array',
            prefixItems: [{
              type: 'string',
              _customValidators: [async () => true],
            }],
          },
          data: ['ok'],
        },
        {
          name: 'dependentSchemas',
          schema: {
            type: 'object',
            dependentSchemas: {
              name: {
                properties: {
                  nickname: {
                    type: 'string',
                    _customValidators: [async () => true],
                  },
                },
              },
            },
          },
          data: { name: 'Ada', nickname: 'A' },
        },
        {
          name: 'additionalProperties',
          schema: {
            type: 'object',
            additionalProperties: {
              type: 'string',
              _customValidators: [async () => true],
            },
          },
          data: { name: 'Ada' },
        },
        {
          name: 'propertyNames',
          schema: {
            type: 'object',
            propertyNames: {
              type: 'string',
              _customValidators: [async () => true],
            },
          },
          data: { name: 'Ada' },
        },
        {
          name: 'contains',
          schema: {
            type: 'array',
            contains: {
              type: 'string',
              _customValidators: [async () => true],
            },
          },
          data: ['ok'],
        },
        {
          name: 'local ref',
          schema: {
            type: 'object',
            properties: {
              value: { $ref: '#/$defs/Value' },
            },
            $defs: {
              Value: {
                type: 'string',
                _customValidators: [async () => true],
              },
            },
          },
          data: { value: 'ok' },
        },
      ]

      for (const testCase of cases) {
        let calls = 0
        const schemaText = JSON.stringify(testCase.schema)
        const schema = JSON.parse(schemaText, (_key, value) => value)
        const attachCalls = (node: unknown): void => {
          if (Array.isArray(node)) {
            node.forEach(attachCalls)
            return
          }
          if (!node || typeof node !== 'object') return
          const record = node as Record<string, unknown>
          if (Array.isArray(record['_customValidators'])) {
            record['_customValidators'] = [
              async () => {
                calls += 1
                return true
              },
            ]
          }
          Object.values(record).forEach(attachCalls)
        }

        if (testCase.name === 'toSchema') {
          schema.toSchema = () => ({
            type: 'string',
            _customValidators: [
              async () => {
                calls += 1
                return true
              },
            ],
          })
        } else {
          attachCalls(schema)
        }

        const result = validator.validate(schema, testCase.data)
        expect(result.valid, testCase.name).toBe(false)
        expect(result.errorMessage, testCase.name).toContain('Async validation not supported')
        expect(calls, testCase.name).toBe(0)
      }
    })

    it('does not reject unreferenced async custom validators in $defs during sync validate()', () => {
      const validator = new Validator()
      let calls = 0
      const schema = {
        type: 'object',
        $defs: {
          Unused: {
            type: 'string',
            _customValidators: [
              async () => {
                calls += 1
                return true
              },
            ],
          },
        },
      } as any

      const result = validator.validate(schema, {})
      expect(result.valid).toBe(true)
      expect(calls).toBe(0)
    })

    it('runs referenced async custom validators behind local refs in validateAsync()', async () => {
      const validator = new Validator()
      let referencedCalls = 0
      let unusedCalls = 0
      const schema = {
        type: 'object',
        properties: {
          value: { $ref: '#/$defs/Value' },
        },
        $defs: {
          Value: {
            type: 'string',
            _customValidators: [
              async () => {
                referencedCalls += 1
                return true
              },
            ],
          },
          Unused: {
            type: 'string',
            _customValidators: [
              async () => {
                unusedCalls += 1
                return true
              },
            ],
          },
        },
      } as any

      const syncResult = validator.validate(schema, { value: 'ok' })
      expect(syncResult.valid).toBe(false)
      expect(syncResult.errorMessage).toContain('Async validation not supported')
      expect(referencedCalls).toBe(0)
      expect(unusedCalls).toBe(0)

      await expect(validator.validateAsync(schema, { value: 'ok' })).resolves.toEqual({ value: 'ok' })
      expect(referencedCalls).toBe(1)
      expect(unusedCalls).toBe(0)
    })

    it('guards declared async custom validators in conditional else branches', async () => {
      const validator = new Validator()
      let calls = 0
      const conditional = dsl
        .if(() => false)
        .then('string')
        .else({
          type: 'string',
          _customValidators: [
            async () => {
              calls += 1
              return true
            },
          ],
        })
        .toSchema()

      const syncResult = validator.validate(conditional, 'ok')
      expect(syncResult.valid).toBe(false)
      expect(syncResult.errorMessage).toContain('Async validation not supported')
      expect(calls).toBe(0)

      await expect(validator.validateAsync(conditional, 'ok')).resolves.toBe('ok')
      expect(calls).toBe(1)
    })

    it('guards declared async custom validators when AJV keyword is invoked directly', () => {
      const ajv = new Ajv()
      let calls = 0
      CustomKeywords.registerCustomValidatorsKeyword(ajv)

      const compiled = ajv.compile({
        type: 'string',
        _customValidators: [
          async () => {
            calls += 1
            return true
          },
        ],
      } as any)

      expect(compiled('ok')).toBe(false)
      expect(calls).toBe(0)
      expect(compiled.errors?.[0]?.message).toContain('Async validation not supported')
    })

    it('reports regex keyword errors for unsafe and invalid patterns', () => {
      const validator = new Validator()

      expect(validator.validate({ type: 'string', regex: '(a+)+$' } as any, 'aaaaaaaaaaaaaaaa!').valid).toBe(false)
      expect(validator.validate({ type: 'string', regex: '[' } as any, 'value').valid).toBe(false)
    })

    it('reports function validator keyword failures', () => {
      const validator = new Validator()

      expect(validator.validate({ type: 'string', validate: false } as any, 'value').valid).toBe(false)
      expect(validator.validate({ type: 'string', validate: () => false } as any, 'value').valid).toBe(false)
      expect(validator.validate({ type: 'string', validate: () => ({ valid: false, message: 'not accepted' }) } as any, 'value').errorMessage).toContain('not accepted')
      expect(validator.validate({ type: 'string', validate: () => ({ valid: true }) } as any, 'value').valid).toBe(true)
      expect(validator.validate({ type: 'string', validate: () => ({ ignored: true }) } as any, 'value').valid).toBe(true)
      expect(validator.validate({ type: 'string', validate: () => { throw new Error('validate exploded') } } as any, 'value').errorMessage).toContain('validate exploded')
    })

    it('runs legacy validate keyword through explicit sync and async paths', async () => {
      const validator = new Validator()
      let declaredAsyncCalls = 0
      const declaredAsyncSchema = {
        type: 'string',
        validate: async (value: unknown) => {
          declaredAsyncCalls += 1
          return value === 'ok'
        },
      } as any

      const syncResult = validator.validate(declaredAsyncSchema, 'bad')
      expect(syncResult.valid).toBe(false)
      expect(syncResult.errorMessage).toContain('Async validation not supported')
      expect(declaredAsyncCalls).toBe(0)

      try {
        await validator.validateAsync(declaredAsyncSchema, 'bad')
        throw new Error('validateAsync should reject invalid legacy validate keyword result')
      } catch (error: any) {
        expect(error.errors?.[0]).toMatchObject({
          keyword: 'validate',
          path: '',
          message: 'Validation failed',
        })
      }
      expect(declaredAsyncCalls).toBe(1)

      await expect(validator.validateAsync(declaredAsyncSchema, 'ok')).resolves.toBe('ok')
      expect(declaredAsyncCalls).toBe(2)

      let promiseReturningCalls = 0
      const promiseReturningSchema = {
        type: 'string',
        validate: (value: unknown) => {
          promiseReturningCalls += 1
          return Promise.resolve({ valid: value === 'ok', message: 'legacy async failed' })
        },
      } as any

      const rootSync = validate(promiseReturningSchema, 'bad')
      expect(rootSync.valid).toBe(false)
      expect(rootSync.errorMessage).toContain('Async validation not supported')
      expect(promiseReturningCalls).toBe(1)

      await expect(validateAsync(promiseReturningSchema, 'bad')).rejects.toMatchObject({
        errors: [expect.objectContaining({ keyword: 'validate', message: 'legacy async failed' })],
      })
      expect(promiseReturningCalls).toBe(2)
    })

    it('runs legacy validate keyword in nested validateAsync traversal', async () => {
      const schema = {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            validate: async (value: unknown) => ({ valid: value === 'ok', message: 'bad code' }),
          },
        },
      } as any

      await expect(validateAsync(schema, { code: 'bad' })).rejects.toMatchObject({
        errors: [expect.objectContaining({ keyword: 'validate', path: 'code', message: 'bad code' })],
      })
      await expect(validateAsync(schema, { code: 'ok' })).resolves.toEqual({ code: 'ok' })
    })

    it('guards declared async legacy validate keyword when AJV keyword is invoked directly', () => {
      const ajv = new Ajv()
      let calls = 0
      CustomKeywords.registerFunctionKeyword(ajv)

      const compiled = ajv.compile({
        type: 'string',
        validate: async () => {
          calls += 1
          return false
        },
      } as any)

      expect(compiled('ok')).toBe(false)
      expect(calls).toBe(0)
      expect(compiled.errors?.[0]).toMatchObject({
        keyword: 'validate',
      })
      expect(compiled.errors?.[0]?.message).toContain('Async validation not supported')
    })

    it('guards legacy validate keyword inside conditional runtime branches', async () => {
      let calls = 0
      const conditional = dsl
        .if(() => true)
        .then({
          type: 'string',
          validate: async (value: unknown) => {
            calls += 1
            return value === 'ok'
          },
        } as any)
        .else('string')
        .toSchema()

      const syncResult = validate(conditional, 'bad')
      expect(syncResult.valid).toBe(false)
      expect(syncResult.errorMessage).toContain('Async validation not supported')
      expect(calls).toBe(0)

      await expect(validateAsync(conditional, 'bad')).rejects.toMatchObject({
        errors: [expect.objectContaining({ keyword: 'validate', path: '', message: 'Validation failed' })],
      })
      expect(calls).toBe(1)

      await expect(validateAsync(conditional, 'ok')).resolves.toBe('ok')
      expect(calls).toBe(2)
    })

    it('guards legacy validate keyword under AJV skipped __proto__ property traversal', async () => {
      const properties = Object.create(null) as Record<string, unknown>
      let calls = 0
      Object.defineProperty(properties, '__proto__', {
        value: {
          type: 'string',
          validate: async (value: unknown) => {
            calls += 1
            return value === 'ok'
          },
        },
        enumerable: true,
        configurable: true,
      })
      const schema = { type: 'object', properties, required: ['__proto__'] } as any

      const syncResult = validate(schema, JSON.parse('{"__proto__":"bad"}'))
      expect(syncResult.valid).toBe(false)
      expect(syncResult.errorMessage).toContain('Async validation not supported')
      expect(calls).toBe(0)

      await expect(validateAsync(schema, JSON.parse('{"__proto__":"bad"}'))).rejects.toMatchObject({
        errors: [expect.objectContaining({ keyword: 'validate', path: '__proto__', message: 'Validation failed' })],
      })
      expect(calls).toBe(1)

      await expect(validateAsync(schema, JSON.parse('{"__proto__":"ok"}'))).resolves.toEqual(JSON.parse('{"__proto__":"ok"}'))
      expect(calls).toBe(2)
    })

    it('deep-compares required array objects and detects missing object values', () => {
      const schema = {
        type: 'array',
        includesRequired: [{ id: 1, tags: ['a', 'b'] }],
      } as any

      expect(validate(schema, [{ tags: ['a', 'b'], id: 1 }]).valid).toBe(true)
      expect(validate(schema, [{ id: 1, tags: ['a'] }]).valid).toBe(false)
    })

    it('handles disabled custom object and array keyword schemas as no-ops', () => {
      expect(validate({
        type: 'object',
        properties: { name: { type: 'string' } },
        requiredAll: false,
        strictSchema: false,
      } as any, {}).valid).toBe(true)

      expect(validate({ type: 'array', noSparse: false, includesRequired: [] } as any, new Array(2)).valid).toBe(true)
    })

    it('rejects invalid ISO and impossible calendar dates', () => {
      expect(validate({ type: 'string', dateFormat: 'ISO8601' } as any, 'not-a-date').valid).toBe(false)
      expect(validate({ type: 'string', dateFormat: 'YYYY-MM-DD' } as any, '2024-02-31').valid).toBe(false)
      expect(validate({ type: 'string', dateFormat: 'DD/MM/YYYY' } as any, '31/02/2024').valid).toBe(false)
    })
  })
});
