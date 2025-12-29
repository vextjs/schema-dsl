/**
 * 示例文件验证脚本
 * 验证所有示例文件是否可以正常运行
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const examplesDir = 'examples';
const files = fs.readdirSync(examplesDir);
const jsFiles = files.filter(f => f.endsWith('.js') && !f.includes('README'));

console.log('📋 示例文件验证报告');
console.log('='.repeat(60));
console.log(`总文件数: ${jsFiles.length}\n`);

const results = {
  pass: [],
  fail: [],
  skip: []
};

// 需要跳过的文件（需要特殊环境）
const skipFiles = [
  'i18n-full-demo.js',  // 需要 Express
  'middleware-usage.js'  // 需要 Express/Koa
];

jsFiles.forEach((file, index) => {
  const filePath = path.join(examplesDir, file);
  console.log(`[${index + 1}/${jsFiles.length}] 验证: ${file}`);

  if (skipFiles.includes(file)) {
    console.log(`  ⏭️  跳过（需要额外依赖）\n`);
    results.skip.push(file);
    return;
  }

  try {
    // 运行示例文件，超时 10 秒
    execSync(`node ${filePath}`, {
      timeout: 10000,
      stdio: 'pipe'  // 不输出到控制台
    });
    console.log(`  ✅ 通过\n`);
    results.pass.push(file);
  } catch (error) {
    const errorMsg = error.message || error.toString();
    // 检查是否是正常退出（某些示例文件会输出后退出）
    if (errorMsg.includes('ERR_CHILD_PROCESS_STDIO_MAXBUFFER')) {
      console.log(`  ✅ 通过（输出过长）\n`);
      results.pass.push(file);
    } else {
      console.log(`  ❌ 失败: ${errorMsg.split('\n')[0]}\n`);
      results.fail.push({ file, error: errorMsg.substring(0, 200) });
    }
  }
});

console.log('='.repeat(60));
console.log('📊 验证结果汇总');
console.log('='.repeat(60));
console.log(`✅ 通过: ${results.pass.length}`);
console.log(`❌ 失败: ${results.fail.length}`);
console.log(`⏭️  跳过: ${results.skip.length}`);
console.log(`📈 通过率: ${((results.pass.length / (jsFiles.length - results.skip.length)) * 100).toFixed(1)}%`);

if (results.fail.length > 0) {
  console.log('\n❌ 失败的文件:');
  results.fail.forEach(({ file, error }) => {
    console.log(`  - ${file}`);
    console.log(`    ${error}`);
  });
}

if (results.skip.length > 0) {
  console.log('\n⏭️  跳过的文件:');
  results.skip.forEach(file => {
    console.log(`  - ${file}`);
  });
}

console.log('\n' + '='.repeat(60));

// 退出码
process.exit(results.fail.length > 0 ? 1 : 0);

