import { dsl, validateAsync } from '../dist/index.js';
const schema = dsl({ email: 'email!' });
async function validateRequestBody(body) {
    return validateAsync(schema, body, { locale: 'zh-CN' });
}
validateRequestBody({ email: 'test@example.com' })
    .then(data => console.log(data))
    .catch(error => console.error(error.toJSON?.() ?? error));
