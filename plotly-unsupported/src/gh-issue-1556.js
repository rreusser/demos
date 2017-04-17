var Plotly = window.Plotly = require('plotly.js');
var gd = window.gd = document.createElement('div');
document.body.appendChild(gd);

var data = [{
  x: [1, 1.5, 2],
  y: [10, 10, 10],
  text: [
    'red <span>X</span>',
    'green <span>X</span>',
    'red <span>X</span>'
  ],
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

gd.on('plotly_click', function toggle() {
  var opacity = (gd.data[0].marker.opacity > 0.5) ? 0.25 : 0.75;
  console.log('plotly_click:', gd.data[0].marker.opacity, opacity);

  Plotly.animate(gd, {
      traces: [0],
      data: [{'marker.opacity': opacity}]
  }, {
      transition: {
          easing:'cubic-in-out',
          duration: 500
      }
  });
});
