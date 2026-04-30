# schema-dsl examples

本目录包含文档中引用的最小 TypeScript 示例。示例默认基于当前 TypeScript 重构版构建产物或已发布包名 `schema-dsl`。

先做类型检查：

```powershell
npm run examples:typecheck
```

编译后运行单个示例：

```powershell
npm run examples:build
node .tmp/simple-example.js
```

