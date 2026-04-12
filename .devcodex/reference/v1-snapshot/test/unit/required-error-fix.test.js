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

const dsl = require('../../lib/adapters/DslAdapter');
const assert = require('assert');
const Locale = require('../../lib/core/Locale');

describe('Required Error Message Fix', function() {

  // 在每个测试前重置语言为英文，避免其他测试的语言设置污染
  beforeEach(function() {
    Locale.setLocale('en-US');
  });

  it('顶层必填字段：应该显示正确的错误消息', function() {
    const schema = dsl({
      "name!": "string",
      "age": "number"
    });

    const result = dsl.validate(schema, {});

    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.errors.length, 1);
    assert.strictEqual(result.errors[0].path, 'name');
    assert.strictEqual(result.errors[0].message, 'name is required');
  });

  it('嵌套对象必填字段：path 应该是完整路径，message 只显示字段名', function() {
    const schema = dsl({
      "project": {
        project_id: "objectId!",
        trip_id: "objectId!"
      }
    });

    const result = dsl.validate(schema, {
      "project": {
        // 缺少 project_id
        "trip_id": "69771ab94d7ff6963d1e93ff"
      }
    });

    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.errors.length, 1);
    assert.strictEqual(result.errors[0].path, 'project/project_id', 'path 应该是完整路径');
    assert.strictEqual(result.errors[0].message, 'project_id is required', 'message 应该只显示字段名');
    assert.strictEqual(result.errors[0].params.missingProperty, 'project_id');
  });

  it('多层嵌套必填字段：应该显示正确的路径和消息', function() {
    const schema = dsl({
      "user": {
        "profile": {
          "email!": "email",
          "phone!": "phone"
        }
      }
    });

    const result = dsl.validate(schema, {
      "user": {
        "profile": {
          "email": "test@example.com"
          // 缺少 phone
        }
      }
    });

    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.errors.length, 1);
    assert.strictEqual(result.errors[0].path, 'user/profile/phone', '多层嵌套的 path 应该是完整路径');
    assert.strictEqual(result.errors[0].message, 'phone is required', 'message 应该只显示字段名');
  });

  it('对象本身是必填：应该显示正确的消息', function() {
    const schema = dsl({
      "project!": {
        project_id: "objectId!",
        trip_id: "objectId!"
      }
    });

    const result = dsl.validate(schema, {});

    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.errors.length, 1);
    assert.strictEqual(result.errors[0].path, 'project');
    assert.strictEqual(result.errors[0].message, 'project is required');
  });

  it('同时缺少多个字段：每个错误应该正确显示', function() {
    const schema = dsl({
      "user": {
        "name!": "string",
        "email!": "email",
        "phone": "phone"
      }
    });

    const result = dsl.validate(schema, {
      "user": {
        "phone": "13800138000"
        // 缺少 name 和 email
      }
    });

    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.errors.length, 2);

    const errors = result.errors.sort((a, b) => a.path.localeCompare(b.path));

    assert.strictEqual(errors[0].path, 'user/email');
    assert.strictEqual(errors[0].message, 'email is required');

    assert.strictEqual(errors[1].path, 'user/name');
    assert.strictEqual(errors[1].message, 'name is required');
  });

  it('用户提供的真实场景：应该正确处理', function() {
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
    const result1 = dsl.validate(schema, {
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
    assert.strictEqual(result1.valid, true, 'project 是可选的，不传应该验证通过');

    // 测试2：传 project 但缺少 project_id
    const result2 = dsl.validate(schema, {
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

    assert.strictEqual(result2.valid, false);
    assert.strictEqual(result2.errors.length, 1);
    assert.strictEqual(result2.errors[0].path, 'project/project_id');
    assert.strictEqual(result2.errors[0].message, 'project_id is required');
  });
});

// 如果直接运行此文件，执行测试
if (require.main === module) {
  console.log('运行测试...\n');

  const tests = [
    {
      name: '顶层必填字段',
      fn: function() {
        const schema = dsl({
          "name!": "string",
          "age": "number"
        });

        const result = dsl.validate(schema, {});

        console.log('错误:', result.errors);
        assert.strictEqual(result.errors[0].path, 'name');
        assert.strictEqual(result.errors[0].message, 'name is required');
      }
    },
    {
      name: '嵌套对象必填字段',
      fn: function() {
        const schema = dsl({
          "project": {
            project_id: "objectId!",
            trip_id: "objectId!"
          }
        });

        const result = dsl.validate(schema, {
          "project": {
            "trip_id": "69771ab94d7ff6963d1e93ff"
          }
        });

        console.log('错误:', result.errors);
        assert.strictEqual(result.errors[0].path, 'project/project_id');
        assert.strictEqual(result.errors[0].message, 'project_id is required');
      }
    },
    {
      name: '用户真实场景',
      fn: function() {
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

        const result = dsl.validate(schema, {
          "project": {
            "trip_id": "69771ab94d7ff6963d1e93ff"
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

        console.log('错误:', result.errors);
        assert.strictEqual(result.errors[0].path, 'project/project_id');
        assert.strictEqual(result.errors[0].message, 'project_id is required');
      }
    }
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach(test => {
    try {
      console.log(`\n测试: ${test.name}`);
      test.fn();
      console.log('✅ 通过');
      passed++;
    } catch (err) {
      console.log('❌ 失败:', err.message);
      failed++;
    }
  });

  console.log(`\n总结: ${passed} 通过, ${failed} 失败`);
}

module.exports = {
  'Required Error Message Fix': function() {
    // Mocha test cases above
  }
};
