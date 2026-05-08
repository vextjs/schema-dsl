import * as schemaDsl from '../../dist/index.js';
import { DslBuilder, PluginManager, dsl, validate } from '../../dist/index.js';
import customFormatPlugin from '../../dist/plugins/custom-format.js';

async function main(): Promise<void> {
  const pluginManager = new PluginManager();
  const calls: string[] = [];

  const auditPlugin = {
    name: 'audit-plugin',
    options: { enabled: false },
    install(_core: unknown, options: Record<string, unknown>, context: { plugins: Map<string, unknown> }) {
      calls.push(`install:${String(options.enabled)}`);
      calls.push(`plugins:${context.plugins.size}`);
    },
    uninstall() {
      calls.push('uninstall');
    },
    hooks: {
      onBeforeValidate(schema: unknown, data: unknown) {
        return `${typeof schema}:${typeof data}`;
      }
    }
  };

  pluginManager.register(auditPlugin);
  pluginManager.install(schemaDsl, 'audit-plugin', { enabled: true });
  const hookResults = await pluginManager.runHook('onBeforeValidate', { type: 'string' }, 'hello');
  pluginManager.uninstall('audit-plugin', schemaDsl);

  pluginManager.register(customFormatPlugin);
  pluginManager.install(schemaDsl, 'custom-format');

  const phoneResult = validate(dsl({ phone: 'phone-cn!' }), { phone: '13800138000' });

  console.log('plugin-system.custom.has =', pluginManager.has('custom-format'));
  console.log('plugin-system.hook.results =', hookResults.join(','));
  console.log('plugin-system.calls =', calls.join('|'));
  console.log('plugin-system.phone.valid =', phoneResult.valid);
  console.log('plugin-system.type.registered =', DslBuilder.hasType('phone-cn'));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});