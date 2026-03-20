process.env.NODE_ENV = process.env.NODE_ENV || 'test';

module.exports = /** @type {import('mocha').MochaOptions} */ ({
  require: ['tsx'],
  file: 'spec/javascript/spec_helper.js',
  extension: ['js', 'jsx', 'ts', 'tsx'],
  conditions: ['source'],
  'node-option': ['import=tsx'],
});
