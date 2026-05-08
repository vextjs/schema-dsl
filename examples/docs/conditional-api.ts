import { ValidationError, dsl, validate } from '../../dist/index.js';

const canRegister = dsl.if((data: any) => data.age < 18).message('未成年用户不能注册');

console.log('conditional-api.check.minor =', canRegister.check({ age: 16 }));
console.log('conditional-api.check.adult =', canRegister.check({ age: 20 }));

try {
  canRegister.assert({ age: 16 });
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('conditional-api.assert =', error.message);
  } else {
    throw error;
  }
}

const discountSchema = dsl({
  isVip: 'boolean',
  discount: dsl.if('isVip', 'number:0-50', 'number:0-10')
});

console.log('conditional-api.field.true =', validate(discountSchema, { isVip: true, discount: 30 }).valid);
console.log('conditional-api.field.false =', validate(discountSchema, { isVip: false, discount: 30 }).valid);

const contactSchema = dsl({
  type: 'email|phone',
  value: dsl.match('type', {
    email: 'email!',
    phone: 'phone:cn!'
  })
});

console.log('conditional-api.match =', validate(contactSchema, { type: 'phone', value: '13800138000' }).valid);