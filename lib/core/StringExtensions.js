/**
 * String.prototype 扩展
 *
 * 让字符串可以直接链式调用 DSL 方法
 *
 * @example
 * 'email!'.pattern(/custom/).label('邮箱')
 * 'string:3-32!'.messages({ ... }).label('用户名')
 */

/**
 * 安装 String 扩展
 * @param {Function} dslFunction - dsl() 函数
 */
function installStringExtensions(dslFunction) {
  // 检查是否已安装
  if (String.prototype._dslExtensionsInstalled) {
    return;
  }

  /**
   * 添加正则验证
   * @param {RegExp} regex - 正则表达式
   * @param {string} [message] - 错误消息
   * @returns {DslBuilder}
   */
  String.prototype.pattern = function(regex, message) {
    return dslFunction(String(this)).pattern(regex, message);
  };

  /**
   * 设置字段标签
   * @param {string} label - 标签文本
   * @returns {DslBuilder}
   */
  String.prototype.label = function(label) {
    return dslFunction(String(this)).label(label);
  };

  /**
   * 自定义错误消息
   * @param {Object} messages - 消息对象
   * @returns {DslBuilder}
   */
  String.prototype.messages = function(messages) {
    return dslFunction(String(this)).messages(messages);
  };

  /**
   * 设置描述
   * @param {string} text - 描述文本
   * @returns {DslBuilder}
   */
  String.prototype.description = function(text) {
    return dslFunction(String(this)).description(text);
  };

  /**
   * 添加自定义验证器
   * @param {Function} validator - 验证函数
   * @returns {DslBuilder}
   */
  String.prototype.custom = function(validator) {
    return dslFunction(String(this)).custom(validator);
  };

  /**
   * 条件验证
   * @param {string} refField - 引用字段
   * @param {Object} options - 条件选项
   * @returns {DslBuilder}
   */
  String.prototype.when = function(refField, options) {
    return dslFunction(String(this)).when(refField, options);
  };

  /**
   * 设置默认值
   * @param {*} value - 默认值
   * @returns {DslBuilder}
   */
  String.prototype.default = function(value) {
    return dslFunction(String(this)).default(value);
  };

  /**
   * 转为 Schema
   * @returns {Object}
   */
  String.prototype.toSchema = function() {
    return dslFunction(String(this)).toSchema();
  };

  // 标记已安装
  String.prototype._dslExtensionsInstalled = true;
}

/**
 * 卸载 String 扩展（测试或清理用）
 */
function uninstallStringExtensions() {
  if (!String.prototype._dslExtensionsInstalled) {
    return;
  }

  delete String.prototype.pattern;
  delete String.prototype.label;
  delete String.prototype.messages;
  delete String.prototype.description;
  delete String.prototype.custom;
  delete String.prototype.when;
  delete String.prototype.default;
  delete String.prototype.toSchema;
  delete String.prototype._dslExtensionsInstalled;
}

module.exports = {
  installStringExtensions,
  uninstallStringExtensions
};

