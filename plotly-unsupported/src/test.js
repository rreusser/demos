/* @ratpack {rules: [{files: '*.js', loader: "transform-loader?brfs", enforce: "post"}]} */

var fs = require('fs');
console.log(fs.readFileSync(__dirname + '/test.js', 'utf8'));
