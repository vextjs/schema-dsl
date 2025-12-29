/**
 * 性能对比测试脚本
 *
 * 对比 Schema-DSL 与其他主流验证库的实际性能
 *
 * 测试库：
 * - Schema-DSL (本项目)
 * - Joi
 * - Yup
 * - Zod
 * - Ajv
 */

const Benchmark = require('benchmark');
const suite = new Benchmark.Suite();

// ========== 测试数据 ==========
const testData = {
  username: 'john_doe',
  email: 'john@example.com',
  age: 25,
  tags: ['nodejs', 'javascript', 'validation']
};

// ========== Schema-DSL ==========
const { dsl, validate } = require('../../index');
const schemaDslSchema = dsl({
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:18-120',
  tags: 'array!1-10<string:1-20>'
});

console.log('正在准备性能测试...\n');
console.log('测试场景：用户注册表单验证');
console.log('测试数据：', JSON.stringify(testData, null, 2));
console.log('\n' + '='.repeat(80));

// ========== 测试 Schema-DSL ==========
suite.add('Schema-DSL', function() {
  validate(schemaDslSchema, testData);
});

// ========== 尝试测试其他库（如果已安装）==========

// 测试 Joi
try {
  const Joi = require('joi');
  const joiSchema = Joi.object({
    username: Joi.string().min(3).max(32).required(),
    email: Joi.string().email().required(),
    age: Joi.number().min(18).max(120),
    tags: Joi.array().items(Joi.string().min(1).max(20)).min(1).max(10)
  });

  suite.add('Joi', function() {
    joiSchema.validate(testData);
  });
  console.log('✅ Joi - 已添加到测试');
} catch (e) {
  console.log('⚠️  Joi - 未安装，跳过测试');
}

// 测试 Yup
try {
  const yup = require('yup');
  const yupSchema = yup.object({
    username: yup.string().min(3).max(32).required(),
    email: yup.string().email().required(),
    age: yup.number().min(18).max(120),
    tags: yup.array().of(yup.string().min(1).max(20)).min(1).max(10)
  });

  suite.add('Yup', function() {
    yupSchema.validateSync(testData);
  });
  console.log('✅ Yup - 已添加到测试');
} catch (e) {
  console.log('⚠️  Yup - 未安装，跳过测试');
}

// 测试 Zod
try {
  const z = require('zod');
  const zodSchema = z.object({
    username: z.string().min(3).max(32),
    email: z.string().email(),
    age: z.number().min(18).max(120).optional(),
    tags: z.array(z.string().min(1).max(20)).min(1).max(10)
  });

  suite.add('Zod', function() {
    zodSchema.parse(testData);
  });
  console.log('✅ Zod - 已添加到测试');
} catch (e) {
  console.log('⚠️  Zod - 未安装，跳过测试');
}

// 测试 Ajv
try {
  const Ajv = require('ajv');
  const ajv = new Ajv();
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

  suite.add('Ajv', function() {
    ajvValidate(testData);
  });
  console.log('✅ Ajv - 已添加到测试');
} catch (e) {
  console.log('⚠️  Ajv - 未安装，跳过测试');
}

console.log('='.repeat(80));
console.log('\n开始性能测试...\n');

// ========== 运行测试 ==========
suite
  .on('cycle', function(event) {
    const benchmark = event.target;
    const ops = benchmark.hz.toLocaleString('en-US', { maximumFractionDigits: 0 });
    const margin = (benchmark.stats.rme).toFixed(2);

    console.log(`${benchmark.name}:`);
    console.log(`  ${ops} ops/sec`);
    console.log(`  ±${margin}% (${benchmark.stats.sample.length} runs sampled)`);
    console.log('');
  })
  .on('complete', function() {
    console.log('='.repeat(80));
    console.log('测试完成！\n');

    // 排序结果
    const results = Array.from(this).sort((a, b) => b.hz - a.hz);

    console.log('📊 性能排名：');
    console.log('');

    results.forEach((benchmark, index) => {
      const rank = ['🥇', '🥈', '🥉'][index] || `${index + 1}.`;
      const ops = benchmark.hz.toLocaleString('en-US', { maximumFractionDigits: 0 });
      const relative = index === 0 ? '(基准)' : `(${(results[0].hz / benchmark.hz).toFixed(2)}x 慢)`;

      console.log(`${rank} ${benchmark.name.padEnd(15)} ${ops.padStart(10)} ops/sec  ${relative}`);
    });

    console.log('');
    console.log('='.repeat(80));

    // 生成详细报告
    console.log('\n📝 详细数据（用于报告）：\n');
    console.log('| 库名 | 每秒操作数 | 平均耗时 | 相对速度 | 排名 |');
    console.log('|------|-----------|---------|---------|------|');

    results.forEach((benchmark, index) => {
      const ops = Math.round(benchmark.hz);
      const avgTime = (1000 / benchmark.hz).toFixed(3);
      const relative = (benchmark.hz / results[0].hz).toFixed(2);
      const rank = index + 1;

      console.log(`| ${benchmark.name} | ${ops.toLocaleString()} ops/s | ${avgTime}ms | ${relative}x | ${rank} |`);
    });

    console.log('');
  })
  .run({ 'async': false });

