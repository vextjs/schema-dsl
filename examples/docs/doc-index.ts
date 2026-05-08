import { dsl, validate, Validator, MarkdownExporter } from '../../dist/index.js'

const quickStartSchema = dsl({
  name: 'string:2-32!',
  email: 'email!',
})

const advancedSchema = dsl({
  role: 'admin|user|guest',
  score: 'number:>=0',
  tags: 'array<string:2-20>',
})

const quickStartResult = validate(quickStartSchema, {
  name: 'Rocky',
  email: 'rocky@example.com',
})

const validator = new Validator()
const compiled = validator.compile(advancedSchema, 'doc-index-advanced')
const advancedValid = compiled({
  role: 'admin',
  score: 98,
  tags: ['docs', 'guide'],
})

const markdown = MarkdownExporter.export(quickStartSchema, { title: 'Doc Index Demo' })

console.log('doc-index.quick-start.valid =', quickStartResult.valid)
console.log('doc-index.advanced.valid =', advancedValid)
console.log('doc-index.markdown.containsTitle =', markdown.includes('Doc Index Demo'))