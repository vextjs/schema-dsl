# SchemaUtils usage guide

> Schema reuse and conversion tools

---

## quick start

4 methods to reuse Schema:

```javascript
const { dsl, SchemaUtils } = require('schema-dsl');

const userSchema = dsl({
  id: 'objectId!',
  name: 'string!',
  email: 'email!',
  password: 'string!',
  age: 'integer:18-120'
});

// exclude fields
SchemaUtils.omit(userSchema, ['password']);

// reserved fields
SchemaUtils.pick(userSchema, ['name', 'email']);

// become optional
SchemaUtils.partial(userSchema);

//Extended fields
SchemaUtils.extend(userSchema, { avatar: 'url' });
```

---

## omit - exclude fields

```javascript
// Create user - exclude system fields
const createSchema = SchemaUtils.omit(userSchema, ['id', 'createdAt']);

// Public information - exclude sensitive fields
const publicSchema = SchemaUtils.omit(userSchema, ['password']);
```

---

## pick - reserved fields

```javascript
// Only some fields are allowed to be modified
const updateSchema = SchemaUtils.pick(userSchema, ['name', 'age']);
```

---

## partial - becomes optional

```javascript
// All fields become optional
const partialSchema = SchemaUtils.partial(userSchema);
```

---

## extend - extend field

```javascript
//Add new field
const extendedSchema = SchemaUtils.extend(userSchema, {
  avatar: 'url',
  bio: 'string:0-500'
});
```

---

## chain call

```javascript
// pick + partial
SchemaUtils.pick(userSchema, ['name', 'age']).partial();

// pick + extend
SchemaUtils.pick(userSchema, ['name']).extend({ avatar: 'url' });
```

---

## Express example

```javascript
const { dsl, SchemaUtils, validateAsync } = require('schema-dsl');

const userSchema = dsl({
  id: 'objectId!',
  name: 'string!',
  email: 'email!',
  password: 'string!',
  age: 'integer:18-120'
});

// POST /users - create
app.post('/users', async (req, res, next) => {
  const schema = SchemaUtils.omit(userSchema, ['id']);
  const data = await validateAsync(schema, req.body);
  // Save to database...
});

// GET /users/:id - Query
app.get('/users/:id', async (req, res) => {
  const schema = SchemaUtils.omit(userSchema, ['password']);
  const user = await db.findById(req.params.id);
  const result = validate(schema, user);
  res.json(result.data);
});

// PATCH /users/:id - update
app.patch('/users/:id', async (req, res, next) => {
  const schema = SchemaUtils.pick(userSchema, ['name', 'age']).partial();
  const data = await validateAsync(schema, req.body);
  //Update database...
});
```

---

## API

### omit(schema, fields)
exclude fields

### pick(schema, fields)
reserved fields

### partial(schema, fields?)
become optional

### extend(schema, extensions)
extension fields

---

## Corresponding sample file

**Example entry**: [schema-utils-chaining.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/schema-utils-chaining.ts)
**Description**: Covers the chain combination of `omit()`, `extend()`, `pick()`, `partial()`, and the success/failure validation path of the derived schema.
