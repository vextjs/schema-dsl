# Plugin Manager (advanced)

> **Update**: 2026-05-01
> **Status**: ✅ Stable

---

This page is about `PluginManager`: lifecycle, hooks, install/uninstall, and integration orchestration.

If your goal is only to add a reusable type, factory, or builder method, start with [Extension Overview](extensions-overview.md), [Custom DSL Types](plugin-type-registration.md), [Custom s.xxx() Factories](custom-factories.md), or [Custom Chain Methods](custom-chain-methods.md). `PluginManager` is the advanced layer for packaging and coordinating those capabilities.

## Overview

`PluginManager` is an independent plug-in manager responsible for:

- Register/install/uninstall plug-in
- Manage plugin hooks
- Provide `EventEmitter` compatible event system
- Expose plugin registry and hook table through `context`

> **Important Note**
> `PluginManager` itself will not automatically connect to the execution processes of `s()`, `Validator`, and various Exporters.
> If you wish to run certain hooks during the validation, compilation or export phases, `pluginManager.runHook(...)` needs to be called explicitly by your integration code.

---

## quick start

```javascript
import { PluginManager } from 'schema-dsl/pure';
import * as schemaDsl from 'schema-dsl/pure';

const pluginManager = new PluginManager();

const myPlugin = {
  name: 'my-plugin',
  version: '1.0.0',
  description: 'My custom plug-in',

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

## Plug-in object structure

```javascript
export default {
  // required
  name: 'plugin-name',
  install(core, options, context) {
    //Installation logic
  },

  // optional
  version: '1.0.0',
  description: 'Plug-in description',
  uninstall(core, context) {
    // Uninstall logic
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

### Parameter description

| Parameter | Description |
|---|---|
| `core` | The core object passed to `install()` / `uninstall()`, usually the result of `import * as schemaDsl from 'schema-dsl/pure'` or your own integration object |
| `options` | Merged configuration during installation: `{...plugin.options,...installOptions }` |
| `context.plugins` | `Map<string, Plugin>` of currently registered plugins |
| `context.hooks` | `Map<string, Function[]>` of the current hook registry |

---

## hook system

### 1. Automatically triggered built-in life cycle

These hooks are automatically triggered by `PluginManager`:

| name | Trigger time | parameter |
|---|---|---|
| `onBeforeRegister` | `register(plugin)` Before writing to the registry | `(plugin)` |
| `onAfterRegister` | `register(plugin)` After completion | `(plugin)` |
| `onError` | After a hook execution throws an error | `(error, meta)` |

### 2. Conventional hook name

The following names are common conventions and `PluginManager` supports registering them, but whether they are executed depends on whether your code calls `runHook()`**:

| name | Common uses |
|---|---|
| `onBeforeValidate` / `onAfterValidate` | Before and after validation |
| `onBeforeCompile` / `onAfterCompile` | Before and after compilation |
| `onBeforeExport` / `onAfterExport` | Before and after export |
| `beforeParse` / `afterParse` | parsing stage |
| `beforeValidate` / `afterValidate` | v2 style naming |
| `beforeCompile` / `afterCompile` | v2 style naming |

> `hook()` / `runHook()` supports any string name, not limited to the above table.

### 3. Register and run hook

```javascript
pluginManager.hook('onBeforeValidate', (schema, data) => {
  console.log('Before validation:', schema, data);
});

const results = await pluginManager.runHook('onBeforeValidate', schema, data);
```

### 4. Declare the hook in the plug-in

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

## event system

`PluginManager` inherits from `EventEmitter`, so you can use:

- `on()`
- `once()`
- `off()`
- `emit()`
- `removeListener()`
- `removeAllListeners()`

### Available events

| event name | Trigger time | parameter |
|---|---|---|
| `plugin:registered` | Plug-in registration successful | `(plugin)` |
| `plugin:installed` | Plug-in installed successfully | `(plugin)` |
| `plugin:uninstalled` | Plug-in uninstalled successfully | `(plugin)` |
| `plugin:error` | Plug-in installation/uninstallation failed | `({ plugin, error })` |
| `hook:error` | Hook execution failed | `({ hookName, handler, error })` |
| `plugins:cleared` | `clear()` After completion | `()` |

### Example

```javascript
pluginManager.on('plugin:registered', (plugin) => {
  console.log('Plug-in registered:', plugin.name);
});

pluginManager.on('plugin:installed', (plugin) => {
  console.log('Plugin installed:', plugin.name);
});

pluginManager.on('plugin:error', ({ plugin, error }) => {
  console.error('Plugin error:', plugin.name, error.message);
});

pluginManager.on('hook:error', ({ hookName, error }) => {
  console.error('Hook error:', hookName, error.message);
});
```

---

## API reference

### `register(plugin)`

Register the plug-in and trigger it automatically:

1. `onBeforeRegister`
2. Write to the registry/Registration plug-in comes with hooks
3. `onAfterRegister`
4. `plugin:registered`

### `install(core, [pluginName], [options])`

Install the plugin.

- `install(core)`: Install all registered plug-ins
- `install(core, 'name', options)`: Install the specified plug-in
- `install()` will pass the third parameter `context` to the plug-in
- Triggered after successful installation `plugin:installed`
- Trigger `plugin:error` when the installation fails, and then throw an error

### `unregister(name, [core])`

Uninstall the plugin and remove the hooks registered by the plugin.

- `plugin.uninstall(core, context)` The plug-in will be removed only after success.
- Triggered after successful uninstall `plugin:uninstalled`
- Triggers `plugin:error` when uninstallation fails, and then throws an error

### `uninstall(name, [core])`

Alias ​​for `unregister()`, compatible with v1.

### `hook(name, handler)`

Register a hook handler.

### `unhook(name, handler)`

Remove the specified hook handler.

### `runHook(name, ...args)`

Run all processors under a hook asynchronously and return the result array.

- An error thrown by a single handler will not interrupt subsequent handlers.
- It will be triggered when an error is thrown `hook:error`
- `onError` will be executed at the same time

### `has(name)`

Check if the plugin is registered.

### `get([name])`

- `get(name)`: Get a single plug-in
- `get()`: Get all plug-ins `Map`

### `list()`

Returns the plugin metadata array:

```javascript
[{ name, version, description }]
```

### `clear([core])`

Uninstall all plug-ins one by one, clear the registry and hooks, and finally trigger `plugins:cleared`.

### property

| property | Description |
|---|---|
| `pluginManager.plugins` | Plug-in registry `Map<string, Plugin>` |
| `pluginManager.hooks` | hook registry `Map<string, Function[]>` |
| `pluginManager.context` | `{ plugins, hooks }` |
| `pluginManager.size` | Number of registered plug-ins |
| `pluginManager.pluginCount` | Number of registered plug-ins (aliases) |

---

## best practices

### 1. Naming

Use `kebab-case`:

```javascript
name: 'custom-validator'
name: 'mongodb-plugin'
```

### 2. Error handling

```javascript
install(core, options, context) {
  try {
    //Installation logic
  } catch (error) {
    throw error;
  }
}
```

### 3. Resource cleanup

```javascript
uninstall(core, context) {
  // Clean up registered resources
}
```

### 4. Communication between plug-ins

```javascript
install(core, options, context) {
  if (!context.plugins.has('dependency-plugin')) {
    throw new Error('dependency-plugin needs to be installed first');
  }
}
```

---

## Troubleshooting

### Plug-in not taking effect

```javascript
pluginManager.has('my-plugin');
pluginManager.list();
```

Confirm that the plug-in is registered, installed, and `install()` indeed executes your logic.

### hook not triggered

Check two things:

1. Are the hook names consistent?
2. Does your code really call `pluginManager.runHook('hookName',...)`

### How the current warehouse is published

The current warehouse has restored the v1 style official plug-in sub-path entry, which can be used directly:

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

> ⚠️ Note: The official plug-in sub-path only completes the three sample plug-in entries that already exist in v1;
> `PluginManager` still will not automatically connect to the `validate()` / `compile()` / exporter process. Whether the hook is executed still depends on whether your integration code explicitly calls `runHook()`.

---

## Related documents

- [API Reference](api-reference.md)
- [Validation Guide](validate.md)
- [DSL syntax](dsl-syntax.md)

---

## Corresponding sample file

**Example entry**: [plugin-system.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/plugin-system.ts)
**Description**: Covers the registration/installation/uninstallation of custom plug-ins, `runHook()` execution results, and the installation effect of the official `custom-format` sub-path plug-in.
