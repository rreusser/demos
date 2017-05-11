var Plotly = require('plotly.js');
var gd = document.createElement("div");
document.body.appendChild(gd);
var data = [
  {
    x: [1, 2, 3],
    y: [10, 10, 10],
    text: ["red <span>X</span>", "green <span>X</span>", "red <span>X</span>"],
    type: "scatter",
    mode: "markers+text",
    marker: {
      size: 100,
      color: ["red", "green", "blue"],
      opacity: 0.75
    }
  }
];

var layout = {
  title: "Click the Circles",
  xaxis: { range: [0, 4] },
  yaxis: { range: [0, 15] },
  hovermode: "closest"
};

var config = {
  scrollZoom: true
};

Plotly.newPlot(gd, data, layout, config);

gd.on("plotly_click", function toggle() {
  var opacity = gd.data[0].marker.opacity > 0.5 ? 0.25 : 0.75;
  var xrange = gd.data[0].marker.opacity > 0.5
    ? [0, 4]
    : [1, 3];
  var yrange = gd.data[0].marker.opacity > 0.5 ? [9, 11] : [0, 15];

  Plotly.animate(
    gd,
    {
      layout: {
        "xaxis.range": xrange,
        "yaxis.range": yrange
      },
      traces: [0],
      data: [
        {
          "marker.opacity": opacity
        }
      ]
    },
    {
      frame: {
        duration: 500,
        redraw: false,
      },
      transition: {
        easing: "cubic-in-out",
        duration: 500
      }
    }
  );
});
