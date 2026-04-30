# 性能优化指南

## 建议

- 复用已编译 Schema 或默认验证器缓存。
- 批量验证时优先使用 `Validator.validateBatch()`。
- 对热点 Schema 避免在循环中重复构造。

## 验证命令

```powershell
npm test
npm run bench
```

