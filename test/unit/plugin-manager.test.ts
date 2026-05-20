/**
/**
 * Plugin System Tests
 *
 * v2 PluginManager is now compatible with the core API of v1 PluginManager:
 *   - EventEmitter event system
 *   - hooks exposed Map, supports any hook name
 *   - unhook() removes a hook
 *   - runHook(name, ...args) passes args through, returns results array
 *   - install(core, name?, opts?) supports single plugin install by name + option merging + context
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PluginManager } from '../../src/core/PluginManager.js';

describe('PluginManager', () => {

  let pluginManager: PluginManager;

  beforeEach(() => {
    pluginManager = new PluginManager();
  });

  describe('Plugin Registration', () => {
    it('should successfully register a plugin', () => {
      const plugin = {
        name: 'test-plugin',
        install() { }
      };

      pluginManager.register(plugin);

      expect(pluginManager.has('test-plugin')).toBe(true);
      expect(pluginManager.size).toBe(1);
      expect(pluginManager.pluginCount).toBe(1);
    });

    it('should reject invalid plugin configuration', () => {
      expect(() => {
        pluginManager.register(null as any);
      }).toThrow('Plugin must be an object');

      expect(() => {
        pluginManager.register({} as any);
      }).toThrow('Plugin must have a valid name');

      expect(() => {
        pluginManager.register({ name: 'test' } as any);
      }).toThrow('Plugin must have an install function');
    });

    it('should reject registering a plugin with a duplicate name', () => {
      const plugin = {
        name: 'test-plugin',
        install() { }
      };

      pluginManager.register(plugin);

      expect(() => {
        pluginManager.register(plugin);
      }).toThrow('Plugin "test-plugin" is already registered');
    });

    it('should emit registration event', () => {
      const plugin = {
        name: 'test-plugin',
        install() { }
      };

      let emittedPlugin: unknown;
      pluginManager.on('plugin:registered', (p) => { emittedPlugin = p });

      pluginManager.register(plugin);

      expect(emittedPlugin).toBe(plugin);
    });

    it('should trigger before/after register hooks', () => {
      const calls: string[] = [];

      pluginManager.hook('onBeforeRegister', (plugin: any) => {
        calls.push(`before:${plugin.name}`);
      });
      pluginManager.hook('onAfterRegister', (plugin: any) => {
        calls.push(`after:${plugin.name}`);
      });

      pluginManager.register({
        name: 'test-plugin',
        install() { }
      });

      expect(calls).toEqual(['before:test-plugin', 'after:test-plugin']);
    });

    it('should be compatible with EventEmitter once()', () => {
      let count = 0;

      pluginManager.once('plugin:registered', () => { count += 1; });

      pluginManager.register({ name: 'plugin-1', install() { } });
      pluginManager.register({ name: 'plugin-2', install() { } });

      expect(count).toBe(1);
    });
  });

  describe('Plugin Installation', () => {
    it('should successfully install a single plugin', () => {
      let installed = false;

      const plugin = {
        name: 'test-plugin',
        install(coreInstance: any) {
          installed = true;
          coreInstance.testMethod = () => 'test';
        }
      };

      pluginManager.register(plugin);

      const coreInstance: any = {};
      pluginManager.install(coreInstance);

      expect(installed).toBe(true);
      expect(coreInstance.testMethod()).toBe('test');
    });

    it('should install all registered plugins', () => {
      const installed: string[] = [];

      const plugin1 = {
        name: 'plugin1',
        install() { installed.push('plugin1'); }
      };

      const plugin2 = {
        name: 'plugin2',
        install() { installed.push('plugin2'); }
      };

      pluginManager.register(plugin1);
      pluginManager.register(plugin2);

      pluginManager.install({});

      expect(installed).toEqual(expect.arrayContaining(['plugin1', 'plugin2']));
      expect(installed).toHaveLength(2);
    });

    it('should pass install options (install(core, name, opts) merges plugin.options + opts)', () => {
      let receivedOptions: any;

      const plugin = {
        name: 'test-plugin',
        options: { default: true },
        install(_coreInstance: any, options: any) {
          receivedOptions = options;
        }
      };

      pluginManager.register(plugin);
      pluginManager.install({}, 'test-plugin', { custom: true });

      expect(receivedOptions).toEqual({
        default: true,
        custom: true
      });
    });

    it('should handle installation errors', () => {
      const plugin = {
        name: 'error-plugin',
        install() {
          throw new Error('Installation failed');
        }
      };

      pluginManager.register(plugin);

      expect(() => {
        pluginManager.install({});
      }).toThrow('Failed to install plugin "error-plugin"');
    });

    it('should emit installation event', () => {
      const plugin = {
        name: 'test-plugin',
        install() { }
      };

      let emittedPlugin: unknown;
      pluginManager.on('plugin:installed', (p) => { emittedPlugin = p; });

      pluginManager.register(plugin);
      pluginManager.install({});

      expect(emittedPlugin).toBe(plugin);
    });

    it('should pass context to install', () => {
      let receivedContext: any;

      const plugin = {
        name: 'test-plugin',
        install(_core: any, _options: any, context: any) {
          receivedContext = context;
        }
      };

      pluginManager.register(plugin);
      pluginManager.install({});

      expect(receivedContext.plugins).toBe(pluginManager.plugins);
      expect(receivedContext.hooks).toBe(pluginManager.hooks);
    });

    it('should emit plugin:error when installation fails', () => {
      let payload: any;

      const plugin = {
        name: 'error-plugin',
        install() {
          throw new Error('Installation failed');
        }
      };

      pluginManager.on('plugin:error', (event) => { payload = event; });
      pluginManager.register(plugin);

      expect(() => {
        pluginManager.install({});
      }).toThrow('Failed to install plugin "error-plugin"');

      expect(payload.plugin).toBe(plugin);
      expect(payload.error.message).toBe('Installation failed');
    });
  });

  describe('Plugin Uninstall', () => {
    it('should successfully uninstall a plugin', () => {
      let uninstalled = false;

      const plugin = {
        name: 'test-plugin',
        install(coreInstance: any) {
          coreInstance.testMethod = () => 'test';
        },
        uninstall(coreInstance: any) {
          uninstalled = true;
          delete coreInstance.testMethod;
        }
      };

      pluginManager.register(plugin);

      const coreInstance: any = {};
      pluginManager.install(coreInstance);
      pluginManager.unregister('test-plugin');

      expect(uninstalled).toBe(true);
      expect(coreInstance.testMethod).toBeUndefined();
      expect(pluginManager.has('test-plugin')).toBe(false);
    });

    it('should handle plugins without an uninstall method', () => {
      const plugin = {
        name: 'test-plugin',
        install() { }
      };

      pluginManager.register(plugin);
      pluginManager.install({});

      expect(() => {
        pluginManager.unregister('test-plugin');
      }).not.toThrow();
    });

    it('should emit uninstall event', () => {
      const plugin = {
        name: 'test-plugin',
        install() { },
        uninstall() { }
      };

      pluginManager.register(plugin);
      pluginManager.install({});

      let emittedPlugin: unknown;
      pluginManager.on('plugin:uninstalled', (p) => { emittedPlugin = p });

      pluginManager.unregister('test-plugin');

      expect(emittedPlugin).toBe(plugin);
    });

    it('should pass core and context to uninstall', () => {
      let receivedCore: any;
      let receivedContext: any;

      const plugin = {
        name: 'test-plugin',
        install() { },
        uninstall(coreInstance: any, context: any) {
          receivedCore = coreInstance;
          receivedContext = context;
        }
      };

      const core = { version: '2' };
      pluginManager.register(plugin);
      pluginManager.install(core);
      pluginManager.unregister('test-plugin');

      expect(receivedCore).toBe(core);
      expect(receivedContext.plugins).toBe(pluginManager.plugins);
      expect(receivedContext.hooks).toBe(pluginManager.hooks);
    });

    it('should emit plugin:error when uninstall fails', () => {
      let payload: any;

      const plugin = {
        name: 'error-plugin',
        install() { },
        uninstall() {
          throw new Error('Uninstall failed');
        }
      };

      pluginManager.on('plugin:error', (event) => { payload = event; });
      pluginManager.register(plugin);
      pluginManager.install({});

      expect(() => {
        pluginManager.unregister('error-plugin');
      }).toThrow('Failed to uninstall plugin "error-plugin"');

      expect(payload.plugin).toBe(plugin);
      expect(payload.error.message).toBe('Uninstall failed');
    });
  });

  describe('Hook System', () => {
    it('should register a hook', () => {
      const handler = () => { };

      pluginManager.hook('onBeforeValidate', handler);

      const handlers = pluginManager.hooks.get('onBeforeValidate');
      expect(handlers).toContain(handler);
    });

    it('should run hooks', async () => {
      const results: string[] = [];

      pluginManager.hook('testHook', (arg: any) => {
        results.push('hook1:' + arg);
      });

      pluginManager.hook('testHook', (arg: any) => {
        results.push('hook2:' + arg);
      });

      await pluginManager.runHook('testHook', 'test');

      expect(results).toEqual(['hook1:test', 'hook2:test']);
    });

    it('should support async hooks', async () => {
      pluginManager.hook('asyncHook', async (value: any) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return value * 2;
      });

      const results = await pluginManager.runHook('asyncHook', 5);

      expect(results).toEqual([10]);
    });

    it('should handle hook errors', async () => {
      let payload: any;

      pluginManager.on('hook:error', (event) => { payload = event; });

      pluginManager.hook('errorHook', () => {
        throw new Error('Hook error');
      });

      await pluginManager.runHook('errorHook');

      expect(payload.hookName).toBe('errorHook');
      expect(payload.error.message).toBe('Hook error');
    });

    it('should trigger onError when a hook throws', async () => {
      const errors: Array<{ message: string; hookName: string }> = [];

      pluginManager.hook('onError', (error: any, meta: any) => {
        errors.push({ message: error.message, hookName: meta.hookName });
      });

      pluginManager.hook('errorHook', () => {
        throw new Error('Hook error');
      });

      await pluginManager.runHook('errorHook');

      expect(errors).toEqual([{ message: 'Hook error', hookName: 'errorHook' }]);
    });

    it('should remove a hook', () => {
      const handler = () => { };

      pluginManager.hook('testHook', handler);
      pluginManager.unhook('testHook', handler);

      const handlers = pluginManager.hooks.get('testHook');
      expect(handlers).not.toContain(handler);
    });
  });

  describe('Plugin Hooks', () => {
    it('should register plugin-defined hooks', () => {
      const hook1 = () => { };
      const hook2 = () => { };

      const plugin = {
        name: 'test-plugin',
        install() { },
        hooks: {
          onBeforeValidate: hook1,
          onAfterValidate: hook2
        }
      };

      pluginManager.register(plugin);

      expect(pluginManager.hooks.get('onBeforeValidate')).toContain(hook1);
      expect(pluginManager.hooks.get('onAfterValidate')).toContain(hook2);
    });

    it('should remove plugin hooks on uninstall', () => {
      const hook = () => { };

      const plugin = {
        name: 'test-plugin',
        install() { },
        uninstall() { },
        hooks: {
          onBeforeValidate: hook
        }
      };

      pluginManager.register(plugin);
      pluginManager.install({});
      pluginManager.unregister('test-plugin');

      const handlers = pluginManager.hooks.get('onBeforeValidate');
      expect(handlers).not.toContain(hook);
    });
  });

  describe('Plugin Management', () => {
    it('should get a plugin', () => {
      const plugin = {
        name: 'test-plugin',
        install() { }
      };

      pluginManager.register(plugin);

      const retrieved = pluginManager.get('test-plugin');
      expect(retrieved).toBe(plugin);
    });

    it('should get all plugins', () => {
      const plugin1 = { name: 'plugin1', install() { } };
      const plugin2 = { name: 'plugin2', install() { } };

      pluginManager.register(plugin1);
      pluginManager.register(plugin2);

      const allPlugins = pluginManager.get() as Map<string, any>;
      expect(allPlugins.size).toBe(2);
      expect(allPlugins.has('plugin1')).toBe(true);
      expect(allPlugins.has('plugin2')).toBe(true);
    });

    it('should list plugins', () => {
      const plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        description: 'Test plugin',
        install() { }
      };

      pluginManager.register(plugin);

      const list = pluginManager.list();
      expect(list).toEqual([{ name: 'test-plugin', version: '1.0.0', description: 'Test plugin' }]);
    });

    it('should clear all plugins', () => {
      const plugin1 = { name: 'plugin1', install() { }, uninstall() { } };
      const plugin2 = { name: 'plugin2', install() { }, uninstall() { } };

      pluginManager.register(plugin1);
      pluginManager.register(plugin2);
      pluginManager.install({});

      pluginManager.clear();
      expect(pluginManager.size).toBe(0);
    });

    it('should emit plugins:cleared after clear()', () => {
      let cleared = false;

      pluginManager.on('plugins:cleared', () => { cleared = true; });

      pluginManager.register({ name: 'plugin1', install() { } });
      pluginManager.clear();

      expect(cleared).toBe(true);
    });
  });

  describe('Context', () => {
    it('should provide context to plugins (install passes core instance)', () => {
      let receivedCore: any;

      const plugin = {
        name: 'test-plugin',
        install(coreInstance: any) {
          receivedCore = coreInstance;
        }
      };

      pluginManager.register(plugin);
      const core = { version: '2' };
      pluginManager.install(core);

      expect(receivedCore).toBe(core);
    });

    it('should allow plugins to access other plugins (via external reference)', () => {
      const plugin1 = { name: 'plugin1', install() { } };
      const plugin2 = { name: 'plugin2', install() { } };

      pluginManager.register(plugin1);
      pluginManager.register(plugin2);
      pluginManager.install({});

      expect(pluginManager.has('plugin1')).toBe(true);
      expect(pluginManager.has('plugin2')).toBe(true);
    });
  });

  describe('Real-world Scenario Tests', () => {
    it('should support custom validator plugins', () => {
      const customValidatorPlugin = {
        name: 'custom-validator',
        install(coreInstance: any) {
          coreInstance.customValidators = {};

          coreInstance.addValidator = function (name: string, fn: (value: any) => boolean) {
            this.customValidators[name] = fn;
          };
        }
      };

      pluginManager.register(customValidatorPlugin);

      const coreInstance: any = {};
      pluginManager.install(coreInstance);

      coreInstance.addValidator('unique', (value: string) => {
        return value === 'unique';
      });

      expect(coreInstance.customValidators.unique('unique')).toBe(true);
    });

    it('should support logging plugins', async () => {
      const logs: string[] = [];

      const loggingPlugin = {
        name: 'logging',
        install() { },
        hooks: {
          onBeforeValidate(_schema: any, _data: any) {
            logs.push('before');
          },
          onAfterValidate(_result: any) {
            logs.push('after');
          }
        }
      };

      pluginManager.register(loggingPlugin);
      pluginManager.install({});

      await pluginManager.runHook('onBeforeValidate', {}, {});
      await pluginManager.runHook('onAfterValidate', {});

      expect(logs).toEqual(['before', 'after']);
    });
  });
});
