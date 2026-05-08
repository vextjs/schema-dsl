import { dsl, validate } from '../../dist/index.js';

const userSchemas = {
  register: dsl({
    username: dsl('string:3-32!')
      .pattern(/^[a-zA-Z0-9_]+$/)
      .label('用户名')
      .error({ pattern: '只能包含字母、数字和下划线' }),
    email: dsl('email!').label('邮箱'),
    password: dsl('string:8-64!')
      .pattern(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/)
      .label('密码')
      .error({ pattern: '密码至少 8 位且必须包含字母和数字' })
  }),
  login: dsl({
    username: 'string!',
    password: 'string!'
  })
};

console.log('best-practices-project-structure.register =', validate(userSchemas.register, {
  username: 'structure_user',
  email: 'structure@example.com',
  password: 'Pass2026A'
}).valid);

console.log('best-practices-project-structure.login =', validate(userSchemas.login, {
  username: 'structure_user'
}).valid);