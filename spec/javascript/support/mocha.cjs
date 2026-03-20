const babelRegister = require('@babel/register');
const path = require('path');

babelRegister({
  configFile: path.resolve(__dirname, '../../../babel.config.cjs'),
  ignore: [/node_modules\/(?!@18f\/identity-)/],
  extensions: ['.js', '.jsx', '.ts', '.tsx'],
});
