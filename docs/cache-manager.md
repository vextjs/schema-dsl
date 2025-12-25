# CacheManager 缓存管理器

> **模块**: `lib/core/CacheManager.js`  
> **版本**: v1.0.0  
> **用途**: 高性能 Schema 编译缓存，支持 LRU 淘汰和 TTL 过期

---

## 📑 目录

- [概述](#概述)
- [快速开始](#快速开始)
- [API 参考](#api-参考)
- [配置选项](#配置选项)
- [统计信息](#统计信息)
- [最佳实践](#最佳实践)

---

## 概述

`CacheManager` 是 SchemaIO 的内部缓存系统，用于缓存编译后的 Schema 验证函数，避免重复编译带来的性能开销。

### 核心功能

- ✅ LRU（最近最少使用）淘汰策略
- ✅ TTL（生存时间）过期机制
- ✅ 命中率统计
- ✅ 可配置的缓存大小
- ✅ 自动清理过期缓存

---

## 快速开始

```javascript
const CacheManager = require('schemaio/lib/core/CacheManager');

// 创建缓存实例
const cache = new CacheManager({
  maxSize: 100,    // 最大缓存数量
  ttl: 3600000     // 1小时过期
});

// 存储缓存
cache.set('user-schema', compiledValidator);

// 获取缓存
const validator = cache.get('user-schema');
if (validator) {
  console.log('缓存命中');
} else {
  console.log('缓存未命中');
}

// 查看统计
console.log(cache.getStats());
```

---

## API 参考

### 构造函数

```javascript
new CacheManager(options)
```

**参数**：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `options.maxSize` | number | `100` | 最大缓存条目数 |
| `options.ttl` | number | `3600000` | 缓存生存时间（毫秒） |
| `options.enabled` | boolean | `true` | 是否启用缓存 |
| `options.statsEnabled` | boolean | `true` | 是否启用统计 |

---

### `get(key)`

获取缓存值。

```javascript
const value = cache.get('my-key');
```

**返回值**：
- 命中：返回缓存的值
- 未命中或过期：返回 `null`

**行为**：
- 更新访问时间（LRU）
- 增加访问计数
- 将条目移到队列末尾

---

### `set(key, value, ttl?)`

设置缓存值。

```javascript
// 使用默认 TTL
cache.set('key', value);

// 使用自定义 TTL（5分钟）
cache.set('key', value, 300000);
```

**行为**：
- 如果达到最大容量，自动淘汰最久未使用的条目
- 记录创建时间和访问时间

---

### `delete(key)`

删除缓存条目。

```javascript
const deleted = cache.delete('key');
console.log(deleted); // true 或 false
```

---

### `has(key)`

检查缓存是否存在（不更新访问时间）。

```javascript
if (cache.has('key')) {
  console.log('缓存存在');
}
```

---

### `clear()`

清空所有缓存。

```javascript
cache.clear();
```

---

### `getStats()`

获取缓存统计信息。

```javascript
const stats = cache.getStats();
console.log(stats);
// {
//   hits: 150,       // 命中次数
//   misses: 30,      // 未命中次数
//   evictions: 10,   // 淘汰次数
//   sets: 100,       // 设置次数
//   deletes: 5,      // 删除次数
//   clears: 1,       // 清空次数
//   hitRate: 0.833,  // 命中率 (83.3%)
//   size: 80,        // 当前缓存数量
//   maxSize: 100     // 最大容量
// }
```

---

### `resetStats()`

重置统计信息。

```javascript
cache.resetStats();
```

---

### `getSize()`

获取当前缓存条目数量。

```javascript
console.log(`当前缓存: ${cache.getSize()} 条`);
```

---

## 配置选项

### 缓存大小

```javascript
// 小型应用（节省内存）
const smallCache = new CacheManager({ maxSize: 50 });

// 大型应用（更高性能）
const largeCache = new CacheManager({ maxSize: 500 });
```

### TTL 设置

```javascript
// 短期缓存（5分钟）
const shortCache = new CacheManager({ ttl: 5 * 60 * 1000 });

// 长期缓存（24小时）
const longCache = new CacheManager({ ttl: 24 * 60 * 60 * 1000 });

// 永不过期
const permanentCache = new CacheManager({ ttl: 0 });
```

### 禁用缓存

```javascript
// 开发环境可能需要禁用缓存
const noCache = new CacheManager({ enabled: false });
```

---

## 统计信息

### 命中率分析

```javascript
function analyzeCachePerformance(cache) {
  const stats = cache.getStats();

  console.log('=== 缓存性能分析 ===');
  console.log(`命中次数: ${stats.hits}`);
  console.log(`未命中次数: ${stats.misses}`);
  console.log(`命中率: ${(stats.hitRate * 100).toFixed(1)}%`);
  console.log(`缓存使用率: ${(stats.size / stats.maxSize * 100).toFixed(1)}%`);
  console.log(`淘汰次数: ${stats.evictions}`);

  // 性能建议
  if (stats.hitRate < 0.5) {
    console.log('⚠️ 命中率较低，考虑增加缓存大小');
  }
  if (stats.evictions > stats.sets * 0.5) {
    console.log('⚠️ 淘汰率较高，考虑增加缓存大小或TTL');
  }
}
```

### 监控仪表板

```javascript
function printCacheDashboard(cache) {
  const stats = cache.getStats();
  const hitRate = (stats.hitRate * 100).toFixed(1);
  const usage = (stats.size / stats.maxSize * 100).toFixed(1);

  console.log('┌─────────────────────────────┐');
  console.log('│     缓存状态仪表板          │');
  console.log('├─────────────────────────────┤');
  console.log(`│ 命中率:     ${hitRate.padStart(6)}%          │`);
  console.log(`│ 使用率:     ${usage.padStart(6)}%          │`);
  console.log(`│ 当前条目:   ${String(stats.size).padStart(6)}           │`);
  console.log(`│ 最大容量:   ${String(stats.maxSize).padStart(6)}           │`);
  console.log('└─────────────────────────────┘');
}
```

---

## 最佳实践

### 1. 合理设置缓存大小

```javascript
// 根据 Schema 数量估算
// 如果有 50 个不同的 Schema，设置 100 以留有余量
const cache = new CacheManager({ maxSize: 100 });
```

### 2. 开发环境禁用缓存

```javascript
const cache = new CacheManager({
  enabled: process.env.NODE_ENV !== 'development'
});
```

### 3. 定期检查性能

```javascript
setInterval(() => {
  const stats = cache.getStats();
  if (stats.hitRate < 0.8) {
    console.warn('缓存命中率低于80%');
  }
}, 60000);
```

### 4. 在 Schema 更新时清除缓存

```javascript
function updateSchema(name, newSchema) {
  // 更新 Schema
  schemas[name] = newSchema;
  
  // 清除相关缓存
  cache.delete(`schema:${name}`);
}
```

---

## LRU 淘汰机制

当缓存达到最大容量时，自动淘汰最久未使用的条目：

```
缓存操作顺序：
1. set('A', ...) → [A]
2. set('B', ...) → [A, B]
3. set('C', ...) → [A, B, C]  (达到 maxSize=3)
4. get('A')      → [B, C, A]  (A 移到末尾)
5. set('D', ...) → [C, A, D]  (B 被淘汰)
```

---

## 相关文档

- [Validator](validate.md)
- [性能优化指南](validation-guide.md#性能优化)
- [API 参考](api-reference.md)
