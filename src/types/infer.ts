type StripMarker<S extends string> = S extends `${infer Base}!` | `${infer Base}?` ? Base : S

type KnownDslType =
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
    | 'objectId'
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
    | 'port'
    | 'number'
    | 'integer'
    | 'boolean'
    | 'object'
    | 'array'
    | 'null'
    | 'any'

type InferPipeMember<S extends string> = StripMarker<S> extends KnownDslType ? InferDslString<S> : StripMarker<S>

type SplitPipe<S extends string> = S extends `${infer Head}|${infer Tail}`
    ? InferPipeMember<Head> | SplitPipe<Tail>
    : InferPipeMember<S>

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
    ? SplitPipe<Rest>
    : StripMarker<T> extends `enum:${infer Values}`
    ? SplitPipe<Values>
    : StripMarker<T> extends `${infer Base}:${string}`
    ? InferDslString<Base>
    : StripMarker<T> extends 'number' | 'integer' | 'port'
    ? number
    : StripMarker<T> extends 'boolean'
    ? boolean
    : StripMarker<T> extends 'object'
    ? Record<string, unknown>
    : StripMarker<T> extends 'array'
    ? unknown[]
    : StripMarker<T> extends 'null'
    ? null
    : StripMarker<T> extends 'any'
    ? unknown
    : StripMarker<T> extends `${string}|${string}`
    ? SplitPipe<StripMarker<T>>
    : string

export type InferJsonSchema<T> = T extends { oneOf: readonly (infer Variant)[] }
    ? InferSchema<Variant>
    : T extends { anyOf: readonly (infer Variant)[] }
    ? InferSchema<Variant>
    : T extends { enum: readonly (infer Value)[] }
    ? Value
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
    : unknown

export type InferDslDefinition<T extends Record<string, unknown>> = InferDslProperties<T>

export type InferSchema<T> = T extends string
    ? InferDslString<T>
    : T extends { type: unknown } | { properties: unknown } | { oneOf: unknown } | { anyOf: unknown } | { enum: unknown }
    ? InferJsonSchema<T>
    : T extends Record<string, unknown>
    ? InferDslDefinition<T>
    : unknown