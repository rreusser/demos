const extend = require('xtend/mutable');
const glsl = require('glslify');
const bound = require('bound-points');
const extents = require('./extents');
const normals = require('normals');
const scale = require('gl-vec3/scale');
const length = require('gl-vec3/length');
const invert = require('gl-mat4/invert');
const normalize = require('gl-vec3/normalize');
const normalize2 = require('gl-vec2/normalize');
const colorString = require('color-string');

const regl = require('regl')({
  extensions: ['oes_texture_float', 'oes_element_index_uint'],
  pixelRatio: 1,
  onDone: (err, regl) => {
    if (err) return require('fail-nicely')(err);
    document.querySelector('canvas').addEventListener('mousewheel', e => e.preventDefault());
    run(regl);
  }
});

function run (regl) {
  const dragon = require('stanford-dragon/2');//require('icosphere')(3);
  dragon.normals = normals.vertexNormals(dragon.cells, dragon.positions);

  var model = {
    positions: regl.buffer(dragon.positions),
    cells: regl.elements(dragon.cells),
    count: dragon.cells.length * 3,
    normals: regl.buffer(dragon.normals),
    specular: 1.0
  };

  const h = 27.3;
  const rad = 120;
  const planePositions = [
      [-rad, h, -rad],
      [rad, h, -rad],
      [-rad, h, rad],
      [rad, h, rad],
      [-rad, h, -rad],
      [rad, h, -rad],
      [-rad, h + rad * 2, -rad],
      [rad, h + rad * 2, -rad],
      [-rad, h, -rad],
      [-rad, h, rad],
      [-rad, h + rad * 2, -rad],
      [-rad, h + rad * 2, rad],
      [-rad, h, rad],
      [rad, h, rad],
      [-rad, h + rad * 2, rad],
      [rad, h + rad * 2, rad],
      [rad, h, -rad],
      [rad, h, rad],
      [rad, h + rad * 2, -rad],
      [rad, h + rad * 2, rad],
  ];

  const plane = {
    positions: regl.buffer(planePositions),
    normals: regl.buffer([
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
      [0, 0, 1],
      [0, 0, 1],
      [0, 0, 1],
      [0, 0, 1],
      [1, 0, 0],
      [1, 0, 0],
      [1, 0, 0],
      [1, 0, 0],
      [0, 0, -1],
      [0, 0, -1],
      [0, 0, -1],
      [0, 0, -1],
      [-1, 0, 0],
      [-1, 0, 0],
      [-1, 0, 0],
      [-1, 0, 0],
    ]),
    cells: regl.elements([
      [0, 2, 1],
      [1, 2, 3],
      [4, 5, 6],
      [5, 7, 6],
      [8, 10, 9],
      [9, 10, 11],
      [12, 14, 13],
      [13, 14, 15],
      [16, 17, 18],
      [17, 19, 18],
    ]),
    count: 30,
    specular: 0.0
  };



  const lights = [{
    position: [-1000, 1000, 1000],
    color: [1, 0.9, 0.8]
  }, {
    position: [1000, 1000, 1000],
    color: [0.8, 1, 0.9]
  }, {
    position: [-500, 1000, -1000],
    color: [0.9, 0.8, 1]
  }];

  const ambient = [0.05, 0.05, 0.05];

  //var nearfar = extents(bound(model.positions), camera.eye);

  const camera = require('./camera')(regl, {
    distance: 200,
    center: [0, 60, 0],
    phi: 0.4,
    theta: 2.2,
    far: 700,
    near: 10
  });

  var params = {
    radius: 15.0,
    blur: 1.4,
    ssao: 1.0,
    exposure: 0.65,
    roughness: 0.5,
    fresnel: 2.0,
    diffuse: 0.9,
    specular: 4,
    modelColor: 'rgb(44, 45, 56)',
    planeColor: 'rgb(255, 255, 255)',
  };

  const setParams = regl({
    uniforms: {
      radius: regl.prop('radius'),
      blur: regl.prop('blur'),
      ssaoPower: regl.prop('ssao'),
      exposure: regl.prop('exposure'),
      roughness: regl.prop('roughness'),
      fresnel: regl.prop('fresnel'),
      diffuse: regl.prop('diffuse'),
      specular: regl.prop('specular'),
    }
  });

  require('./controls')([
    {type: 'range', label: 'radius', min: 1.0, max: 50.0, initial: params.radius, step: 0.1},
    {type: 'range', label: 'blur', min: 0.0, max: 8.0, initial: params.blur, step: 0.1},
    {type: 'range', label: 'ssao', min: 0.0, max: 2.0, initial: params.ssao, step: 0.1},
    {type: 'range', label: 'exposure', min: 0.0, max: 2.0, initial: params.exposure, step: 0.01},
    {type: 'range', label: 'diffuse', min: 0.0, max: 2.0, initial: params.diffuse, step: 0.01},
    {type: 'range', label: 'specular', min: 0.0, max: 10.0, initial: params.specular, step: 0.01},
    {type: 'range', label: 'roughness', min: 0.0, max: 2.0, initial: params.roughness, step: 0.01},
    {type: 'range', label: 'fresnel', min: 0.0, max: 2.0, initial: params.fresnel, step: 0.01},
    {type: 'color', label: 'modelColor', initial: params.modelColor},
    {type: 'color', label: 'planeColor', initial: params.planeColor},
  ], params);

  function createKernel (n) {
    var pts = [];
    for (var i = 0; i < n; i++) {
      var r = 2;
      while (r > 1.0) {
        var pt = [Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() + 0.04];
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
        var vec1 = normalize2([], [Math.random() - 0.5, Math.random() - 0.5]);
        var vec2 = normalize2([], [Math.random() - 0.5, Math.random() - 0.5]);
        pts.push(vec1.concat(vec2));
      }
      ret.push(pts);
    }
    return ret;
  }

  const ssaoDownsample = 1;
  const sampleCnt = 32;
  const rotationSize = 4;

  const sampleUniforms = {};
  const sampleKernel = createKernel(sampleCnt);
  for (let i = 0; i < sampleKernel.length; i++) {
    sampleUniforms['kernel[' + i + ']'] = sampleKernel[i];
  }

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

  const positionBuffer = regl.framebuffer({
    width: regl._gl.canvas.width,
    height: regl._gl.canvas.height,
    depth: true,
    colorFormat: 'rgba',
    colorType: 'float',
  });

  const ssaoBuffer = regl.framebuffer({
    color: regl.texture({
      min: 'linear',
      mag: 'linear',
      width: Math.round(regl._gl.canvas.width / ssaoDownsample),
      height: Math.round(regl._gl.canvas.height / ssaoDownsample),
    }),
    depth: false,
    colorFormat: 'rgba',
    colorType: 'uint8',
  });

  const ssaoBlurBuffer = regl.framebuffer({
    color: regl.texture({
      min: 'linear',
      mag: 'linear',
      width: Math.round(regl._gl.canvas.width / ssaoDownsample),
      height: Math.round(regl._gl.canvas.height / ssaoDownsample),
    }),
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
    cull: {enable: true},
    elements: regl.prop('cells'),
    count: (context, props) => props.count
  });

  const drawPosition = regl({
    vert: `
      precision mediump float;
      attribute vec3 position;
      uniform mat4 projection, view;
      varying vec3 p;
      void main () {
        p = position;
        gl_Position = projection * view * vec4(position, 1);
      }
    `,
    frag: `
      precision mediump float;
      varying vec3 p;
      void main () {
        gl_FragColor = vec4(p, 1);
      }
    `,
    attributes: {
      position: regl.prop('positions'),
      normal: regl.prop('normals'),
    },
    cull: {enable: true},
    elements: regl.prop('cells'),
    count: (ctx, props) => props.count
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
      uniform float modelSpecular;
      varying vec3 n;
      uniform vec3 diffuse;
      void main () {
        gl_FragColor = vec4(diffuse, modelSpecular);
      }
    `,
    attributes: {
      position: regl.prop('positions'),
      normal: regl.prop('normals'),
    },
    cull: {enable: true},
    uniforms: {
      diffuse: (ctx, props) => colorString.get.rgb(props.diffuse).slice(0, 3).map(i => i / 255),
      modelSpecular: regl.prop('specular'),
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
    frag: glsl(`
      precision mediump float;
      #pragma glslify: random = require(glsl-random)

      const int samples = 32;

      uniform sampler2D depthNormalBuf, diffuseBuf;//, rotationsBuf;
      uniform mat4 projection, view, iProj;
      uniform vec2 hRotBuf;
      uniform vec3 kernel[samples];
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
        //vec4 rotSample = texture2D(rotationsBuf, uv * hRotBuf);
        vec2 rotSample = normalize(vec2(
          random(gl_FragCoord.xy * hRotBuf) * 2.0 - 1.0,
          random((gl_FragCoord.xy + vec2(0.5)) * hRotBuf) * 2.0 - 1.0
        ));
        vec3 rotation = vec3(rotSample.xy, 0.0);
        vec3 tangent = normalize(rotation - normal * dot(rotation, normal));
        mat3 tbn = mat3(tangent, cross(normal, tangent), normal);
        float sampleDepth, rangeCheck;
        float occlusion = 0.0;
        float ddist, ddist2;
        for (int i = 0; i < samples; i++) {
          sample = origin.xyz + radius * tbn * kernel[i];
          offset = projection * vec4(sample, 1.0);
          offset.xy /= offset.w;
          offset.xy = offset.xy * 0.5 + 0.5;
          sampleDepth = valueToDepth(texture2D(depthNormalBuf, offset.xy).x);
          ddist = abs(origin.z - sampleDepth) * 0.5 / radius;
          occlusion += (sampleDepth >= sample.z ? 1.0 : 0.0) / (1.0 + ddist * ddist);
        }
        occlusion = 1.0 - (occlusion / float(samples));
        gl_FragColor = vec4(vec3(occlusion), depthNormal.x);
      }
    `),
    attributes: {xy: [[-4, -4], [0, 4], [4, -4]]},
    uniforms: Object.assign({
      depthNormalBuf: regl.prop('depthNormal'),
      //rotationsBuf: regl.prop('rotations'),
      iProj: ctx => invert([], ctx.projection),
      hRotBuf: (ctx, props) => [
        1.0 / ctx.framebufferWidth,
        1.0 / ctx.framebufferHeight
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
    frag: glsl(`
      precision mediump float;

      #pragma glslify: lambert = require(glsl-diffuse-lambert)
      #pragma glslify: cookTorranceSpec = require(glsl-specular-cook-torrance)
      #pragma glslify: blinnPhongSpec = require(glsl-specular-blinn-phong)

      struct Light {
        vec3 color;
        vec3 position;
      };

      uniform sampler2D diffuseBuf, ssaoBuf, depthNormalBuf, positionBuf;
      uniform vec3 eye;
      uniform vec3 ambient;
      uniform Light lights[3];
      uniform float ssaoPower, exposure, roughness, fresnel, diffuse, specular;
      varying vec2 uv;
      void main () {
        vec4 materialColor = texture2D(diffuseBuf, uv);
        vec3 position = texture2D(positionBuf, uv).xyz;
        vec3 normal = texture2D(depthNormalBuf, uv).yzw;

        vec3 viewDir = normalize(eye - position);

        float ssao = pow(texture2D(ssaoBuf, uv).x, ssaoPower);
        float spec = specular * materialColor.w;

        vec3 light0Dir = normalize(lights[0].position - position);
        vec3 light1Dir = normalize(lights[1].position - position);
        vec3 light2Dir = normalize(lights[2].position - position);


        vec3 diff =
          lights[0].color * (diffuse * lambert(light0Dir, normal)) +
          lights[1].color * (diffuse * lambert(light1Dir, normal)) +
          lights[2].color * (diffuse * lambert(light2Dir, normal));

        vec3 specColor =
          lights[0].color * (spec * cookTorranceSpec(light0Dir, viewDir, normal, roughness, fresnel)) +
          lights[1].color * (spec * cookTorranceSpec(light1Dir, viewDir, normal, roughness, fresnel)) +
          lights[2].color * (spec * cookTorranceSpec(light2Dir, viewDir, normal, roughness, fresnel));

        vec3 color = (ssao * exposure) * (ambient + materialColor.xyz * diff + specColor);

        gl_FragColor = vec4(color, 1);
      }
    `),
    attributes: {xy: [[-4, -4], [0, 4], [4, -4]]},
    uniforms: {
      diffuseBuf: regl.prop('diffuse'),
      positionBuf: regl.prop('position'),
      depthNormalBuf: regl.prop('depthNormal'),
      ssaoBuf: regl.prop('ssao'),
      ambient: regl.prop('ambient'),
      'lights[0].position': regl.prop('lights[0].position'),
      'lights[0].color': regl.prop('lights[0].color'),
      'lights[1].position': regl.prop('lights[1].position'),
      'lights[1].color': regl.prop('lights[1].color'),
      'lights[2].position': regl.prop('lights[2].position'),
      'lights[2].color': regl.prop('lights[2].color'),
    },
    depth: {enable: false},
    count: 3
  });

  const loop = regl.frame(({tick}) => {
    //if (tick % 60 !== 1) return;
    try {
      setParams(params, () => {
        camera(() => {
          depthNormalBuffer.use(() => {
            regl.clear({color: [0, 0, 0, 0], depth: 1});
            drawModelDepthAndNormal(model);
            drawModelDepthAndNormal(plane);
          });

          diffuseBuffer.use(() => {
            regl.clear({color: [0, 0, 0, 0], depth: 1});
            drawDiffuse(extend(model, {diffuse: params.modelColor}));
            drawDiffuse(extend(plane, {diffuse: params.planeColor}));
          });

          positionBuffer.use(() => {
            regl.clear({color: [0, 0, 0, 0], depth: 1});
            drawPosition(model);
            drawPosition(plane);
          });

          ssaoBuffer.use(() => {
            drawSSAO({
              diffuse: diffuseBuffer,
              depthNormal: depthNormalBuffer,
              rotations: rotationsBuffer,
            });
          });

          if (params.blur > 0.001) {
            ssaoBlurBuffer.use(() => {
              blurSSAO({ssao: ssaoBuffer});
            });
          }

          deferredRender({
            diffuse: diffuseBuffer,
            position: positionBuffer,
            depthNormal: depthNormalBuffer,
            ssao: params.blur > 0.001? ssaoBlurBuffer : ssaoBuffer,
            lights: lights,
            ambient: ambient,
          });
        });
      });
    } catch (err) {
      loop.cancel();
      throw err;
    }
  });
}
