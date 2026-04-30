import { dsl, validate, installStringExtensions } from '../dist/index.js';
installStringExtensions();
const schema = dsl({
    email: 'email!'.label('邮箱地址'),
    username: 'string:3-32!'.label('用户名')
});
console.log(validate(schema, { email: 'test@example.com', username: 'rocky' }));
