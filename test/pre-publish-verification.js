/**
 * v2.3.0 发布前三轮深度验证脚本
 *
 * 第一轮：文档完整性验证
 * 第二轮：示例代码验证
 * 第三轮：测试覆盖验证
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('='.repeat(80));
console.log('v2.3.0 发布前三轮深度验证');
console.log('='.repeat(80));
console.log('');

// ========== 第一轮：文档完整性验证 ==========
console.log('🔍 第一轮：文档完整性验证');
console.log('-'.repeat(80));

const round1 = {
  pass: [],
  fail: [],
  warnings: []
};

// 1.1 检查核心文档是否存在
console.log('\n📋 1.1 检查核心文档');
const coreDocsExpected = [
  'README.md',
  'CHANGELOG.md',
  'STATUS.md',
  'CONTRIBUTING.md',
  'LICENSE'
];

coreDocsExpected.forEach(doc => {
  const exists = fs.existsSync(doc);
  if (exists) {
    console.log(`  ✅ ${doc}`);
    round1.pass.push(`核心文档: ${doc}`);
  } else {
    console.log(`  ❌ ${doc} - 缺失`);
    round1.fail.push(`核心文档缺失: ${doc}`);
  }
});

// 1.2 检查导出功能的文档
console.log('\n📋 1.2 检查功能文档覆盖');
const index = require('../index');
const exportedFeatures = Object.keys(index);
const docsDir = 'docs';
const docFiles = fs.readdirSync(docsDir).filter(f => f.endsWith('.md'));

console.log(`  导出功能数: ${exportedFeatures.length}`);
console.log(`  文档文件数: ${docFiles.length}`);

// 检查主要功能是否有文档
const featureDocMap = {
  'dsl': ['dsl-syntax.md', 'api-reference.md'],
  'validate': ['validate.md', 'validation-guide.md'],
  'Validator': ['validate.md', 'api-reference.md'],
  'Locale': ['dynamic-locale.md', 'frontend-i18n-guide.md'],
  'exporters': ['export-guide.md', 'mongodb-exporter.md', 'mysql-exporter.md', 'postgresql-exporter.md', 'markdown-exporter.md'],
  'PluginManager': ['plugin-system.md'],
  'CacheManager': ['cache-manager.md']
};

Object.entries(featureDocMap).forEach(([feature, expectedDocs]) => {
  const hasAllDocs = expectedDocs.every(doc => docFiles.includes(doc));
  if (hasAllDocs) {
    console.log(`  ✅ ${feature} - 文档齐全`);
    round1.pass.push(`功能文档: ${feature}`);
  } else {
    const missing = expectedDocs.filter(doc => !docFiles.includes(doc));
    console.log(`  ⚠️  ${feature} - 缺少: ${missing.join(', ')}`);
    round1.warnings.push(`功能文档不全: ${feature} (缺少 ${missing.join(', ')})`);
  }
});

// 1.3 检查 v2.3.0 新功能文档
console.log('\n📋 1.3 检查 v2.3.0 新功能文档');
const v230Features = [
  { name: 'i18n 用户指南', file: 'docs/i18n-user-guide.md' },
  { name: 'i18n 完整示例', file: 'examples/i18n-full-demo.js' }
];

v230Features.forEach(({ name, file }) => {
  const exists = fs.existsSync(file);
  if (exists) {
    console.log(`  ✅ ${name} (${file})`);
    round1.pass.push(`v2.3.0 文档: ${name}`);
  } else {
    console.log(`  ❌ ${name} (${file}) - 缺失`);
    round1.fail.push(`v2.3.0 文档缺失: ${name}`);
  }
});

// 1.4 检查文档中是否有 .when() 方法（已废弃）
console.log('\n📋 1.4 检查废弃方法引用');
let whenReferences = 0;
docFiles.forEach(file => {
  const content = fs.readFileSync(path.join(docsDir, file), 'utf8');
  const matches = content.match(/\.when\(/g);
  if (matches) {
    whenReferences += matches.length;
    console.log(`  ⚠️  ${file} - 发现 ${matches.length} 处 .when() 引用`);
    round1.warnings.push(`废弃方法引用: ${file} (${matches.length}处)`);
  }
});

if (whenReferences === 0) {
  console.log(`  ✅ 无废弃方法引用`);
  round1.pass.push('废弃方法检查通过');
}

// 第一轮总结
console.log('\n' + '-'.repeat(80));
console.log('📊 第一轮验证结果:');
console.log(`  ✅ 通过: ${round1.pass.length}`);
console.log(`  ⚠️  警告: ${round1.warnings.length}`);
console.log(`  ❌ 失败: ${round1.fail.length}`);
console.log('');

// ========== 第二轮：示例代码验证 ==========
console.log('🔍 第二轮：示例代码验证');
console.log('-'.repeat(80));

const round2 = {
  pass: [],
  fail: [],
  skip: [],
  warnings: []  // 添加 warnings 数组
};

// 运行示例验证脚本
console.log('\n🚀 运行示例文件...');
try {
  const result = execSync('node test/verify-examples.js', {
    encoding: 'utf8',
    stdio: 'pipe'
  });

  // 解析结果
  const passMatch = result.match(/✅ 通过: (\d+)/);
  const failMatch = result.match(/❌ 失败: (\d+)/);
  const skipMatch = result.match(/⏭️  跳过: (\d+)/);

  if (passMatch) round2.pass = Array(parseInt(passMatch[1])).fill('示例通过');
  if (failMatch) round2.fail = Array(parseInt(failMatch[1])).fill('示例失败');
  if (skipMatch) round2.skip = Array(parseInt(skipMatch[1])).fill('示例跳过');

  console.log(result);
} catch (error) {
  console.log('  ❌ 示例验证失败');
  round2.fail.push('示例验证脚本执行失败');
}

// 第二轮总结
console.log('-'.repeat(80));
console.log('📊 第二轮验证结果:');
console.log(`  ✅ 通过: ${round2.pass.length}`);
console.log(`  ⏭️  跳过: ${round2.skip.length}`);
console.log(`  ❌ 失败: ${round2.fail.length}`);
console.log('');

// ========== 第三轮：测试覆盖验证 ==========
console.log('🔍 第三轮：测试覆盖验证');
console.log('-'.repeat(80));

const round3 = {
  pass: [],
  fail: [],
  warnings: []
};

// 3.1 运行所有测试
console.log('\n🧪 运行测试套件...');
try {
  const testResult = execSync('npm test', {
    encoding: 'utf8',
    stdio: 'pipe'
  });

  // 解析测试结果
  const passingMatch = testResult.match(/(\d+) passing/);
  const failingMatch = testResult.match(/(\d+) failing/);

  if (passingMatch) {
    const passing = parseInt(passingMatch[1]);
    console.log(`  ✅ ${passing} 个测试通过`);
    round3.pass.push(`${passing} 个测试通过`);
  }

  if (failingMatch) {
    const failing = parseInt(failingMatch[1]);
    console.log(`  ❌ ${failing} 个测试失败`);
    round3.fail.push(`${failing} 个测试失败`);
  }
} catch (error) {
  console.log('  ❌ 测试失败');
  round3.fail.push('测试套件失败');
}

// 3.2 检查测试文件覆盖
console.log('\n📋 3.2 检查测试文件覆盖');
const testDir = 'test/unit';
const testFiles = fs.readdirSync(testDir).filter(f => f.endsWith('.test.js'));
console.log(`  测试文件数: ${testFiles.length}`);

// 检查新功能测试
const v230Tests = [
  'dsl-config.test.js'  // v2.3.0 新功能测试
];

v230Tests.forEach(testFile => {
  const exists = testFiles.includes(testFile);
  if (exists) {
    console.log(`  ✅ ${testFile}`);
    round3.pass.push(`v2.3.0 测试: ${testFile}`);
  } else {
    console.log(`  ❌ ${testFile} - 缺失`);
    round3.fail.push(`v2.3.0 测试缺失: ${testFile}`);
  }
});

// 第三轮总结
console.log('\n' + '-'.repeat(80));
console.log('📊 第三轮验证结果:');
console.log(`  ✅ 通过: ${round3.pass.length}`);
console.log(`  ⚠️  警告: ${round3.warnings.length}`);
console.log(`  ❌ 失败: ${round3.fail.length}`);
console.log('');

// ========== 最终汇总 ==========
console.log('='.repeat(80));
console.log('📊 三轮验证最终汇总');
console.log('='.repeat(80));

const totalPass = round1.pass.length + round2.pass.length + round3.pass.length;
const totalFail = round1.fail.length + round2.fail.length + round3.fail.length;
const totalWarnings = round1.warnings.length + round2.warnings.length + round3.warnings.length;

console.log('\n第一轮（文档完整性）:');
console.log(`  ✅ 通过: ${round1.pass.length}`);
console.log(`  ⚠️  警告: ${round1.warnings.length}`);
console.log(`  ❌ 失败: ${round1.fail.length}`);

console.log('\n第二轮（示例代码）:');
console.log(`  ✅ 通过: ${round2.pass.length}`);
console.log(`  ⏭️  跳过: ${round2.skip.length}`);
console.log(`  ❌ 失败: ${round2.fail.length}`);

console.log('\n第三轮（测试覆盖）:');
console.log(`  ✅ 通过: ${round3.pass.length}`);
console.log(`  ⚠️  警告: ${round3.warnings.length}`);
console.log(`  ❌ 失败: ${round3.fail.length}`);

console.log('\n' + '='.repeat(80));
console.log(`总计通过: ${totalPass}`);
console.log(`总计警告: ${totalWarnings}`);
console.log(`总计失败: ${totalFail}`);

// 输出详细的失败和警告信息
if (totalFail > 0) {
  console.log('\n❌ 失败项详情:');
  if (round1.fail.length > 0) {
    console.log('\n  第一轮:');
    round1.fail.forEach(f => console.log(`    - ${f}`));
  }
  if (round2.fail.length > 0) {
    console.log('\n  第二轮:');
    round2.fail.forEach(f => console.log(`    - ${f}`));
  }
  if (round3.fail.length > 0) {
    console.log('\n  第三轮:');
    round3.fail.forEach(f => console.log(`    - ${f}`));
  }
}

if (totalWarnings > 0) {
  console.log('\n⚠️  警告项详情:');
  if (round1.warnings.length > 0) {
    console.log('\n  第一轮:');
    round1.warnings.forEach(w => console.log(`    - ${w}`));
  }
  if (round3.warnings.length > 0) {
    console.log('\n  第三轮:');
    round3.warnings.forEach(w => console.log(`    - ${w}`));
  }
}

// 最终判定
console.log('\n' + '='.repeat(80));
if (totalFail === 0) {
  console.log('✅ 所有验证通过！可以发布 v2.3.0');
  if (totalWarnings > 0) {
    console.log(`⚠️  但有 ${totalWarnings} 个警告项，建议修复后再发布`);
  }
  process.exit(0);
} else {
  console.log(`❌ 验证失败！发现 ${totalFail} 个问题，必须修复后才能发布`);
  process.exit(1);
}

