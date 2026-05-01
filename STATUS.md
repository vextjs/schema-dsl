# schema-dsl Status

当前仓库为 TypeScript 重构版，目标是保持 v1 公共 API 兼容并提供 ESM/CJS 双格式构建。

当前插件兼容状态：已恢复 v1 官方插件子路径 `schema-dsl/plugins/*`（`custom-format` / `custom-validator` / `custom-type-example`），并确认 `custom-validator` 安装阶段不再输出 AJV `addKeyword` deprecated 警告。

## 当前验证

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- `npm run test:version`
- CJS 子路径 smoke（`require('schema-dsl/plugins/*')`）
- ESM 子路径 smoke（`import 'schema-dsl/plugins/*'`）

