# JSON Schema 基础

schema-dsl 以 JSON Schema Draft 7 为基础，并额外保留少量内部字段供验证器使用。它也会执行部分较新版本的 applicator 关键字，包括 `minContains` / `maxContains`；这项扩展不表示完整支持 Draft 2019-09 或 2020-12。

常见字段：

- `type`
- `properties`
- `required`
- `minLength` / `maxLength`
- `minimum` / `maximum`
- `format`
- `enum`
- `items`
- `additionalItems`
- `contains`，以及 schema-dsl 的 `minContains` / `maxContains` 范围支持

对外输出纯净 JSON Schema 时，请使用 `toJsonSchema()`。

```javascript
const emailField = s('email!').label('邮箱');

emailField.toSchema();
// 含 _label / _customMessages 等内部字段

emailField.toJsonSchema();
// 纯净 JSON Schema，适合导出到外部系统

const objectSchema = s({
	email: emailField,
	age: s('number:18-100')
});
// s({ ... }) 入口直接返回 Draft 7 风格对象

const containsRangeSchema = {
	type: 'array',
	contains: { type: 'number' },
	minContains: 2,
	maxContains: 3
};
// validate()、validateAsync() 与 compile() 会一致执行该范围约束。
```

---

## 对应示例文件

**示例入口**: [json-schema-basics.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/json-schema-basics.ts)  
**说明**: 直接对比 `toSchema()` 与 `toJsonSchema()` 的输出差异，并展示对象入口返回的 JSON Schema 结构。

