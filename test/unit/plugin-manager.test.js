/**
 * 插件系统测试
 */

const { expect } = require('chai');
const { PluginManager } = require('../../index');

describe('PluginManager', () => {

    let pluginManager;

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

            expect(pluginManager.has('test-plugin')).to.be.true;
            expect(pluginManager.size).to.equal(1);
        });

        it('应该拒绝无效的插件配置', () => {
            expect(() => {
                pluginManager.register(null);
            }).to.throw('Plugin must be an object');

            expect(() => {
                pluginManager.register({});
            }).to.throw('Plugin must have a valid name');

            expect(() => {
                pluginManager.register({ name: 'test' });
            }).to.throw('Plugin must have an install function');
        });

        it('应该拒绝重复注册同名插件', () => {
            const plugin = {
                name: 'test-plugin',
                install() { }
            };

            pluginManager.register(plugin);

            expect(() => {
                pluginManager.register(plugin);
            }).to.throw('Plugin "test-plugin" is already registered');
        });

        it('应该触发注册事件', (done) => {
            const plugin = {
                name: 'test-plugin',
                install() { }
            };

            pluginManager.on('plugin:registered', (p) => {
                expect(p.name).to.equal('test-plugin');
                done();
            });

            pluginManager.register(plugin);
        });
    });

    describe('插件安装', () => {
        it('应该成功安装单个插件', () => {
            let installed = false;

            const plugin = {
                name: 'test-plugin',
                install(coreInstance) {
                    installed = true;
                    coreInstance.testMethod = () => 'test';
                }
            };

            pluginManager.register(plugin);

            const coreInstance = {};
            pluginManager.install(coreInstance, 'test-plugin');

            expect(installed).to.be.true;
            expect(coreInstance.testMethod()).to.equal('test');
        });

        it('应该安装所有已注册的插件', () => {
            const installed = [];

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

            expect(installed).to.have.members(['plugin1', 'plugin2']);
        });

        it('应该传递安装选项', () => {
            let receivedOptions;

            const plugin = {
                name: 'test-plugin',
                options: { default: true },
                install(coreInstance, options) {
                    receivedOptions = options;
                }
            };

            pluginManager.register(plugin);
            pluginManager.install({}, 'test-plugin', { custom: true });

            expect(receivedOptions).to.deep.equal({
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
                pluginManager.install({}, 'error-plugin');
            }).to.throw('Failed to install plugin "error-plugin"');
        });
    });

    describe('插件卸载', () => {
        it('应该成功卸载插件', () => {
            let uninstalled = false;

            const plugin = {
                name: 'test-plugin',
                install(coreInstance) {
                    coreInstance.testMethod = () => 'test';
                },
                uninstall(coreInstance) {
                    uninstalled = true;
                    delete coreInstance.testMethod;
                }
            };

            pluginManager.register(plugin);

            const coreInstance = {};
            pluginManager.install(coreInstance, 'test-plugin');
            pluginManager.uninstall('test-plugin', coreInstance);

            expect(uninstalled).to.be.true;
            expect(coreInstance.testMethod).to.be.undefined;
            expect(pluginManager.has('test-plugin')).to.be.false;
        });

        it('应该处理没有 uninstall 方法的插件', () => {
            const plugin = {
                name: 'test-plugin',
                install() { }
            };

            pluginManager.register(plugin);
            pluginManager.install({}, 'test-plugin');

            expect(() => {
                pluginManager.uninstall('test-plugin', {});
            }).to.not.throw();
        });

        it('应该触发卸载事件', (done) => {
            const plugin = {
                name: 'test-plugin',
                install() { },
                uninstall() { }
            };

            pluginManager.register(plugin);
            pluginManager.install({}, 'test-plugin');

            pluginManager.on('plugin:uninstalled', (p) => {
                expect(p.name).to.equal('test-plugin');
                done();
            });

            pluginManager.uninstall('test-plugin', {});
        });
    });

    describe('钩子系统', () => {
        it('应该注册钩子', () => {
            const handler = () => { };

            pluginManager.hook('onBeforeValidate', handler);

            const handlers = pluginManager.hooks.get('onBeforeValidate');
            expect(handlers).to.include(handler);
        });

        it('应该运行钩子', async () => {
            const results = [];

            pluginManager.hook('testHook', (arg) => {
                results.push('hook1:' + arg);
            });

            pluginManager.hook('testHook', (arg) => {
                results.push('hook2:' + arg);
            });

            await pluginManager.runHook('testHook', 'test');

            expect(results).to.deep.equal(['hook1:test', 'hook2:test']);
        });

        it('应该支持异步钩子', async () => {
            pluginManager.hook('asyncHook', async (value) => {
                await new Promise(resolve => setTimeout(resolve, 10));
                return value * 2;
            });

            const results = await pluginManager.runHook('asyncHook', 5);

            expect(results).to.deep.equal([10]);
        });

        it('应该处理钩子错误', async () => {
            let errorEmitted = false;

            pluginManager.on('hook:error', () => {
                errorEmitted = true;
            });

            pluginManager.hook('errorHook', () => {
                throw new Error('Hook error');
            });

            await pluginManager.runHook('errorHook');

            expect(errorEmitted).to.be.true;
        });

        it('应该移除钩子', () => {
            const handler = () => { };

            pluginManager.hook('testHook', handler);
            pluginManager.unhook('testHook', handler);

            const handlers = pluginManager.hooks.get('testHook');
            expect(handlers).to.not.include(handler);
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

            const beforeHandlers = pluginManager.hooks.get('onBeforeValidate');
            const afterHandlers = pluginManager.hooks.get('onAfterValidate');

            expect(beforeHandlers).to.include(hook1);
            expect(afterHandlers).to.include(hook2);
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
            pluginManager.install({}, 'test-plugin');
            pluginManager.uninstall('test-plugin', {});

            const handlers = pluginManager.hooks.get('onBeforeValidate');
            expect(handlers).to.not.include(hook);
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
            expect(retrieved).to.equal(plugin);
        });

        it('应该获取所有插件', () => {
            const plugin1 = { name: 'plugin1', install() { } };
            const plugin2 = { name: 'plugin2', install() { } };

            pluginManager.register(plugin1);
            pluginManager.register(plugin2);

            const allPlugins = pluginManager.get();
            expect(allPlugins.size).to.equal(2);
            expect(allPlugins.has('plugin1')).to.be.true;
            expect(allPlugins.has('plugin2')).to.be.true;
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
            expect(list).to.deep.equal([{
                name: 'test-plugin',
                version: '1.0.0',
                description: 'Test plugin'
            }]);
        });

        it('应该清空所有插件', () => {
            const plugin1 = { name: 'plugin1', install() { }, uninstall() { } };
            const plugin2 = { name: 'plugin2', install() { }, uninstall() { } };

            pluginManager.register(plugin1);
            pluginManager.register(plugin2);
            pluginManager.install({});

            pluginManager.clear({});

            expect(pluginManager.size).to.equal(0);
        });
    });

    describe('上下文', () => {
        it('应该提供上下文给插件', () => {
            let receivedContext;

            const plugin = {
                name: 'test-plugin',
                install(coreInstance, options, context) {
                    receivedContext = context;
                }
            };

            pluginManager.register(plugin);
            pluginManager.install({}, 'test-plugin');

            expect(receivedContext).to.have.property('plugins');
            expect(receivedContext).to.have.property('hooks');
            expect(receivedContext.plugins).to.equal(pluginManager.plugins);
        });

        it('应该允许插件访问其他插件', () => {
            let plugin2Context;

            const plugin1 = {
                name: 'plugin1',
                install() { }
            };

            const plugin2 = {
                name: 'plugin2',
                install(coreInstance, options, context) {
                    plugin2Context = context;
                }
            };

            pluginManager.register(plugin1);
            pluginManager.register(plugin2);
            pluginManager.install({});

            expect(plugin2Context.plugins.has('plugin1')).to.be.true;
        });
    });

    describe('真实场景测试', () => {
        it('应该支持自定义验证器插件', () => {
            const customValidatorPlugin = {
                name: 'custom-validator',
                install(coreInstance) {
                    coreInstance.customValidators = {};

                    coreInstance.addValidator = function (name, fn) {
                        this.customValidators[name] = fn;
                    };
                }
            };

            pluginManager.register(customValidatorPlugin);

            const coreInstance = {};
            pluginManager.install(coreInstance);

            coreInstance.addValidator('unique', (value) => {
                return value === 'unique';
            });

            expect(coreInstance.customValidators.unique('unique')).to.be.true;
        });

        it('应该支持日志插件', async () => {
            const logs = [];

            const loggingPlugin = {
                name: 'logging',
                install(coreInstance, options, context) { },
                hooks: {
                    onBeforeValidate(schema, data) {
                        logs.push('before');
                    },
                    onAfterValidate(result) {
                        logs.push('after');
                    }
                }
            };

            pluginManager.register(loggingPlugin);
            pluginManager.install({});

            await pluginManager.runHook('onBeforeValidate', {}, {});
            await pluginManager.runHook('onAfterValidate', {});

            expect(logs).to.deep.equal(['before', 'after']);
        });
    });
});


