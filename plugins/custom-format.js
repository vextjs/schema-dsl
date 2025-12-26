/**
 * 示例插件：自定义格式验证
 * 
 * @description 添加常用的格式验证（手机号、邮编、身份证等）
 * @module plugins/custom-format
 */

module.exports = {
    name: 'custom-format',
    version: '1.0.0',
    description: '自定义格式验证插件',

    install(coreInstance, options = {}, context) {
        // 获取默认 validator 实例
        const validator = schema-dsl.getDefaultValidator();
        const ajv = validator.getAjv();

        // 添加自定义格式
        this.addCustomFormats(ajv);

        console.log('[Plugin] custom-format installed');
    },

    uninstall(coreInstance, context) {
        console.log('[Plugin] custom-format uninstalled');
    },

    addCustomFormats(ajv) {
        // 1. 中国手机号
        ajv.addFormat('phone-cn', {
            validate: /^1[3-9]\d{9}$/
        });

        // 2. 中国邮政编码
        ajv.addFormat('postal-code-cn', {
            validate: /^\d{6}$/
        });

        // 3. IPv4 地址
        ajv.addFormat('ipv4', {
            validate: /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
        });

        // 4. 微信号
        ajv.addFormat('wechat', {
            validate: /^[a-zA-Z][-_a-zA-Z0-9]{5,19}$/
        });

        // 5. QQ号
        ajv.addFormat('qq', {
            validate: /^[1-9][0-9]{4,10}$/
        });

        // 6. 银行卡号（简单验证）
        ajv.addFormat('bank-card', {
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
            }
        });

        // 7. 车牌号（普通+新能源）
        ajv.addFormat('license-plate', {
            validate: /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-HJ-NP-Z0-9]{4,5}[A-HJ-NP-Z0-9挂学警港澳]$/
        });

        // 8. 统一社会信用代码
        ajv.addFormat('credit-code', {
            validate: /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/
        });

        // 9. 护照号（中国）
        ajv.addFormat('passport-cn', {
            validate: /^[EG]\d{8}$/
        });

        // 10. 港澳通行证
        ajv.addFormat('hk-macao-pass', {
            validate: /^[HM]\d{8,10}$/
        });
    }
};

