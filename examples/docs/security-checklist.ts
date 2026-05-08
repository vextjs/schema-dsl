import { dsl, validate } from '../../dist/index.js';

const schema = dsl({
  apiToken: dsl('string:20-64!')
    .pattern(/^[A-Za-z0-9_-]+$/)
    .label('访问令牌')
    .error({ pattern: '访问令牌只能包含字母、数字、下划线和连字符' }),
  callbackUrl: 'url!'
});

console.log('security-checklist.valid =', validate(schema, {
  apiToken: 'PLACEHOLDER_TOKEN_2026_SAFE',
  callbackUrl: 'https://example.com/hooks/audit'
}).valid);

console.log('security-checklist.invalid =', validate(schema, {
  apiToken: 'DROP TABLE users;',
  callbackUrl: 'not-a-url'
}).valid);