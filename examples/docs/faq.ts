import { SchemaUtils, Validator, dsl, validate } from '../../dist/index.js';

const schema = dsl({
  username: 'string:3-32!',
  email: dsl('email!').label('Email address')
});

const validator = new Validator({ cache: true, allErrors: true });

const single = validate(schema, {
  username: 'faq_user',
  email: 'faq@example.com'
});

const localeResult = validator.validate(schema, {
  username: 'faq_user',
  email: 'bad'
}, {
  locale: 'en-US'
});

const batch = SchemaUtils.validateBatch(schema, [
  { username: 'faq_user', email: 'faq@example.com' },
  { username: 'x', email: 'bad' }
], validator.getAjv());

validator.validate(schema, {
  username: 'faq_user',
  email: 'faq@example.com'
});

const stats = validator.getCacheStats();

console.log('faq.single =', single.valid);
console.log('faq.locale =', localeResult.errors?.[0]?.message);
console.log('faq.batch.valid =', batch.summary.valid);
console.log('faq.cache.enabled =', stats.enabled);
console.log('faq.cache.hits =', stats.hits >= 0);