const controlPanel = require('control-panel');
const h = require('h');
const extend = require('xtend');
const mutate = require('xtend/mutable');
const css = require('insert-css');
const fs = require('fs');

module.exports = function (fields, state, cb) {
  const control = h('div#control');
  document.body.appendChild(control);
  const controlHeader = h('div.control-header', 'Controls')
  control.appendChild(controlHeader);
  control.addEventListener('mousemove', e => e.stopPropagation());
  control.addEventListener('mousedown', e => e.stopPropagation());
  controlHeader.addEventListener('click', (e) => {
    e.stopPropagation();
    control.classList.toggle('expanded')
  });

  css(fs.readFileSync(__dirname + '/styles.css', 'utf8'));

  let pstate = extend({}, state);

  require('control-panel')(fields, {
    root: control,
    theme: 'light',
    width: 375
  }).on('input', data => {
    pstate = extend({}, state);
    mutate(state, data);
    cb && cb(pstate, state);
  });
};
