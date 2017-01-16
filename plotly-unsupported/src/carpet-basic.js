var h = require('h');
var Plotly = require('plotly.js');

var gd = window.gd = h('div');
document.body.appendChild(gd);

Plotly.plot(gd, {
  data: [{
    carpetid: 'c',
    a: [4, 4, 4, 5, 5, 5, 6, 6, 6],
    b: [1, 2, 3, 1, 2, 3, 1, 2, 3],
    y: [2, 3, 4, 5, 6, 7, 8, 9, 10],
    cheaterslope: 2,
    type: 'carpet',
    aaxis: {
      minorgridcount: 10,
      cheatertype: 'value',
      tickmode: 'array',
    },
    baxis: {
      minorgridcount: 10,
      cheatertype: 'value',
      tickmode: 'array',
    },
  }]
});
