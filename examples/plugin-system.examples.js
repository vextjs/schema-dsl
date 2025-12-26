/**
 * 插件系统使用示例
 */

const { dsl, validate, PluginManager } = require('../index');

// ========== 1. 基础使用 ==========

console.log('=== 1. 基础使用 ===\n');

// 创建插件管理器
const pluginManager = new PluginManager();

// 注册插件
const customValidatorPlugin = require('../plugins/custom-validator');
pluginManager.register(customValidatorPlugin);

const customFormatPlugin = require('../plugins/custom-format');
pluginManager.register(customFormatPlugin);

// 安装插件
const schemaio = require('../index');
pluginManager.install(schemaio);

console.log('已安装插件:', pluginManager.list());
console.log('');

// ========== 2. 使用自定义格式 ==========

console.log('=== 2. 使用自定义格式 ===\n');

const contactSchema = dsl({
    phone: 'string!',
    email: 'email!',
    wechat: 'string'
});

// 测试数据
const validContact = {
    phone: '13800138000',
    email: 'test@example.com',
    wechat: 'my_wechat_id'
};

const result1 = validate(contactSchema, validContact);
console.log('验证结果:', result1.valid ? '✅ 通过' : '❌ 失败');
if (!result1.valid) {
    console.log('错误:', result1.errors);
}
console.log('');

// ========== 3. 使用钩子系统 ==========

console.log('=== 3. 使用钩子系统 ===\n');

// 注册钩子
pluginManager.hook('onBeforeValidate', (schema, data) => {
    console.log('[Hook] 验证前:', { schema: '...', data });
});

pluginManager.hook('onAfterValidate', (result) => {
    console.log('[Hook] 验证后:', { valid: result.valid });
});

// 运行钩子
const testSchema = dsl({ name: 'string!' });
const testData = { name: 'John' };

pluginManager.runHook('onBeforeValidate', testSchema, testData);
const result2 = validate(testSchema, testData);
pluginManager.runHook('onAfterValidate', result2);
console.log('');

// ========== 4. 自定义插件 ==========

console.log('=== 4. 自定义插件 ===\n');

// 创建自定义插件
const myPlugin = {
    name: 'my-plugin',
    version: '1.0.0',
    description: '我的自定义插件',

    install(schemaio, options, context) {
        console.log('[Plugin] my-plugin 安装中...');
        console.log('  选项:', options);
        console.log('  已注册插件数:', context.plugins.size);

        // 添加自定义方法
        schemaio.myCustomMethod = () => {
            console.log('  这是自定义方法!');
        };
    },

    uninstall(schemaio, context) {
        console.log('[Plugin] my-plugin 卸载中...');
        delete schemaio.myCustomMethod;
    },

    hooks: {
        onBeforeValidate(schema, data) {
            console.log('  [my-plugin] 验证前钩子');
        }
    }
};

// 注册并安装
pluginManager.register(myPlugin);
pluginManager.install(schemaio, 'my-plugin', { custom: true });

// 使用自定义方法
if (schemaio.myCustomMethod) {
    schemaio.myCustomMethod();
}
console.log('');

// ========== 5. 插件管理 ==========

console.log('=== 5. 插件管理 ===\n');

// 查看所有插件
console.log('所有插件:', pluginManager.list());

// 检查插件是否存在
console.log('my-plugin 是否存在:', pluginManager.has('my-plugin'));

// 获取插件数量
console.log('插件数量:', pluginManager.size);
console.log('');

// ========== 6. 实用插件示例 ==========

console.log('=== 6. 实用插件示例 ===\n');

// 日志插件
const loggingPlugin = {
    name: 'logging',
    version: '1.0.0',

    install(schemaio, options, context) {
        // 包装 validate 方法
        const originalValidate = schemaio.validate;
        schemaio.validate = function (...args) {
            console.log('[Logging] 开始验证');
            const start = Date.now();
            const result = originalValidate.apply(this, args);
            const duration = Date.now() - start;
            console.log(`[Logging] 验证完成，耗时 ${duration}ms，结果: ${result.valid ? '通过' : '失败'}`);
            return result;
        };
    }
};

pluginManager.register(loggingPlugin);
pluginManager.install(schemaio, 'logging');

// 测试日志插件
const schema = dsl({ email: 'email!' });
validate(schema, { email: 'test@example.com' });
console.log('');

// ========== 7. 卸载插件 ==========

console.log('=== 7. 卸载插件 ===\n');

pluginManager.uninstall('my-plugin', schemaio);
console.log('my-plugin 已卸载');
console.log('当前插件数:', pluginManager.size);
console.log('');

// ========== 8. 批量插件 ==========

console.log('=== 8. 批量插件 ===\n');

// 清空所有插件
pluginManager.clear(schemaio);
console.log('所有插件已清空');
console.log('当前插件数:', pluginManager.size);
console.log('');

// 批量注册多个插件
const plugins = [
    customValidatorPlugin,
    customFormatPlugin
];

plugins.forEach(plugin => pluginManager.register(plugin));
pluginManager.install(schemaio); // 安装所有插件

console.log('批量安装完成:', pluginManager.list());
console.log('');

// ========== 总结 ==========

console.log('=== 总结 ===\n');
console.log('✅ 插件系统支持:');
console.log('  - 动态注册/卸载插件');
console.log('  - 生命周期钩子');
console.log('  - 自定义验证器和格式');
console.log('  - 插件间通信');
console.log('  - 事件监听');
console.log('');
console.log('示例运行完成！');

