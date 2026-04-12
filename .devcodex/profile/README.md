# schema-dsl · Profile 索引

> DevCodex Profile — 供 AI Agent 加载项目上下文

## 文件清单

| 文件 | 说明 | 必读 |
|------|------|:----:|
| [01-项目信息.md](./01-项目信息.md) | 技术栈、仓库信息、依赖、环境要求 | ✅ |
| [02-架构约束.md](./02-架构约束.md) | 目录结构、模块边界、数据流、API接口 | ✅ |
| [03-代码风格.md](./03-代码风格.md) | 命名规范、ESLint配置、注释风格、模块化 | ✅ |

## 项目快速概览

- **项目名**: schema-dsl
- **版本**: 2.0.0（TypeScript + ESM/CJS 双格式）
- **类型**: JSON Schema 数据验证库（v1 100% 向后兼容）
- **核心能力**: DSL语法数据验证 + 数据库Schema导出 + 多语言错误处理
- **源码**: `src/`（TypeScript）→ 构建产物 `dist/`（tsup）
- **测试**: `test/`（Vitest，1013 个用例）
- **npm**: https://www.npmjs.com/package/schema-dsl
- **仓库**: https://github.com/vextjs/schema-dsl
- **v1 参考**: `E:\MySelf\schema-dsl-v1.1.0`（v1.2.5 只读参考）
- **下游项目**: monSQLize（CJS）、vext（ESM）
- **ENV_MODE**: prod（默认）
