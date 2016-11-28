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

  function compute () {
    if (arguments.length - 1 !== invokeArgs.length) {
      fail('Number of arguments provided (' + arguments.length + ') does not equal number of arguments expected (' + (invokeArgs.length + 1) + ').');
    }

    var i;
    var props = {};

    // Set the destination fbo:
    props[parsedMap.destProp] = arguments[0];

    // Set the props:
    for (var i = 1; i < arguments.length; i++) {
      props[invokeArgs[i - 1]] = arguments[i];
    }

    op(props);
  }

  compute.destroy = function () {
    if (!op) return;
    op.destroy();
    op = null;
  }

  return compute;
};
