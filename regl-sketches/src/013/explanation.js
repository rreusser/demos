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
    "x(u,v) = -\\frac{2}{15} \\cos u (3 \\cos{v}-30 \\sin{u}+90 \\cos^4{u} \\sin{u} -60 \\cos^6{u} \\sin{u}+5 \\cos{u} \\cos{v} \\sin{u})",
    "y(u,v) = -\\frac{1}{15} \\sin u (3 \\cos{v}-3 \\cos^2{u} \\cos{v}-48 \\cos^4{u} \\cos{v}+ 48 \\cos^6{u} \\cos{v}-60 \\sin{u}+",
    "\\quad\\quad\\quad\\quad 5 \\cos{u} \\cos{v} \\sin{u}-5 \\cos^3{u} \\cos{v} \\sin{u}-80 \\cos^5{u} \\cos{v} \\sin{u}+80 \\cos^7{u} \\cos{v} \\sin{u})",
    "z(u,v) = \\frac{2}{15} (3+5 \\cos{u} \\sin{u}) \\sin{v}",
    "\\quad \\mathrm{for}\\,0 \\le u \\le \\pi,\\quad 0 \\le v \\le 2\\pi"
  ].map(eqn => {
    let el = h('div.eqn')
    katex.render(eqn, el)
    return el;
  })

  let explanation = h('div', [
    h('h3', 'Klein Bottle'),
    eqns
  ], {class: 'explanation'})

  document.body.appendChild(explanation);
};
