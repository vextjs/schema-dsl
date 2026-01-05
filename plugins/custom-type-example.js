/**
 * 示例插件：自定义类型注册
 *
 * @description 演示如何创建插件并注册自定义DSL类型
 * @module plugins/custom-type-example
 * @version 1.0.0
 *
 * 使用场景：
 * - 业务特定的数据类型（订单号、商品编码等）
 * - 复杂验证规则（需要多个条件组合）
 * - 与第三方系统集成的数据格式
 */

module.exports = {
    name: 'custom-type-example',
    version: '1.0.0',
    description: '自定义类型注册示例插件',

    install(schemaDsl, options = {}, context) {
        // 获取 DslBuilder 类
        const { DslBuilder } = schemaDsl;

        if (!DslBuilder || !DslBuilder.registerType) {
            throw new Error('DslBuilder.registerType is not available. Please upgrade to schema-dsl v1.1.0+');
        }

        // 注册自定义类型
        this.registerCustomTypes(DslBuilder);

        console.log('[Plugin] custom-type-example installed');
    },

    uninstall(schemaDsl, context) {
        console.log('[Plugin] custom-type-example uninstalled');
    },

    /**
     * 注册自定义类型
     * @param {Class} DslBuilder - DslBuilder类
     */
    registerCustomTypes(DslBuilder) {
        // 示例1：订单号（固定格式）
        DslBuilder.registerType('order-id', {
            type: 'string',
            pattern: /^ORD[0-9]{12}$/.source,
            minLength: 15,
            maxLength: 15,
            _customMessages: {
                pattern: '订单号格式不正确，应为ORD开头的15位字符'
            }
        });

        // 示例2：商品SKU编码
        DslBuilder.registerType('sku', {
            type: 'string',
            pattern: /^SKU-[A-Z0-9]{6,10}$/.source,
            minLength: 10,
            maxLength: 14,
            _customMessages: {
                pattern: 'SKU编码格式不正确，应为SKU-开头加6-10位字母数字'
            }
        });

        // 示例3：价格（正数，最多2位小数）
        DslBuilder.registerType('price', {
            type: 'number',
            minimum: 0,
            multipleOf: 0.01,  // 最多2位小数
            _customMessages: {
                minimum: '价格不能为负数',
                multipleOf: '价格最多保留2位小数'
            }
        });

        // 示例4：评分（1-5星）
        DslBuilder.registerType('rating', {
            type: 'integer',
            minimum: 1,
            maximum: 5,
            _customMessages: {
                minimum: '评分不能低于1星',
                maximum: '评分不能超过5星'
            }
        });

        // 示例5：颜色代码（支持多种格式）
        DslBuilder.registerType('color-code', {
            oneOf: [
                { type: 'string', pattern: /^#[0-9A-Fa-f]{6}$/.source },  // Hex: #RRGGBB
                { type: 'string', pattern: /^#[0-9A-Fa-f]{3}$/.source },  // Hex: #RGB
                { type: 'string', pattern: /^rgb\(\d{1,3},\s*\d{1,3},\s*\d{1,3}\)$/.source },  // rgb(R, G, B)
                { type: 'string', pattern: /^rgba\(\d{1,3},\s*\d{1,3},\s*\d{1,3},\s*(0|1|0?\.\d+)\)$/.source }  // rgba(R, G, B, A)
            ]
        });

        // 示例6：版本号（语义化版本）
        DslBuilder.registerType('semver', {
            type: 'string',
            pattern: /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/.source,
            _customMessages: {
                pattern: '版本号格式不正确，应遵循语义化版本规范（如：1.0.0, 2.1.3-beta.1）'
            }
        });

        // 示例7：动态生成Schema（函数方式）
        DslBuilder.registerType('dynamic-age', function() {
            const currentYear = new Date().getFullYear();
            return {
                type: 'integer',
                minimum: 0,
                maximum: currentYear - 1900,  // 动态计算最大年龄
                _customMessages: {
                    minimum: '年龄不能为负数',
                    maximum: `年龄不能超过${currentYear - 1900}岁`
                }
            };
        });

        // 示例8：国际化手机号（支持多国格式）
        DslBuilder.registerType('phone-intl', {
            type: 'string',
            pattern: /^\+?[1-9]\d{1,14}$/.source,  // E.164格式
            minLength: 8,
            maxLength: 15,
            _customMessages: {
                pattern: '请输入有效的国际手机号（E.164格式）'
            }
        });
    }
};

/**
 * 使用示例：
 *
 * // 1. 注册插件
 * const { PluginManager, dsl } = require('schema-dsl');
 * const customTypePlugin = require('./plugins/custom-type-example');
 *
 * const pluginManager = new PluginManager();
 * pluginManager.register(customTypePlugin);
 * pluginManager.install(require('schema-dsl'));
 *
 * // 2. 在DSL中使用自定义类型
 * const orderSchema = dsl({
 *   orderId: 'order-id!',           // ORD开头的15位订单号
 *   sku: 'sku!',                    // SKU编码
 *   price: 'price!',                // 价格（正数，2位小数）
 *   rating: 'rating',               // 评分（1-5星）
 *   color: 'color-code',            // 颜色代码
 *   version: 'semver!',             // 语义化版本号
 *   age: 'dynamic-age',             // 动态年龄验证
 *   phone: 'phone-intl'             // 国际手机号
 * });
 *
 * // 3. 在types:中使用自定义类型
 * const flexSchema = dsl({
 *   identifier: 'types:order-id|sku',  // 订单号或SKU编码
 *   contact: 'types:email|phone-intl'  // 邮箱或国际手机号
 * });
 *
 * // 4. 验证数据
 * const { validate } = require('schema-dsl');
 *
 * const result1 = validate(orderSchema, {
 *   orderId: 'ORD202401010001',
 *   sku: 'SKU-ABC123',
 *   price: 99.99,
 *   rating: 5,
 *   color: '#FF5733',
 *   version: '1.2.3',
 *   age: 30,
 *   phone: '+8613800138000'
 * });
 *
 * console.log(result1.valid);  // true
 *
 * const result2 = validate(flexSchema, {
 *   identifier: 'ORD202401010001',  // ✅ 匹配订单号
 *   contact: 'user@example.com'     // ✅ 匹配邮箱
 * });
 *
 * console.log(result2.valid);  // true
 */

