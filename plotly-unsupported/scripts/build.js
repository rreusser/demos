#!/usr/bin/env node

var glob = require('glob');
var browserify = require('browserify');
var fs = require('fs');
var indexhtmlify = require('indexhtmlify');
var path = require('path');
var metadataify = require('metadataify');
var hyperstream = require('hyperstream');
var humanize = require('humanize-string');

var repoUrl = 'https://github.com/rreusser/demos/tree/master/plotly-unsupported';
var webUrlBase = 'http://rickyreusser.com/demos/plotly-unsupported/';
var srcUrlBase = 'https://github.com/rreusser/demos/blob/master/plotly-unsupported/';

var ghcornerify = require('github-cornerify')({url: repoUrl});

if (!process.argv[2]) {
  console.error(`[0;31mOops! You need to specify a source file.

You can't build all the demos at once because then half of them
would be broken since it's all experimental which is the reason
I took the time to create this in the first place. :)[0m`)
  process.exit(1);
}

var pattern = process.argv[2];
pattern = /^src\//.test(pattern) ? pattern : path.join('src', pattern);
pattern = /\.js/.test(pattern) ? pattern : pattern + '.js';

processFiles(pattern);

function processFiles (pattern) {
  return new Promise(function (resolve) {
    var resultList = [];
    glob(pattern, function (err, filenames) {
      var i = 0;
      (function nextFile() {
        var filename = filenames[i++];

        if (!filename) return resolve(resultList);

        console.log(`Processing '${filename}'...`);

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
      var srcUrl = path.join(srcUrlBase, filename);
      var webUrl = path.join(webUrlBase, htmlname);

      var appendIndexLink = hyperstream({
        body: {_prependHtml:
          `<div class="links">
            <a href="${repoUrl}#pages">&larr; Back</a> | <a href="${srcUrl}"><code>${basename}.js</code></a>
          </div>`
        }
      });

      var b = browserify();
      b.add(path.join(__dirname, '../', filename));
      b.transform(require('brfs'));
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
        url: webUrl,
        srcUrl: srcUrl
      });
    }
  });
}
