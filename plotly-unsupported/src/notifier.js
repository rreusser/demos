'use strict';

var Plotly = require('plotly.js');
var h = require('h');
var gd = window.gd = h('div');
document.body.appendChild(gd);
var controls = h('div');
document.body.appendChild(controls);

function PlotlyNotifier (gd) {
    // These could be prototype methods, but so that we don't have to worry
    // about binding in case something tries to bind, we'll create methods
    // directly

    // Accept either a string id or otherwise interpret gd as the div itself:
    gd = typeof gd === 'string' ? document.getElementById(gd) : gd;

    function computePerturbedFrames () {
        var traceIndices = Object.keys(activeNotifications).map(parseFloat);
        var newFrame = {data: [], traces: []};
        var restoreFrame = {data: [], traces: []};

        for (var i = 0; i < traceIndices.length; i++) {
            var traceIdx = traceIndices[i];

            // Create animation data for *this trace*:
            var newData = {marker: {}};
            var restoreData = {marker: {}};

            // Add info for this trace to the frames:
            newFrame.traces.push(traceIdx);
            newFrame.data.push(newData);
            restoreFrame.traces.push(traceIdx);
            restoreFrame.data.push(restoreData);

            // Notifications for this point:
            var ptNotifs = activeNotifications[traceIdx];
            var ptIdxs = Object.keys(ptNotifs).map(parseFloat);

            var fullData = gd._fullData[traceIdx];

            // Create arrays to store new, perturbed sizes for each point:
            var newSizes = [];
            var newBorderWidths = [];
            var newBorderColors = [];

            // Arrays that will hold the original state to which we return after each pulse:
            var restoreSizes = [];
            var restoreBorderWidths = [];
            var restoreBorderColors = [];

            // Compute everything, but just hold a flag to denote whether they actually
            // need to be set:
            var hasSizeNotif = false;
            var hasBorderNotif = false;

            // Full default-supplied arrays (or values). With lots of sanity-checking for
            // non-existent values:
            var fullSizes = (fullData && fullData.marker && fullData.marker.size) ? fullData.marker.size : [];
            var fullBorderWidths = (fullData && fullData.marker && fullData.marker.line && fullData.marker.line.width) ? fullData.marker.line.width : [];
            var fullBorderColors = (fullData && fullData.marker && fullData.marker.line && fullData.marker.line.color) ? fullData.marker.line.color : [];

            // Get the size of a point, with sanity-checking to ensure it works
            // with either arrays or simple values:
            function getSize(idx) {
                var sz = Array.isArray(fullSizes) ? fullSizes[idx] : fullSizes
                sz = sz === undefined || sz === null ? 1 : sz;
                return parseFloat(sz);
            }

            // Ditto, border width:
            function getBorderWidth(idx) {
                var sz = Array.isArray(fullBorderWidths) ? fullBorderWidths[idx] : fullBorderWidths
                sz = sz === undefined || sz === null ? 0 : sz;
                return parseFloat(sz);
            }

            // And border color:
            function getBorderColor(idx) {
                var col = Array.isArray(fullBorderColors) ? fullBorderColors[idx] : fullBorderColors
                col = col === undefined || col === null ? '#fff' : col;
                return col;
            }

            // Loop through all points for this trace and store either the desired,
            // perturbed value or just the currently-specified value:
            for (var j = 0; j < fullData.x.length; j++) {
                restoreSizes[j] = getSize(j);
                restoreBorderWidths[j] = getBorderWidth(j);
                restoreBorderColors[j] = getBorderColor(j);

                // Check if there's an entry for notifications on this point:
                var hasProps = ptIdxs.indexOf(j) === -1;
                var ptProps = ptNotifs[j];

                // Check if there's a size notification:
                if (ptProps && ptProps.sizeactive) {
                    hasSizeNotif = true;
                    newSizes[j] = getSize(j) * ptProps.sizechange;
                } else {
                    newSizes[j] = getSize(j);
                }

                // Check if there's a border notification
                if (ptProps && ptProps.borderactive) {
                    hasBorderNotif = hasBorderNotif || ptProps.borderactive;
                    newBorderWidths[j] = ptProps.borderwidth;
                    newBorderColors[j] = ptProps.bordercolor;
                } else {
                    newBorderWidths[j] = getBorderWidth(j);
                    newBorderColors[j] = getBorderColor(j);
                }
            }

            // If there actually was a size notif, then set sizes for *all* points:
            if (hasSizeNotif) {
                newData.marker.size = newSizes;
                restoreData.marker.size = restoreSizes;
            }

            // If there actually was a size notif, then set borders for *all* points:
            if (hasBorderNotif) {
                newData.marker.line = {};
                restoreData.marker.line = {};
                newData.marker.line.width = newBorderWidths;
                restoreData.marker.line.width = restoreBorderWidths;
                newData.marker.line.color = newBorderColors;
                restoreData.marker.line.color = restoreBorderColors;
            }
        }

        // Return two frames: one that perturbs the points, and a second frame that
        // restores the view to its original state. Important note: we only ever compute
        // this perturbation *between* pulses so that everything stays nice and correct.
        //
        // If the plot is restyled, notifications should be stopped first.
        return [newFrame, restoreFrame];
    }

    var pulsing = false;
    var needsstop = false;

    function start () {
        pulsing = true;
        function doPulse () {
            return Plotly.animate(gd, computePerturbedFrames(), {
                frame: {redraw: false},
                mode: 'immediate',
            }).then(function () {
                if (needsstop) {
                    needsstop = false;
                    pulsing = false;
                    return;
                }
                return doPulse();
            });
        }

        doPulse();
    }

    // Manage what's active:
    var activeNotifications = {};

    // Start a new notification:
    this.start = function (trace, index, opts) {
        opts = opts || {};

        // Default type is to animate the border:
        opts.type = opts.type === 'border' ? 'border' : 'size';

        // Border defaults:
        opts.bordercolor = opts.hasOwnProperty('bordercolor') ? opts.bordercolor : 'red';
        opts.borderwidth = opts.hasOwnProperty('borderwidth') ? opts.borderwidth : 5;

        opts.sizechange = opts.hasOwnProperty('sizechange') ? opts.sizechange : 1.1;

        // Get or create a trace notification entry:
        var t = activeNotifications[trace] = activeNotifications[trace] || {};

        // For this trace, get or create a point notification entry:
        var p = t[index] = t[index] || {};

        // Set this type active for the point:
        p[opts.type + 'active'] = true;

        // Apply the specified properties:
        if (opts.type === 'border') {
            p.bordercolor = opts.bordercolor;
            p.borderwidth = opts.borderwidth;
        } else if (opts.type === 'size') {
            p.sizechange = opts.sizechange;
        }

        if (!pulsing) {
            start();
        }
    };

    this.stop = function (trace, index, type) {
        var t = activeNotifications[trace];

        if (trace === undefined) {
            activeNotifications = {};
            needsstop = true;
            return;
        }

        if (!t) {
            checkForStop();
            return;
        }

        if (index === undefined) {
            delete activeNotifications[trace];
        }

        var p = t[index];

        if (!p) {
            checkForStop();
            return;
        }

        if (type) {
            delete p[type + 'active'];
        } else {
            delete t[index];
        }

        if (!p.borderactive && !p.sizeactive) {
            delete t[index];
        }

        if (Object.keys(t).length === 0) {
            delete activeNotifications[trace];
        }

        checkForStop();

        function checkForStop () {
            if (Object.keys(activeNotifications).length === 0) {
                needsstop = true;
            }
        }
    };
}

window.notifier = new PlotlyNotifier(gd);

Plotly.plot(gd, {
  data: [{
    x: [1, 2, 3],
    y: [2, 1, 3],
    mode: 'markers',
    marker: {
      size: [100, 200, 300],
      borderwidth: [1, 2, 3],
      sizeref: 3
    }
  }]
})


controls.innerHTML = `
  <button onclick="notifier.stop();">Stop all</button>
  <ul>
    <li>
      Point 1: <button onclick="notifier.stop(0, 0);">Stop Pt 1</button>
      <ul>
        <li>
          Border:
          <button onclick="notifier.start(0, 0, {type: 'border', borderwidth: 5, bordercolor: 'blue'});">Start</button>
          <button onclick="notifier.stop(0, 0, 'border');">Stop</button>
        </li>
        <li>
          Size:
          <button onclick="notifier.start(0, 0, {type: 'size', sizechange: 1.5});">Start</button>
          <button onclick="notifier.stop(0, 0, 'size');">Stop</button>
        </li>
      </ul>
    </li>
    <li>
      Point 2: <button onclick="notifier.stop(0, 1);">Stop Pt 2</button>
      <ul>
        <li>
          Border:
          <button onclick="notifier.start(0, 1, {type: 'border', borderwidth: 5, bordercolor: 'red'});">Start</button>
          <button onclick="notifier.stop(0, 1, 'border');">Stop</button>
        </li>
        <li>
          Size:
          <button onclick="notifier.start(0, 1, {type: 'size', sizechange: 1.5});">Start</button>
          <button onclick="notifier.stop(0, 1, 'size');">Stop</button>
        </li>
      </ul>
    </li>
    <li>
      Point 3: <button onclick="notifier.stop(0, 2);">Stop Pt 3</button>
      <ul>
        <li>
          Border:
          <button onclick="notifier.start(0, 2, {type: 'border', borderwidth: 5, bordercolor: 'red'});">Start</button>
          <button onclick="notifier.stop(0, 2, 'border');">Stop</button>
        </li>
        <li>
          Size:
          <button onclick="notifier.start(0, 2, {type: 'size', sizechange: 1.5});">Start</button>
          <button onclick="notifier.stop(0, 2, 'size');">Stop</button>
        </li>
      </ul>
    </li>
  </ul>
`;
