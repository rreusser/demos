'use strict'

const Plotly = require('plotly.js');
const h = require('h');
const gd = h('div');
document.body.appendChild(gd);

let animate = () => {
  return Plotly.animate(gd, [{
    data: [{y: [2, 2.5 + Math.random(), 4]}]
  }], {
    frame: {redraw: false}
  }).then(animate);
};

Plotly.plot(gd, [{
  x: [1, 2, 3],
  y: [2, 3, 4],
  line: {simplify: false}
}], {}, {
  scrollZoom: true
}).then(() => {
  animate();
});

