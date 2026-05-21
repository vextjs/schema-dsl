/**
 * Error Message Fix Tests
 *
 * Fix contents:
 * 1. **path**: shows full path (e.g. 'project/project_id') — for locating error position
 * 2. **message**: shows only field name (e.g. 'project_id is required') — more user-friendly
 *
 * Fix scope:
 * - ✅ required errors (missing required fields)
 * - ✅ type errors (type mismatch)
 * - ✅ minLength/maxLength errors (length constraints)
 * - ✅ pattern/format errors (format validation)
 * - ✅ enum errors (enum validation)
 * - ✅ minimum/maximum errors (numeric range)
 * - ✅ minItems/maxItems errors (array length)
 * - ✅ additionalProperties errors (extra properties)
 * - ✅ all other error types
 *
 * Path separator note:
 * Why `/` is used instead of `.`:
 * - Complies with the **JSON Pointer (RFC 6901)** standard
 * - Consistent with ajv's native format (`instancePath: "/user/profile"`)
 * - Supports field names containing `.` (e.g. `api/v1.2.3/endpoint`)
 * - Most JSON Schema tools use `/`
 *
 * @see https://datatracker.ietf.org/doc/html/rfc6901
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { dsl, validate, Locale } from '../../src/index.js';

describe('Required Error Message Fix', () => {

  // reset locale to English before each test to avoid pollution from other tests
  beforeEach(() => {
    Locale.setLocale('en-US');
  });

  it('top-level required field: should display correct error message', () => {
    const schema = dsl({
      "name!": "string",
      "age": "number"
    });

    const result = validate(schema, {});

    expect(result.valid).toBe(false);
    expect(result.errors!.length).toBe(1);
    expect(result.errors![0].path).toBe('name');
    expect(result.errors![0].message).toBe('name is required');
  });

  it('nested object required field: path should be full path, message shows only field name', () => {
    const schema = dsl({
      "project": {
        project_id: "objectId!",
        trip_id: "objectId!"
      }
    });

    const result = validate(schema, {
      "project": {
        // missing project_id
        "trip_id": "69771ab94d7ff6963d1e93ff"
      }
    });

    expect(result.valid).toBe(false);
    expect(result.errors!.length).toBe(1);
    expect(result.errors![0].path).toBe('project/project_id');
    expect(result.errors![0].message).toBe('project_id is required');
    expect(result.errors![0].params!.missingProperty).toBe('project_id');
  });

  it('deeply nested required field: should display correct path and message', () => {
    const schema = dsl({
      "user": {
        "profile": {
          "email!": "email",
          "phone!": "phone"
        }
      }
    });

    const result = validate(schema, {
      "user": {
        "profile": {
          "email": "test@example.com"
          // missing phone
        }
      }
    });

    expect(result.valid).toBe(false);
    expect(result.errors!.length).toBe(1);
    expect(result.errors![0].path).toBe('user/profile/phone');
    expect(result.errors![0].message).toBe('phone is required');
  });

  it('object itself is required: should display correct message', () => {
    const schema = dsl({
      "project!": {
        project_id: "objectId!",
        trip_id: "objectId!"
      }
    });

    const result = validate(schema, {});

    expect(result.valid).toBe(false);
    expect(result.errors!.length).toBe(1);
    expect(result.errors![0].path).toBe('project');
    expect(result.errors![0].message).toBe('project is required');
  });

  it('multiple fields missing simultaneously: each error should display correctly', () => {
    const schema = dsl({
      "user": {
        "name!": "string",
        "email!": "email",
        "phone": "phone"
      }
    });

    const result = validate(schema, {
      "user": {
        "phone": "13800138000"
        // missing name and email
      }
    });

    expect(result.valid).toBe(false);
    expect(result.errors!.length).toBe(2);

    const errors = result.errors!.sort((a: any, b: any) => a.path.localeCompare(b.path));

    expect(errors[0].path).toBe('user/email');
    expect(errors[0].message).toBe('email is required');

    expect(errors[1].path).toBe('user/name');
    expect(errors[1].message).toBe('name is required');
  });

  it('real-world user scenario: should handle correctly', () => {
    const schema = dsl({
      "project": {
        project_id: "objectId!",
        trip_id: "objectId!"
      },
      "dbConfig!": {
        ssh: {
          host: "string!",
          port: "number!",
          username: "string!",
          password: "string!"
        },
        uri: "string!"
      }
    });

    // test 1: omit project (optional), should pass
    const result1 = validate(schema, {
      "dbConfig": {
        "ssh": {
          "host": "47.90.246.167",
          "port": 38449,
          "username": "huojianshi",
          "password": "9JnrQf/jCsuvT2Sw"
        },
        "uri": "mongodb://..."
      }
    });
    expect(result1.valid).toBe(true);

    // test 2: include project but missing project_id
    const result2 = validate(schema, {
      "project": {
        "trip_id": "69771ab94d7ff6963d1e93ff"
        // missing project_id
      },
      "dbConfig": {
        "ssh": {
          "host": "47.90.246.167",
          "port": 38449,
          "username": "huojianshi",
          "password": "9JnrQf/jCsuvT2Sw"
        },
        "uri": "mongodb://..."
      }
    });

    expect(result2.valid).toBe(false);
    expect(result2.errors!.length).toBe(1);
    expect(result2.errors![0].path).toBe('project/project_id');
    expect(result2.errors![0].message).toBe('project_id is required');
  });
});
