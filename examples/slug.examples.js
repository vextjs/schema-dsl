/**
 * slug 类型验证示例
 *
 * slug 用于 URL 友好的字符串，只能包含：
 * - 小写字母 (a-z)
 * - 数字 (0-9)
 * - 连字符 (-)
 *
 * 格式规则：
 * - 必须以字母或数字开头
 * - 必须以字母或数字结尾
 * - 中间可以有连字符，但不能连续
 */

const { dsl, validate } = require('../index');

// ========== 示例 1: 基础用法 ==========
console.log('\n========== 示例 1: 基础 slug 验证 ==========');

const schema1 = dsl({
  slug: 'slug!'
});

console.log('✅ 有效的 slug:');
console.log('  my-blog-post:', validate(schema1, { slug: 'my-blog-post' }).valid);
console.log('  hello-world:', validate(schema1, { slug: 'hello-world' }).valid);
console.log('  post-123:', validate(schema1, { slug: 'post-123' }).valid);
console.log('  article:', validate(schema1, { slug: 'article' }).valid);

console.log('\n❌ 无效的 slug:');
console.log('  My-Blog-Post:', validate(schema1, { slug: 'My-Blog-Post' }).valid); // 大写
console.log('  hello_world:', validate(schema1, { slug: 'hello_world' }).valid);   // 下划线
console.log('  -hello:', validate(schema1, { slug: '-hello' }).valid);             // 开头连字符
console.log('  hello-:', validate(schema1, { slug: 'hello-' }).valid);             // 结尾连字符
console.log('  hello--world:', validate(schema1, { slug: 'hello--world' }).valid); // 连续连字符
console.log('  hello world:', validate(schema1, { slug: 'hello world' }).valid);   // 空格

// ========== 示例 2: DSL 字符串语法 ==========
console.log('\n========== 示例 2: DSL 字符串语法 ==========');

const schema2 = dsl({
  articleSlug: 'slug:3-100!'  // slug + 长度限制
});

console.log('✅ 3-100字符的 slug:');
console.log('  abc:', validate(schema2, { articleSlug: 'abc' }).valid);
console.log('  my-long-article-title-with-many-words:',
  validate(schema2, { articleSlug: 'my-long-article-title-with-many-words' }).valid);

console.log('\n❌ 长度不符:');
console.log('  ab:', validate(schema2, { articleSlug: 'ab' }).valid);  // 太短

// ========== 示例 3: 链式调用 ==========
console.log('\n========== 示例 3: 链式调用 ==========');

const schema3 = dsl({
  pageSlug: 'string!'.slug().label('页面别名')
});

console.log('✅ 链式调用验证:');
console.log('  about-us:', validate(schema3, { pageSlug: 'about-us' }).valid);
console.log('  contact:', validate(schema3, { pageSlug: 'contact' }).valid);

// ========== 示例 4: 实际应用场景 ==========
console.log('\n========== 示例 4: 博客文章Schema ==========');

const blogPostSchema = dsl({
  title: 'string:1-200!',
  slug: 'slug:3-100!',
  author: 'string!',
  content: 'string:10-!',
  tags: 'array<slug>',  // slug 数组
  publishedAt: 'datetime'
});

const validPost = {
  title: 'Getting Started with Node.js',
  slug: 'getting-started-with-nodejs',
  author: 'John Doe',
  content: 'This is a comprehensive guide to Node.js...',
  tags: ['nodejs', 'javascript', 'backend'],
  publishedAt: '2025-12-31T10:00:00Z'
};

console.log('✅ 有效的博客文章:', validate(blogPostSchema, validPost).valid);

const invalidPost = {
  title: 'Invalid Post',
  slug: 'Invalid Slug!',  // ❌ 包含大写和特殊字符
  author: 'Jane',
  content: 'Short content',
  tags: ['Node.js', 'JavaScript'],  // ❌ 标签包含大写
  publishedAt: '2025-12-31T10:00:00Z'
};

const result = validate(blogPostSchema, invalidPost);
console.log('\n❌ 无效的博客文章:', result.valid);
if (!result.valid) {
  console.log('错误信息:');
  result.errors.forEach(err => {
    console.log(`  - ${err.path}: ${err.message}`);
  });
}

// ========== 示例 5: URL 生成应用 ==========
console.log('\n========== 示例 5: 自动生成 slug ==========');

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')  // 替换非字母数字为连字符
    .replace(/^-+|-+$/g, '');      // 移除首尾连字符
}

const titles = [
  'Hello World!',
  'Getting Started with Node.js',
  'Top 10 JavaScript Tips & Tricks',
  '2025年的技术趋势'
];

const urlSchema = dsl({ slug: 'slug!' });

console.log('标题 → slug 转换:');
titles.forEach(title => {
  const slug = generateSlug(title);
  const isValid = validate(urlSchema, { slug }).valid;
  console.log(`  "${title}"`);
  console.log(`    → "${slug}" ${isValid ? '✅' : '❌'}`);
});

// ========== 示例 6: 多语言支持 ==========
console.log('\n========== 示例 6: 多语言错误消息 ==========');

const { Validator } = require('../index');
const validator = new Validator();

const schema6 = dsl({ slug: 'slug!' });

// 中文
const resultCN = validator.validate(schema6, { slug: 'Invalid Slug!' }, { locale: 'zh-CN' });
console.log('中文错误:', resultCN.errors[0]?.message);

// 英文
const resultEN = validator.validate(schema6, { slug: 'Invalid Slug!' }, { locale: 'en-US' });
console.log('英文错误:', resultEN.errors[0]?.message);

// 西班牙语
const resultES = validator.validate(schema6, { slug: 'Invalid Slug!' }, { locale: 'es-ES' });
console.log('西班牙语错误:', resultES.errors[0]?.message);

// ========== 示例 7: 常见错误 ==========
console.log('\n========== 示例 7: 常见 slug 错误 ==========');

const testCases = [
  { slug: 'valid-slug-123', expected: true, reason: '✅ 正确格式' },
  { slug: 'Valid-Slug', expected: false, reason: '❌ 包含大写字母' },
  { slug: 'hello_world', expected: false, reason: '❌ 包含下划线' },
  { slug: 'hello world', expected: false, reason: '❌ 包含空格' },
  { slug: '-hello', expected: false, reason: '❌ 以连字符开头' },
  { slug: 'hello-', expected: false, reason: '❌ 以连字符结尾' },
  { slug: 'hello--world', expected: false, reason: '❌ 连续连字符' },
  { slug: 'hello.world', expected: false, reason: '❌ 包含点号' },
  { slug: '123-456', expected: true, reason: '✅ 纯数字+连字符' },
  { slug: 'a', expected: true, reason: '✅ 单个字母' },
  { slug: '1', expected: true, reason: '✅ 单个数字' }
];

const testSchema = dsl({ slug: 'slug!' });

console.log('测试用例:');
testCases.forEach(({ slug, expected, reason }) => {
  const result = validate(testSchema, { slug });
  const passed = result.valid === expected;
  console.log(`  ${passed ? '✅' : '❌'} "${slug}" - ${reason}`);
});

console.log('\n========== 所有示例完成 ==========');

