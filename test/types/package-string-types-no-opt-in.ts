import { dsl } from 'schema-dsl/pure'

dsl('email!').label('Email')

// @ts-expect-error String chain types are opt-in through schema-dsl/string-types.
'email!'.label('Email')
