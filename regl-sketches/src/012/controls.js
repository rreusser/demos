
const h = require('h');
const css = require('insert-css');
const katex = require('katex');
const fs = require('fs');

css(`
.controls {
  position: absolute;
  top: 0;
  left: 0;
  padding: 8px;
  font-family: 'Helvetica', 'Arial', sans-serif;
}

.controls .btn {
  margin-top: 0.4em;
  margin-bottom: 0.3em;
  font-size: 0.8em;
  background: none;
  border: 1px solid rgba(0, 0, 0, 0.5);
  border-radius: 3px;
  cursor: pointer;
  outline: none;
  display: block;
}

.controls .btn:hover {
  background: rgba(0, 0, 0, 0.2);
}

.controls .btn:active {
  background: rgba(0, 0, 0, 0.4);
}
`)

css(fs.readFileSync(__dirname + '/../../node_modules/katex/dist/katex.min.css', 'utf8'));


module.exports = function (callbacks) {
  let nextTexBtn = h('button', 'Change material', {class: 'btn'})
  nextTexBtn.addEventListener('click', () => callbacks.nextTexture());

  let toggleGridBtn = h('button', 'Toggle grid', {class: 'btn'})
  toggleGridBtn.addEventListener('click', () => callbacks.toggleGrid());

  let controls = h('div', [
    nextTexBtn,
    toggleGridBtn
  ], {class: 'controls'})

  document.body.appendChild(controls);
};
