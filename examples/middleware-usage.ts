import { dsl, validate } from '../dist/index.js';

const schema = dsl({ email: 'email!', age: 'number:18-' });

function validateBody(body, locale = 'zh-CN') {
  const result = validate(schema, body, { locale });
  if (!result.valid) {
    return { status: 400, body: { errors: result.errors } };
  }
  return { status: 200, body: result.data };
}

console.log(validateBody({ email: 'test@example.com', age: '20' }));


