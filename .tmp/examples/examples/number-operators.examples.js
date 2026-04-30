import { dsl, validate } from '../dist/index.js';
const schema = dsl({
    age: 'number:>=18!',
    score: 'number:<100'
});
console.log(validate(schema, { age: 20, score: 99 }));
