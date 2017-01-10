'use strict';

function fail (msg) {
  throw new Error('regl-gpgpu-parser:map: ' + msg);
}

module.exports = function (regl, parsedMap) {
  var attributes = {};
  attributes[parsedMap.attrName] = [[-4, -4], [4, -4], [0, 4]];

  var uniforms = {};
  var invokeArgs = parsedMap.invokeArgs;
  for (var i = 0; i < invokeArgs.length; i++) {
    uniforms[invokeArgs[i]] = regl.prop(invokeArgs[i]);
  }

  uniforms[parsedMap.duProp] = function (context) {
    return 1.0 / context.framebufferWidth;
  }

  uniforms[parsedMap.dvProp] = function (context) {
    return 1.0 / context.framebufferHeight;
  }

  var op = regl({
    frag: parsedMap.frag,
    vert: parsedMap.vert,
    framebuffer: regl.prop(parsedMap.destProp),
    attributes: attributes,
    uniforms: uniforms,
    depth: {
      enable: false
    },
    count: 3
  });

  function compute (args, reps) {
    if (args.length - 1 !== invokeArgs.length) {
      fail('Number of args provided (' + args.length + ') does not equal number of args expected (' + (invokeArgs.length + 1) + ').');
    }

    var i;
    var props = {};
    reps = reps || 1;

    for (var rep = 0; rep < reps; rep++) {
      // Set the destination fbo:
      props[parsedMap.destProp] = args[0];

      // Set the props:
      for (var i = 1; i < args.length; i++) {
        props[invokeArgs[i - 1]] = args[i];
      }

      op(props);

      if (parsedMap.permute) {
        var p = parsedMap.permute;
        var tmp = [];
        for (i = 0; i < p.length; i++) {
          tmp[i] = args[p[i]];
        }
        for (i = 0; i < p.length; i++) {
          args[i] = tmp[i];
        }
      }
    }
  }

  compute.destroy = function () {
    if (!op) return;
    op.destroy();
    op = null;
  }

  return compute;
};
