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

```javascript
const emailField = dsl('email!').label('邮箱');

emailField.toSchema();
// 含 _label / _customMessages 等内部字段

emailField.toJsonSchema();
// 纯净 JSON Schema，适合导出到外部系统

const objectSchema = dsl({
	email: emailField,
	age: dsl('number:18-100')
});
// dsl({ ... }) 入口直接返回 Draft 7 风格对象
```

---

## 对应示例文件

**示例入口**: [json-schema-basics.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/json-schema-basics.ts)  
**说明**: 直接对比 `toSchema()` 与 `toJsonSchema()` 的输出差异，并展示对象入口返回的 JSON Schema 结构。

