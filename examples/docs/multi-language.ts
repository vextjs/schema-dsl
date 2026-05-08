import { Locale, dsl, validate } from '../../dist/index.js';

const schema = dsl({
  email: dsl('email!').label('Email address')
});

Locale.setLocale('zh-CN');

const zh = validate(schema, { email: 'bad' });
const en = validate(schema, { email: 'bad' }, { locale: 'en-US' });

console.log('multi-language.available =', Locale.getAvailableLocales().includes('en-US'));
console.log('multi-language.zh =', zh.errors?.[0]?.message);
console.log('multi-language.en =', en.errors?.[0]?.message);