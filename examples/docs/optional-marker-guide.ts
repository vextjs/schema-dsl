import { dsl, validate } from '../../dist/index.js';

const schema = dsl({
  username: 'string!',
  nickname: 'string?',
  email: 'email?',
  'profile?': {
    city: 'string!',
    bio: 'string?'
  }
});

const enumSchema = dsl({
  status: 'active|inactive'
});

console.log('optional-marker-guide.base =', validate(schema, { username: 'alice' }).valid);
console.log('optional-marker-guide.profile =', validate(schema, { username: 'alice', profile: { city: 'Shanghai' } }).valid);
console.log('optional-marker-guide.emailInvalid =', validate(schema, { username: 'alice', email: 'bad' }).valid);
console.log('optional-marker-guide.requiredMissing =', validate(schema, {}).valid);
console.log('optional-marker-guide.enumOptional =', validate(enumSchema, {}).valid);