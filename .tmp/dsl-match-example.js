import { dsl, validate } from '../dist/index.js';
const schema = dsl({
    type: 'string!',
    value: dsl.match('type', {
        email: 'email!',
        phone: 'string:11!',
        _default: 'string'
    })
});
console.log(validate(schema, { type: 'email', value: 'test@example.com' }));
