/**
 * index.d.ts 完整性检查脚本
 *
 * 验证 TypeScript 类型定义文件是否包含所有导出的功能
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('index.d.ts 完整性检查');
console.log('='.repeat(80));
console.log('');

// 读取 index.js 获取实际导出
const indexJs = require('../index.js');
const actualExports = Object.keys(indexJs);

// 读取 index.d.ts 内容
const dtsPath = path.join(__dirname, '../index.d.ts');
const dtsContent = fs.readFileSync(dtsPath, 'utf8');

// 检查项
const checks = {
  pass: [],
  fail: [],
  warnings: []
};

console.log('📋 1. 检查导出项是否都有类型定义');
console.log('-'.repeat(80));

actualExports.forEach(exportName => {
  // 跳过内部使用的导出
  if (exportName === 'VERSION' || exportName === 'CONSTANTS') {
    checks.warnings.push(`${exportName} - 常量类型（可选定义）`);
    console.log(`  ⚠️  ${exportName} - 常量类型（可选定义）`);
    return;
  }

  // 检查是否在 d.ts 中定义
  const patterns = [
    new RegExp(`export\\s+(class|interface|function|const|type)\\s+${exportName}`, 'i'),
    new RegExp(`export\\s+{[^}]*${exportName}[^}]*}`, 'i'),
    new RegExp(`${exportName}\\s*:\\s*`, 'i')
  ];

  const found = patterns.some(pattern => pattern.test(dtsContent));

  if (found) {
    checks.pass.push(exportName);
    console.log(`  ✅ ${exportName}`);
  } else {
    checks.fail.push(exportName);
    console.log(`  ❌ ${exportName} - 缺少类型定义`);
  }
});

console.log('');
console.log('📋 2. 检查核心功能类型定义');
console.log('-'.repeat(80));

const coreTypes = [
  { name: 'JSONSchema', type: 'interface' },
  { name: 'ValidationResult', type: 'interface' },
  { name: 'ValidationError', type: 'interface' },
  { name: 'ErrorMessages', type: 'interface' },
  { name: 'DslBuilder', type: 'class' },
  { name: 'Validator', type: 'class' },
  { name: 'Locale', type: 'class' },
  { name: 'PluginManager', type: 'class' },
  { name: 'CacheManager', type: 'class' }
];

coreTypes.forEach(({ name, type }) => {
  const pattern = new RegExp(`export\\s+(${type}|interface)\\s+${name}`, 'i');
  if (pattern.test(dtsContent)) {
    console.log(`  ✅ ${name} (${type})`);
    checks.pass.push(`${name} type`);
  } else {
    console.log(`  ❌ ${name} (${type}) - 缺少定义`);
    checks.fail.push(`${name} type`);
  }
});

console.log('');
console.log('📋 3. 检查导出器类型定义');
console.log('-'.repeat(80));

const exporters = [
  'MongoDBExporter',
  'MySQLExporter',
  'PostgreSQLExporter',
  'MarkdownExporter'
];

exporters.forEach(exporter => {
  const pattern = new RegExp(`export\\s+class\\s+${exporter}`, 'i');
  if (pattern.test(dtsContent)) {
    console.log(`  ✅ ${exporter}`);
    checks.pass.push(`${exporter} class`);
  } else {
    console.log(`  ❌ ${exporter} - 缺少类定义`);
    checks.fail.push(`${exporter} class`);
  }
});

console.log('');
console.log('📋 4. 检查 v2.3.0 新功能类型定义');
console.log('-'.repeat(80));

// 检查 dsl.config 的 i18n 和 cache 选项
const v230Features = [
  { name: 'DslConfigOptions', desc: 'dsl.config() 配置选项' },
  { name: 'I18nConfig', desc: 'i18n 配置' },
  { name: 'CacheConfig', desc: 'cache 配置' }
];

v230Features.forEach(({ name, desc }) => {
  if (dtsContent.includes(name)) {
    console.log(`  ✅ ${name} - ${desc}`);
    checks.pass.push(`${name} interface`);
  } else {
    console.log(`  ⚠️  ${name} - ${desc} (可能未定义)`);
    checks.warnings.push(`${name} interface`);
  }
});

console.log('');
console.log('📋 5. 检查 dsl.match() 和 dsl.if() 类型定义');
console.log('-'.repeat(80));

if (dtsContent.includes('match(')) {
  console.log('  ✅ dsl.match() 方法');
  checks.pass.push('dsl.match() method');
} else {
  console.log('  ❌ dsl.match() - 缺少方法定义');
  checks.fail.push('dsl.match() method');
}

if (dtsContent.includes('if(')) {
  console.log('  ✅ dsl.if() 方法');
  checks.pass.push('dsl.if() method');
} else {
  console.log('  ❌ dsl.if() - 缺少方法定义');
  checks.fail.push('dsl.if() method');
}

console.log('');
console.log('📋 6. 检查泛型支持');
console.log('-'.repeat(80));

const generics = [
  { pattern: 'ValidationResult<T', name: 'ValidationResult 泛型' },
  { pattern: 'validate<T', name: 'validate 函数泛型' }
];

generics.forEach(({ pattern, name }) => {
  if (dtsContent.includes(pattern)) {
    console.log(`  ✅ ${name}`);
    checks.pass.push(name);
  } else {
    console.log(`  ⚠️  ${name} - 可能缺少泛型支持`);
    checks.warnings.push(name);
  }
});

console.log('');
console.log('='.repeat(80));
console.log('📊 检查结果汇总');
console.log('='.repeat(80));

console.log(`✅ 通过: ${checks.pass.length}`);
console.log(`⚠️  警告: ${checks.warnings.length}`);
console.log(`❌ 失败: ${checks.fail.length}`);

if (checks.fail.length > 0) {
  console.log('');
  console.log('❌ 缺少的类型定义:');
  checks.fail.forEach(item => {
    console.log(`  - ${item}`);
  });
}

if (checks.warnings.length > 0) {
  console.log('');
  console.log('⚠️  警告项:');
  checks.warnings.forEach(item => {
    console.log(`  - ${item}`);
  });
}

console.log('');
console.log('='.repeat(80));

// 退出码
const exitCode = checks.fail.length > 0 ? 1 : 0;
process.exit(exitCode);

