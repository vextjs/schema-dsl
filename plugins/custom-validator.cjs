'use strict';

const mod = require('../dist/plugins/custom-validator.cjs');
const plugin = mod.default ?? mod.customValidatorPlugin ?? mod;

module.exports = plugin;
module.exports.default = plugin;

