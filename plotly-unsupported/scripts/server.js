#!/usr/bin/env node

var args = process.argv.slice(2)
args = args.concat(['--host', 'localhost', '--live', '--open', '--', '-t', 'brfs']);
require('../node_modules/budo').cli(args)
