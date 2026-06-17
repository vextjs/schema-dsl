import dsl, { installStringExtensions } from './api.js'

export * from './api.js'
export { default } from './api.js'

installStringExtensions(dsl)
