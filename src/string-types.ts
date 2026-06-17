import type { IDslBuilder } from './types/dsl.js'
import type { JSONSchema } from './types/schema.js'

export interface SchemaDslStringExtensions {
  pattern(regex: RegExp | string, message?: string): IDslBuilder
  label(text: string): IDslBuilder
  messages(msgs: Record<string, string>): IDslBuilder
  error(messages: Record<string, string>): IDslBuilder
  description(text: string): IDslBuilder
  format(fmt: string): IDslBuilder
  custom(validatorFn: (value: unknown) => unknown): IDslBuilder
  default(value: unknown): IDslBuilder
  toSchema(): JSONSchema
  toJsonSchema(): JSONSchema
  username(preset?: string | { minLength?: number; maxLength?: number; allowUnderscore?: boolean; allowNumber?: boolean }): IDslBuilder
  password(preset?: string): IDslBuilder
  phone(country?: string): IDslBuilder
  phoneNumber(country?: string): IDslBuilder
  idCard(country?: string): IDslBuilder
  creditCard(type?: string): IDslBuilder
  licensePlate(country?: string): IDslBuilder
  postalCode(country?: string): IDslBuilder
  passport(country?: string): IDslBuilder
  slug(): IDslBuilder
  domain(): IDslBuilder
  ip(): IDslBuilder
  base64(): IDslBuilder
  jwt(): IDslBuilder
  dateGreater(date: string): IDslBuilder
  dateLess(date: string): IDslBuilder
  after(date: string): IDslBuilder
  before(date: string): IDslBuilder
  dateFormat(fmt: string): IDslBuilder
  min(n: number): IDslBuilder
  max(n: number): IDslBuilder
  alphanum(): IDslBuilder
  lowercase(): IDslBuilder
  uppercase(): IDslBuilder
  json(): IDslBuilder
  precision(n: number): IDslBuilder
  multiple(n: number): IDslBuilder
  port(): IDslBuilder
  requireAll(): IDslBuilder
  strict(): IDslBuilder
  noSparse(): IDslBuilder
  includesRequired(items: unknown[]): IDslBuilder
  required(): IDslBuilder
  optional(): IDslBuilder
  enum(...values: unknown[]): IDslBuilder
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- intentional opt-in global declaration merging
  interface String extends SchemaDslStringExtensions {}
}

export {}
