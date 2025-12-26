# 版本迁移指南

> **用途**: 帮助你平滑升级 SchemaIO 版本  
> **更新**: 2025-12-26  

---

## 📑 目录

- [v2.1.1 → v2.1.2](#v211--v212)
- [v2.1.0 → v2.1.1](#v210--v211)
- [v2.0.1 → v2.1.0](#v201--v210)
- [v1.0.0 → v2.0.1](#v100--v201)
- [迁移工具](#迁移工具)

---

## v2.1.1 → v2.1.2

### 发布日期
2025-12-26

### 变更类型
✅ **无破坏性变更** - 100%向后兼容

### 新增功能

#### 1. min/max 简写支持

**新特性**: 支持使用 `'min'`/`'max'` 代替 `'minLength'`/`'maxLength'`

```javascript
// ✅ v2.1.2 推荐写法（更简洁）
username: 'string:3-32!'.messages({
  'min': '至少3个字符',
  'max': '最多32个字符'
})

// ✅ v2.1.1 写法（仍然支持）
username: 'string:3-32!'.messages({
  'minLength': '至少3个字符',
  'maxLength': '最多32个字符'
})
```

**优势**:
- 更简洁，与 DSL 语法 `string:3-32` 一致
- 同时支持数组约束（`minItems`/`maxItems` 也映射为 `min`/`max`）

#### 2. 代码质量提升

- 移除了所有调试 console 语句
- 清理了注释的调试代码
- 更专业的生产级代码

### 迁移步骤

#### ✅ 无需迁移！

你的现有代码**完全兼容**，可以直接升级。

#### 可选优化

如果你想使用新的简写语法，可以批量替换：

```bash
# 在你的项目中批量替换
sed -i "s/'minLength'/'min'/g" **/*.js
sed -i "s/'maxLength'/'max'/g" **/*.js
```

或者手动逐个替换：
- `'minLength'` → `'min'`
- `'maxLength'` → `'max'`

### 测试验证

```bash
npm test
# 确保所有测试通过
```

---

## v2.1.0 → v2.1.1

### 发布日期
2025-12-25

### 变更类型
✅ **无破坏性变更** - 100%向后兼容

### 主要变更

#### Bug 修复
1. 修复 `examples/user-registration/schema.js` 中的错误键名
2. 统一错误码为 `format.*` 格式
3. 修复多语言架构，移除硬编码

### 迁移步骤

✅ **无需迁移** - 直接升级即可

---

## v2.0.1 → v2.1.0

### 发布日期
2025-12-25

### 变更类型
🔴 **有破坏性变更**

### Breaking Changes

#### 1. 移除 JoiAdapter

**影响**: 如果你使用了 `JoiAdapter` 相关 API

```javascript
// ❌ v2.0.1（已移除）
const { JoiAdapter } = require('schemaio');
const schema = JoiAdapter.string().min(3);

// ✅ v2.1.0（使用 DslAdapter）
const { dsl } = require('schemaio');
const schema = dsl('string:3-');
```

#### 2. Patterns 错误消息改为 Key

**影响**: 自定义 patterns 的错误消息需要通过 Locale 配置

```javascript
// ❌ v2.0.1
dsl.config({
  patterns: {
    phone: {
      cn: {
        pattern: /^1[3-9]\d{9}$/,
        message: '请输入有效的手机号' // 直接指定消息
      }
    }
  }
});

// ✅ v2.1.0
dsl.config({
  patterns: {
    phone: {
      cn: /^1[3-9]\d{9}$/
    }
  },
  locales: {
    'zh-CN': {
      'pattern.phone.cn': '请输入有效的手机号'
    }
  }
});
```

### 新增功能

#### 1. 扩展新类型
- `objectId` - MongoDB ObjectId
- `hexColor` - CSS 十六进制颜色
- `macAddress` - MAC 地址
- `cron` - Cron 表达式

```javascript
// 新增类型使用
const schema = dsl({
  id: 'objectId!',
  color: 'hexColor',
  mac: 'macAddress',
  schedule: 'cron'
});
```

#### 2. 全局配置增强

```javascript
dsl.config({
  patterns: { /* 自定义验证规则 */ },
  locales: { /* 多语言配置 */ }
});
```

#### 3. ESM 支持

```javascript
// CommonJS
const { dsl } = require('schemaio');

// ESM
import { dsl } from 'schemaio';
```

### 迁移步骤

#### 步骤1: 移除 JoiAdapter 使用

```bash
# 搜索项目中的 JoiAdapter 使用
grep -r "JoiAdapter" src/
```

将所有 `JoiAdapter` 改为 `dsl`：

```javascript
// Before
const schema = JoiAdapter.object({
  username: JoiAdapter.string().min(3).max(32).required(),
  email: JoiAdapter.string().email().required()
});

// After
const schema = dsl({
  username: 'string:3-32!',
  email: 'email!'
});
```

#### 步骤2: 更新 Patterns 配置

如果你使用了自定义 patterns：

```javascript
// Before (v2.0.1)
dsl.config({
  patterns: {
    customPattern: {
      pattern: /test/,
      message: '错误消息'
    }
  }
});

// After (v2.1.0)
dsl.config({
  patterns: {
    customPattern: /test/
  },
  locales: {
    'zh-CN': {
      'pattern.customPattern': '错误消息'
    }
  }
});
```

#### 步骤3: 测试验证

```bash
npm test
```

---

## v1.0.0 → v2.0.1

### 发布日期
2025-12-25

### 变更类型
🔴 **有重大破坏性变更**

### Breaking Changes

#### 1. 移除简写语法

v1.0.0 支持的简写（s/n/i/b/o/a）已被移除。

```javascript
// ❌ v1.0.0（已移除）
const schema = dsl({
  name: 's:3-32',      // s = string
  age: 'n:18-120',     // n = number
  active: 'b',         // b = boolean
  tags: 'a<s>'         // a = array
});

// ✅ v2.0.1（使用完整类型名）
const schema = dsl({
  name: 'string:3-32',
  age: 'number:18-120',
  active: 'boolean',
  tags: 'array<string>'
});
```

#### 2. 数组语法变化

必填标记 `!` 的位置规则更严格。

```javascript
// ❌ v1.0.0
'array:1-10!<string>'  // ! 在中间

// ✅ v2.0.1（两种正确方式）
'array:1-10<string>!'  // 方式1: ! 在最后（推荐）
'array!1-10<string>'   // 方式2: ! 紧跟 array（会自动转换）
```

#### 3. 对象必填优化

```javascript
// v2.0.1 新增：对象本身必填
const schema = dsl({
  'user!': {  // user 对象本身必填
    name: 'string',
    email: 'email'
  }
});
```

### 新增功能

#### 1. 新增 6 个类型
- `time` - HH:mm:ss 时间格式
- `ipv4` - IPv4 地址
- `ipv6` - IPv6 地址
- `binary` - Base64 编码
- `any` - 任意类型
- `null` - null 值

#### 2. String 扩展（重要新特性）

```javascript
// v2.0.1 新特性：字符串直接链式调用
const schema = dsl({
  email: 'email!'
    .pattern(/custom/)
    .label('邮箱地址'),
  
  username: 'string:3-32!'
    .pattern(/^\w+$/)
    .messages({ 'pattern': '格式不正确' })
});
```

### 迁移步骤

#### 步骤1: 替换简写语法

**自动化工具**（推荐）:

创建 `migrate-v2.js`:
```javascript
const fs = require('fs');
const path = require('path');

const replacements = {
  "'s:": "'string:",
  "'n:": "'number:",
  "'i:": "'integer:",
  "'b'": "'boolean'",
  "'o'": "'object'",
  "'a<": "'array<",
  "'a:": "'array:"
};

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  for (const [old, newStr] of Object.entries(replacements)) {
    if (content.includes(old)) {
      content = content.replace(new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newStr);
      changed = true;
    }
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Migrated: ${filePath}`);
  }
}

// 使用
const files = ['src/**/*.js', 'routes/**/*.js'];
// ... 遍历文件并调用 migrateFile
```

**手动迁移**:
1. 搜索项目中的简写使用：`grep -r "'s:" src/`
2. 逐个替换为完整类型名

#### 步骤2: 修复数组语法

```bash
# 搜索可能有问题的数组语法
grep -r "array:.*!<" src/
```

修改为：
```javascript
// Before
'array:1-10!<string>'

// After
'array:1-10<string>!'  // 推荐
```

#### 步骤3: 测试验证

```bash
npm test
```

如有错误，根据错误消息调整。

#### 步骤4: 考虑使用新特性

**String 扩展**：
```javascript
// 利用 v2.0 的新特性
const schema = dsl({
  email: 'email!'.custom(checkExists).label('邮箱')
});
```

---

## 迁移工具

### 自动迁移脚本

创建 `scripts/migrate.js`:

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const VERSION_MIGRATIONS = {
  'v1.0->v2.0': [
    { from: /'s:/g, to: "'string:" },
    { from: /'n:/g, to: "'number:" },
    { from: /'i:/g, to: "'integer:" },
    { from: /'b'/g, to: "'boolean'" },
    { from: /'o'/g, to: "'object'" },
    { from: /'a</g, to: "'array<" },
    { from: /'a:/g, to: "'array:" },
    { from: /array:(\d+-?\d*)!<(\w+)>/g, to: "array:$1<$2>!" }
  ]
};

function migrate(fromVersion, toVersion, files) {
  const migrations = VERSION_MIGRATIONS[`${fromVersion}->${toVersion}`];
  if (!migrations) {
    console.error(`No migration path from ${fromVersion} to ${toVersion}`);
    return;
  }

  let totalChanges = 0;

  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let fileChanged = false;

    migrations.forEach(({ from, to }) => {
      const before = content;
      content = content.replace(from, to);
      if (content !== before) {
        fileChanged = true;
        totalChanges++;
      }
    });

    if (fileChanged) {
      fs.writeFileSync(file, content);
      console.log(`✅ ${file}`);
    }
  });

  console.log(`\n🎉 Migration complete! ${totalChanges} changes applied.`);
}

// CLI
const args = process.argv.slice(2);
if (args.length < 3) {
  console.log('Usage: node migrate.js <from-version> <to-version> <glob-pattern>');
  console.log('Example: node migrate.js v1.0 v2.0 "src/**/*.js"');
  process.exit(1);
}

const [fromVer, toVer, pattern] = args;
const files = glob.sync(pattern);

console.log(`Migrating ${files.length} files from ${fromVer} to ${toVer}...\n`);
migrate(fromVer, toVer, files);
```

**使用方法**:
```bash
node scripts/migrate.js v1.0 v2.0 "src/**/*.js"
```

---

## 迁移检查清单

### v2.0 → v2.1 迁移检查

- [ ] 移除所有 `JoiAdapter` 使用
- [ ] 更新 patterns 配置格式
- [ ] 测试所有自定义验证规则
- [ ] 验证多语言错误消息
- [ ] 运行完整测试套件

### v1.0 → v2.0 迁移检查

- [ ] 替换所有简写语法（s/n/i/b/o/a）
- [ ] 修复数组必填语法
- [ ] 测试嵌套对象验证
- [ ] 验证所有枚举值
- [ ] 考虑使用 String 扩展新特性
- [ ] 更新文档和注释
- [ ] 运行完整测试套件

---

## 常见问题

### Q: 迁移后测试失败怎么办？

**A**: 按以下步骤排查：

1. 查看具体的失败信息
2. 检查是否有遗漏的简写语法
3. 验证数组和对象的必填标记位置
4. 参考 [troubleshooting.md](troubleshooting.md)

### Q: 可以跨版本迁移吗（如 v1.0 → v2.1）？

**A**: 可以，但建议逐步迁移：
```
v1.0 → v2.0 → v2.1
```

每一步都运行测试，确保正常。

### Q: 迁移需要多长时间？

**A**: 取决于项目规模：

| 项目规模 | 预计时间 |
|---------|---------|
| 小型（< 10个Schema） | 30分钟 |
| 中型（10-50个Schema） | 2-4小时 |
| 大型（> 50个Schema） | 1-2天 |

使用自动化工具可以大幅减少时间。

---

## 获取帮助

迁移遇到问题？

- 📖 [查看文档](INDEX.md)
- 🐛 [提交 Issue](https://github.com/schemaio/schemaio/issues)
- 💬 [讨论区](https://github.com/schemaio/schemaio/discussions)
