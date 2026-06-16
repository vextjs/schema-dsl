# 自定义类型注册

当前版本通过 `TypeRegistry` 提供类型注册能力；如果你更偏向 DSL 侧入口，也可以使用 `DslBuilder.registerType()`，它内部会委托给 `TypeRegistry`。

```javascript
const { TypeRegistry, dsl } = require('schema-dsl');

TypeRegistry.register('evenNumber', {
  baseSchema: { type: 'number', multipleOf: 2 }
});

const schema = dsl({ value: 'evenNumber!' });
```

如果你希望统一从 Builder 侧管理自定义类型，也可以这样写：

```javascript
const { DslBuilder } = require('schema-dsl');

DslBuilder.registerType('orderCode', {
  type: 'string',
  pattern: '^ORD\\d{6}$'
});
```

当插件或测试只需要移除一个 Builder 侧自定义类型时，使用 `DslBuilder.unregisterType('orderCode')`；只有确实要清空全部自定义类型（例如隔离测试收尾）时，才使用 `DslBuilder.clearCustomTypes()`。

自 `2.0.11` 起，自定义类型注册表在同一 Node.js 进程内会跨 ESM / CJS 入口共享。也就是说，`import { DslBuilder } from 'schema-dsl'` 注册的类型可以被 `require('schema-dsl')` 解析到，反向也成立。这适用于框架先把用户代码编译成 CJS、再由自身 ESM 链路生成 OpenAPI 或执行校验的场景。

该注册表按设计是进程级全局状态。请在应用或插件启动期一次性注册自定义类型，避免多个依赖分支重复定义同名类型；只有在插件显式卸载或隔离测试收尾时，才调用 `DslBuilder.unregisterType()` / `DslBuilder.clearCustomTypes()`。如果同一进程内同名注册发生多次，最后一次注册会生效。

插件化扩展可结合 [plugin-system.md](./plugin-system.md) 使用。

---

## 对应示例文件

**示例入口**: [plugin-type-registration.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/plugin-type-registration.ts)  
**说明**: 覆盖 `TypeRegistry.register()`、`DslBuilder.registerType()`，以及通过 `DslBuilder.unregisterType()` / `DslBuilder.clearCustomTypes()` 清理注册状态的路径。

