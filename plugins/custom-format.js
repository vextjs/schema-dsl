/**
 * 示例插件：自定义格式验证
 * 
 * @description 添加常用的格式验证（手机号、邮编、身份证等）
 * @module plugins/custom-format
 * @version 2.0.0 - 支持DSL类型注册
 */

module.exports = {
    name: 'custom-format',
    version: '2.0.0',
    description: '自定义格式验证插件（支持DSL类型注册）',

    install(schemaDsl, options = {}, context) {
        // 获取默认 validator 实例
        const validator = schemaDsl.getDefaultValidator();
        const ajv = validator.getAjv();

        // 获取 DslBuilder 类（用于注册DSL类型）
        const { DslBuilder } = schemaDsl;

        // 🔴 同时注册两个层面：
        // 1. ajv format（验证阶段） - 验证数据格式
        // 2. DSL type（解析阶段） - 让DSL语法认识这些类型
        this.addCustomFormats(ajv, DslBuilder);

        console.log('[Plugin] custom-format v2.0.0 installed (with DSL type registration)');
    },

    uninstall(schemaDsl, context) {
        console.log('[Plugin] custom-format uninstalled');
    },

    /**
     * 添加自定义格式和DSL类型
     * @param {Object} ajv - AJV实例
     * @param {Class} DslBuilder - DslBuilder类
     */
    addCustomFormats(ajv, DslBuilder) {
        // 🔴 定义格式配置（统一管理）
        const formats = {
            // 1. 中国手机号
            'phone-cn': {
                pattern: /^1[3-9]\d{9}$/,
                schema: { type: 'string', pattern: /^1[3-9]\d{9}$/.source, minLength: 11, maxLength: 11 }
            },

            // 2. 中国邮政编码
            'postal-code-cn': {
                pattern: /^\d{6}$/,
                schema: { type: 'string', pattern: /^\d{6}$/.source, minLength: 6, maxLength: 6 }
            },

            // 3. IPv4 地址（已内置，这里重新注册以示例）
            'ipv4-custom': {
                pattern: /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
                schema: { type: 'string', format: 'ipv4' }
            },

            // 4. 微信号
            'wechat': {
                pattern: /^[a-zA-Z][-_a-zA-Z0-9]{5,19}$/,
                schema: { type: 'string', pattern: /^[a-zA-Z][-_a-zA-Z0-9]{5,19}$/.source, minLength: 6, maxLength: 20 }
            },

            // 5. QQ号
            'qq': {
                pattern: /^[1-9][0-9]{4,10}$/,
                schema: { type: 'string', pattern: /^[1-9][0-9]{4,10}$/.source, minLength: 5, maxLength: 11 }
            },

            // 6. 银行卡号（Luhn算法验证）
            'bank-card': {
                validate: (value) => {
                    if (!/^\d{16,19}$/.test(value)) return false;

                    // Luhn 算法验证
                    let sum = 0;
                    let shouldDouble = false;

                    for (let i = value.length - 1; i >= 0; i--) {
                        let digit = parseInt(value[i]);

                        if (shouldDouble) {
                            digit *= 2;
                            if (digit > 9) digit -= 9;
                        }

                        sum += digit;
                        shouldDouble = !shouldDouble;
                    }

                    return sum % 10 === 0;
                },
                schema: { type: 'string', minLength: 16, maxLength: 19, pattern: /^\d{16,19}$/.source }
            },

            // 7. 车牌号（普通+新能源）
            'license-plate': {
                pattern: /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-HJ-NP-Z0-9]{4,5}[A-HJ-NP-Z0-9挂学警港澳]$/,
                schema: { type: 'string', pattern: /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-HJ-NP-Z0-9]{4,5}[A-HJ-NP-Z0-9挂学警港澳]$/.source }
            },

            // 8. 统一社会信用代码
            'credit-code': {
                pattern: /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/,
                schema: { type: 'string', pattern: /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/.source, minLength: 18, maxLength: 18 }
            },

            // 9. 护照号（中国）
            'passport-cn': {
                pattern: /^[EG]\d{8}$/,
                schema: { type: 'string', pattern: /^[EG]\d{8}$/.source, minLength: 9, maxLength: 9 }
            },

            // 10. 港澳通行证
            'hk-macao-pass': {
                pattern: /^[HM]\d{8,10}$/,
                schema: { type: 'string', pattern: /^[HM]\d{8,10}$/.source, minLength: 9, maxLength: 11 }
            }
        };

        // 🔴 注册所有格式
        Object.keys(formats).forEach(name => {
            const config = formats[name];

            // 1. 注册到ajv（验证阶段）
            ajv.addFormat(name, {
                validate: config.validate || config.pattern
            });

            // 2. 注册到DslBuilder（解析阶段）- 让DSL语法认识这些类型
            if (DslBuilder && DslBuilder.registerType) {
                DslBuilder.registerType(name, config.schema);
            }
        });
    }
};


