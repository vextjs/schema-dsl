/**
 * StringExtensions — String.prototype 链式 DSL 扩展（opt-in）
 *
 * v2 修复：
 *   S-01/S-02：数组驱动对称 install/uninstall（v1 uninstall 遗漏了 `format` 和 `phoneNumber`）
 *              现在通过 EXTENSION_METHODS 数组统一维护，确保两个操作完全对称
 *
 * @example
 * import { installStringExtensions } from 'schema-dsl'
 * installStringExtensions(dsl)
 * // 之后可使用：
 * 'email!'.label('邮箱').messages({ format: '格式不正确' })
 * 'string:3-32!'.username('medium')
 */

import type { DslBuilder } from './DslBuilder.js'

// 修复 S-01/S-02：所有扩展方法名统一在此数组管理，install/uninstall 对称
const EXTENSION_METHODS = [
  'pattern',
  'label',
  'messages',
  'error',
  'description',
  'format',
  'custom',
  'default',
  'toSchema',
  'toJsonSchema',
  'username',
  'password',
  'phone',
  'phoneNumber',
  'idCard',
  'creditCard',
  'licensePlate',
  'postalCode',
  'passport',
  'slug',
  'domain',
  'ip',
  'base64',
  'jwt',
  'dateGreater',
  'dateLess',
  'after',
  'before',
  'dateFormat',
  'min',
  'max',
  'alphanum',
  'lowercase',
  'uppercase',
  'json',
  'precision',
  'multiple',
  'port',
  'requireAll',
  'strict',
  'noSparse',
  'includesRequired',
  'required',
  'optional',
  'enum',
  '_dslExtensionsInstalled',
] as const

type DslFn = (dslStr: string) => DslBuilder

/**
 * 安装 String.prototype 扩展
 * @param dslFunction - dsl() 函数（用于将字符串转为 DslBuilder 实例）
 */
export function installStringExtensions(dslFunction: DslFn): void {
  // 幂等性：已安装则跳过
  if ((String.prototype as unknown as Record<string, unknown>)['_dslExtensionsInstalled']) return

  const proto = String.prototype as unknown as Record<string, unknown>

  function extend(name: string, fn: (...args: unknown[]) => unknown): void {
    proto[name] = fn
  }

  // 委托到 DslBuilder 实例的同名方法（透明代理）
  const delegatedMethods: string[] = [
    'pattern', 'label', 'messages', 'error', 'description', 'format', 'custom',
    'default', 'username', 'password', 'phone', 'phoneNumber', 'idCard', 'creditCard',
    'licensePlate', 'postalCode', 'passport', 'slug', 'domain', 'ip', 'base64', 'jwt',
    'dateGreater', 'dateLess', 'after', 'before', 'dateFormat',
    'min', 'max', 'alphanum', 'lowercase', 'uppercase', 'json',
    'precision', 'multiple', 'port', 'requireAll', 'strict',
    'noSparse', 'includesRequired', 'required', 'optional',
  ]

  for (const method of delegatedMethods) {
    extend(method, function (this: string, ...args: unknown[]): DslBuilder {
      const builder = dslFunction(String(this))
      return (builder as unknown as Record<string, (...args: unknown[]) => DslBuilder>)[method](...args)
    })
  }

  // enum 方法接受 rest 参数
  extend('enum', function (this: string, ...values: unknown[]): DslBuilder {
    return dslFunction(String(this)).enum(...values)
  })

  // toSchema / toJsonSchema 返回 JSONSchema（非 DslBuilder）
  extend('toSchema', function (this: string) {
    return dslFunction(String(this)).toSchema()
  })
  extend('toJsonSchema', function (this: string) {
    return dslFunction(String(this)).toJsonSchema()
  })

  // 安装完成标记（v1 BC）
  proto['_dslExtensionsInstalled'] = true
}

/**
 * 卸载 String.prototype 扩展（用于测试或清理）
 * 修复 S-01/S-02：使用 EXTENSION_METHODS 数组确保与 install 完全对称
 */
export function uninstallStringExtensions(): void {
  if (!(String.prototype as unknown as Record<string, unknown>)['_dslExtensionsInstalled']) return

  const proto = String.prototype as unknown as Record<string, unknown>
  for (const method of EXTENSION_METHODS) {
    delete proto[method]
  }
}
