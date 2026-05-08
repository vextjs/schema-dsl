import { dsl, validate } from '../../dist/index.js';

const contactSchema = dsl({
  contact: dsl('string!')
    .pattern(/^([^\s@]+@[^\s@]+\.[^\s@]+|1[3-9]\d{9})$/)
    .error({ pattern: 'pattern.emailOrPhone' })
    .label('联系方式')
});

const websiteSchema = dsl({
  website: dsl('string!')
    .pattern(/^https?:\/\/.+$/)
    .error({ pattern: 'pattern.httpOrHttps' })
    .label('网站地址')
});

console.log('union-type-guide.email =', validate(contactSchema, { contact: 'user@example.com' }).valid);
console.log('union-type-guide.phone =', validate(contactSchema, { contact: '13800138000' }).valid);
console.log('union-type-guide.zh =', validate(contactSchema, { contact: 'invalid' }, { locale: 'zh-CN' }).errors?.[0]?.message);
console.log('union-type-guide.en =', validate(contactSchema, { contact: 'invalid' }, { locale: 'en-US' }).errors?.[0]?.message);
console.log('union-type-guide.website =', validate(websiteSchema, { website: 'https://example.com' }).valid);