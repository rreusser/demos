const katex = require('katex');
const h = require('h');
const css = require('insert-css');
const path = require('path');
const fs = require('fs');

css(fs.readFileSync(path.join(__dirname, '../../node_modules/katex/dist/katex.min.css'), 'utf8'));

css(`
#explanation {
  position: absolute;
  bottom: 15px;
  left: 15px;
  color: white;
  z-index: 100;
  text-shadow: 1px 1px 15px rgba(0, 0, 0, 0.5);
}

h3 {
  font-family: 'Helvetica', 'Arial', sans-serif;
  font-style: italic;
  margin-bottom: 0.5em;
}

a {
  text-decoration: none;
}

a:hover {
  color: #ccc;
}
`);

module.exports = function () {
  const eqn = h('span');
  eqn.innerHTML = katex.renderToString(`
    u_t + \\nabla^4 u + \\nabla^2 u + \\frac{1}{2}| \\nabla u |^2 = 0
  `);

  return h('a', {id: 'explanation', href: 'https://www.encyclopediaofmath.org/index.php/Kuramoto-Sivashinsky_equation'}, [
    h('h3', 'Kuramoto-Sivashinsky Equation,'),
    eqn
  ]);
};
