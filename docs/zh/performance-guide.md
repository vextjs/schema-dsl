# 性能优化指南

## 建议

- 复用同一个 schema 对象，让默认验证器缓存命中。
- 通过 `s.config({ cache })` 或 `new Validator({ cache })` 调整缓存策略。
- 对热点路径避免在循环中重复构造 DSL。
- 服务端应复用长生命周期的 `Validator` 实例；每次请求都新建会重置验证引擎和实例缓存。
- 如果你已经自行管理底层验证实例，再考虑 `SchemaUtils.validateBatch()` 这类批量路径。

## 当前 benchmark 基线

本节全部数值来自仓库跟踪的 `test/benchmarks/performance-docs-snapshot.json`，不再拼接不同 benchmark 报告。环境：Node.js v20.20.2、win32-x64、Zod 4.3.6；运行开始时间 2026-07-13T09:55:17.579Z。

该 full 场景矩阵包含 19 个计入胜负的可比场景和 1 个不计入胜负的异步抛错诊断场景（`AV2_THROW`）；可比场景中 schema-dsl 胜 14/19，Zod 胜 5/19。接近持平的场景可能在不同运行中切换胜方，因此这个矩阵只作为本仓库的回归信号，不作为永久公开性能承诺。

| ID | 场景 | schema-dsl | Zod | 结果 |
|---|---|---:|---:|---|
| S1 | 有效数据 | 1.792M | 1.427M | schema-dsl 1.26x |
| S2 | 无效数据 | 158.10K | 12.77K | schema-dsl 12.38x |
| S3 | 格式化 | 14.19K | 13.48K | schema-dsl 1.05x |
| C1 | 类型转换 | 3.852M | 3.221M | schema-dsl 1.20x |
| C2 | 关闭类型转换 | 635.40K | 29.86K | schema-dsl 21.28x |
| U1 | 联合类型 | 2.723M | 10.295M | Zod 3.78x |
| U2 | 联合类型 | 2.690M | 5.977M | Zod 2.22x |
| E1 | 枚举 | 10.370M | 14.025M | Zod 1.35x |
| A1 | 数组 | 1.061M | 268.34K | schema-dsl 3.95x |
| A2 | 数组 | 33.43K | 27.63K | schema-dsl 1.21x |
| D1 | 深层对象 | 777.96K | 2.101M | Zod 2.70x |
| L1 | 大对象 | 110.41K | 83.25K | schema-dsl 1.33x |
| COND1 | 条件分支 | 10.30K | 17.48K | Zod 1.70x |
| COND2 | 条件分支 | 9.48K | 7.80K | schema-dsl 1.22x |
| CV1 | 自定义规则 | 6.747M | 6.090M | schema-dsl 1.11x |
| CV2 | 自定义规则 | 182.50K | 33.26K | schema-dsl 5.49x |
| AV1 | 异步 | 1.943M | 1.021M | schema-dsl 1.90x |
| AV2 | 异步 | 39.00K | 38.94K | schema-dsl 1.00x |
| AV2_THROW | 异步抛错 | 40.55K | 29.75K | schema-dsl 1.36x |
| COLD1 | 冷启动 | 13.60K | 7.34K | schema-dsl 1.85x |

矩阵的 JSON 报告会记录语义差异。这里比较的是双方最接近的受支持行为，不表示所有场景的内部实现语义完全相同。

这些数字适合作为当前项目的回归基线。Node.js、依赖、schema 复杂度或错误格式化行为变化后，应重新运行 benchmark。

## 推荐做法

```typescript
import { Validator, s } from 'schema-dsl/pure';

const schema = s({
	email: 'email!',
	age: 'number:18-100'
});

const validator = new Validator({
	cache: { maxSize: 500, statsEnabled: true }
});

validator.validate(schema, { email: 'a@example.com', age: 20 });
validator.validate(schema, { email: 'b@example.com', age: 21 });

console.log(validator.getCacheStats());
```

## 请求级 DSL 与内存边界

调用 `s()` 本身不会保留无限增长的全局状态。生产环境真正需要避免的不是“每次请求调用 `s()` 必然泄漏”，而是在热点路径上生成无限多种不同的 schema 结构。

```typescript
// 通常安全，但仍慢于启动时转换：
// 结构稳定，验证阶段可以复用编译缓存。
app.post('/users', (req, res) => {
	const schema = s({ email: 'email!', age: 'number:18-100' });
	const result = validate(schema, req.body);
	res.json(result);
});

// 长运行服务中应避免：
// 每个请求都生成不同结构，缓存几乎无法命中。
app.post('/dynamic', (req, res) => {
	const schema = s({ [`field_${req.id}`]: 'string!' });
	const result = validate(schema, req.body);
	res.json(result);
});
```

内置缓存对“相同 schema 结构被重复使用”的场景有效。它无法让无限多、从不重复的新 schema 变便宜：schema-dsl 自身的受控缓存有容量边界，但每次未命中仍要承担转换和 validator 编译成本。

## 服务端 Validator 生命周期

普通 API 请求中不要每次都创建新的 `Validator`：

```typescript
// 不推荐放在请求处理函数里
app.post('/users', (req, res) => {
	const validator = new Validator();
	res.json(validator.validate(userSchema, req.body));
});
```

如果实例没有被长期持有，这通常不是长期内存泄漏；问题在于它会丢弃实例级缓存，并让新的 validator / 缓存对象不断进入分配和 GC。推荐使用一个应用级 validator，或按不同配置 profile 维护少量 validator。

对确实不可复用、基数很高的一次性动态 schema，可以隔离这条路径并让 validator 短生命周期存在，但不要把请求内创建的 validator 或 schema 对象存入应用级集合。

## 什么时候需要更低层优化

- 你要长期复用同一个 `Validator` 实例并观察命中率。
- 你需要显式控制缓存大小、TTL 或统计开关。
- 你已经维护底层验证实例，需要走 `SchemaUtils.validateBatch()`。

## 验证命令

```powershell
npm test
npm run bench:smoke
npm run bench:conditional
npm run bench:full
npm run bench:cache
npm run bench:guard:smoke
npm run bench:guard:full
```

回归门禁会对每个被跟踪的场景运行三次并取中位数。同一 Node.js、平台和 CPU 下，schema-dsl/Zod 比值必须不低于基线的 75%；绝对吞吐低于阈值时，只有同轮 Zod 也出现相同比例的主机负载下降才标记为 `CALIBRATED`，否则仍失败。环境不同时只使用同轮相对比值。这里的 Zod 是固定版本的校准负载，不构成产品性能宣传。

---

## 对应示例文件

**示例入口**: [performance-guide.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/performance-guide.ts)  
**说明**: 展示复用同一个 schema / validator、读取缓存统计，以及 `SchemaUtils.withPerformance()` 包装后的耗时输出。

