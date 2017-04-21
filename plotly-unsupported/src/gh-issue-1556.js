var Plotly = window.Plotly = require('plotly.js');
var gd = window.gd = document.createElement('div');
document.body.appendChild(gd);

var data = [{
  x: [1, 1.5, 2],
  y: [0.5, 0.5, 0.5],
  text: [
    'red <span>X</span><br>🦁',
    'green <span>X</span>',
    'red <span>X</span>'
  ],
  textfont: {
    size: 18
  },
  type:'scatter',
  mode:'markers+text',
  marker: {
      size: 100,
      color: ['red', 'green', 'blue'],
      opacity: 0.75
  }
}];


Plotly.plot(gd, {
  data: data,
  layout: {
    title: 'Click the Circles',
    hovermode: 'closest'
  }
});

var btn = document.createElement('button');
document.body.appendChild(btn);
btn.innerHTML = 'doit'
btn.addEventListener('click', function () {
  var opacity = (gd.data[0].marker.opacity > 0.5) ? 0.25 : 0.75;
  data[0].y[0] = Math.random();
  data[0].y[1] = Math.random();
  data[0].y[2] = Math.random();
  Plotly.animate(gd, {
      traces: [0],
      data: [{'marker.opacity': opacity}]
    }, {
      transition: {easing: 'cubic-in-out', duration: 1000},
      frame: {duration: 1000}
    }
  );
});
