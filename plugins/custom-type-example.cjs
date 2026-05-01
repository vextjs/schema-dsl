'use strict';

const mod = require('../dist/plugins/custom-type-example.cjs');
const plugin = mod.default ?? mod.customTypeExamplePlugin ?? mod;

module.exports = plugin;
module.exports.default = plugin;

