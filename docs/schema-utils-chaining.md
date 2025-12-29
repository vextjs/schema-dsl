# SchemaUtils 使用指南

> Schema 复用和转换工具  

---

## 快速开始

4 个方法复用 Schema：

```javascript
const { dsl, SchemaUtils } = require('schema-dsl');

const userSchema = dsl({
  id: 'objectId!',
  name: 'string!',
  email: 'email!',
  password: 'string!',
  age: 'integer:18-120'
});

// 排除字段
SchemaUtils.omit(userSchema, ['password']);

// 保留字段
SchemaUtils.pick(userSchema, ['name', 'email']);

// 变为可选
SchemaUtils.partial(userSchema);

// 扩展字段
SchemaUtils.extend(userSchema, { avatar: 'url' });
```

---

## omit - 排除字段

```javascript
// 创建用户 - 排除系统字段
const createSchema = SchemaUtils.omit(userSchema, ['id', 'createdAt']);

// 公开信息 - 排除敏感字段
const publicSchema = SchemaUtils.omit(userSchema, ['password']);
```

---

## pick - 保留字段

```javascript
// 只允许修改部分字段
const updateSchema = SchemaUtils.pick(userSchema, ['name', 'age']);
```

---

## partial - 变为可选

```javascript
// 所有字段变为可选
const partialSchema = SchemaUtils.partial(userSchema);
```

---

## extend - 扩展字段

```javascript
// 添加新字段
const extendedSchema = SchemaUtils.extend(userSchema, {
  avatar: 'url',
  bio: 'string:0-500'
});
```

---

## 链式调用

```javascript
// pick + partial
SchemaUtils.pick(userSchema, ['name', 'age']).partial();

// pick + extend
SchemaUtils.pick(userSchema, ['name']).extend({ avatar: 'url' });
```

---

## Express 示例

```javascript
const { dsl, SchemaUtils, validateAsync } = require('schema-dsl');

const userSchema = dsl({
  id: 'objectId!',
  name: 'string!',
  email: 'email!',
  password: 'string!',
  age: 'integer:18-120'
});

// POST /users - 创建
app.post('/users', async (req, res, next) => {
  const schema = SchemaUtils.omit(userSchema, ['id']);
  const data = await validateAsync(schema, req.body);
  // 保存到数据库...
});

// GET /users/:id - 查询
app.get('/users/:id', async (req, res) => {
  const schema = SchemaUtils.omit(userSchema, ['password']);
  const user = await db.findById(req.params.id);
  const result = validate(schema, user);
  res.json(result.data);
});

// PATCH /users/:id - 更新
app.patch('/users/:id', async (req, res, next) => {
  const schema = SchemaUtils.pick(userSchema, ['name', 'age']).partial();
  const data = await validateAsync(schema, req.body);
  // 更新数据库...
});
```

---

## API

### omit(schema, fields)
排除字段

### pick(schema, fields)
保留字段

### partial(schema, fields?)
变为可选

### extend(schema, extensions)
扩展字段

---

**版本**: v2.3.1

