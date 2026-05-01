'use strict';

const mod = require('../dist/plugins/custom-format.cjs');
const plugin = mod.default ?? mod.customFormatPlugin ?? mod;

module.exports = plugin;
module.exports.default = plugin;

