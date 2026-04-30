import { PluginManager } from '../dist/index.js';

const manager = new PluginManager();
manager.register({
  name: 'demo-plugin',
  install() {},
  hooks: {
    beforeValidate(data) {
      return data;
    }
  }
});

console.log(manager.has('demo-plugin'));

