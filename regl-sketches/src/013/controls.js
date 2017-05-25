var controlPanel = require('control-panel');
var EventEmitter = require('event-emitter')
var extend = require('xtend/mutable')

module.exports = function (state) {
  var emitter = new EventEmitter();

  controlPanel([
    {type: 'range', label: 'border', min: 0, max: 100, steps: 100, initial: state.border},
    {type: 'range', label: 'aspectRatio', min: 0, max: 2, steps: 100, initial: state.aspectRatio}
  ]).on('input', function (data) {
    extend(state, data);
    emitter.emit('input');
  });

  return {
    state: state,
    on: emitter.on.bind(emitter),
    off: emitter.off.bind(emitter)
  };
}
