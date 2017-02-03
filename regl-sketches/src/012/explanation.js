const h = require('h');
const css = require('insert-css');
const katex = require('katex');
const fs = require('fs');

css(`
.explanation {
  position: absolute;
  bottom: 0;
  left: 0;
  padding: 8px;
  font-family: 'Helvetica', 'Arial', sans-serif;
  pointer-events: none;
}

.explanation h3 {
  margin-bottom: 0;
  font-style: italic;
}

.explanation .eqn {
  margin-top: 0.4em;
  margin-bottom: 0.3em;
  font-size: 0.8em;
}
`)

css(fs.readFileSync(__dirname + '/../../node_modules/katex/dist/katex.min.css', 'utf8'));


module.exports = function () {
  let eqns = [
    "x = \\sin u \\left(7+\\cos\\left({u \\over 3} - 2v\\right) + 2\\cos\\left({u \\over3} + v\\right)\\right)",
    "y = \\cos u \\left(7 + \\cos\\left({u \\over 3} - 2v\\right) + 2\\cos\\left({u \\over 3} + v\\right)\\right)",
    "z = \\sin\\left({u \\over 3} - 2v\\right) + 2\\sin \\left({u \\over 3} + v\\right)",
    "\\quad \\mathrm{for}\\,-\\pi \\le u \\le \\pi,\\quad -\\pi \\le v \\le \\pi"
  ].map(eqn => {
    let el = h('div.eqn')
    katex.render(eqn, el)
    return el;
  })

  let explanation = h('div', [
    h('h3', 'Umbilic Torus'),
    eqns
  ], {class: 'explanation'})

  document.body.appendChild(explanation);
};
