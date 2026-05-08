import { dsl, validate } from '../../dist/index.js';

const schema = dsl({
  email: 'email!',
  serverIp: 'ip',
  job: 'cron',
  port: 'port',
  theme: 'hexColor',
  mobile: 'phone:cn!',
  metadata: 'json?'
});

const validResult = validate(schema, {
  email: 'ops@example.com',
  serverIp: '127.0.0.1',
  job: '0 9 * * 1',
  port: 8080,
  theme: '#336699',
  mobile: '13800138000',
  metadata: '{"enabled":true}'
});

const invalidResult = validate(schema, {
  email: 'bad',
  serverIp: '999.999.999.999',
  job: 'bad cron',
  port: 70000,
  theme: 'red',
  mobile: '123',
  metadata: 'not json'
});

console.log('type-reference.valid =', validResult.valid);
console.log('type-reference.invalid =', invalidResult.valid);
console.log('type-reference.errorCount =', invalidResult.errors?.length ?? 0);