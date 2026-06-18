import { dsl, s, type I18nError } from 'schema-dsl/pure'

dsl('email!').label('Email')
s.email().require().label('Email')

const facadeError: I18nError = dsl.error.create('missing')
const facadeErrorStatus: number = facadeError.statusCode

// @ts-expect-error String chain types are opt-in through schema-dsl/string-types.
'email!'.label('Email')

// @ts-expect-error String chain types are opt-in through schema-dsl/string-types.
'email!'.require()

// @ts-expect-error String chain types are opt-in through schema-dsl/string-types.
'array'.items('string!')

void facadeErrorStatus
