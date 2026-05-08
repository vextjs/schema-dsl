import * as schemaDsl from '../../dist/index.js';
import { DslBuilder, Locale, PluginManager, Validator, dsl, validate } from '../../dist/index.js';
import customTypeExamplePlugin from '../../dist/plugins/custom-type-example.js';

DslBuilder.clearCustomTypes();

const validator = new Validator();
validator.addKeyword('isPositive', {
  type: 'number',
  validate: (_schema: unknown, data: unknown) => (data as number) > 0
});

const positiveSchema = { type: 'number', isPositive: true };

DslBuilder.registerType('invoice-id', {
  type: 'string',
  pattern: '^INV-\\d{4}$'
} as any);

Locale.addLocale('pt-BR', {
  'custom.invoiceId': 'ID da fatura'
});

const pluginManager = new PluginManager();
pluginManager.register(customTypeExamplePlugin);
pluginManager.install(schemaDsl, 'custom-type-example');

console.log('custom-extensions-guide.keyword.valid =', validator.validate(positiveSchema as any, 1).valid);
console.log('custom-extensions-guide.keyword.invalid =', validator.validate(positiveSchema as any, 0).valid);
console.log('custom-extensions-guide.type.valid =', validate(dsl({ id: 'invoice-id!' }), { id: 'INV-2026' }).valid);
console.log('custom-extensions-guide.locale =', Locale.getMessageText('custom.invoiceId', {}, 'pt-BR'));
console.log('custom-extensions-guide.plugin.valid =', validate(dsl({ orderId: 'order-id!' }), { orderId: 'ORD202401010001' }).valid);

DslBuilder.clearCustomTypes();