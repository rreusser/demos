#!/usr/bin/env node

var glob = require('glob');
var browserify = require('browserify');
var fs = require('fs');
var indexhtmlify = require('indexhtmlify');
var path = require('path');
var metadataify = require('metadataify');
var hyperstream = require('hyperstream');
var humanize = require('humanize-string');

var repoUrl = 'https://github.com/rreusser/demos/tree/master/plotly';
var webUrl = 'http://rickyreusser.com/demos/plotly/';

var ghcornerify = require('github-cornerify')({url: repoUrl});

var appendIndexLink = hyperstream({
  body: {_prependHtml: '<a href="' + repoUrl + '">&larr; Back</a>'}
});

processFiles('src/*.js')
  .then(createReadme);

function processFiles (pattern) {
  return new Promise(function (resolve) {
    var resultList = [];
    glob(pattern, function (err, filenames) {
      var i = 0;
      (function nextFile() {
        var filename = filenames[i++];

        if (!filename) return resolve(resultList);

        processFile(filename, function (result) {
          resultList.push(result);
          nextFile();
        });
      })()
    });

    function processFile(filename, cb) {
      var basename = path.basename(filename, path.extname(filename));
      var humanname = humanize(basename);
      var htmlname = filename.replace(/\.js$/, '.html').replace(/^src\//,'');
      var htmlstream = fs.createWriteStream(path.join(__dirname, '../', htmlname));


      var b = browserify();
      b.add(path.join(__dirname, '../', filename));
      b.bundle()
        .pipe(indexhtmlify())
        .pipe(appendIndexLink)
        .pipe(metadataify({
          name: humanname
        }))
        .pipe(ghcornerify)
        .pipe(htmlstream);

      cb && cb({
        humanName: humanname,
        path: htmlname,
        url: path.join(webUrl, htmlname)
      });
    }
  });
}

function createReadme (results) {
  return new Promise(function (resolve) {
    var readmeStream = fs.createWriteStream(path.join(__dirname, '../', 'README.md'));

    readmeStream.write(`# plotly.js testing
> Demos and tests created in the process of devlopment with plotly.js

## Pages

${results.map(function(result) {
  return `- [${result.humanName}](${result.url})`;
}).join('\n')}

## License

&copy; 2016 Ricky Reusser. MIT License.
`);
    readmeStream.end();
  });
}
