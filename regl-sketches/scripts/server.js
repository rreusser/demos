#!/usr/bin/env node

var path = require('path');
var args = process.argv.slice(2)

if (args[0]) {
  args[0] = /^src\//.test(args[0]) ? args[0] : path.join('src', args[0]);
  args[0] = /\.js/.test(args[0]) ? args[0] : args[0] + '.js';
}

args = args.concat(['--host', 'localhost', '--force-default-index', '--live', '--open', '--', '-t', 'brfs', '-t', 'glslify', '-t', 'es2040']);
require('../node_modules/budo').cli(args)
