var h = require('h');
require('insert-css')(`
html, body {
  padding: 0;
  margin: 0;
}
`);
var Plotly = require('plotly.js');

var gd = window.gd = h('div');
document.body.appendChild(gd);

Plotly.plot(gd, {
  "frames": [
    {
      "data": [
        {
          "y": [
            1.5
          ],
          "ysrc": "chelsea_lyn:13819:467b5f",
          "mode": "markers",
          "xsrc": "chelsea_lyn:13819:987567",
          "x": [
            1.5
          ]
        }
      ]
    },
    {
      "data": [
        {
          "y": [
            0.5
          ],
          "ysrc": "chelsea_lyn:13819:6d582b",
          "mode": "markers",
          "xsrc": "chelsea_lyn:13819:435d64",
          "x": [
            0.5
          ]
        }
      ]
    }
  ],
  "data": [
    {
      "ysrc": "chelsea_lyn:13819:6d582b",
      "xsrc": "chelsea_lyn:13819:435d64",
      "mode": "markers",
      "y": [
        0.5
      ],
      "x": [
        0.5
      ],
      "type": "scatter"
    }
  ],
  "layout": {
    "title": "Ping Pong Animation",
    "xaxis": {
      "range": [
        0,
        2
      ],
      "autorange": false
    },
    "updatemenus": [
      {
        "buttons": [
          {
            "args": [
              null
            ],
            "method": "animate",
            "label": "Play"
          }
        ],
        "type": "buttons",
        "showactive": false,
        "pad": {
          "r": 10,
          "t": 87
        }
      }
    ],
    "yaxis": {
      "range": [
        0,
        2
      ],
      "autorange": false
    }
  }
});
