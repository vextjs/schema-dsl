import { describe, expect, it } from 'vitest';
import { validate } from '../../../src/index.js';

describe('CustomKeywords - regex safety', () => {
  it('should reject potentially catastrophic nested quantifier patterns', () => {
    const result = validate(
      {
        type: 'object',
        properties: {
          value: {
            type: 'string',
            regex: '((a)+)+$'
          }
        }
      },
      { value: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaa!' }
    );

    expect(result.valid).toBe(false);
    expect(result.errors?.[0].keyword).toBe('regex');
    expect(result.errors?.[0].params).toMatchObject({
      pattern: '((a)+)+$',
      reason: 'unsafe regex pattern'
    });
  });

  it('should continue to allow safe regex patterns', () => {
    const result = validate(
      {
        type: 'object',
        properties: {
          value: {
            type: 'string',
            regex: '^[a-z]+$'
          }
        }
      },
      { value: 'schema' }
    );

    expect(result.valid).toBe(true);
  });

  it('should continue to report invalid regex syntax via the invalid-pattern path', () => {
    const result = validate(
      {
        type: 'object',
        properties: {
          value: {
            type: 'string',
            regex: '('
          }
        }
      },
      { value: 'schema' }
    );

    expect(result.valid).toBe(false);
    expect(result.errors?.[0].keyword).toBe('regex');
    expect(result.errors?.[0].params).toHaveProperty('error');
    expect(result.errors?.[0].params).not.toHaveProperty('reason');
  });
});

