/**
 * Adapters - 适配器统一导出
 * @module lib/adapters
 */

const joi = require('./JoiAdapter');
const dsl = require('./DslAdapter');

module.exports = {
  // Joi风格
  joi,
  JoiAdapter: joi.JoiAdapter,

  // DSL风格
  dsl,
  DslAdapter: dsl.DslAdapter,
  s: dsl.s,
  _: dsl._
};

