/**
 * 简化版性能对比测试
 *
 * 不依赖 benchmark 库，直接测试各库性能
 */

const testIterations = 10000;

// ========== 测试数据 ==========
const testData = {
  username: 'john_doe',
  email: 'john@example.com',
  age: 25,
  tags: ['nodejs', 'javascript', 'validation']
};

console.log('='.repeat(80));
console.log('Schema-DSL vs 主流验证库 - 性能对比测试');
console.log('='.repeat(80));
console.log('');
console.log(`测试场景: 用户注册表单验证`);
console.log(`测试次数: ${testIterations.toLocaleString()} 次迭代`);
console.log(`测试数据: ${JSON.stringify(testData)}`);
console.log('');
console.log('='.repeat(80));
console.log('');

const results = [];

// ========== 测试 Schema-DSL ==========
console.log('测试 Schema-DSL...');
try {
  const { dsl, validate } = require('../../index');
  const schemaDslSchema = dsl({
    username: 'string:3-32!',
    email: 'email!',
    age: 'number:18-120',
    tags: 'array!1-10<string:1-20>'
  });

  // 预热
  for (let i = 0; i < 100; i++) {
    validate(schemaDslSchema, testData);
  }

  // 正式测试
  const start = Date.now();
  for (let i = 0; i < testIterations; i++) {
    validate(schemaDslSchema, testData);
  }
  const end = Date.now();
  const time = end - start;

  results.push({
    name: 'Schema-DSL',
    time,
    opsPerSec: Math.round((testIterations / time) * 1000),
    avgTime: (time / testIterations).toFixed(3)
  });

  console.log(`  ✅ 完成 - 总耗时: ${time}ms`);
} catch (e) {
  console.log(`  ❌ 失败: ${e.message}`);
}
console.log('');

// ========== 测试 Joi ==========
console.log('测试 Joi...');
try {
  const Joi = require('joi');
  const joiSchema = Joi.object({
    username: Joi.string().min(3).max(32).required(),
    email: Joi.string().email().required(),
    age: Joi.number().min(18).max(120),
    tags: Joi.array().items(Joi.string().min(1).max(20)).min(1).max(10)
  });

  // 预热
  for (let i = 0; i < 100; i++) {
    joiSchema.validate(testData);
  }

  // 正式测试
  const start = Date.now();
  for (let i = 0; i < testIterations; i++) {
    joiSchema.validate(testData);
  }
  const end = Date.now();
  const time = end - start;

  results.push({
    name: 'Joi',
    time,
    opsPerSec: Math.round((testIterations / time) * 1000),
    avgTime: (time / testIterations).toFixed(3)
  });

  console.log(`  ✅ 完成 - 总耗时: ${time}ms`);
} catch (e) {
  console.log(`  ⚠️  未安装 - 跳过测试 (npm install joi)`);
}
console.log('');

// ========== 测试 Yup ==========
console.log('测试 Yup...');
try {
  const yup = require('yup');
  const yupSchema = yup.object({
    username: yup.string().min(3).max(32).required(),
    email: yup.string().email().required(),
    age: yup.number().min(18).max(120),
    tags: yup.array().of(yup.string().min(1).max(20)).min(1).max(10)
  });

  // 预热
  for (let i = 0; i < 100; i++) {
    yupSchema.validateSync(testData);
  }

  // 正式测试
  const start = Date.now();
  for (let i = 0; i < testIterations; i++) {
    yupSchema.validateSync(testData);
  }
  const end = Date.now();
  const time = end - start;

  results.push({
    name: 'Yup',
    time,
    opsPerSec: Math.round((testIterations / time) * 1000),
    avgTime: (time / testIterations).toFixed(3)
  });

  console.log(`  ✅ 完成 - 总耗时: ${time}ms`);
} catch (e) {
  console.log(`  ⚠️  未安装 - 跳过测试 (npm install yup)`);
}
console.log('');

// ========== 测试 Zod ==========
console.log('测试 Zod...');
try {
  const z = require('zod');
  const zodSchema = z.object({
    username: z.string().min(3).max(32),
    email: z.string().email(),
    age: z.number().min(18).max(120).optional(),
    tags: z.array(z.string().min(1).max(20)).min(1).max(10)
  });

  // 预热
  for (let i = 0; i < 100; i++) {
    zodSchema.parse(testData);
  }

  // 正式测试
  const start = Date.now();
  for (let i = 0; i < testIterations; i++) {
    zodSchema.parse(testData);
  }
  const end = Date.now();
  const time = end - start;

  results.push({
    name: 'Zod',
    time,
    opsPerSec: Math.round((testIterations / time) * 1000),
    avgTime: (time / testIterations).toFixed(3)
  });

  console.log(`  ✅ 完成 - 总耗时: ${time}ms`);
} catch (e) {
  console.log(`  ⚠️  未安装 - 跳过测试 (npm install zod)`);
}
console.log('');

// ========== 测试 Ajv ==========
console.log('测试 Ajv...');
try {
  const Ajv = require('ajv');
  const ajv = new Ajv();

  // 添加 email 格式支持
  ajv.addFormat('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/);

  const ajvSchema = {
    type: 'object',
    properties: {
      username: { type: 'string', minLength: 3, maxLength: 32 },
      email: { type: 'string', format: 'email' },
      age: { type: 'number', minimum: 18, maximum: 120 },
      tags: {
        type: 'array',
        items: { type: 'string', minLength: 1, maxLength: 20 },
        minItems: 1,
        maxItems: 10
      }
    },
    required: ['username', 'email', 'tags']
  };
  const ajvValidate = ajv.compile(ajvSchema);

  // 预热
  for (let i = 0; i < 100; i++) {
    ajvValidate(testData);
  }

  // 正式测试
  const start = Date.now();
  for (let i = 0; i < testIterations; i++) {
    ajvValidate(testData);
  }
  const end = Date.now();
  const time = end - start;

  results.push({
    name: 'Ajv',
    time,
    opsPerSec: Math.round((testIterations / time) * 1000),
    avgTime: (time / testIterations).toFixed(3)
  });

  console.log(`  ✅ 完成 - 总耗时: ${time}ms`);
} catch (e) {
  console.log(`  ⚠️  Ajv 已包含在项目中但测试失败: ${e.message}`);
}
console.log('');

// ========== 结果分析 ==========
if (results.length === 0) {
  console.log('⚠️  没有可用的测试结果');
  process.exit(0);
}

// 排序（从快到慢）
results.sort((a, b) => b.opsPerSec - a.opsPerSec);

console.log('='.repeat(80));
console.log('📊 性能测试结果');
console.log('='.repeat(80));
console.log('');

console.log('排名：');
console.log('');
results.forEach((result, index) => {
  const rank = ['🥇', '🥈', '🥉'][index] || `${index + 1}.`;
  const relative = index === 0 ? '(基准)' : `(${(results[0].opsPerSec / result.opsPerSec).toFixed(2)}x 慢)`;

  console.log(`${rank} ${result.name.padEnd(15)} ${result.opsPerSec.toLocaleString().padStart(10)} ops/sec  ${result.time}ms 总耗时  ${relative}`);
});

console.log('');
console.log('='.repeat(80));
console.log('');
console.log('📝 详细对比表格（Markdown格式）：');
console.log('');
console.log('| 库名 | 10,000次总耗时 | 平均每次 | 每秒操作数 | 相对速度 | 排名 |');
console.log('|------|---------------|---------|-----------|---------|------|');

results.forEach((result, index) => {
  const relative = (result.opsPerSec / results[0].opsPerSec).toFixed(2);
  const relativeSpeed = index === 0 ? '1.0x' : `${relative}x`;
  const rank = index + 1;
  const emoji = ['🥇', '🥈', '🥉'][index] || '';

  console.log(`| ${result.name} | ${result.time}ms | ${result.avgTime}ms | ${result.opsPerSec.toLocaleString()} ops/s | ${relativeSpeed} | ${emoji} 第${rank} |`);
});

console.log('');
console.log('='.repeat(80));
console.log('');

// 性能对比结论
const fastest = results[0];
const slowest = results[results.length - 1];
const speedup = (fastest.opsPerSec / slowest.opsPerSec).toFixed(2);

console.log('🎯 结论：');
console.log('');
console.log(`✅ ${fastest.name} 性能最佳：${fastest.opsPerSec.toLocaleString()} ops/sec`);
console.log(`✅ ${fastest.name} 比 ${slowest.name} 快 ${speedup} 倍`);
console.log('');

if (results.length > 1) {
  const second = results[1];
  const diff = ((fastest.opsPerSec - second.opsPerSec) / second.opsPerSec * 100).toFixed(1);
  console.log(`✅ ${fastest.name} 比第2名快 ${diff}%`);
}

console.log('');
console.log('='.repeat(80));

