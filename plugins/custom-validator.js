/**
 * 示例插件：自定义验证器
 * 
 * @description 展示如何创建一个自定义验证器插件
 * @module plugins/custom-validator
 */

module.exports = {
    // 插件元信息
    name: 'custom-validator',
    version: '1.0.0',
    description: '自定义验证器插件，添加业务特定的验证规则',

    /**
     * 插件安装函数
     * 
     * @param {Object} schema-dsl - SchemaIO 实例
     * @param {Object} options - 插件选项
     * @param {Object} context - 插件上下文
     */
    install(coreInstance, options = {}, context) {
        // 1. 获取默认 validator 实例
        const validator = schema-dsl.getDefaultValidator();

        // 2. 添加自定义关键字
        this.addCustomKeywords(validator);

        // 3. 注册到全局
        if (!global.__schema-dsl_plugins) {
            global.__schema-dsl_plugins = {};
        }
        global.__schema-dsl_plugins['custom-validator'] = this;

        console.log('[Plugin] custom-validator installed');
    },

    /**
     * 插件卸载函数
     */
    uninstall(coreInstance, context) {
        // 清理全局注册
        if (global.__schema-dsl_plugins) {
            delete global.__schema-dsl_plugins['custom-validator'];
        }

        console.log('[Plugin] custom-validator uninstalled');
    },

    /**
     * 添加自定义关键字
     */
    addCustomKeywords(validator) {
        const ajv = validator.getAjv();

        // 示例1: 唯一性验证（需要异步检查数据库）
        // 检查关键字是否已存在
        if (!ajv.getKeyword('unique')) {
            validator.addKeyword('unique', {
                async: true,
                type: 'string',
                validate: async function validateUnique(schema, data, parentSchema, dataPath) {
                    // schema: { unique: { table: 'users', field: 'email' } }
                    // data: 实际要验证的值

                    if (!schema) return true;

                    const { table, field } = schema;

                    // 模拟数据库查询
                    // 实际使用时替换为真实的数据库查询
                    const exists = false; // await db.query(...)

                    if (exists) {
                        validateUnique.errors = [{
                            keyword: 'unique',
                            message: `${field} already exists in ${table}`,
                            params: { table, field }
                        }];
                        return false;
                    }

                    return true;
                }
            });
        }

        // 示例2: 密码强度验证
        if (!ajv.getKeyword('passwordStrength')) {
            validator.addKeyword('passwordStrength', {
                type: 'string',
                validate: function validatePasswordStrength(schema, data) {
                    if (!schema) return true;

                    // schema: { passwordStrength: 'medium' }
                    // 强度等级: weak, medium, strong

                    const strength = schema;
                    const value = data;

                    const rules = {
                        weak: /^.{6,}$/,
                        medium: /^(?=.*[a-z])(?=.*[A-Z]).{8,}$/,
                        strong: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}$/
                    };

                    const pattern = rules[strength];
                    if (!pattern) {
                        return true;
                    }

                    if (!pattern.test(value)) {
                        validatePasswordStrength.errors = [{
                            keyword: 'passwordStrength',
                            message: `Password does not meet ${strength} strength requirements`,
                            params: { strength }
                        }];
                        return false;
                    }

                    return true;
                }
            });
        }

        // 示例3: 中国身份证号验证
        if (!ajv.getKeyword('idCard')) {
            validator.addKeyword('idCard', {
                type: 'string',
                validate: function validateIdCard(schema, data) {
                    if (!schema) return true;

                    const value = data;

                    // 身份证号正则
                    const pattern = /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;

                    if (!pattern.test(value)) {
                        validateIdCard.errors = [{
                            keyword: 'idCard',
                            message: 'Invalid ID card number',
                            params: {}
                        }];
                        return false;
                    }

                    // 验证校验码
                    if (!this._validateIdCardChecksum(value)) {
                        validateIdCard.errors = [{
                            keyword: 'idCard',
                            message: 'Invalid ID card checksum',
                            params: {}
                        }];
                        return false;
                    }

                    return true;
                }
            });
        }
    },

    /**
     * 验证身份证校验码
     * @private
     */
    _validateIdCardChecksum(idCard) {
        const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
        const checksums = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];

        let sum = 0;
        for (let i = 0; i < 17; i++) {
            sum += parseInt(idCard[i]) * weights[i];
        }

        const checksum = checksums[sum % 11];
        return idCard[17].toUpperCase() === checksum;
    },

    /**
     * 生命周期钩子
     */
    hooks: {
        onBeforeValidate(schema, data) {
            // 验证前钩子
            // 可以在这里修改 schema 或 data
        },

        onAfterValidate(result) {
            // 验证后钩子
            // 可以在这里修改验证结果
        },

        onError(error, context) {
            // 错误处理钩子
            console.error('[custom-validator] Error:', error.message);
        }
    }
};

