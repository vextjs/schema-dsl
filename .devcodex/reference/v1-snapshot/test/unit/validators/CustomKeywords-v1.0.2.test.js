/**
 * CustomKeywords v1.0.2 新增验证器测试
 *
 * 测试 v1.0.2 版本新增的 15 个自定义验证器
 */

const { expect } = require('chai');
const { dsl, validate } = require('../../../index');

describe('CustomKeywords - v1.0.2 新增验证器', () => {

  // ==================== String 验证器 ====================

  describe('String 验证器', () => {

    describe('1. exactLength - 精确长度验证', () => {
      it('应该通过精确长度验证', () => {
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
        expect(result.valid).to.be.true;
      });

      it('应该拒绝长度不足', () => {
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
        expect(result.valid).to.be.false;
        expect(result.errors).to.be.an('array').that.is.not.empty;
      });

      it('应该拒绝长度超出', () => {
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
        expect(result.valid).to.be.false;
      });

      it('应该处理边界情况 - 长度为0', () => {
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
        expect(result.valid).to.be.true;
      });

      it('应该处理边界情况 - 长度为100', () => {
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
        expect(result.valid).to.be.true;
      });
    });

    describe('2. alphanum - 字母和数字', () => {
      it('应该通过只包含字母和数字的字符串', () => {
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
        expect(result.valid).to.be.true;
      });

      it('应该通过只包含字母', () => {
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
        expect(result.valid).to.be.true;
      });

      it('应该通过只包含数字', () => {
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
        expect(result.valid).to.be.true;
      });

      it('应该拒绝包含特殊字符', () => {
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
        expect(result.valid).to.be.false;
      });

      it('应该拒绝包含空格', () => {
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
        expect(result.valid).to.be.false;
      });
    });

    describe('3. trim - 前后空格检查', () => {
      it('应该通过无前后空格的字符串', () => {
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
        expect(result.valid).to.be.true;
      });

      it('应该通过包含中间空格的字符串', () => {
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
        expect(result.valid).to.be.true;
      });

      it('应该拒绝前导空格', () => {
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
        expect(result.valid).to.be.false;
      });

      it('应该拒绝尾随空格', () => {
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
        expect(result.valid).to.be.false;
      });

      it('应该拒绝前后都有空格', () => {
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
        expect(result.valid).to.be.false;
      });
    });

    describe('4. lowercase - 小写检查', () => {
      it('应该通过全小写字符串', () => {
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
        expect(result.valid).to.be.true;
      });

      it('应该通过只包含小写字母和数字', () => {
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
        expect(result.valid).to.be.true;
      });

      it('应该拒绝包含大写字母', () => {
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
        expect(result.valid).to.be.false;
      });

      it('应该拒绝全大写字符串', () => {
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
        expect(result.valid).to.be.false;
      });

      it('应该通过空字符串', () => {
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
        expect(result.valid).to.be.true;
      });
    });

    describe('5. uppercase - 大写检查', () => {
      it('应该通过全大写字符串', () => {
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
        expect(result.valid).to.be.true;
      });

      it('应该通过只包含大写字母和数字', () => {
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
        expect(result.valid).to.be.true;
      });

      it('应该拒绝包含小写字母', () => {
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
        expect(result.valid).to.be.false;
      });

      it('应该拒绝全小写字符串', () => {
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
        expect(result.valid).to.be.false;
      });

      it('应该通过空字符串', () => {
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
        expect(result.valid).to.be.true;
      });
    });

    describe('6. jsonString - JSON字符串验证', () => {
      it('应该通过有效的JSON对象', () => {
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
        expect(result.valid).to.be.true;
      });

      it('应该通过有效的JSON数组', () => {
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
        expect(result.valid).to.be.true;
      });

      it('应该通过有效的JSON原始值', () => {
        const schema = {
          type: 'object',
          properties: {
            config: {
              type: 'string',
              jsonString: true
            }
          }
        };

        expect(validate(schema, { config: '"string"' }).valid).to.be.true;
        expect(validate(schema, { config: '123' }).valid).to.be.true;
        expect(validate(schema, { config: 'true' }).valid).to.be.true;
        expect(validate(schema, { config: 'null' }).valid).to.be.true;
      });

      it('应该拒绝无效的JSON - 键未加引号', () => {
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
        expect(result.valid).to.be.false;
      });

      it('应该拒绝无效的JSON - 单引号', () => {
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
        expect(result.valid).to.be.false;
      });
    });
  });

  // ==================== Number 验证器 ====================

  describe('Number 验证器', () => {

    describe('7. precision - 小数位数限制', () => {
      it('应该通过符合精度要求的数字', () => {
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
        expect(result.valid).to.be.true;
      });

      it('应该通过整数（0位小数）', () => {
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
        expect(result.valid).to.be.true;
      });

      it('应该通过1位小数', () => {
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
        expect(result.valid).to.be.true;
      });

      it('应该拒绝小数位数超出', () => {
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
        expect(result.valid).to.be.false;
      });

      it('应该拒绝小数位数远超出', () => {
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
        expect(result.valid).to.be.false;
      });
    });

    describe('8. port - 端口号验证', () => {
      it('应该通过有效的端口号', () => {
        const schema = {
          type: 'object',
          properties: {
            port: {
              type: 'integer',
              port: true
            }
          }
        };

        expect(validate(schema, { port: 80 }).valid).to.be.true;
        expect(validate(schema, { port: 443 }).valid).to.be.true;
        expect(validate(schema, { port: 3000 }).valid).to.be.true;
      });

      it('应该通过边界值 - 最小端口1', () => {
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
        expect(result.valid).to.be.true;
      });

      it('应该通过边界值 - 最大端口65535', () => {
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
        expect(result.valid).to.be.true;
      });

      it('应该拒绝端口0', () => {
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
        expect(result.valid).to.be.false;
      });

      it('应该拒绝端口超过65535', () => {
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
        expect(result.valid).to.be.false;
      });

      it('应该拒绝负数端口', () => {
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
        expect(result.valid).to.be.false;
      });

      it('应该拒绝非整数端口', () => {
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
        expect(result.valid).to.be.false;
      });
    });
  });

  // ==================== Object 验证器 ====================

  describe('Object 验证器', () => {

    describe('9. requiredAll - 要求所有属性', () => {
      it('应该通过所有属性都存在', () => {
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
        expect(result.valid).to.be.true;
      });

      it('应该拒绝缺少一个属性', () => {
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
        expect(result.valid).to.be.false;
      });

      it('应该拒绝缺少多个属性', () => {
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
        expect(result.valid).to.be.false;
      });

      it('应该拒绝空对象', () => {
        const schema = {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' }
          },
          requiredAll: true
        };

        const result = validate(schema, {});
        expect(result.valid).to.be.false;
      });

      it('应该通过包含额外属性', () => {
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
        expect(result.valid).to.be.true;
      });
    });

    describe('10. strictSchema - 严格模式', () => {
      it('应该通过只包含定义的属性', () => {
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
        expect(result.valid).to.be.true;
      });

      it('应该拒绝包含一个额外属性', () => {
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
        expect(result.valid).to.be.false;
      });

      it('应该拒绝包含多个额外属性', () => {
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
        expect(result.valid).to.be.false;
      });

      it('应该通过缺少可选属性', () => {
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
        expect(result.valid).to.be.true;
      });

      it('应该通过空对象', () => {
        const schema = {
          type: 'object',
          properties: {
            name: { type: 'string' }
          },
          strictSchema: true
        };

        const result = validate(schema, {});
        expect(result.valid).to.be.true;
      });
    });
  });

  // ==================== Array 验证器 ====================

  describe('Array 验证器', () => {

    describe('11. noSparse - 禁止稀疏数组', () => {
      it('应该通过密集数组', () => {
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
        expect(result.valid).to.be.true;
      });

      it('应该通过空数组', () => {
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
        expect(result.valid).to.be.true;
      });

      it('应该拒绝稀疏数组', () => {
        const schema = {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              noSparse: true
            }
          }
        };

        const sparseArray = [1, , 3]; // eslint-disable-line no-sparse-arrays
        const result = validate(schema, { items: sparseArray });
        expect(result.valid).to.be.false;
      });

      it('应该拒绝使用new Array创建的稀疏数组', () => {
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
        expect(result.valid).to.be.false;
      });

      it('应该拒绝delete后的稀疏数组', () => {
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
        delete arr[1];
        const result = validate(schema, { items: arr });
        expect(result.valid).to.be.false;
      });
    });

    describe('12. includesRequired - 必须包含元素', () => {
      it('应该通过包含所有必需元素', () => {
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
        expect(result.valid).to.be.true;
      });

      it('应该通过包含必需元素（顺序无关）', () => {
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
        expect(result.valid).to.be.true;
      });

      it('应该拒绝缺少一个必需元素', () => {
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
        expect(result.valid).to.be.false;
      });

      it('应该拒绝缺少所有必需元素', () => {
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
        expect(result.valid).to.be.false;
      });

      it('应该拒绝空数组', () => {
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
        expect(result.valid).to.be.false;
      });
    });
  });

  // ==================== Date 验证器 ====================

  describe('Date 验证器', () => {

    describe('13. dateFormat - 日期格式验证', () => {
      it('应该通过YYYY-MM-DD格式', () => {
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
        expect(result.valid).to.be.true;
      });

      it('应该通过YYYY/MM/DD格式', () => {
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
        expect(result.valid).to.be.true;
      });

      it('应该通过DD-MM-YYYY格式', () => {
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
        expect(result.valid).to.be.true;
      });

      it('应该通过DD/MM/YYYY格式', () => {
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
        expect(result.valid).to.be.true;
      });

      it('应该通过ISO8601格式', () => {
        const schema = {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              dateFormat: 'ISO8601'
            }
          }
        };

        expect(validate(schema, { date: '2025-12-31T15:30:00.000Z' }).valid).to.be.true;
        expect(validate(schema, { date: '2025-12-31T15:30:00Z' }).valid).to.be.true;
      });

      it('应该拒绝格式不匹配', () => {
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
        expect(result.valid).to.be.false;
      });
    });

    describe('14. dateGreater - 日期大于', () => {
      it('应该通过日期在指定日期之后', () => {
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
        expect(result.valid).to.be.true;
      });

      it('应该拒绝日期等于指定日期', () => {
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
        expect(result.valid).to.be.false;
      });

      it('应该拒绝日期在指定日期之前', () => {
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
        expect(result.valid).to.be.false;
      });

      it('应该拒绝无效日期', () => {
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
        expect(result.valid).to.be.false;
      });

      it('应该处理时间戳比较', () => {
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
        expect(result.valid).to.be.true;
      });
    });

    describe('15. dateLess - 日期小于', () => {
      it('应该通过日期在指定日期之前', () => {
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
        expect(result.valid).to.be.true;
      });

      it('应该拒绝日期等于指定日期', () => {
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
        expect(result.valid).to.be.false;
      });

      it('应该拒绝日期在指定日期之后', () => {
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
        expect(result.valid).to.be.false;
      });

      it('应该拒绝无效日期', () => {
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
        expect(result.valid).to.be.false;
      });

      it('应该处理时间戳比较', () => {
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
        expect(result.valid).to.be.true;
      });
    });
  });
});

