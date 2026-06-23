import { dsl, registerExtensions, s, type I18nError } from '../../src/pure.js'

dsl('email!').label('Email')
dsl('email!').validate('user@example.com')
s.email().require().label('Email')
s.email().validate('user@example.com')

const facadeError: I18nError = dsl.error.create('missing')
const facadeErrorMessage: string = facadeError.message

const extendedS = registerExtensions([
  {
    literal: 'tenant-id',
    factoryName: 'tenantId',
    segmentMode: 'params',
    params: {
      scope: { kind: 'enum', values: ['tenant', 'corp'], default: 'tenant' },
    },
    schema({ scope }: { scope?: 'tenant' | 'corp' }) {
      return { type: 'string', pattern: `^${scope}_[a-z0-9]+$` }
    },
  },
] as const)

extendedS.tenantId('corp').require()
extendedS('tenant-id:corp!').label('Tenant')
extendedS('tenant-id:corp!').validate('corp_demo')

// @ts-expect-error registerExtensions should preserve enum parameter hints for object params.
extendedS.tenantId({ scope: 'bad' })

const requiredParamS = registerExtensions([
  {
    literal: 'required-code',
    factoryName: 'requiredCode',
    segmentMode: 'params',
    params: {
      value: { kind: 'string', required: true },
    },
    schema({ value }: { value: string }) {
      return { type: 'string', const: value }
    },
  },
] as const)

requiredParamS.requiredCode('abc').require()
requiredParamS.requiredCode({ value: 'abc' }).require()

// @ts-expect-error required extension params without defaults must be provided.
requiredParamS.requiredCode()

// @ts-expect-error String chain types are opt-in through schema-dsl/string-types.
'email!'.label('Email')

// @ts-expect-error String chain types are opt-in through schema-dsl/string-types.
'email!'.require()

// @ts-expect-error String chain types are opt-in through schema-dsl/string-types.
'array'.items('string!')

void facadeErrorMessage
