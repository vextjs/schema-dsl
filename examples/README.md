# schema-dsl examples

本目录包含文档中引用的 TypeScript 示例。示例默认基于当前 TypeScript 重构版构建产物或已发布包名 `schema-dsl`。

- `examples/docs/*.ts`：与 `docs/*.md` 一一对应的文档示例入口

先做类型检查：

```powershell
npm run examples:typecheck
```

编译后运行单个示例：

```powershell
npm run examples:build
node .tmp/docs/quick-start.js
```

文档示例入口示例：

```powershell
npm run examples:build
node .tmp/docs/quick-start.js
```

