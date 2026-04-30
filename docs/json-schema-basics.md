# JSON Schema 基础

schema-dsl 生成的是 JSON Schema Draft 7 风格的对象，并额外保留少量内部字段供验证器使用。

常见字段：

- `type`
- `properties`
- `required`
- `minLength` / `maxLength`
- `minimum` / `maximum`
- `format`
- `enum`
- `items`

对外输出纯净 JSON Schema 时，请使用 `toJsonSchema()`。

