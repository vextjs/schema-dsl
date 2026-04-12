/**
 * 完整类型系统测试
 *
 * 测试所有18种类型的解析和验证
 */

const { expect } = require('chai');
const { dsl, validate } = require('../../../index');

describe('完整类型系统测试', () => {

    // ========== 基本类型（8种）==========
    describe('基本类型', () => {
        it('应该支持 string 类型', () => {
            const schema = dsl({ field: 'string' });
            expect(schema.properties.field.type).to.equal('string');
            expect(validate(schema, { field: 'hello' }).valid).to.be.true;
            expect(validate(schema, { field: 123 }).valid).to.be.false;
        });

        it('应该支持 number 类型', () => {
            const schema = dsl({ field: 'number' });
            expect(schema.properties.field.type).to.equal('number');
            expect(validate(schema, { field: 3.14 }).valid).to.be.true;
            expect(validate(schema, { field: 'abc' }).valid).to.be.false;
        });

        it('应该支持 integer 类型', () => {
            const schema = dsl({ field: 'integer' });
            expect(schema.properties.field.type).to.equal('integer');
            expect(validate(schema, { field: 42 }).valid).to.be.true;
            expect(validate(schema, { field: 3.14 }).valid).to.be.false;
        });

        it('应该支持 boolean 类型', () => {
            const schema = dsl({ field: 'boolean' });
            expect(schema.properties.field.type).to.equal('boolean');
            expect(validate(schema, { field: true }).valid).to.be.true;
            expect(validate(schema, { field: 'true' }).valid).to.be.false;
        });

        it('应该支持 object 类型', () => {
            const schema = dsl({ field: 'object' });
            expect(schema.properties.field.type).to.equal('object');
            expect(validate(schema, { field: { a: 1 } }).valid).to.be.true;
            expect(validate(schema, { field: 'not object' }).valid).to.be.false;
        });

        it('应该支持 array 类型', () => {
            const schema = dsl({ field: 'array' });
            expect(schema.properties.field.type).to.equal('array');
            expect(validate(schema, { field: [1, 2, 3] }).valid).to.be.true;
            expect(validate(schema, { field: 'not array' }).valid).to.be.false;
        });

        it('应该支持 null 类型', () => {
            const schema = dsl({ field: 'null' });
            expect(schema.properties.field.type).to.equal('null');
            expect(validate(schema, { field: null }).valid).to.be.true;
            expect(validate(schema, { field: 'not null' }).valid).to.be.false;
        });

        it('应该支持 any 类型', () => {
            const schema = dsl({ field: 'any' });
            // any类型不限制类型
            expect(schema.properties.field.type).to.be.undefined;
            expect(validate(schema, { field: 'string' }).valid).to.be.true;
            expect(validate(schema, { field: 123 }).valid).to.be.true;
            expect(validate(schema, { field: null }).valid).to.be.true;
            expect(validate(schema, { field: { a: 1 } }).valid).to.be.true;
        });
    });

    // ========== 格式类型（9种）==========
    describe('格式类型', () => {
        it('应该支持 email 类型', () => {
            const schema = dsl({ field: 'email' });
            expect(schema.properties.field.type).to.equal('string');
            expect(schema.properties.field.format).to.equal('email');
            expect(validate(schema, { field: 'test@example.com' }).valid).to.be.true;
            expect(validate(schema, { field: 'invalid-email' }).valid).to.be.false;
        });

        it('应该支持 url 类型', () => {
            const schema = dsl({ field: 'url' });
            expect(schema.properties.field.type).to.equal('string');
            expect(schema.properties.field.format).to.equal('uri');
            expect(validate(schema, { field: 'https://example.com' }).valid).to.be.true;
            expect(validate(schema, { field: 'not-a-url' }).valid).to.be.false;
        });

        it('应该支持 uuid 类型', () => {
            const schema = dsl({ field: 'uuid' });
            expect(schema.properties.field.type).to.equal('string');
            expect(schema.properties.field.format).to.equal('uuid');
            expect(validate(schema, { field: '550e8400-e29b-41d4-a716-446655440000' }).valid).to.be.true;
            expect(validate(schema, { field: 'not-a-uuid' }).valid).to.be.false;
        });

        it('应该支持 date 类型', () => {
            const schema = dsl({ field: 'date' });
            expect(schema.properties.field.type).to.equal('string');
            expect(schema.properties.field.format).to.equal('date');
            expect(validate(schema, { field: '2025-12-25' }).valid).to.be.true;
            expect(validate(schema, { field: '2025/12/25' }).valid).to.be.false;
        });

        it('应该支持 datetime 类型', () => {
            const schema = dsl({ field: 'datetime' });
            expect(schema.properties.field.type).to.equal('string');
            expect(schema.properties.field.format).to.equal('date-time');
            expect(validate(schema, { field: '2025-12-25T10:30:00Z' }).valid).to.be.true;
            expect(validate(schema, { field: '2025-12-25' }).valid).to.be.false;
        });

        it('应该支持 time 类型', () => {
            const schema = dsl({ field: 'time' });
            expect(schema.properties.field.type).to.equal('string');
            expect(schema.properties.field.format).to.equal('time');
            expect(validate(schema, { field: '10:30:00' }).valid).to.be.true;
            expect(validate(schema, { field: '10:30' }).valid).to.be.false;
        });

        it('应该支持 ipv4 类型', () => {
            const schema = dsl({ field: 'ipv4' });
            expect(schema.properties.field.type).to.equal('string');
            expect(schema.properties.field.format).to.equal('ipv4');
            expect(validate(schema, { field: '192.168.1.1' }).valid).to.be.true;
            expect(validate(schema, { field: '999.999.999.999' }).valid).to.be.false;
        });

        it('应该支持 ipv6 类型', () => {
            const schema = dsl({ field: 'ipv6' });
            expect(schema.properties.field.type).to.equal('string');
            expect(schema.properties.field.format).to.equal('ipv6');
            expect(validate(schema, { field: '2001:0db8:85a3:0000:0000:8a2e:0370:7334' }).valid).to.be.true;
            expect(validate(schema, { field: 'not-ipv6' }).valid).to.be.false;
        });

        it('应该支持 binary 类型（Base64）', () => {
            const schema = dsl({ field: 'binary' });
            expect(schema.properties.field.type).to.equal('string');
            expect(schema.properties.field.contentEncoding).to.equal('base64');
            // binary类型在ajv中只检查是否为字符串
            expect(validate(schema, { field: 'SGVsbG8gV29ybGQ=' }).valid).to.be.true;
        });
    });

    // ========== 类型 + 约束组合 ==========
    describe('类型 + 约束组合', () => {
        it('应该支持 string + 长度约束', () => {
            const schema = dsl({ field: 'string:3-32!' });
            expect(schema.properties.field.type).to.equal('string');
            expect(schema.properties.field.minLength).to.equal(3);
            expect(schema.properties.field.maxLength).to.equal(32);
            expect(schema.required).to.include('field');
        });

        it('应该支持 number + 范围约束', () => {
            const schema = dsl({ field: 'number:0-100!' });
            expect(schema.properties.field.type).to.equal('number');
            expect(schema.properties.field.minimum).to.equal(0);
            expect(schema.properties.field.maximum).to.equal(100);
            expect(schema.required).to.include('field');
        });

        it('应该支持 integer + 范围约束', () => {
            const schema = dsl({ field: 'integer:1-10' });
            expect(schema.properties.field.type).to.equal('integer');
            expect(schema.properties.field.minimum).to.equal(1);
            expect(schema.properties.field.maximum).to.equal(10);
        });

        it('应该支持 array + 长度约束', () => {
            const schema = dsl({ field: 'array:1-5' });
            expect(schema.properties.field.type).to.equal('array');
            expect(schema.properties.field.minItems).to.equal(1);
            expect(schema.properties.field.maxItems).to.equal(5);
        });

        it('应该支持 array + 元素类型', () => {
            const schema = dsl({ field: 'array<string>' });
            expect(schema.properties.field.type).to.equal('array');
            expect(schema.properties.field.items.type).to.equal('string');
        });

        it('应该支持 array + 长度 + 元素约束', () => {
            const schema = dsl({ field: 'array:1-5<string:1-20>' });
            expect(schema.properties.field.type).to.equal('array');
            expect(schema.properties.field.minItems).to.equal(1);
            expect(schema.properties.field.maxItems).to.equal(5);
            expect(schema.properties.field.items.type).to.equal('string');
            expect(schema.properties.field.items.minLength).to.equal(1);
            expect(schema.properties.field.items.maxLength).to.equal(20);
        });
    });

    // ========== 枚举类型 ==========
    describe('枚举类型', () => {
        it('应该支持字符串枚举', () => {
            const schema = dsl({ field: 'active|inactive|pending' });
            expect(schema.properties.field.enum).to.deep.equal(['active', 'inactive', 'pending']);
            expect(validate(schema, { field: 'active' }).valid).to.be.true;
            expect(validate(schema, { field: 'unknown' }).valid).to.be.false;
        });

        it('应该支持必填枚举', () => {
            const schema = dsl({ field: 'a|b|c!' });
            expect(schema.required).to.include('field');
        });
    });

    // ========== 嵌套对象 ==========
    describe('嵌套对象', () => {
        it('应该支持嵌套对象类型', () => {
            const schema = dsl({
                user: {
                    name: 'string!',
                    email: 'email!',
                    age: 'number:18-120'
                }
            });

            expect(schema.properties.user.type).to.equal('object');
            expect(schema.properties.user.properties.name.type).to.equal('string');
            expect(schema.properties.user.properties.email.format).to.equal('email');
        });

        it('应该支持多层嵌套', () => {
            const schema = dsl({
                level1: {
                    level2: {
                        level3: 'string!'
                    }
                }
            });

            expect(schema.properties.level1.properties.level2.properties.level3.type).to.equal('string');
        });
    });

    // ========== 复杂组合场景 ==========
    describe('复杂组合场景', () => {
        it('应该支持完整的用户Schema', () => {
            const schema = dsl({
                username: 'string:3-32!',
                email: 'email!',
                password: 'string:8-64!',
                age: 'number:18-120',
                birthday: 'date',
                createdAt: 'datetime',
                loginTime: 'time',
                serverIp: 'ipv4',
                roles: 'array:1-5<string>',
                status: 'active|inactive|pending!',
                profile: {
                    bio: 'string:500',
                    avatar: 'url',
                    isPublic: 'boolean'
                }
            });

            expect(Object.keys(schema.properties)).to.have.lengthOf(11);
            expect(schema.required).to.include('username');
            expect(schema.required).to.include('email');
            expect(schema.required).to.include('password');
            expect(schema.required).to.include('status');
        });
    });
});
