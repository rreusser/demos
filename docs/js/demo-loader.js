
    window.onload = function() {
      var makeSandbox = require('browser-module-sandbox');
      var insertCss = require('insert-css');
      var throttle = require('method-throttle');
      var CodeMirror = require('codemirror');

      insertCss([
        '.remark-demo {',
        '  width: 100%;',
        '  height: 500px;',
        '  margin-bottom: 1em;',
        '  position: relative;',
        '}',
        '.remark-demo button {',
        '  display: none;',
        '  border: none;',
        '  background-color: #666;',
        '  color: white;',
        '  padding: 5px 20px;',
        '  border-radius: 3px;',
        '  position: absolute;',
        '  top: 0;',
        '  left: 0;',
        '  z-index: 10;',
        '  cursor: pointer;',
        '}',
        '.remark-demo:hover button {',
        '  display: block;',
        '}',
        '.remark-demo--editing {',
        '  position: fixed;',
        '  top: 0;',
        '  right: 0;',
        '  bottom: 0;',
        '  left: 0;',
        '  z-index: 10000;',
        '  background-color: white;',
        '  height: auto !important;',
        '  margin: 0 !important;',
        '}',
        '.remark-demo--editing iframe {',
        '  left: 50% !important;',
        '  width: 50% !important;',
        '  position: absolute !important;',
        '  top: 0 !important;',
        '  right: 0 !important;',
        '}',
        '.remark-demo-editor {',
        '  dispay: none;',
        '}',
        '.remark-demo--editing .remark-demo-editor {',
        '  dispay: block;',
        '  position: absolute;',
        '  left: 0;',
        '  top: 30px;',
        '  border-top: 1px solid #ccc;',
        '  bottom: 0;',
        '  width: 50%;',
        '}',
        '.remark-demo-editor .CodeMirror {',
        '  height: 100%;',
        '  top: 0;',
        '  right: 0;',
        '  bottom: 0;',
        '  left: 0;',
        '}',
      ].join('\n'));

      var els = document.querySelectorAll('.remark-demo');

      window.addEventListener('message', function (ev) {
        //console.log('parent received message:', ev.data);
        var data = ev.data;
        var demo = demos[data.id];
        if (demo) {
          if (data.message === 'demo:loaded') {
            //console.log('demo is loaded:', data.id);
            demo.sendVisibility();
          }
        } else {
          console.warn('message received from unknown demo:', data.id);
        }
      });

      function makeDemo (el, opts) {
        var iframe, headScripts;
        var opts = opts || {};
        opts.offscreenDistance = opts.offscreenDistance === undefined ? 1000 : opts.offscreenDistance;
        opts.offscreenRunningDistance = opts.offscreenRunningDistance === undefined ? 0 : opts.offscreenRunningDistance;

        var scriptId = el.getAttribute('data-script-id');
        var scriptEl = document.getElementById(scriptId);

        if (window.demoScripts) {
          headScripts = [
            [
              '<script type="text/javascript">',
              '  (function (window) {',
              '    "use strict";',
              '    var isVisible = false;',
              '    var scriptId = "' + scriptId + '";',
              '    window.onload = function () {',
              '      window.parent.postMessage({message: "demo:loaded", id: scriptId}, "*");',
              '    };',
              '    window.addEventListener("message", function (data) {',
              '      console.log("iframe received message:", data.data);',
              '      if (data.data && data.data.message === "visibility:visible") {',
              '        console.log(scriptId + " is visible");',
              '        isVisible = true;',
              '        flushRafQueue();',
              '      }',
              '      if (data.data && data.data.message === "visibility:occluded") {',
              '        console.log(scriptId + " is occluded");',
              '        isVisible = false;',
              '      }',
              '    });',
              '    var origRAF = window.requestAnimationFrame;',
              '    var rafQueue = [];',
              '    function flushRafQueue () {',
              '      while (rafQueue.length) {',
              '        origRAF(rafQueue.pop());',
              '      }',
              '    }',
              '    window.requestAnimationFrame = function (cb) {',
              '      if (isVisible) {',
                '      flushRafQueue();',
              '        origRAF(cb);',
              '      } else {',
              '        rafQueue.push(cb)',
              '      }',
              '    };',
              '  }(window));',
              '</script>'
            ].join('\n')
          ].concat(window.demoScripts.map(function(s) {
            return '<script src="' + s + '" type="text/javascript"></script>';
          })).join('\n');
        }

        var exists = false;
        var bundled = false;
        var sandbox = makeSandbox({
          name: 'test',
          cdn: 'http://wzrd.in',
          container: el,
          iframeHead: headScripts,
          iframeStyle: 'html, body { margin: 0; padding: 0 }',
          cacheOpts: {inMemory: true},
        });

        function getScript () {
          if (!scriptEl) return null;
          var dataURI = scriptEl.src;
          if (!dataURI) return null;

          var parts = dataURI.split(',');
          var type = parts[0];
          var script = decodeURIComponent(parts[1]);

          return script;
        }

        var script = getScript();

        function destroy () {
          if (!exists) return;
          //console.info('destroying ' + el.getAttribute('data-script-id'));
          exists = false;
          bundled = false;
          sandbox.bundle('');
        }

        function create () {
          if (exists) return;
          //console.info('creating ' + el.getAttribute('data-script-id'));
          exists = true;
          sandbox.bundle(script);
        }

        function reload () {
          destroy();
          create();
        }

        function postMessage (message, data) {
          var ifr = sandbox.iframe;
          if (!ifr) return;
          var iframe = ifr.iframe;
          if (!iframe) return;

          iframe.contentWindow.postMessage(message, "*", data);
        }

        var visible = false;
        function startRunning () {
          if (!exists || visible) return;
          visible = true;
          sendVisibility();
        }

        function stopRuning () {
          if (!exists || !visible) return;
          visible = false;
          sendVisibility();
        }

        function sendVisibility () {
          if (!exists) return;
          postMessage({message: visible ? 'visibility:visible' : 'visibility:occluded'});
        }

        function attachEditor () {
          el.addEventListener('click', function (ev) {
            var clicked = ev.target;
            if (clicked.classList.contains('remark-demo-edit')) {
              if (el.classList.contains('remark-demo--editing')) {
                exitEditor();
              } else {
                enterEditor();
              }
            }
          });
        }

        var editor, textarea;
        function enterEditor () {
          el.classList.add('remark-demo--editing');
          editor = document.createElement('div');
          editor.classList.add('remark-demo-editor');

          textarea = document.createElement('textarea');
          editor.appendChild(textarea);
          textarea.value = script;

          el.appendChild(editor);

          CodeMirror.fromTextArea(textarea);

          reload();
        }

        function exitEditor () {
          el.classList.remove('remark-demo--editing');
          el.removeChild(editor);

          reload();
        }

        var t0, t1;
        sandbox.on('bundleStart', function () {
          if (!exists) return;
          t0 = Date.now();
          //console.info('Bundling ' + el.getAttribute('data-script-id') + '...');
          bundled = false;
        }).on('bundleEnd', function () {
          if (!exists) return;
          t1 = Date.now();
          console.info('Bundled ' + el.getAttribute('data-script-id') + ' in ' + (t1 - t0) / 1000 + 's');
          checkVisibilityOcclusion();
          bundled = true;
        });

        function isVisible (bufferDistance) {
          if (bufferDistance === undefined) {
            bufferDistance = 0;
          }
          var rect = el.getBoundingClientRect();
          return rect.top < window.innerHeight + bufferDistance && rect.bottom > -bufferDistance;
        }

        function checkExistenceOcclusion () {
          isVisible(opts.offscreenDistance) ? create() : destroy();
        }

        function checkVisibilityOcclusion () {
          if (!exists) return;
          isVisible(opts.offscreenRunningDistance) ? startRunning() : stopRuning();
        }

        function checkOcclusion () {
          checkExistenceOcclusion();
          if (exists) {
            checkVisibilityOcclusion();
          }
        }

        checkExistenceOcclusion();
        attachEditor();

        return {
          sandbox: sandbox,
          checkExistenceOcclusion: checkExistenceOcclusion,
          checkVisibilityOcclusion: checkVisibilityOcclusion,
          checkOcclusion: checkOcclusion,
          sendVisibility: sendVisibility,
          isVisible: isVisible,
          id: el.getAttribute('id'),
          scriptId: scriptId
        };
      }

      var demos = {};
      for (var i = 0; i < els.length; i++) {
        var newDemo = makeDemo(els[i], {
          headScripts: window.headScripts,
          offscreenDistance: 1000,
          offscreenRAFDidstance: 0,
        });
        demos[newDemo.scriptId] = newDemo;
      }

      var prevScrollPos = window.scrollY;
      var checkDemoOcclusion = throttle(function () {
        var scrollPos = window.scrollY;
        if (prevScrollPos !== scrollPos) {
          var demoNames = Object.keys(demos);
          for (var i = 0; i < demoNames.length; i++) {
            demos[demoNames[i]].checkOcclusion();
          }
        }
        prevScrollPos = scrollPos;
      }, 50);

      window.addEventListener('scroll', checkDemoOcclusion, false);
      window.addEventListener('resize', checkDemoOcclusion, false);

    };
  