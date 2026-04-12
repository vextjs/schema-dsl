/**
 * 插件系统测试
 *
 * v2 PluginManager 现已完全兼容 v1 API：
 *   - on() 事件系统（plugin:registered / plugin:uninstalled / hook:error）
 *   - hooks 公开 Map，支持任意钩子名称
 *   - unhook() 移除钩子
 *   - runHook(name, ...args) 透传参数，返回结果数组
 *   - install(core, name?, opts?) 支持按名称单插件安装 + 选项合并
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PluginManager } from '../../src/core/PluginManager.js';

describe('PluginManager', () => {

  let pluginManager: PluginManager;

  beforeEach(() => {
    pluginManager = new PluginManager();
  });

  describe('插件注册', () => {
    it('应该成功注册插件', () => {
      const plugin = {
        name: 'test-plugin',
        install() { }
      };

      pluginManager.register(plugin);

      expect(pluginManager.has('test-plugin')).toBe(true);
      expect(pluginManager.size).toBe(1);
      expect(pluginManager.pluginCount).toBe(1);
    });

    it('应该拒绝无效的插件配置', () => {
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

    it('应该拒绝重复注册同名插件', () => {
      const plugin = {
        name: 'test-plugin',
        install() { }
      };

      pluginManager.register(plugin);

      expect(() => {
        pluginManager.register(plugin);
      }).toThrow('Plugin "test-plugin" is already registered');
    });

    it('应该触发注册事件', () => {
      const plugin = {
        name: 'test-plugin',
        install() { }
      };

      let emittedPlugin: unknown;
      pluginManager.on('plugin:registered', (p) => { emittedPlugin = p });

      pluginManager.register(plugin);

      expect(emittedPlugin).toBe(plugin);
    });
  });

  describe('插件安装', () => {
    it('应该成功安装单个插件', () => {
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

    it('应该安装所有已注册的插件', () => {
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

    it('应该传递安装选项（install(core, name, opts) 合并 plugin.options + opts）', () => {
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

    it('应该处理安装错误', () => {
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
  });

  describe('插件卸载', () => {
    it('应该成功卸载插件', () => {
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

    it('应该处理没有 uninstall 方法的插件', () => {
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

    it('应该触发卸载事件', () => {
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
  });

  describe('钩子系统', () => {
    it('应该注册钩子', () => {
      const handler = () => { };

      pluginManager.hook('onBeforeValidate', handler);

      const handlers = pluginManager.hooks.get('onBeforeValidate');
      expect(handlers).toContain(handler);
    });

    it('应该运行钩子', async () => {
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

    it('应该支持异步钩子', async () => {
      pluginManager.hook('asyncHook', async (value: any) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return value * 2;
      });

      const results = await pluginManager.runHook('asyncHook', 5);

      expect(results).toEqual([10]);
    });

    it('应该处理钩子错误', async () => {
      let errorEmitted = false;

      pluginManager.on('hook:error', () => { errorEmitted = true; });

      pluginManager.hook('errorHook', () => {
        throw new Error('Hook error');
      });

      await pluginManager.runHook('errorHook');

      expect(errorEmitted).toBe(true);
    });

    it('应该移除钩子', () => {
      const handler = () => { };

      pluginManager.hook('testHook', handler);
      pluginManager.unhook('testHook', handler);

      const handlers = pluginManager.hooks.get('testHook');
      expect(handlers).not.toContain(handler);
    });
  });

  describe('插件钩子', () => {
    it('应该注册插件定义的钩子', () => {
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

    it('应该在卸载时移除插件钩子', () => {
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

  describe('插件管理', () => {
    it('应该获取插件', () => {
      const plugin = {
        name: 'test-plugin',
        install() { }
      };

      pluginManager.register(plugin);

      const retrieved = pluginManager.get('test-plugin');
      expect(retrieved).toBe(plugin);
    });

    it('应该获取所有插件', () => {
      const plugin1 = { name: 'plugin1', install() { } };
      const plugin2 = { name: 'plugin2', install() { } };

      pluginManager.register(plugin1);
      pluginManager.register(plugin2);

      const allPlugins = pluginManager.get() as Map<string, any>;
      expect(allPlugins.size).toBe(2);
      expect(allPlugins.has('plugin1')).toBe(true);
      expect(allPlugins.has('plugin2')).toBe(true);
    });

    it('应该列出插件', () => {
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

    it('应该清空所有插件', () => {
      const plugin1 = { name: 'plugin1', install() { }, uninstall() { } };
      const plugin2 = { name: 'plugin2', install() { }, uninstall() { } };

      pluginManager.register(plugin1);
      pluginManager.register(plugin2);
      pluginManager.install({});

      pluginManager.clear();
      expect(pluginManager.size).toBe(0);
    });
  });

  describe('上下文', () => {
    it('应该提供上下文给插件（install 参数传递 core 实例）', () => {
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

    it('应该允许插件访问其他插件（通过外部引用）', () => {
      const plugin1 = { name: 'plugin1', install() { } };
      const plugin2 = { name: 'plugin2', install() { } };

      pluginManager.register(plugin1);
      pluginManager.register(plugin2);
      pluginManager.install({});

      expect(pluginManager.has('plugin1')).toBe(true);
      expect(pluginManager.has('plugin2')).toBe(true);
    });
  });

  describe('真实场景测试', () => {
    it('应该支持自定义验证器插件', () => {
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

    it('应该支持日志插件', async () => {
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
