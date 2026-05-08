import { ValidationError, dsl, validate, validateAsync } from '../../dist/index.js';

interface UserForm {
  username: string;
  email: string;
  password: string;
  age?: number;
}

const commonFields = {
  email: dsl('email!')
    .label('邮箱地址')
    .error({ required: '邮箱必填' }),

  username: dsl('string:3-32!')
    .pattern(/^[a-zA-Z0-9_]+$/)
    .label('用户名')
    .error({ pattern: '用户名只能包含字母、数字和下划线' })
};

const userSchema = dsl({
  ...commonFields,
  password: dsl('string:8-64!')
    .pattern(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/)
    .label('密码')
    .error({ pattern: '密码至少 8 位且必须包含字母和数字' }),
  age: dsl('number:18-100').label('年龄')
});

const syncResult = validate<UserForm>(userSchema, {
  username: 'demo_user',
  email: 'demo@example.com',
  password: 'Pass1234',
  age: 28
});

console.log('typescript-guide.sync =', syncResult.valid);

const asyncUser = await validateAsync<UserForm>(userSchema, {
  username: 'runner_01',
  email: 'runner@example.com',
  password: 'Run2026A',
  age: 30
});

console.log('typescript-guide.async.user =', asyncUser.username);

try {
  await validateAsync<UserForm>(userSchema, {
    username: 'bad user',
    email: 'oops',
    password: 'short'
  } as any);
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('typescript-guide.errorCount =', error.getErrorCount());
    console.log('typescript-guide.emailError =', error.getFieldErrors().email ?? 'none');
  } else {
    throw error;
  }
}