/**
 * 测试错误消息的修复
 *
 * 修复内容：
 * 1. **path**: 显示完整路径（如 'project/project_id'）- 用于定位错误位置
 * 2. **message**: 只显示字段名（如 'project_id is required'）- 更友好的提示
 *
 * 修复范围：
 * - ✅ required 错误（缺少必填字段）
 * - ✅ type 错误（类型不匹配）
 * - ✅ minLength/maxLength 错误（长度限制）
 * - ✅ pattern/format 错误（格式验证）
 * - ✅ enum 错误（枚举验证）
 * - ✅ minimum/maximum 错误（数值范围）
 * - ✅ minItems/maxItems 错误（数组长度）
 * - ✅ additionalProperties 错误（额外属性）
 * - ✅ 所有其他错误类型
 *
 * 路径分隔符说明：
 * 使用 `/` 而不是 `.` 的原因：
 * - 符合 **JSON Pointer (RFC 6901)** 标准
 * - 与 ajv 原始格式一致（`instancePath: "/user/profile"`）
 * - 支持包含 `.` 的字段名（如 `api/v1.2.3/endpoint`）
 * - 大多数 JSON Schema 工具都使用 `/`
 *
 * @see https://datatracker.ietf.org/doc/html/rfc6901
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { dsl, validate, Locale } from '../../src/index.js';

describe('Required Error Message Fix', () => {

  // 在每个测试前重置语言为英文，避免其他测试的语言设置污染
  beforeEach(() => {
    Locale.setLocale('en-US');
  });

  it('顶层必填字段：应该显示正确的错误消息', () => {
    const schema = dsl({
      "name!": "string",
      "age": "number"
    });

    const result = validate(schema, {});

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].path).toBe('name');
    expect(result.errors[0].message).toBe('name is required');
  });

  it('嵌套对象必填字段：path 应该是完整路径，message 只显示字段名', () => {
    const schema = dsl({
      "project": {
        project_id: "objectId!",
        trip_id: "objectId!"
      }
    });

    const result = validate(schema, {
      "project": {
        // 缺少 project_id
        "trip_id": "69771ab94d7ff6963d1e93ff"
      }
    });

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].path).toBe('project/project_id');
    expect(result.errors[0].message).toBe('project_id is required');
    expect(result.errors[0].params.missingProperty).toBe('project_id');
  });

  it('多层嵌套必填字段：应该显示正确的路径和消息', () => {
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
          // 缺少 phone
        }
      }
    });

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].path).toBe('user/profile/phone');
    expect(result.errors[0].message).toBe('phone is required');
  });

  it('对象本身是必填：应该显示正确的消息', () => {
    const schema = dsl({
      "project!": {
        project_id: "objectId!",
        trip_id: "objectId!"
      }
    });

    const result = validate(schema, {});

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].path).toBe('project');
    expect(result.errors[0].message).toBe('project is required');
  });

  it('同时缺少多个字段：每个错误应该正确显示', () => {
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
        // 缺少 name 和 email
      }
    });

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(2);

    const errors = result.errors.sort((a: any, b: any) => a.path.localeCompare(b.path));

    expect(errors[0].path).toBe('user/email');
    expect(errors[0].message).toBe('email is required');

    expect(errors[1].path).toBe('user/name');
    expect(errors[1].message).toBe('name is required');
  });

  it('用户提供的真实场景：应该正确处理', () => {
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

    // 测试1：不传 project（可选），应该通过
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

    // 测试2：传 project 但缺少 project_id
    const result2 = validate(schema, {
      "project": {
        "trip_id": "69771ab94d7ff6963d1e93ff"
        // 缺少 project_id
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
    expect(result2.errors.length).toBe(1);
    expect(result2.errors[0].path).toBe('project/project_id');
    expect(result2.errors[0].message).toBe('project_id is required');
  });
});
