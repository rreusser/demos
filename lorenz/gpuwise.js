var isTypedArray = require('is-typedarray');
var parse = require('./parse');

module.exports = function (regl, baseSize) {
  var wh = Math.ceil(Math.sqrt(baseSize));

  function variable (input) {
    var n, data, tex, fbo;

    if (isTypedArray(input)) {
      data = input;
      n = data.length / 4;
    } else if (typeof input === 'function') {
      n = wh * wh;
      data = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) {
        var value = input(i);
        if (Array.isArray(value)) {
          for (let j = Math.min(4, value.length); j >= 0; j--) {
            data[4 * i + j] = value[j];
          }
        } else {
          data[4 * i] = value;
          data[4 * i + 1] = value;
          data[4 * i + 2] = value;
          data[4 * i + 3] = value;
        }
      }
    } else {
      n = wh * wh;
      data = new Float32Array(n * 4);
    }

    tex = regl.texture({
      width: wh,
      height: wh,
      data: data
    });

    function getFramebuffer () {
      return fbo === undefined ?
        regl.framebuffer({
          color: tex,
          colorFormat: 'rgba',
          colorType: 'float',
        }) :
        fbo;
    }

    // For the sake of a nice API:
    function getTexture () {
      return tex;
    }

    function read () {
      let a;
      getFramebuffer().use(() => a = regl.read());
      if (a.length !== baseSize * 4) {
        return a.subarray(0, baseSize * 4);
      } else {
        return a;
      }
    }

    function destroy () {
      tex.destroy();
      if (fbo) {
        fbo.destroy();
      }
    }

    return {
      read: read,
      getTexture: getTexture,
      getFramebuffer: getFramebuffer,
      destroy: destroy
    }
  }

  function operation (params) {
    let i;

    let args = parse(params.body);

    let samplerDefs = [];
    let samplerEvals = [];
    let uniformDefs = [];
    let argList = [];
    let uniforms = {};

    for (i = 0; i < args.length; i++) {
      var arg = args[i];
      arg.kind = params.args[i];
      argList.push(arg.name);
      if (arg.kind === 'array') {
        arg.uniformName = arg.name + 'Texture';
        samplerDefs.push(`uniform sampler2D ${arg.uniformName};`);
        samplerEvals.push(`vec4 ${arg.name} = texture2D(${arg.uniformName}, texCoord);`);
      } else {
        arg.uniformName = arg.name;
        uniformDefs.push(`uniform ${arg.type} ${arg.name};`);
        uniforms[arg.name] = regl.prop(arg.name);
      }
      uniforms[arg.uniformName] = regl.prop(arg.uniformName);
    }

    let obj = {
      vert: `
        precision mediump float;
        attribute vec2 pos;
        varying vec2 texCoord;
        void main() {
          texCoord = 0.5 + 0.5 * pos;
          gl_Position = vec4(pos, 0, 1);
        }
      `,
      frag: `
        precision mediump float;
        varying vec2 texCoord;
        ${samplerDefs}
        ${uniformDefs}
        ${params.body}
        void main () {
          ${samplerEvals}
          gl_FragColor = compute(${argList.join(', ')});
        }
      `,
      attributes: {pos: [[-4, -4], [4, -4], [0, 4]]},
      uniforms: uniforms,
      framebuffer: regl.prop('__destinationFBO'),
      depth: {enable: false},
      count: 3
    };

    let op = regl(obj);
    return function (out) {
      var params = {__destinationFBO: out.getFramebuffer()};
      for (i = 1; i < arguments.length; i++) {
        var arg = args[i - 1];
        if (arg.kind === 'array') {
          params[arg.uniformName] = arguments[i].getTexture();
        } else {
          params[arg.uniformName] = arguments[i];
        }
      }
      return op(params);
    }
  }

  return {
    width: wh,
    height: wh,
    variable: variable,
    operation: operation
  }
};
