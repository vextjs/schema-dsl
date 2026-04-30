import { dsl, validate, Locale } from '../dist/index.js';

Locale.addLocale('zh-CN', {
  'account.notFound': '账户不存在'
});

const schema = dsl({ email: 'email!' });
console.log(validate(schema, { email: 'bad' }, { locale: 'zh-CN' }));

