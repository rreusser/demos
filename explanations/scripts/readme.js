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

**Disclaimer**: I work for plotly and have struggled to find an effective way to develop and share working examples that do not use the official CDN version of plotly.js. The examples here are provided strictly for sharability and effective communication regarding plotly.js bugs and features in development. **Do not** expect them to work with [the official plotly.js library](https://github.com/plotly/plotly.js). In fact probably don't expect them to work at all. Most of them used open source but unreleased code, so the particular implementations found here will *not* be supported.

${results.map(function(result) {
  if (result.humanName === 'Index') return;
  return `- [${result.humanName}](${result.url})`;
}).filter(x => !!x).join('\n')}

## License

&copy; 2016 Ricky Reusser. MIT License.
`);
    readmeStream.end();
  });
}
