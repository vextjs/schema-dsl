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
   * 设置格式
   * @param {string} format - 格式名称
   * @returns {DslBuilder}
   */
  String.prototype.format = function(format) {
    return dslFunction(String(this)).format(format);
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

  /**
   * 用户名验证
   * @param {Object} options - 选项
   * @returns {DslBuilder}
   */
  String.prototype.username = function(options) {
    return dslFunction(String(this)).username(options);
  };

  /**
   * 密码强度验证
   * @param {string} strength - 强度级别
   * @returns {DslBuilder}
   */
  String.prototype.password = function(strength) {
    return dslFunction(String(this)).password(strength);
  };

  /**
   * 手机号验证
   * @param {string} country - 国家代码
   * @returns {DslBuilder}
   */
  String.prototype.phone = function(country) {
    return dslFunction(String(this)).phone(country);
  };

  /**
   * 手机号验证（别名）
   * @param {string} country - 国家代码
   * @returns {DslBuilder}
   */
  String.prototype.phoneNumber = function(country) {
    return dslFunction(String(this)).phone(country);
  };

  /**
   * 身份证验证
   * @param {string} country - 国家代码
   * @returns {DslBuilder}
   */
  String.prototype.idCard = function(country) {
    return dslFunction(String(this)).idCard(country);
  };

  /**
   * 信用卡验证
   * @param {string} type - 卡类型
   * @returns {DslBuilder}
   */
  String.prototype.creditCard = function(type) {
    return dslFunction(String(this)).creditCard(type);
  };

  /**
   * 车牌号验证
   * @param {string} country - 国家代码
   * @returns {DslBuilder}
   */
  String.prototype.licensePlate = function(country) {
    return dslFunction(String(this)).licensePlate(country);
  };

  /**
   * 邮政编码验证
   * @param {string} country - 国家代码
   * @returns {DslBuilder}
   */
  String.prototype.postalCode = function(country) {
    return dslFunction(String(this)).postalCode(country);
  };

  /**
   * 护照号码验证
   * @param {string} country - 国家代码
   * @returns {DslBuilder}
   */
  String.prototype.passport = function(country) {
    return dslFunction(String(this)).passport(country);
  };

  /**
   * v1.0.2 新增方法（dateGreater和dateLess）
   * v1.0.3 新增方法（slug）
   */

  /**
   * URL slug验证
   */
  String.prototype.slug = function() {
    return dslFunction(String(this)).slug();
  };

  /**
   * 日期大于验证
   */
  String.prototype.dateGreater = function(date) {
    return dslFunction(String(this)).dateGreater(date);
  };

  /**
   * 日期小于验证
   */
  String.prototype.dateLess = function(date) {
    return dslFunction(String(this)).dateLess(date);
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
  delete String.prototype.username;
  delete String.prototype.password;
  delete String.prototype.phone;
  delete String.prototype.idCard;
  delete String.prototype.creditCard;
  delete String.prototype.licensePlate;
  delete String.prototype.postalCode;
  delete String.prototype.passport;
  // v1.0.2 新增
  delete String.prototype.dateGreater;
  delete String.prototype.dateLess;
  // v1.0.3 新增
  delete String.prototype.slug;
  delete String.prototype._dslExtensionsInstalled;
}

module.exports = {
  installStringExtensions,
  uninstallStringExtensions
};
