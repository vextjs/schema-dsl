# 插件系统


> **更新**: 2025-12-26  
> **状态**: ✅ 稳定

---

## 📑 目录

- [概述](#概述)
- [快速开始](#快速开始)
- [插件开发](#插件开发)
- [钩子系统](#钩子系统)
- [插件示例](#插件示例)
- [最佳实践](#最佳实践)
- [API 参考](#api-参考)

---

## 概述

SchemaI-DSL 插件系统允许你扩展核心功能，添加自定义验证器、格式化器、导出器等。

### 特性

✅ **动态加载** - 运行时注册/卸载插件  
✅ **生命周期钩子** - 在关键时刻执行自定义逻辑  
✅ **事件驱动** - 基于 EventEmitter 的事件系统  
✅ **依赖管理** - 插件间通信和依赖注入  
✅ **TypeScript 支持** - 完整的类型定义

### 架构

```
PluginManager
├── 插件注册表 (Map)
├── 钩子系统 (Hooks)
├── 事件系统 (EventEmitter)
└── 上下文 (Context)
```

---

## 快速开始

### 1. 创建插件管理器

```javascript
const { PluginManager } = require('schema-dsl');

const pluginManager = new PluginManager();
```

### 2. 注册插件

```javascript
const myPlugin = {
  name: 'my-plugin',
  version: '1.0.0',
  description: '我的自定义插件',

  install(schemaDsl, options, context) {
    console.log('插件安装成功！');
  }
};

pluginManager.register(myPlugin);
```

### 3. 安装插件

```javascript
const schemaDsl = require('schema-dsl');

pluginManager.install(schemaDsl, 'my-plugin');
```

### 4. 使用插件

插件安装后，自动生效，无需额外配置。

---

## 插件开发

### 插件结构

一个标准的插件对象包含以下字段：

```javascript
module.exports = {
  // ========== 必填 ==========
  name: 'plugin-name',          // 插件名称（唯一）
  install: function(schemaDsl, options, context) {
    // 安装逻辑
  },

  // ========== 可选 ==========
  version: '1.0.0',            // 插件版本
  description: '插件描述',      // 插件描述
  uninstall: function(schemaDsl, context) {
    // 卸载逻辑
  },
  hooks: {                      // 生命周期钩子
    onBeforeValidate: function() {},
    onAfterValidate: function() {}
  },
  options: {                    // 默认选项
    enabled: true
  }
};
```

### 示例：自定义验证器插件

```javascript
module.exports = {
  name: 'custom-validator',
  version: '1.0.0',

  install(schemaDsl, options, context) {
    const { Validator } = schemaDsl;
    
    // 添加自定义关键字
    Validator.prototype.addKeyword('unique', {
      async: true,
      validate: async function(schema, data) {
        // 验证逻辑
        const exists = await checkDatabase(data);
        return !exists;
      }
    });
  }
};
```

### 示例：自定义格式插件

```javascript
module.exports = {
  name: 'custom-format',
  version: '1.0.0',

  install(schemaDsl, options, context) {
    const validator = schemaDsl.getDefaultValidator();
    const ajv = validator.getAjv();
    
    // 添加自定义格式
    ajv.addFormat('phone-cn', {
      validate: /^1[3-9]\d{9}$/
    });
  }
};
```

---

## 钩子系统

### 可用钩子

| 钩子名称 | 触发时机 | 参数 |
|---------|---------|------|
| `onBeforeRegister` | 插件注册前 | `(plugin)` |
| `onAfterRegister` | 插件注册后 | `(plugin)` |
| `onBeforeValidate` | 验证前 | `(schema, data)` |
| `onAfterValidate` | 验证后 | `(result)` |
| `onBeforeExport` | 导出前 | `(schema, options)` |
| `onAfterExport` | 导出后 | `(result)` |
| `onError` | 错误发生时 | `(error, context)` |

### 注册钩子

```javascript
pluginManager.hook('onBeforeValidate', (schema, data) => {
  console.log('验证前:', schema, data);
});
```

### 运行钩子

```javascript
const results = await pluginManager.runHook('onBeforeValidate', schema, data);
```

### 插件中定义钩子

```javascript
module.exports = {
  name: 'my-plugin',
  
  hooks: {
    onBeforeValidate(schema, data) {
      // 在这里修改 schema 或 data
    },
    
    onAfterValidate(result) {
      // 在这里修改验证结果
    }
  }
};
```

---

## 插件示例

当前仓库**没有**发布 `schema-dsl/plugins/*` 这类内置插件入口；推荐方式是直接注册本地插件对象或你自己封装的模块。

### 1. 自定义验证插件

```javascript
const customValidatorPlugin = {
  name: 'custom-validator',
  install() {
    // 在这里注册自定义关键字、Hook 或业务规则
  },
};

pluginManager.register(customValidatorPlugin);
```

**适合放入的能力**:
- `passwordStrength` - 密码强度验证
- `idCard` - 身份证号验证
- 业务字段的一致性检查

### 2. 自定义格式插件

```javascript
const customFormatPlugin = {
  name: 'custom-format',
  install() {
    // 在这里注册额外格式或 pattern
  },
};

pluginManager.register(customFormatPlugin);
```

**常见扩展方向**:
- `phone-cn` - 中国手机号
- `postal-code-cn` - 邮政编码
- `wechat` - 微信号
- `qq` - QQ号
- `license-plate` - 车牌号

---

## 最佳实践

### 1. 插件命名

使用 `kebab-case` 命名：

```javascript
// ✅ 推荐
name: 'custom-validator'
name: 'mongodb-plugin'

// ❌ 不推荐
name: 'CustomValidator'
name: 'mongodb_plugin'
```

### 2. 版本管理

使用语义化版本：

```javascript
version: '1.0.0'   // 主版本.次版本.修订版本
```

### 3. 错误处理

插件应该优雅地处理错误：

```javascript
install(schema-dsl, options, context) {
  try {
    // 安装逻辑
  } catch (error) {
    console.error(`[${this.name}] 安装失败:`, error.message);
    throw error; // 重新抛出，让调用者知道
  }
}
```

### 4. 清理资源

提供 `uninstall` 方法：

```javascript
uninstall(schema-dsl, context) {
  // 清理注册的验证器、格式、钩子等
  delete schemaDsl.myCustomMethod;
}
```

### 5. 文档

为你的插件编写清晰的文档：

```javascript
/**
 * 我的自定义插件
 * 
 * @description 添加业务特定的验证规则
 * 
 * @example
 * ```javascript
 * pluginManager.register(myPlugin);
 * pluginManager.install(schema-dsl);
 * ```
 */
module.exports = { /* ... */ };
```

---

## API 参考

### PluginManager

#### `register(plugin)`

注册插件。

**参数**:
- `plugin` (Object) - 插件配置

**返回**: `this`

**示例**:
```javascript
pluginManager.register({
  name: 'my-plugin',
  install(schema-dsl) {
    // ...
  }
});
```

#### `install(schema-dsl, [pluginName], [options])`

安装插件。

**参数**:
- `schema-dsl` (Object) - SchemaI-DSL 实例
- `pluginName` (String, optional) - 插件名称
- `options` (Object, optional) - 安装选项

**返回**: `this`

#### `uninstall(pluginName, schema-dsl)`

卸载插件。

**参数**:
- `pluginName` (String) - 插件名称
- `schema-dsl` (Object) - SchemaI-DSL 实例

**返回**: `this`

#### `hook(hookName, handler)`

注册钩子。

**参数**:
- `hookName` (String) - 钩子名称
- `handler` (Function) - 钩子处理函数

**返回**: `this`

#### `runHook(hookName, ...args)`

运行钩子。

**参数**:
- `hookName` (String) - 钩子名称
- `...args` (any) - 钩子参数

**返回**: `Promise<any[]>`

#### `list()`

获取插件列表。

**返回**: `Array<{name, version, description}>`

#### `has(pluginName)`

检查插件是否存在。

**参数**:
- `pluginName` (String) - 插件名称

**返回**: `Boolean`

#### `clear(schema-dsl)`

清空所有插件。

**参数**:
- `schema-dsl` (Object) - SchemaI-DSL 实例

**返回**: `this`

---

## 事件系统

PluginManager 继承自 EventEmitter，支持事件监听：

```javascript
pluginManager.on('plugin:registered', (plugin) => {
  console.log('插件已注册:', plugin.name);
});

pluginManager.on('plugin:installed', (plugin) => {
  console.log('插件已安装:', plugin.name);
});

pluginManager.on('plugin:error', ({ plugin, error }) => {
  console.error('插件错误:', plugin.name, error.message);
});
```

**可用事件**:
- `plugin:registered` - 插件注册成功
- `plugin:installed` - 插件安装成功
- `plugin:uninstalled` - 插件卸载成功
- `plugin:error` - 插件错误
- `hook:error` - 钩子执行错误
- `plugins:cleared` - 所有插件已清空

---

## 进阶话题

### 1. 插件间通信

通过 `context` 参数访问其他插件：

```javascript
install(schema-dsl, options, context) {
  // 检查依赖插件
  if (!context.plugins.has('dependency-plugin')) {
    throw new Error('需要先安装 dependency-plugin');
  }
  
  // 获取其他插件实例
  const depPlugin = context.plugins.get('dependency-plugin');
}
```

### 2. 插件配置

通过 `options` 参数传递配置：

```javascript
// 注册时设置默认配置
module.exports = {
  name: 'my-plugin',
  options: {
    strict: false,
    maxRetries: 3
  },
  
  install(schema-dsl, options) {
    const config = { ...this.options, ...options };
    console.log('配置:', config);
  }
};

// 安装时覆盖配置
pluginManager.install(schema-dsl, 'my-plugin', {
  strict: true
});
```

### 3. 异步安装

插件安装函数可以是异步的：

```javascript
module.exports = {
  name: 'async-plugin',
  
  async install(schema-dsl, options) {
    // 异步初始化
    await this.loadConfig();
    await this.connectDatabase();
  }
};
```

---

## 故障排查

### 插件未生效

1. 检查插件是否已注册：
```javascript
console.log(pluginManager.has('my-plugin')); // true?
```

2. 检查插件是否已安装：
```javascript
pluginManager.list(); // 是否在列表中?
```

3. 检查 `install` 函数是否正确执行。

### 钩子未触发

1. 确认钩子名称拼写正确。
2. 使用 `pluginManager.hooks.get('hookName')` 查看已注册的钩子。

### 插件冲突

如果两个插件修改同一个方法，后安装的会覆盖前一个。解决方案：
- 使用不同的方法名
- 在插件中保存原始方法的引用

---

## 完整示例

见 [examples/plugin-system.examples.ts](../examples/plugin-system.examples.ts)

---

## 相关文档

- [API 参考](api-reference.md)
- [最佳实践](best-practices.md)
- [故障排查](troubleshooting.md)

---

**贡献**

欢迎提交你的插件到官方插件库！请提交 PR 到 `plugins/` 目录。

