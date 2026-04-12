/**
 * Markdown 文档导出器
 *
 * @description 将 JSON Schema 导出为人类可读的 Markdown 文档
 * @module lib/exporters/MarkdownExporter
 * @version 2.2.0
 */

class MarkdownExporter {
  /**
   * 导出为 Markdown
   * @param {Object} schema - JSON Schema
   * @param {Object} options - 导出选项
   * @param {string} [options.title='Schema 文档'] - 文档标题
   * @param {string} [options.locale='zh-CN'] - 语言 (zh-CN/en-US/ja-JP)
   * @param {boolean} [options.includeExample=true] - 是否包含示例
   * @param {boolean} [options.includeDescription=true] - 是否包含描述
   * @returns {string} Markdown 文本
   *
   * @example
   * const markdown = MarkdownExporter.export(schema, {
   *   title: '用户注册 API',
   *   locale: 'zh-CN',
   *   includeExample: true
   * });
   */
  static export(schema, options = {}) {
    const {
      title = 'Schema 文档',
      locale = 'zh-CN',
      includeExample = true,
      includeDescription = true
    } = options;

    let markdown = `# ${title}\n\n`;

    // 添加描述
    if (includeDescription && schema.description) {
      markdown += `${schema.description}\n\n`;
    }

    // 生成字段列表
    markdown += this._generateFieldsTable(schema, locale);

    // 生成示例
    if (includeExample) {
      markdown += '\n' + this._generateExample(schema, locale);
    }

    // 生成约束规则
    markdown += '\n' + this._generateConstraintsSection(schema, locale);

    return markdown;
  }

  /**
   * 生成字段列表表格
   * @private
   */
  static _generateFieldsTable(schema, locale) {
    const i18n = {
      'zh-CN': {
        fields: '字段列表',
        name: '字段名',
        type: '类型',
        required: '必填',
        constraints: '约束',
        description: '说明'
      },
      'en-US': {
        fields: 'Fields',
        name: 'Field',
        type: 'Type',
        required: 'Required',
        constraints: 'Constraints',
        description: 'Description'
      },
      'ja-JP': {
        fields: 'フィールド一覧',
        name: 'フィールド名',
        type: 'タイプ',
        required: '必須',
        constraints: '制約',
        description: '説明'
      }
    };

    const t = i18n[locale] || i18n['en-US'];

    let table = `## ${t.fields}\n\n`;
    table += `| ${t.name} | ${t.type} | ${t.required} | ${t.constraints} | ${t.description} |\n`;
    table += `|--------|------|------|------|------|\n`;

    // 遍历 properties
    if (schema.properties) {
      Object.entries(schema.properties).forEach(([key, prop]) => {
        const type = this._formatType(prop, locale);
        const required = prop._required || schema.required?.includes(key) ? '✅' : '❌';
        const constraints = this._formatConstraints(prop, locale);
        const description = this._getDescription(prop, locale);

        table += `| ${key} | ${type} | ${required} | ${constraints} | ${description} |\n`;
      });
    }

    return table;
  }

  /**
   * 格式化类型
   * @private
   */
  static _formatType(prop, locale) {
    const typeMap = {
      'zh-CN': {
        string: '字符串',
        number: '数字',
        integer: '整数',
        boolean: '布尔值',
        array: '数组',
        object: '对象',
        email: '邮箱',
        url: '网址',
        date: '日期',
        uuid: 'UUID'
      },
      'en-US': {
        string: 'String',
        number: 'Number',
        integer: 'Integer',
        boolean: 'Boolean',
        array: 'Array',
        object: 'Object',
        email: 'Email',
        url: 'URL',
        date: 'Date',
        uuid: 'UUID'
      },
      'ja-JP': {
        string: '文字列',
        number: '数値',
        integer: '整数',
        boolean: 'ブール値',
        array: '配列',
        object: 'オブジェクト',
        email: 'メールアドレス',
        url: 'URL',
        date: '日付',
        uuid: 'UUID'
      }
    };

    const t = typeMap[locale] || typeMap['en-US'];

    // 优先使用 format
    if (prop.format) {
      return t[prop.format] || prop.format;
    }

    // 数组类型
    if (prop.type === 'array' && prop.items) {
      const itemType = this._formatType(prop.items, locale);
      return `${t.array}<${itemType}>`;
    }

    return t[prop.type] || prop.type;
  }

  /**
   * 格式化约束
   * @private
   */
  static _formatConstraints(prop, locale) {
    const constraints = [];

    const i18n = {
      'zh-CN': {
        length: '长度',
        range: '范围',
        pattern: '正则',
        enum: '枚举',
        items: '元素数'
      },
      'en-US': {
        length: 'Length',
        range: 'Range',
        pattern: 'Pattern',
        enum: 'Enum',
        items: 'Items'
      },
      'ja-JP': {
        length: '長さ',
        range: '範囲',
        pattern: '正規表現',
        enum: '列挙',
        items: '要素数'
      }
    };

    const t = i18n[locale] || i18n['en-US'];

    // 字符串长度
    if (prop.minLength !== undefined || prop.maxLength !== undefined) {
      const min = prop.minLength !== undefined ? prop.minLength : '';
      const max = prop.maxLength !== undefined ? prop.maxLength : '';
      if (min && max) {
        constraints.push(`${t.length}: ${min}-${max}`);
      } else if (min) {
        constraints.push(`${t.length}: ≥${min}`);
      } else if (max) {
        constraints.push(`${t.length}: ≤${max}`);
      }
    }

    // 数字范围
    if (prop.minimum !== undefined || prop.maximum !== undefined) {
      const min = prop.minimum !== undefined ? prop.minimum : '';
      const max = prop.maximum !== undefined ? prop.maximum : '';
      if (min !== '' && max !== '') {
        constraints.push(`${t.range}: ${min}-${max}`);
      } else if (min !== '') {
        constraints.push(`${t.range}: ≥${min}`);
      } else if (max !== '') {
        constraints.push(`${t.range}: ≤${max}`);
      }
    }

    // 数组元素数
    if (prop.minItems !== undefined || prop.maxItems !== undefined) {
      const min = prop.minItems !== undefined ? prop.minItems : '';
      const max = prop.maxItems !== undefined ? prop.maxItems : '';
      if (min !== '' && max !== '') {
        constraints.push(`${t.items}: ${min}-${max}`);
      } else if (min !== '') {
        constraints.push(`${t.items}: ≥${min}`);
      } else if (max !== '') {
        constraints.push(`${t.items}: ≤${max}`);
      }
    }

    // 正则表达式
    if (prop.pattern) {
      constraints.push(`${t.pattern}: \`${prop.pattern}\``);
    }

    // 枚举值
    if (prop.enum) {
      const enumStr = prop.enum.map(v => `\`${v}\``).join(', ');
      constraints.push(`${t.enum}: ${enumStr}`);
    }

    return constraints.length > 0 ? constraints.join('<br>') : '-';
  }

  /**
   * 获取描述
   * @private
   */
  static _getDescription(prop, locale) {
    // 优先使用多语言 label
    if (prop._labelI18n && prop._labelI18n[locale]) {
      return prop._labelI18n[locale];
    }

    // 其次使用单语言 label
    if (prop._label) {
      return prop._label;
    }

    // 最后使用 description
    if (prop.description) {
      return prop.description;
    }

    return '-';
  }

  /**
   * 生成示例数据
   * @private
   */
  static _generateExample(schema, locale) {
    const i18n = {
      'zh-CN': { example: '示例数据' },
      'en-US': { example: 'Example Data' },
      'ja-JP': { example: 'サンプルデータ' }
    };

    const t = i18n[locale] || i18n['en-US'];

    let example = `## ${t.example}\n\n\`\`\`json\n`;
    example += JSON.stringify(this._buildExample(schema), null, 2);
    example += '\n\`\`\`\n';
    return example;
  }

  /**
   * 构建示例对象
   * @private
   */
  static _buildExample(schema) {
    if (schema.properties) {
      const obj = {};
      Object.entries(schema.properties).forEach(([key, prop]) => {
        // 只生成必填字段的示例
        if (prop._required || schema.required?.includes(key)) {
          obj[key] = this._getExampleValue(prop);
        }
      });
      return obj;
    }
    return null;
  }

  /**
   * 获取示例值
   * @private
   */
  static _getExampleValue(prop) {
    // 使用默认值
    if (prop.default !== undefined) {
      return prop.default;
    }

    // 使用枚举第一项
    if (prop.enum) {
      return prop.enum[0];
    }

    // 根据类型和格式生成
    switch (prop.type) {
      case 'string':
        if (prop.format === 'email') return 'user@example.com';
        if (prop.format === 'url') return 'https://example.com';
        if (prop.format === 'date') return '2025-12-29';
        if (prop.format === 'uuid') return '550e8400-e29b-41d4-a716-446655440000';
        return 'example';

      case 'number':
      case 'integer':
        if (prop.minimum !== undefined) return prop.minimum;
        if (prop.maximum !== undefined) return Math.floor(prop.maximum / 2);
        return 0;

      case 'boolean':
        return true;

      case 'array':
        if (prop.items) {
          return [this._getExampleValue(prop.items)];
        }
        return [];

      case 'object':
        if (prop.properties) {
          return this._buildExample(prop);
        }
        return {};

      default:
        return null;
    }
  }

  /**
   * 生成约束规则章节
   * @private
   */
  static _generateConstraintsSection(schema, locale) {
    const i18n = {
      'zh-CN': {
        rules: '约束规则',
        required: '必填字段',
        optional: '可选字段'
      },
      'en-US': {
        rules: 'Validation Rules',
        required: 'Required Fields',
        optional: 'Optional Fields'
      },
      'ja-JP': {
        rules: '検証ルール',
        required: '必須フィールド',
        optional: 'オプションフィールド'
      }
    };

    const t = i18n[locale] || i18n['en-US'];

    if (!schema.properties) {
      return '';
    }

    const requiredFields = [];
    const optionalFields = [];

    Object.entries(schema.properties).forEach(([key, prop]) => {
      if (prop._required || schema.required?.includes(key)) {
        requiredFields.push(key);
      } else {
        optionalFields.push(key);
      }
    });

    let section = `## ${t.rules}\n\n`;

    if (requiredFields.length > 0) {
      section += `**${t.required}**: ${requiredFields.map(f => `\`${f}\``).join(', ')}\n\n`;
    }

    if (optionalFields.length > 0) {
      section += `**${t.optional}**: ${optionalFields.map(f => `\`${f}\``).join(', ')}\n`;
    }

    return section;
  }
}

module.exports = MarkdownExporter;

