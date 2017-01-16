'use strict'

const Plotly = require('plotly.js');
const h = require('h');
const gd = h('div');
document.body.appendChild(gd);

var eventList = h('ul');
document.body.append(eventList);

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

var clicks = 0;
gd.on('plotly_click', function (e) {
  console.log(e);

  eventList.appendChild(h('li', [
    h('ul', [
      h('pre', (clicks++) + ': pointNumber: ' + e.points[0].pointNumber)
    ])
  ]));

  while (eventList.children.length > 5) {
    eventList.removeChild(eventList.children[0]);
  }
});
