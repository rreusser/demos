const extend = require('xtend/mutable');
const glsl = require('glslify');
const bound = require('bound-points');
const extents = require('./extents');
const normals = require('normals');
const scale = require('gl-vec3/scale');
const length = require('gl-vec3/length');
const invert = require('gl-mat4/invert');
const normalize = require('gl-vec3/normalize');

const regl = require('regl')({
  extensions: ['oes_texture_float'],
  pixelRatio: 1,
  onDone: (err, regl) => {
    if (err) return require('fail-nicely')(err);
    document.querySelector('canvas').addEventListener('mousewheel', e => e.preventDefault());
    run(regl);
  }
});

function run (regl) {
  const dragon = require('stanford-dragon/3');//require('icosphere')(3);
  dragon.normals = normals.vertexNormals(dragon.cells, dragon.positions);

  const camera = require('./camera')(regl, {
    distance: 200,
    center: [0, 60, 0],
    phi: 0.5,
    theta: 1.5,
    far: 1000,
    near: 0.1
  });

  var params = {
    radius: 15.0,
    blur: 1.0,
  };

  const setParams = regl({
    uniforms: {
      radius: regl.prop('radius'),
      blur: regl.prop('blur')
    }
  });

  require('./controls')([
    {type: 'range', label: 'radius', min: 0.0, max: 50.0, initial: params.radius, step: 0.1},
    {type: 'range', label: 'blur', min: 0.0, max: 8.0, initial: params.blur, step: 0.1}
  ], params);

  var bounds = bound(dragon.positions);
  var nearfar = extents(bound(dragon.positions), camera.eye);

  var model = {
    positions: regl.buffer(dragon.positions),
    cells: regl.elements(dragon.cells),
    count: dragon.cells.length * 3,
    normals: regl.buffer(dragon.normals)
  };

  function createKernel (n) {
    var pts = [];
    for (var i = 0; i < n; i++) {
      var r = 2;
      while (r > 1.0) {
        var pt = [Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random()];
        r = length(pt);
      }
      pt = scale([], normalize([], pt), 0.1 + 0.9 * Math.pow(i / (n - 1), 2));
      pts.push(pt);
    }
    return pts;
  }

  function createRotations (n) {
    var ret = [];
    for (i = 0; i < n; i++) {
      var pts = [];
      for (j = 0; j < n; j++) {
        pts.push(normalize([], [Math.random(), Math.random(), 0]).concat([0]));
      }
      ret.push(pts);
    }
    return ret;
  }

  const sampleUniforms = {};
  const sampleKernel = createKernel(64);
  for (let i = 0; i < sampleKernel.length; i++) {
    sampleUniforms['kernel[' + i + ']'] = sampleKernel[i];
  }

  const rotationSize = 4;
  const rotationsBuffer = regl.texture({
    format: 'rgba',
    data: createRotations(rotationSize),
    width: rotationSize,
    height: rotationSize,
    type: 'float',
    wrapS: 'repeat',
    wrapT: 'repeat'
  });

  const depthNormalBuffer = regl.framebuffer({
    width: regl._gl.canvas.width,
    height: regl._gl.canvas.height,
    depth: true,
    colorFormat: 'rgba',
    colorType: 'float',
  });

  const diffuseBuffer = regl.framebuffer({
    width: regl._gl.canvas.width,
    height: regl._gl.canvas.height,
    depth: true,
    colorFormat: 'rgba',
    colorType: 'uint8',
  });

  const ssaoBuffer = regl.framebuffer({
    width: regl._gl.canvas.width,
    height: regl._gl.canvas.height,
    texture: regl.texture({
      min: 'linear',
      mag: 'linear'
    }),
    depth: false,
    colorFormat: 'rgba',
    colorType: 'uint8',
  });

  const ssaoBlurBuffer = regl.framebuffer({
    width: regl._gl.canvas.width,
    height: regl._gl.canvas.height,
    depth: false,
    colorFormat: 'rgba',
    colorType: 'uint8',
  });

  const drawModelDepthAndNormal = regl({
    vert: `
      precision mediump float;
      attribute vec3 position, normal;
      varying vec3 n;
      uniform mat4 projection, view;
      void main () {
        n = normal;
        gl_Position = projection * view * vec4(position, 1);
      }
    `,
    frag: `
      precision mediump float;
      varying vec3 n;
      void main () {
        gl_FragColor = vec4(gl_FragCoord.z, n);
      }
    `,
    attributes: {
      position: regl.prop('positions'),
      normal: regl.prop('normals'),
    },
    elements: regl.prop('cells'),
    count: (context, props) => props.count
  });

  const drawDiffuse = regl({
    vert: `
      precision mediump float;
      attribute vec3 position, normal;
      uniform mat4 projection, view;
      varying vec3 n;
      void main () {
        n = normal;
        gl_Position = projection * view * vec4(position, 1);
      }
    `,
    frag: `
      precision mediump float;
      varying vec3 n;
      void main () {
        gl_FragColor = vec4(1);
      }
    `,
    attributes: {
      position: regl.prop('positions'),
      normal: regl.prop('normals')
    },
    elements: regl.prop('cells'),
    count: (ctx, props) => props.count
  });

  const drawSSAO = regl({
    vert: `
      precision mediump float;
      attribute vec2 xy;
      varying vec2 uv;
      void main () {
        uv = 0.5 * (1.0 + xy);
        gl_Position = vec4(xy, 0, 1);
      }
    `,
    frag: `
      precision mediump float;
      uniform sampler2D depthNormalBuf, diffuseBuf, rotationsBuf;
      uniform mat4 projection, view, iProj;
      uniform vec2 hRotBuf;
      uniform vec3 kernel[64];
      uniform float radius, near, far;
      varying vec2 uv;

      float valueToDepth (float value) {
        return -projection[3].z / (projection[2].z + 2.0 * value - 1.0);
      }

      void main () {
        vec3 sample;
        vec4 offset;
        vec4 depthNormal = texture2D(depthNormalBuf, uv);
        vec3 normal = (view * vec4(depthNormal.yzw, 0)).xyz;
        vec4 origin = iProj * vec4(2.0 * uv - 1.0, -1.0 + 2.0 * depthNormal.x, 1.0);
        origin /= origin.w;
        vec3 rotation = vec3(normalize(texture2D(rotationsBuf, uv * hRotBuf).xy), 0.0);
        vec3 tangent = normalize(rotation - normal * dot(rotation, normal));
        mat3 tbn = mat3(tangent, cross(normal, tangent), normal);
        float sampleDepth, rangeCheck;
        float occlusion = 0.0;
        for (int i = 0; i < 64; i++) {
          sample = origin.xyz + radius * tbn * kernel[i];
          offset = projection * vec4(sample, 1.0);
          offset.xy /= offset.w;
          offset.xy = offset.xy * 0.5 + 0.5;
          sampleDepth = valueToDepth(texture2D(depthNormalBuf, offset.xy).x);
          rangeCheck = abs(origin.z - sampleDepth) < radius ? 1.0 : 0.0;
          occlusion += (sampleDepth >= sample.z ? 1.0 : 0.0) * rangeCheck;
        }
        occlusion = 1.0 - (occlusion / 64.0);
        gl_FragColor = vec4(vec3(occlusion), depthNormal.x);
      }
    `,
    attributes: {xy: [[-4, -4], [0, 4], [4, -4]]},
    uniforms: Object.assign({
      depthNormalBuf: regl.prop('depthNormal'),
      rotationsBuf: regl.prop('rotations'),
      iProj: ctx => invert([], ctx.projection),
      hRotBuf: (ctx, props) => [
        ctx.framebufferWidth / props.rotations.width,
        ctx.framebufferHeight / props.rotations.height
      ]
    }, sampleUniforms),
    depth: {enable: false},
    count: 3
  });

  const blurSSAO = regl({
    vert: `
      precision mediump float;
      attribute vec2 xy;
      varying vec2 uv;
      void main () {
        uv = 0.5 * (1.0 + xy);
        gl_Position = vec4(xy, 0, 1);
      }
    `,
    frag: `
      precision mediump float;
      uniform sampler2D ssaoBuf;
      varying vec2 uv;
      uniform vec2 h;
      uniform float blur;
      void main () {
        float use;
        float result = 0.0;
        float cnt = 0.0;
        for (float i = -1.0; i <= 1.1; i += 0.5) {
          for (float j = -1.0; j <= 1.1; j += 0.5) {
            vec4 value = texture2D(ssaoBuf, uv + vec2(h.x * i, h.y * j) * blur);
            use = value.w == 0.0 ? 0.0 : 1.0;
            result += value.x * use;
            cnt += use;
          }
        }
        float value = result / max(cnt, 1.0);
        gl_FragColor = vec4(vec3(value), 1);
      }
    `,
    attributes: {xy: [[-4, -4], [0, 4], [4, -4]]},
    uniforms: {
      ssaoBuf: regl.prop('ssao'),
      h: ctx => [1.0 / ctx.framebufferWidth, 1.0 / ctx.framebufferHeight]
    },
    depth: {enable: false},
    count: 3
  });

  const deferredRender = regl({
    vert: `
      precision mediump float;
      attribute vec2 xy;
      varying vec2 uv;
      void main () {
        uv = 0.5 * (1.0 + xy);
        gl_Position = vec4(xy, 0, 1);
      }
    `,
    frag: `
      precision mediump float;
      uniform sampler2D diffuseBuf, ssaoBuf;
      varying vec2 uv;
      void main () {
        vec3 diffuse = texture2D(diffuseBuf, uv).xyz;
        float ssao = texture2D(ssaoBuf, uv).x;
        gl_FragColor = vec4(diffuse * ssao, 1);
      }
    `,
    attributes: {xy: [[-4, -4], [0, 4], [4, -4]]},
    uniforms: {
      diffuseBuf: regl.prop('diffuse'),
      ssaoBuf: regl.prop('ssao')
    },
    depth: {enable: false},
    count: 3
  });

  const loop = regl.frame(({tick}) => {
    try {
      setParams(params, () => {
        camera(() => {
          depthNormalBuffer.use(() => {
            regl.clear({color: [0, 0, 0, 0], depth: 1});
            drawModelDepthAndNormal(model);
          });

          diffuseBuffer.use(() => {
            regl.clear({color: [0, 0, 0, 0], depth: 1});
            drawDiffuse(model);
          });

          ssaoBuffer.use(() => {
            drawSSAO({
              diffuse: diffuseBuffer,
              depthNormal: depthNormalBuffer,
              rotations: rotationsBuffer,
            });
          });

          ssaoBlurBuffer.use(() => {
            blurSSAO({ssao: ssaoBuffer});
          });

          deferredRender({
            diffuse: diffuseBuffer,
            ssao: ssaoBlurBuffer
          });
        });
      });
    } catch (err) {
      loop.cancel();
      throw err;
    }
  });
}
