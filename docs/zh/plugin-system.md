# 插件管理器（高级）

本页讲的是 `PluginManager`：生命周期、hook、安装/卸载和集成编排。

如果你的目标只是添加可复用业务类型，请先从 [扩展概览](extensions-overview.md) 和 [自定义扩展](custom-extensions.md) 开始。`PluginManager` 是把这些能力封装和协调起来的高级层。

## 概述

`PluginManager` 是一个独立的插件管理器，负责：

- 注册 / 安装 / 卸载插件
- 管理插件钩子
- 提供 `EventEmitter` 兼容事件系统
- 通过 `context` 暴露插件注册表和钩子表

> **重要说明**
> `PluginManager` 本身不会自动接入 `s()`、`Validator`、各类 Exporter 的执行流程。
> 如果你希望在验证、编译或导出阶段运行某些 hook，需要由你的集成代码显式调用 `pluginManager.runHook(...)`。

---

## 快速开始

```javascript
import { PluginManager } from 'schema-dsl/pure';
import * as schemaDsl from 'schema-dsl/pure';

const pluginManager = new PluginManager();

const myPlugin = {
  name: 'my-plugin',
  version: '1.0.0',
  description: '我的自定义插件',

  install(core, options, context) {
    console.log('installed:', !!core, options);
    console.log('registered plugins:', context.plugins.size);
  },

  uninstall(core, context) {
    console.log('cleanup:', !!core, context.hooks.size);
  }
};

pluginManager.register(myPlugin);
pluginManager.install(schemaDsl, 'my-plugin', { enabled: true });
pluginManager.uninstall('my-plugin', schemaDsl);
```

---

## 插件对象结构

```javascript
export default {
  // 必填
  name: 'plugin-name',
  install(core, options, context) {
    // 安装逻辑
  },

  // 可选
  version: '1.0.0',
  description: '插件描述',
  uninstall(core, context) {
    // 卸载逻辑
  },
  hooks: {
    onBeforeValidate(schema, data) {},
    onAfterValidate(result) {}
  },
  options: {
    enabled: true
  }
};
```

### 参数说明

| 参数 | 说明 |
|---|---|
| `core` | 传给 `install()` / `uninstall()` 的核心对象，通常是 `import * as schemaDsl from 'schema-dsl/pure'` 的结果或你自己的集成对象 |
| `options` | 安装时的合并配置：`{ ...plugin.options, ...installOptions }` |
| `context.plugins` | 当前已注册插件的 `Map<string, Plugin>` |
| `context.hooks` | 当前 hook 注册表的 `Map<string, Function[]>` |

---

## 钩子系统

### 1. 自动触发的内置生命周期

这些 hook 由 `PluginManager` 自动触发：

| 名称 | 触发时机 | 参数 |
|---|---|---|
| `onBeforeRegister` | `register(plugin)` 写入注册表前 | `(plugin)` |
| `onAfterRegister` | `register(plugin)` 完成后 | `(plugin)` |
| `onError` | 某个 hook 执行抛错后 | `(error, meta)` |

### 2. 约定式 hook 名称

以下名称是常用约定，`PluginManager` 支持注册它们，但**是否执行取决于你的代码是否调用 `runHook()`**：

| 名称 | 常见用途 |
|---|---|
| `onBeforeValidate` / `onAfterValidate` | 验证前后 |
| `onBeforeCompile` / `onAfterCompile` | 编译前后 |
| `onBeforeExport` / `onAfterExport` | 导出前后 |
| `beforeParse` / `afterParse` | 解析阶段 |
| `beforeValidate` / `afterValidate` | v2 风格命名 |
| `beforeCompile` / `afterCompile` | v2 风格命名 |

> `hook()` / `runHook()` 支持任意字符串名称，不限于上表。

### 3. 注册与运行 hook

```javascript
pluginManager.hook('onBeforeValidate', (schema, data) => {
  console.log('验证前:', schema, data);
});

const results = await pluginManager.runHook('onBeforeValidate', schema, data);
```

### 4. 在插件中声明 hook

```javascript
const loggingPlugin = {
  name: 'logging',
  install() {},
  hooks: {
    onBeforeValidate(schema, data) {
      console.log('before validate', schema, data);
    },
    onAfterValidate(result) {
      console.log('after validate', result);
    }
  }
};

pluginManager.register(loggingPlugin);
await pluginManager.runHook('onBeforeValidate', schema, data);
```

---

## 事件系统

`PluginManager` 继承自 `EventEmitter`，因此可以使用：

- `on()`
- `once()`
- `off()`
- `emit()`
- `removeListener()`
- `removeAllListeners()`

### 可用事件

| 事件名 | 触发时机 | 参数 |
|---|---|---|
| `plugin:registered` | 插件注册成功 | `(plugin)` |
| `plugin:installed` | 插件安装成功 | `(plugin)` |
| `plugin:uninstalled` | 插件卸载成功 | `(plugin)` |
| `plugin:error` | 插件安装 / 卸载失败 | `({ plugin, error })` |
| `hook:error` | hook 执行失败 | `({ hookName, handler, error })` |
| `plugins:cleared` | `clear()` 完成后 | `()` |

### 示例

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

pluginManager.on('hook:error', ({ hookName, error }) => {
  console.error('Hook 错误:', hookName, error.message);
});
```

---

## API 参考

### `register(plugin)`

注册插件，并自动触发：

1. `onBeforeRegister`
2. 写入注册表 / 注册插件自带 hooks
3. `onAfterRegister`
4. `plugin:registered`

### `install(core, [pluginName], [options])`

安装插件。

- `install(core)`：安装所有已注册插件
- `install(core, 'name', options)`：安装指定插件
- `install()` 时会把第三个参数 `context` 传给插件
- 安装成功后触发 `plugin:installed`
- 安装失败时触发 `plugin:error`，然后抛错

### `unregister(name, [core])`

卸载插件并移除该插件注册的 hooks。

- `plugin.uninstall(core, context)` 成功后才会真正移除插件
- 卸载成功后触发 `plugin:uninstalled`
- 卸载失败时触发 `plugin:error`，然后抛错

### `uninstall(name, [core])`

`unregister()` 的别名，兼容 v1。

### `hook(name, handler)`

注册一个 hook 处理器。

### `unhook(name, handler)`

移除指定 hook 处理器。

### `runHook(name, ...args)`

异步运行某个 hook 下的全部处理器，返回结果数组。

- 单个 handler 抛错不会中断后续 handler
- 抛错时会触发 `hook:error`
- 同时会执行 `onError`

### `has(name)`

检查插件是否已注册。

### `get([name])`

- `get(name)`：获取单个插件
- `get()`：获取全部插件 `Map`

### `list()`

返回插件元数据数组：

```javascript
[{ name, version, description }]
```

### `clear([core])`

逐个卸载所有插件，清空注册表和 hooks，最后触发 `plugins:cleared`。

### 属性

| 属性 | 说明 |
|---|---|
| `pluginManager.plugins` | 插件注册表 `Map<string, Plugin>` |
| `pluginManager.hooks` | hook 注册表 `Map<string, Function[]>` |
| `pluginManager.context` | `{ plugins, hooks }` |
| `pluginManager.size` | 已注册插件数量 |
| `pluginManager.pluginCount` | 已注册插件数量（别名） |

---

## 最佳实践

### 1. 命名

使用 `kebab-case`：

```javascript
name: 'custom-validator'
name: 'mongodb-plugin'
```

### 2. 错误处理

```javascript
install(core, options, context) {
  try {
    // 安装逻辑
  } catch (error) {
    throw error;
  }
}
```

### 3. 资源清理

```javascript
uninstall(core, context) {
  // 清理注册的资源
}
```

### 4. 插件间通信

```javascript
install(core, options, context) {
  if (!context.plugins.has('dependency-plugin')) {
    throw new Error('需要先安装 dependency-plugin');
  }
}
```

---

## 故障排查

### 插件未生效

```javascript
pluginManager.has('my-plugin');
pluginManager.list();
```

确认插件已注册、已安装，并且 `install()` 确实执行到了你的逻辑。

### hook 未触发

检查两件事：

1. hook 名称是否一致
2. 你的代码是否真的调用了 `pluginManager.runHook('hookName', ...)`

### 当前仓库的发布方式

当前仓库已恢复 v1 风格的官方插件子路径入口，可直接使用：

- `schema-dsl/plugins/custom-format`
- `schema-dsl/plugins/custom-validator`
- `schema-dsl/plugins/custom-type-example`

```javascript
import { PluginManager } from 'schema-dsl/pure';
import * as schemaDsl from 'schema-dsl/pure';
import customFormat from 'schema-dsl/plugins/custom-format';

const pluginManager = new PluginManager();
pluginManager.register(customFormat);
pluginManager.install(schemaDsl, 'custom-format');
```

```typescript
import { PluginManager } from 'schema-dsl/pure';
import * as schemaDsl from 'schema-dsl/pure';
import customTypeExample from 'schema-dsl/plugins/custom-type-example';

const pluginManager = new PluginManager();
pluginManager.register(customTypeExample);
pluginManager.install(schemaDsl, 'custom-type-example');
```

> ⚠️ 注意：官方插件子路径只补齐了 v1 已存在的三个示例插件入口；
> `PluginManager` 仍然不会自动接入 `validate()` / `compile()` / exporter 流程，hook 是否执行仍取决于你的集成代码是否显式调用 `runHook()`。

---

## 相关文档

- [API 参考](api-reference.md)
- [验证指南](validate.md)
- [DSL 语法](dsl-syntax.md)

---

## 对应示例文件

**示例入口**: [plugin-system.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/plugin-system.ts)
**说明**: 覆盖自定义插件的注册 / 安装 / 卸载、`runHook()` 执行结果，以及官方 `custom-format` 子路径插件的安装效果。

