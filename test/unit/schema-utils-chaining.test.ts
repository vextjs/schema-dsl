/**
 * SchemaUtils Chaining Unit Tests (v2.1.0 simplified)
 *
 * Tests core 4 methods: partial, omit, pick, extend chaining
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { dsl, validate } from '../../src/index.js';
import { SchemaUtils } from '../../src/utils/SchemaUtils.js';

describe('SchemaUtils Chaining (v2.1.0 - Core Methods)', () => {
  let baseSchema: any;

  beforeEach(() => {
    baseSchema = dsl({
      id: 'objectId!',
      name: 'string:1-50!',
      email: 'email!',
      password: 'string:8-32!',
      age: 'integer:0-150',
      createdAt: 'date',
      updatedAt: 'date'
    });
  });


  describe('partial() - Partial Validation', () => {
    it('should remove all required constraints', () => {
      const partialSchema = SchemaUtils.partial(baseSchema);

      const result = validate(partialSchema, {
        name: 'John'
        // other required fields missing, but should not error
      });

      expect(result.valid).toBe(true);
      expect(partialSchema.required).toBeUndefined();
    });

    it('should make only the specified fields optional while preserving the full schema', () => {
      const partialSchema = SchemaUtils.partial(baseSchema, ['name', 'age']);

      expect(Object.keys(partialSchema.properties!)).toHaveLength(Object.keys(baseSchema.properties!).length);
      expect(partialSchema.properties!).toHaveProperty('name');
      expect(partialSchema.properties!).toHaveProperty('age');
      expect(partialSchema.required).not.toContain('name');
      expect(partialSchema.required).toContain('id');
      expect(partialSchema.required).toContain('email');
      expect(partialSchema.required).toContain('password');
    });

    it('should validate the provided field values', () => {
      const partialSchema = SchemaUtils.partial(baseSchema, ['name', 'email']);

      // invalid email format should be caught
      const result = validate(partialSchema, {
        id: '507f1f77bcf86cd799439011',
        name: 'John',
        email: 'invalid',
        password: 'password123'
      });

      expect(result.valid).toBe(false);
    });
  });

  describe('reuse helpers and performance wrappers', () => {
    it('returns reusable factories and fragment libraries without altering call semantics', () => {
      const factory = SchemaUtils.reusable(() => ({ type: 'string' as const }))
      const library = SchemaUtils.createLibrary({ email: () => dsl('email!') })

      expect(factory()).toEqual({ type: 'string' })
      expect((library.email() as any).toSchema()).toMatchObject({ type: 'string', format: 'email' })
    })

    it('adds performance metadata to validator results', () => {
      const wrapped = SchemaUtils.withPerformance({
        validate: () => ({ valid: true, errors: [] }),
      })

      const result = wrapped.validate()

      expect(result).toMatchObject({ valid: true })
      expect(result.performance).toMatchObject({ duration: expect.any(Number), timestamp: expect.any(String) })
    })

    it('validates batches and reports summary metrics', () => {
      const compiled = Object.assign((data: unknown) => typeof data === 'string', {
        errors: [{ message: 'must be string' }],
      })
      const ajv = {
        compile: () => compiled,
      }

      const result = SchemaUtils.validateBatch({ type: 'string' }, ['ok', 1], ajv)

      expect(result.results).toEqual([
        { index: 0, valid: true, errors: null, data: 'ok' },
        { index: 1, valid: false, errors: compiled.errors, data: null },
      ])
      expect(result.summary).toMatchObject({ total: 2, valid: 1, invalid: 1 })
      expect(result.summary.averageTime).toBeGreaterThanOrEqual(0)
    })

    it('handles empty batch averages without dividing by zero', () => {
      const result = SchemaUtils.validateBatch({ type: 'string' }, [], {
        compile: () => () => true,
      })

      expect(result.summary).toMatchObject({ total: 0, valid: 0, invalid: 0, averageTime: 0 })
    })
  })

  describe('schema export metadata', () => {
    it('should preserve both label and description in Markdown and HTML exports', () => {
      const schema = dsl({
        email: ('email!' as any)
          .label('Email Address')
          .description('Primary login email'),
        username: ('string:3-32!' as any)
          .label('Username')
          .description('Login handle'),
      });

      const markdown = SchemaUtils.toMarkdown(schema);
      const html = SchemaUtils.toHTML(schema);

      expect(markdown).toContain('| Field | Type | Required | Constraints | Description |');
      expect(markdown).toContain('Email Address - Primary login email');
      expect(markdown).toContain('length: 3-32');
      expect(html).toContain('Email Address - Primary login email');
      expect(html).toContain('<th>Constraints</th>');
    });

    it('should HTML-escape Markdown export cells', () => {
      const schema = {
        type: 'object',
        properties: {
          bio: {
            type: 'string',
            _label: '<strong>Bio</strong>',
            description: '<img src=x onerror=alert(1)>',
            enum: ['<script>alert(1)</script>'],
            pattern: '<svg onload=alert(1)>',
          },
        },
      } as any;

      const markdown = SchemaUtils.toMarkdown(schema, { title: '<script>alert(1)</script>' });

      expect(markdown).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
      expect(markdown).toContain('&lt;strong&gt;Bio&lt;/strong&gt;');
      expect(markdown).toContain('&lt;img src=x onerror=alert(1)&gt;');
      expect(markdown).not.toContain('<img src=x onerror=alert(1)>');
      expect(markdown).not.toContain('<script>alert(1)</script>');
    });
  });

  describe('omit() - Exclude Fields', () => {
    it('should exclude the specified fields', () => {
      const omittedSchema = SchemaUtils.omit(baseSchema, ['password', 'createdAt', 'updatedAt']);

      expect(omittedSchema.properties!.password).toBeUndefined();
      expect(omittedSchema.properties!.createdAt).toBeUndefined();
      expect(omittedSchema.properties!.updatedAt).toBeUndefined();
      expect(omittedSchema.properties!.name).toBeDefined();
      expect(omittedSchema.properties!.email).toBeDefined();
    });

    it('should remove excluded fields from required', () => {
      const omittedSchema = SchemaUtils.omit(baseSchema, ['password']);

      expect(omittedSchema.required).not.toContain('password');
      expect(omittedSchema.required).toContain('name');
      expect(omittedSchema.required).toContain('email');
    });
  });

  describe('pick() - Pick Fields', () => {
    it('should keep only the specified fields', () => {
      const pickedSchema = SchemaUtils.pick(baseSchema, ['name', 'email']);

      expect(Object.keys(pickedSchema.properties!)).toHaveLength(2);
      expect(pickedSchema.properties!).toHaveProperty('name');
      expect(pickedSchema.properties!).toHaveProperty('email');
      expect(pickedSchema.properties!.password).toBeUndefined();
    });

    it('should preserve required constraints for picked fields', () => {
      const pickedSchema = SchemaUtils.pick(baseSchema, ['name', 'email']);

      expect(pickedSchema.required).toContain('name');
      expect(pickedSchema.required).toContain('email');
    });

    it('should preserve object-level constraints when picking fields', () => {
      const strictSchema = {
        type: 'object',
        title: 'Strict user',
        additionalProperties: false,
        minProperties: 1,
        patternProperties: {
          '^x_': { type: 'string' }
        },
        properties: {
          name: { type: 'string' },
          age: { type: 'number' }
        },
        required: ['name', 'age']
      } as any;

      const pickedSchema = SchemaUtils.pick(strictSchema, ['name']);

      expect(pickedSchema.title).toBe('Strict user');
      expect(pickedSchema.additionalProperties).toBe(false);
      expect(pickedSchema.minProperties).toBe(1);
      expect(pickedSchema.patternProperties).toEqual({ '^x_': { type: 'string' } });
      expect(pickedSchema.required).toEqual(['name']);
      expect(validate(pickedSchema, { name: 'Ada', extra: 1 }).valid).toBe(false);
      expect(validate(pickedSchema, { name: 'Ada', x_meta: 'ok' }).valid).toBe(true);
    });

    it('should drop dependent constraints that reference fields omitted by pick', () => {
      const strictSchema = {
        type: 'object',
        additionalProperties: false,
        properties: {
          card: { type: 'string' },
          billingAddress: { type: 'string' },
          note: { type: 'string' }
        },
        required: ['card', 'billingAddress'],
        dependentRequired: {
          card: ['billingAddress']
        },
        dependentSchemas: {
          card: { required: ['billingAddress'] }
        },
        dependencies: {
          card: ['billingAddress']
        }
      } as any;

      const pickedSchema = SchemaUtils.pick(strictSchema, ['card']);

      expect(pickedSchema.required).toEqual(['card']);
      expect(pickedSchema.dependentRequired).toBeUndefined();
      expect(pickedSchema.dependentSchemas).toBeUndefined();
      expect(pickedSchema.dependencies).toBeUndefined();
      expect(validate(pickedSchema, { card: '4242' }).valid).toBe(true);
    });
  });

  describe('extend() - Extend Fields', () => {
    it('should add new fields', () => {
      const extendedSchema = SchemaUtils.extend(baseSchema, {
        avatar: 'url',
        bio: 'string:0-500'
      });

      expect(extendedSchema.properties!.avatar).toBeDefined();
      expect(extendedSchema.properties!.bio).toBeDefined();
      expect(extendedSchema.properties!.name).toBeDefined();
    });

    it('should preserve original fields', () => {
      const extendedSchema = SchemaUtils.extend(baseSchema, {
        avatar: 'url'
      });

      expect(extendedSchema.properties!.name).toBeDefined();
      expect(extendedSchema.properties!.email).toBeDefined();
      expect(extendedSchema.properties!.password).toBeDefined();
    });

    it('should deep-merge nested object properties and required arrays', () => {
      const base = {
        type: 'object',
        properties: {
          profile: {
            type: 'object',
            properties: { name: { type: 'string' } },
            required: ['name'],
          },
        },
      } as any
      const extended = SchemaUtils.extend(base, {
        type: 'object',
        properties: {
          profile: {
            type: 'object',
            properties: { age: { type: 'number' } },
            required: ['age'],
          },
        },
      } as any)

      expect(extended.properties!.profile).toMatchObject({
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name', 'age'],
      })
    })

    it('should replace nested values when types differ or values are not plain records', () => {
      const extended = SchemaUtils.extend({
        type: 'object',
        properties: { field: { type: 'string', minLength: 3 } },
      } as any, {
        type: 'object',
        properties: { field: { type: 'number', minimum: 1 } },
      } as any)

      expect(extended.properties!.field).toEqual({ type: 'number', minimum: 1 })
    })

    it('should preserve base schema metadata while merging extension fields', () => {
      const extended = SchemaUtils.extend({
        type: 'object',
        title: 'Base user',
        additionalProperties: false,
        properties: { name: { type: 'string' } },
        required: ['name'],
      } as any, {
        properties: { role: { type: 'string' } },
        required: ['role'],
      } as any)

      expect(extended.title).toBe('Base user')
      expect(extended.additionalProperties).toBe(false)
      expect(extended.properties).toMatchObject({
        name: { type: 'string' },
        role: { type: 'string' },
      })
      expect(extended.required).toEqual(['name', 'role'])
    })
  });


  describe('Chaining', () => {
    it('should support omit + extend', () => {
      const schema = SchemaUtils
        .omit(baseSchema, ['password'])
        .extend({ avatar: 'url' });

      expect(schema.properties!.password).toBeUndefined();
      expect(schema.properties!.avatar).toBeDefined();
    });

    it('should support pick + partial', () => {
      const schema = SchemaUtils
        .pick(baseSchema, ['name', 'age'])
        .partial();

      expect(Object.keys(schema.properties!)).toHaveLength(2);
      expect(schema.required).toBeUndefined();
    });

    it('should support pick + extend', () => {
      const schema = SchemaUtils
        .pick(baseSchema, ['name', 'email'])
        .extend({ avatar: 'url', bio: 'string:0-500' });

      expect(schema.properties!.name).toBeDefined();
      expect(schema.properties!.email).toBeDefined();
      expect(schema.properties!.avatar).toBeDefined();
      expect(schema.properties!.bio).toBeDefined();
      expect(schema.properties!.password).toBeUndefined();
    });

    it('should support complex chaining', () => {
      const schema = SchemaUtils
        .omit(baseSchema, ['id', 'password', 'createdAt', 'updatedAt'])
        .extend({ avatar: 'url' })
        .pick(['name', 'email', 'avatar'])
        .partial();

      expect(Object.keys(schema.properties!)).toHaveLength(3);
      expect(schema.properties!.name).toBeDefined();
      expect(schema.properties!.email).toBeDefined();
      expect(schema.properties!.avatar).toBeDefined();
      expect(schema.required).toBeUndefined();
    });
  });

  describe('CRUD Scenarios', () => {
    it('POST - create user (exclude system fields)', () => {
      const createSchema = SchemaUtils.omit(baseSchema, ['id', 'createdAt', 'updatedAt']);

      const result = validate(createSchema, {
        name: 'John',
        email: 'john@example.com',
        password: 'password123',
        age: 30
      });

      expect(result.valid).toBe(true);
    });

    it('GET - query user (exclude sensitive fields)', () => {
      const publicSchema = SchemaUtils.omit(baseSchema, ['password']);

      const result = validate(publicSchema, {
        id: '507f1f77bcf86cd799439011',
        name: 'John',
        email: 'john@example.com',
        age: 30,
        createdAt: '2025-12-29',
        updatedAt: '2025-12-29'
      });

      expect(result.valid).toBe(true);
      expect((result.data as Record<string, unknown>)!.password).toBeUndefined();
    });

    it('PATCH - update user (partial validation)', () => {
      const updateSchema = SchemaUtils
        .pick(baseSchema, ['name', 'age'])
        .partial();

      const result = validate(updateSchema, {
        name: 'Jane'
        // age may be absent since this is partial
      });

      expect(result.valid).toBe(true);
    });

    it('PUT - replace user (exclude system fields)', () => {
      const replaceSchema = SchemaUtils.omit(baseSchema, ['id', 'createdAt', 'updatedAt']);

      const result = validate(replaceSchema, {
        name: 'John',
        email: 'john@example.com',
        password: 'password123'
        // age is optional, so it can be absent
      });

      expect(result.valid).toBe(true);
    });
  });

  describe('Immutability', () => {
    it('should not modify the original schema', () => {
      const originalProps = Object.keys(baseSchema.properties);
      const originalRequired = [...(baseSchema.required || [])];

      SchemaUtils
        .omit(baseSchema, ['password'])
        .extend({ avatar: 'url' });

      expect(Object.keys(baseSchema.properties)).toEqual(originalProps);
      expect(baseSchema.required).toEqual(originalRequired);
    });

    it('each call should return a new object', () => {
      const schema1 = SchemaUtils.omit(baseSchema, ['password']);
      const schema2 = SchemaUtils.omit(baseSchema, ['password']);

      expect(schema1).not.toBe(schema2);
      expect(schema1).toEqual(schema2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle an empty field array', () => {
      const schema = SchemaUtils.omit(baseSchema, []);
      expect(Object.keys(schema.properties!)).toHaveLength(Object.keys(baseSchema.properties!).length);
    });

    it('should handle non-existent fields', () => {
      const schema = SchemaUtils.omit(baseSchema, ['nonExistentField']);
      expect(Object.keys(schema.properties!)).toHaveLength(Object.keys(baseSchema.properties!).length);
    });

    it('should handle partial on nested objects', () => {
      const nestedSchema = dsl({
        user: {
          name: 'string!',
          email: 'email!'
        }
      });

      const partialSchema = SchemaUtils.partial(nestedSchema);

      expect(partialSchema.required).toBeUndefined();
    });

    it('should clone chainable and plain schemas without sharing references', () => {
      const chainable = SchemaUtils.pick(baseSchema, ['name'])
      const clonedChainable = SchemaUtils.clone(chainable as any)
      const clonedPlain = SchemaUtils.clone({ type: 'object', properties: { name: { type: 'string' } } })

      expect(clonedChainable).toEqual({ type: 'object', properties: { name: baseSchema.properties.name }, required: ['name'] })
      expect(clonedPlain).toEqual({ type: 'object', properties: { name: { type: 'string' } } })
      expect(clonedPlain.properties!.name).not.toBe(baseSchema.properties.name)
    })

    it('should export markdown safely for pipes, newlines and backtick runs', () => {
      const markdown = SchemaUtils.toMarkdown({
        type: 'object',
        properties: {
          notes: {
            type: 'string',
            description: 'line1\nline2 | pipe',
            pattern: '`code`',
            enum: ['a|b', '``literal``'],
          },
        },
      } as any, { title: 'Title\nNext' })

      expect(markdown).toContain('Title\nNext')
      expect(markdown).toContain('line1<br>line2 \\| pipe')
      expect(markdown).toContain('`` `code` ``')
      expect(markdown).toContain('``` ``literal`` ```')
    })

    it('should return minimal exports for schemas without properties', () => {
      expect(SchemaUtils.toMarkdown({ type: 'string' })).toBe('# Schema Documentation\n\n')
      expect(SchemaUtils.toHTML({ type: 'string' })).toContain('<h1>Schema Documentation</h1>')
    })
  });
});
