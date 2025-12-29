/**
 * 文档示例代码验证脚本
 * 检查所有文档中的JavaScript代码示例是否有语法错误
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('====================================================================');
console.log('  📋 文档示例代码验证');
console.log('====================================================================\n');

const docsDir = path.join(__dirname, '../docs');
const errors = [];
let totalExamples = 0;
let validExamples = 0;

// 获取所有md文件
const mdFiles = fs.readdirSync(docsDir)
  .filter(f => f.endsWith('.md'))
  .map(f => path.join(docsDir, f));

console.log(`找到 ${mdFiles.length} 个文档文件\n`);

// 提取代码块的正则
const codeBlockRegex = /```(?:javascript|js)\n([\s\S]*?)```/g;

for (const file of mdFiles) {
  const fileName = path.basename(file);
  const content = fs.readFileSync(file, 'utf-8');

  let match;
  let fileExampleCount = 0;
  let fileValidCount = 0;
  const fileErrors = [];

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const code = match[1];
    fileExampleCount++;
    totalExamples++;

    // 检查常见问题
    const issues = [];

    // 1. 检查是否使用了错误的包名
    if (code.includes("require('schemaio')")) {
      issues.push("使用了错误的包名 'schemaio'，应为 'schema-dsl'");
    }
    if (code.includes("from 'schemaio'")) {
      issues.push("使用了错误的包名 'schemaio'，应为 'schema-dsl'");
    }

    // 2. 检查是否有语法错误的变量名
    if (code.match(/\bschema-dsl\b/) && !code.includes("'schema-dsl'") && !code.includes('"schema-dsl"')) {
      issues.push("使用了非法变量名 'schema-dsl'");
    }

    // 3. 检查是否有未关闭的括号/引号
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      issues.push(`括号不匹配: ${openParens} 个 '(' vs ${closeParens} 个 ')'`);
    }

    const openBrackets = (code.match(/\{/g) || []).length;
    const closeBrackets = (code.match(/\}/g) || []).length;
    if (openBrackets !== closeBrackets) {
      issues.push(`大括号不匹配: ${openBrackets} 个 '{' vs ${closeBrackets} 个 '}'`);
    }

    // 4. 检查是否使用了 dsl() 函数
    if (code.includes('const schema = dsl(')) {
      fileValidCount++;
      validExamples++;
    }

    if (issues.length > 0) {
      fileErrors.push({
        exampleNum: fileExampleCount,
        code: code.substring(0, 100) + (code.length > 100 ? '...' : ''),
        issues
      });
    }
  }

  if (fileExampleCount > 0) {
    if (fileErrors.length === 0) {
      console.log(`✅ ${fileName} - ${fileExampleCount} 个示例，无问题`);
    } else {
      console.log(`❌ ${fileName} - ${fileExampleCount} 个示例，${fileErrors.length} 个有问题`);
      errors.push({ file: fileName, errors: fileErrors });
    }
  }
}

console.log('\n====================================================================');
console.log('  📊 验证总结');
console.log('====================================================================\n');

console.log(`总示例数: ${totalExamples}`);
console.log(`有效示例: ${validExamples}`);
console.log(`问题数量: ${errors.reduce((sum, e) => sum + e.errors.length, 0)}`);

if (errors.length > 0) {
  console.log('\n🔍 详细问题:\n');

  errors.forEach(({ file, errors: fileErrors }) => {
    console.log(`\n📄 ${file}:`);
    fileErrors.forEach(({ exampleNum, code, issues }) => {
      console.log(`\n  示例 #${exampleNum}:`);
      console.log(`  代码片段: ${code.replace(/\n/g, ' ')}`);
      issues.forEach(issue => {
        console.log(`    ❌ ${issue}`);
      });
    });
  });

  console.log('\n❌ 发现问题，请修复后再发布！');
  process.exit(1);
} else {
  console.log('\n✅ 所有文档示例验证通过！');
  process.exit(0);
}

