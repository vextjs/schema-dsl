type StripMarker<S extends string> = S extends `${infer Base}!` | `${infer Base}?` ? Base : S

type StringDslType =
    | 'string'
    | 'email'
    | 'url'
    | 'uri'
    | 'uuid'
    | 'ipv4'
    | 'ipv6'
    | 'ip'
    | 'hostname'
    | 'date'
    | 'datetime'
    | 'time'
    | 'binary'
    | 'buffer'
    | 'objectId'
    | 'objectid'
    | 'hexColor'
    | 'macAddress'
    | 'cron'
    | 'slug'
    | 'chineseName'
    | 'chinese'
    | 'emailDomain'
    | 'alphanum'
    | 'lower'
    | 'upper'
    | 'json'

type NumberDslType =
    | 'number'
    | 'integer'
    | 'int'
    | 'float'
    | 'double'
    | 'decimal'
    | 'port'

type BooleanDslType = 'boolean'
type ObjectDslType = 'object'
type ArrayDslType = 'array'
type NullDslType = 'null'
type AnyDslType =
    | 'any'
    | 'mixed'

type ParseNumberLiteral<S extends string> = S extends `${infer N extends number}` ? N : number
type ParseBooleanLiteral<S extends string> = S extends 'true' ? true : S extends 'false' ? false : boolean
type InferUntypedEnumValue<Value extends string> =
    Value extends `${infer N extends number}`
    ? N
    : Value extends 'true'
    ? true
    : Value extends 'false'
    ? false
    : Value
type InferTypedEnumValue<TypeName extends string, Value extends string> =
    StripMarker<TypeName> extends NumberDslType
    ? ParseNumberLiteral<Value>
    : StripMarker<TypeName> extends BooleanDslType
    ? ParseBooleanLiteral<Value>
    : Value

type SplitTypedEnum<TypeName extends string, Values extends string> = Values extends `${infer Head}|${infer Tail}`
    ? InferTypedEnumValue<TypeName, Head> | SplitTypedEnum<TypeName, Tail>
    : Values extends `${infer Head},${infer Tail}`
    ? InferTypedEnumValue<TypeName, Head> | SplitTypedEnum<TypeName, Tail>
    : InferTypedEnumValue<TypeName, Values>

type SplitUntypedEnum<Values extends string> = Values extends `${infer Head}|${infer Tail}`
    ? InferUntypedEnumValue<Head> | SplitUntypedEnum<Tail>
    : Values extends `${infer Head},${infer Tail}`
    ? InferUntypedEnumValue<Head> | SplitUntypedEnum<Tail>
    : InferUntypedEnumValue<Values>

type SplitDslTypes<S extends string> = S extends `${infer Head}|${infer Tail}`
    ? InferDslString<Head> | SplitDslTypes<Tail>
    : InferDslString<S>

type RequiredDslKeys<T extends Record<string, unknown>> = {
    [K in keyof T]: K extends string
    ? K extends `${infer Name}!`
    ? Name
    : T[K] extends `${string}!`
    ? K
    : never
    : never
}[keyof T]

type CleanDslKey<K> = K extends `${infer Name}!` | `${infer Name}?` ? Name : K

type InferJsonSchemaProperties<Properties, RequiredKeys extends PropertyKey> =
    & {
        [K in keyof Properties as K extends RequiredKeys ? K : never]-?: InferSchema<Properties[K]>
    }
    & {
        [K in keyof Properties as K extends RequiredKeys ? never : K]?: InferSchema<Properties[K]>
    }

type InferDslProperties<T extends Record<string, unknown>, RequiredKeys extends PropertyKey = RequiredDslKeys<T>> =
    & {
        [K in keyof T as CleanDslKey<K> extends RequiredKeys ? CleanDslKey<K> : never]-?: InferSchema<T[K]>
    }
    & {
        [K in keyof T as CleanDslKey<K> extends RequiredKeys ? never : CleanDslKey<K>]?: InferSchema<T[K]>
    }

export type InferDslString<T extends string> = StripMarker<T> extends `types:${infer Rest}`
    ? SplitDslTypes<Rest>
    : StripMarker<T> extends `enum:${infer TypeName}:${infer Values}`
    ? SplitTypedEnum<TypeName, Values>
    : StripMarker<T> extends `enum:${infer Values}`
    ? SplitUntypedEnum<Values>
    : StripMarker<T> extends `array:${string}<${infer Item}>`
    ? InferDslString<Item>[]
    : StripMarker<T> extends `array<${infer Item}>`
    ? InferDslString<Item>[]
    : StripMarker<T> extends `${string}|${string}`
    ? SplitUntypedEnum<StripMarker<T>>
    : StripMarker<T> extends `${infer Base}:${string}`
    ? InferDslString<Base>
    : StripMarker<T> extends StringDslType
    ? string
    : StripMarker<T> extends NumberDslType
    ? number
    : StripMarker<T> extends BooleanDslType
    ? boolean
    : StripMarker<T> extends ObjectDslType
    ? Record<string, unknown>
    : StripMarker<T> extends ArrayDslType
    ? unknown[]
    : StripMarker<T> extends NullDslType
    ? null
    : StripMarker<T> extends AnyDslType
    ? unknown
    : string

type JsonSchemaTypeName = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'null'

type InferJsonSchemaType<TypeName, Schema> = TypeName extends 'number' | 'integer'
    ? number
    : TypeName extends 'boolean'
    ? boolean
    : TypeName extends 'null'
    ? null
    : TypeName extends 'object'
    ? Schema extends { properties: infer Properties; required?: readonly (infer RequiredKey)[] }
    ? InferJsonSchemaProperties<Properties, Extract<RequiredKey, keyof Properties>>
    : Record<string, unknown>
    : TypeName extends 'array'
    ? Schema extends { items: infer Item }
    ? InferSchema<Item>[]
    : unknown[]
    : TypeName extends 'string'
    ? string
    : unknown

export type InferJsonSchema<T> = T extends { const: infer Value }
    ? Value
    : T extends { enum: readonly (infer Value)[] }
    ? Value
    : T extends { oneOf: readonly (infer Variant)[] }
    ? InferSchema<Variant>
    : T extends { anyOf: readonly (infer Variant)[] }
    ? InferSchema<Variant>
    : T extends { type: readonly (infer TypeName)[] }
    ? InferJsonSchemaType<Extract<TypeName, JsonSchemaTypeName>, T>
    : T extends { type: 'object'; properties: infer Properties; required?: readonly (infer RequiredKey)[] }
    ? InferJsonSchemaProperties<Properties, Extract<RequiredKey, keyof Properties>>
    : T extends { type: 'array'; items: infer Item }
    ? InferSchema<Item>[]
    : T extends { type: 'number' | 'integer' }
    ? number
    : T extends { type: 'boolean' }
    ? boolean
    : T extends { type: 'null' }
    ? null
    : T extends { type: 'object' }
    ? Record<string, unknown>
    : T extends { type: 'array' }
    ? unknown[]
    : T extends { type: 'string' }
    ? string
    : T extends { properties: infer Properties; required?: readonly (infer RequiredKey)[] }
    ? InferJsonSchemaProperties<Properties, Extract<RequiredKey, keyof Properties>>
    : unknown

export type InferDslDefinition<T extends Record<string, unknown>> = InferDslProperties<T>

export type InferSchema<T> = T extends string
    ? InferDslString<T>
    : T extends true
    ? unknown
    : T extends false
    ? never
    : T extends { type: unknown } | { properties: unknown } | { oneOf: unknown } | { anyOf: unknown } | { enum: unknown } | { const: unknown }
    ? InferJsonSchema<T>
    : T extends Record<string, unknown>
    ? InferDslDefinition<T>
    : unknown
