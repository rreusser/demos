#!/usr/bin/env node

var glob = require('glob');
var browserify = require('browserify');
var fs = require('fs');
var indexhtmlify = require('indexhtmlify');
var path = require('path');
var metadataify = require('metadataify');
var hyperstream = require('hyperstream');
var humanize = require('humanize-string');
var es2040 = require('es2040');
var uglify = require('uglify-stream');

var repoUrl = 'https://github.com/rreusser/demos/tree/master/regl-sketches';
var webUrlBase = 'http://rickyreusser.com/demos/regl-sketches/';
var srcUrlBase = 'https://github.com/rreusser/demos/blob/master/regl-sketches/';

var ghcornerify = require('github-cornerify')

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
      var srcUrl = path.join(srcUrlBase, filename).replace(/index\.js$/,'');
      var webUrl = path.join(webUrlBase, htmlname);

      console.log('srcUrl', srcUrl);

      var b = browserify();
      b.add(path.join(__dirname, '../', filename));
      b.transform(require('es2040'));
      b.transform(require('brfs'));
      b.transform(require('glslify'));
      b.transform(require('envify')({NODE_ENV: 'production'}));
      b.bundle()
        .pipe(uglify())
        .pipe(indexhtmlify())
        .pipe(metadataify({
          name: humanname
        }))
        .pipe(ghcornerify({
          url: srcUrl,
          bg: '#fff',
          fg: '#2a3235',
        }))
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
