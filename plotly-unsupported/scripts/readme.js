#!/usr/bin/env node

var glob = require('glob');
var path = require('path');
var humanize = require('humanize-string');
var fs = require('fs');

var webUrlBase = 'http://rickyreusser.com/demos/plotly-unsupported/';

glob('*.html', function (err, files) {
  createReadme(files.map(filename => {
    var basename = path.basename(filename, path.extname(filename));
    var humanname = humanize(basename);
    return {
      url: path.join(webUrlBase, filename),
      humanName: humanname
    }
  }));
});

function createReadme (results) {
  return new Promise(function (resolve) {
    var readmeStream = fs.createWriteStream(path.join(__dirname, '../', 'README.md'));

    readmeStream.write(`# plotly.js testing
> Demos and tests created in the process of devlopment with plotly.js

## Pages

These are provided strictly for sharability. **Do not** expect them to work with [the official plotly.js library](https://github.com/plotly/plotly.js).

${results.map(function(result) {
  return `- [${result.humanName}](${result.url})`;
}).join('\n')}

## License

&copy; 2016 Ricky Reusser. MIT License.
`);
    readmeStream.end();
  });
}
