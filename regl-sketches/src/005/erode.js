const glslify = require('glslify');
const swap = require('./swap');

module.exports = function (regl) {
  // Update rain velocities:
  const updateRain = regl({
    vert: `
      precision mediump float;
      attribute vec2 xy;
      varying vec2 uv;
      void main () {
        uv = 0.5 * (xy + 1.0);
        gl_Position = vec4(xy, 0, 1);
      }
    `,
    frag: `
      precision mediump float;
      uniform sampler2D r0;
      uniform sampler2D y;
      uniform float dt, hx, hy, gravity, wind, maxVelocity, friction;
      varying vec2 uv;
      void main () {
        vec4 r = texture2D(r0, uv);
        vec2 rx = r.xy;
        vec2 rvel = r.zw;

        float z0 = texture2D(y, vec2(r.x, r.y)).z;
        float zn = texture2D(y, vec2(r.x, r.y + hy)).z;
        float zs = texture2D(y, vec2(r.x, r.y - hy)).z;
        float ze = texture2D(y, vec2(r.x + hx, r.y)).z;
        float zw = texture2D(y, vec2(r.x - hx, r.y)).z;

        vec2 grad = vec2((ze - zw) * 0.5 / hx, (zn - zs) * 0.5 / hy);

        vec2 fGrav = -grad * gravity;
        vec2 fFric = -rvel * friction;
        vec2 fWind = wind * z0 * vec2(1.0, 0.0);

        vec2 vNew = rvel + (fGrav + fFric + fWind) * dt;
        float vMag = length(vNew);
        vNew = normalize(vNew) * min(vMag, maxVelocity);

        gl_FragColor = vec4(rx + rvel * dt, vNew);
      }
    `,
    attributes: {xy: [[-4, -4], [0, 4], [4, -4]]},
    uniforms: {
      r0: regl.prop('r0'),
      y: regl.prop('y'),
      hx: (context, props) => 1.0 / props.y.width,
      hy: (context, props) => 1.0 / props.y.height,
    },
    depth: {enable: false},
    framebuffer: regl.prop('r1'),
    count: 3
  });

  const updateRainVars = regl({
    vert: `
      precision mediump float;
      attribute vec2 xy;
      varying vec2 uv;
      void main () {
        uv = 0.5 * (xy + 1.0);
        gl_Position = vec4(xy, 0, 1);
      }
    `,
    frag: glslify(`
      precision mediump float;
      #pragma glslify: snoise = require(glsl-noise/simplex/3d)
      uniform sampler2D r0, rv0, y;
      uniform float dt, hx, hy, gravity, restartThreshold, carveRate, carryingCapacity, evaporationTime, stratification;
      varying vec2 uv;
      void main () {
        vec4 r = texture2D(r0, uv);
        vec4 rv = texture2D(rv0, uv);
        vec4 pos = texture2D(y, r.xy);

        float life = rv.z;

        //float z0 = texture2D(y, r.xy).z;
        //float zn = texture2D(y, vec2(r.x, r.y + hy)).z;
        //float zs = texture2D(y, vec2(r.x, r.y - hy)).z;
        //float ze = texture2D(y, vec2(r.x + hx, r.y)).z;
        //float zw = texture2D(y, vec2(r.x - hx, r.y)).z;

        //float laplacian = (zn + zs - 2.0 * z0) / hy / hy + (ze + zw - 2.0 * z0) / hx / hx;
        //vec2 grad = vec2((ze - zw) * 0.5 / hx, (zn - zs) * 0.5 / hy);
        //float gradMag = length(grad);

        float prevFlow = rv.x;
        float v = length(r.zw);
        float dFlow = v * carveRate;
        //dFlow += laplacian * 0.0001;
        //float steepness = smoothstep(0.5, 0.0, gradMag);
        //dFlow += steepness * steepness * 0.05;

        //float noise = snoise(vec3(pos.x * 4.0, pos.y * 4.0, (pos.z - 0.4 * pos.x - 0.4 * pos.y) * 120.0));
        float noise = snoise(vec3(pos.x * 1.5, pos.y * 1.5, (pos.z - 0.4 * pos.x - 0.4 * pos.y) * 10.0));
        float strat = (1.0 - exp(-pos.z / 0.5)) * stratification;
        dFlow *= (1.0 - strat) + strat * (0.5 + 2.0 * noise);

        float decay = exp(-dt / evaporationTime * 3.0);
        float vavg = rv.w * decay + (1.0 - decay) * v;
        float stallFactor = 1.0 / (1.0 + 10.0 * vavg * vavg);

        float evaporation = exp(-dt / (evaporationTime * (1.0 - 0.5 * stallFactor)));

        float newFlow = prevFlow + dFlow * dt;
        newFlow = max(0.0, min(carryingCapacity, newFlow * evaporation));
        float carve = newFlow - prevFlow;


        bool restart = false;

        life = life * evaporation;

        if (life < restartThreshold) {
          life = 0.0;
        }

        float deposition = newFlow * smoothstep(restartThreshold + 0.4, restartThreshold, life);
        carve -= deposition;
        newFlow -= deposition;

        if (r.x < 0.0 || r.x > 1.0 || r.y < 0.0 || r.y > 1.0) {
          life = 0.0;
        }

        gl_FragColor = restart ? vec4(0.0, 0.0, 1.0, 0.0) : vec4(newFlow, carve, life, vavg);
      }
    `),
    attributes: {xy: [[-4, -4], [0, 4], [4, -4]]},
    uniforms: {
      r0: regl.prop('r0'),
      rv0: regl.prop('rv0'),
      y: regl.prop('y'),
      hx: (context, props) => 1.0 / props.y.width,
      hy: (context, props) => 1.0 / props.y.height,
    },
    depth: {enable: false},
    framebuffer: regl.prop('rv1'),
    count: 3
  });

  const computeDz = regl({
    vert: `
      precision mediump float;
      attribute vec2 xy;
      uniform sampler2D r0, rv0;
      uniform float brushSize;
      varying vec4 r;
      varying vec4 rv;
      void main () {
        r = texture2D(r0, xy);
        rv = texture2D(rv0, xy);
        vec2 uv = (r.xy - 0.5) * 2.0;
        gl_Position = vec4(uv, 0, 1);
        gl_PointSize = brushSize;
      }
    `,
    frag: `
      precision mediump float;
      varying vec4 r, rv;
      void main () {
        float intens = max(0.0, 1.0 - length(gl_PointCoord.xy - 0.5) / 0.5);
        gl_FragColor = vec4(-rv.y * intens, 0.0, 0.0, 1.0);
      }
    `,
    attributes: {
      xy: regl.prop('coords')
    },
    uniforms: {
      y: regl.prop('y'),
      r0: regl.prop('r'),
      rv0: regl.prop('rv'),
    },
    blend: {
      enable: true,
      func: {srcRGB: 'src alpha', srcAlpha: 1, dstRGB: 1, dstAlpha: 1},
      equation: {rgb: 'add', alpha: 'add'}
    },
    framebuffer: regl.prop('dz'),
    count: (context, props) => props.r.width * props.r.height,
    primitive: 'points',
  });

  const updateZ = regl({
    vert: `
      precision mediump float;
      attribute vec2 xy;
      varying vec2 uv;
      void main () {
        uv = 0.5 * (xy + 1.0);
        gl_Position = vec4(xy, 0, 1);
      }
    `,
    frag: `
      precision mediump float;
      uniform sampler2D y0;
      uniform sampler2D dz;
      uniform float dt, hx, hy, smoothing;
      varying vec2 uv;
      void main () {
        vec4 yval = texture2D(y0, uv);

        float z0 = texture2D(y0, uv).z;
        float zn = texture2D(y0, vec2(uv.x, uv.y + hy)).z;
        float zs = texture2D(y0, vec2(uv.x, uv.y - hy)).z;
        float ze = texture2D(y0, vec2(uv.x + hx, uv.y)).z;
        float zw = texture2D(y0, vec2(uv.x - hx, uv.y)).z;

        float laplacian = (zn + zs - 2.0 * z0) / hy / hy + (ze + zw - 2.0 * z0) / hx / hx;

        vec4 dyval = texture2D(dz, uv);

        gl_FragColor = vec4(
          yval.xy,
          yval.z + dyval.x + laplacian * dt * 0.00001 * smoothing,
          yval.w
        );
      }
    `,
    attributes: {xy: [[-4, -4], [0, 4], [4, -4]]},
    uniforms: {
      y0: regl.prop('y0'),
      dz: regl.prop('dz'),
      hx: (context, props) => 1.0 / props.y0.width,
      hy: (context, props) => 1.0 / props.y0.height,
    },
    depth: {enable: false},
    framebuffer: regl.prop('y1'),
    count: 3
  });

  const restartRain = regl({
    vert: `
      precision mediump float;
      attribute vec2 xy;
      varying vec2 uv;
      void main () {
        uv = 0.5 * (xy + 1.0);
        gl_Position = vec4(xy, 0, 1);
      }
    `,
    frag: glslify(`
      precision mediump float;
      #pragma glslify: random = require(glsl-random)

      uniform float t;
      uniform sampler2D rv0, r0;
      varying vec2 uv;
      void main () {
        //vec4 rvI = texture2D(rvInitial, uv);
        vec4 r = texture2D(r0, uv);
        vec4 rv = texture2D(rv0, uv);

        if (rv.z == 0.0 || r.x < 0.0 || r.x > 1.0 || r.y < 0.0 || r.y > 1.0) {
          gl_FragColor = vec4(
            random(uv + t),
            random(uv + t + 1.12345),
            0.0,
            0.0
          );
        } else {
          gl_FragColor = r;
        }
      }
    `),
    attributes: {xy: [[-4, -4], [0, 4], [4, -4]]},
    uniforms: {
      r0: regl.prop('r0'),
      rv0: regl.prop('rv0'),
    },
    depth: {enable: false},
    framebuffer: regl.prop('r1'),
    count: 3
  });

  const restartRainVars = regl({
    vert: `
      precision mediump float;
      attribute vec2 xy;
      varying vec2 uv;
      void main () {
        uv = 0.5 * (xy + 1.0);
        gl_Position = vec4(xy, 0, 1);
      }
    `,
    frag: `
      precision mediump float;
      uniform sampler2D rv0, r0;
      varying vec2 uv;
      void main () {
        vec4 r = texture2D(r0, uv);
        vec4 rv = texture2D(rv0, uv);

        if (rv.z == 0.0 || r.x < 0.0 || r.x > 1.0 || r.y < 0.0 || r.y > 1.0) {
          gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
        } else {
          gl_FragColor = rv;
        }
      }
    `,
    attributes: {xy: [[-4, -4], [0, 4], [4, -4]]},
    uniforms: {
      r0: regl.prop('r0'),
      rv0: regl.prop('rv0'),
    },
    depth: {enable: false},
    framebuffer: regl.prop('rv1'),
    count: 3
  });

  const globalUniforms = regl({
    uniforms: {
      t: () => t,
      dt: regl.prop('dt'),
      restartThreshold: regl.prop('restartThreshold'),
      gravity: regl.prop('gravity'),
      wind: regl.prop('wind'),
      maxVelocity: regl.prop('maxVelocity'),
      friction: regl.prop('friction'),
      carveRate: regl.prop('carveRate'),
      stratification: regl.prop('stratification'),
      smoothing: regl.prop('smoothing'),
      carryingCapacity: regl.prop('carryingCapacity'),
      evaporationTime: regl.prop('evaporationTime'),
      brushSize: regl.prop('brushSize'),
    }
  });

  let t = 0.0;

  return function (gridState, rainState, params) {
    globalUniforms(params, () => {
      updateRain({
        r0: rainState.r0,
        r1: rainState.r1,
        y: gridState.y0,
        rv0: rainState.rv0,
      });

      swap(rainState, 'r0', 'r1');

      updateRainVars({
        r0: rainState.r0,
        rv0: rainState.rv0,
        rv1: rainState.rv1,
        y: gridState.y0,
      });

      swap(rainState, 'rv0', 'rv1');

      gridState.dz.use(() => regl.clear({color: [0, 0, 0, 1], depth: 1}));

      computeDz({
        r: rainState.r0,
        rv: rainState.rv0,
        coords: rainState.coords,
        y: gridState.y0,
        dz: gridState.dz,
      });

      updateZ({
        y1: gridState.y1,
        y0: gridState.y0,
        dz: gridState.dz,
      });

      swap(gridState, 'y0', 'y1');

      restartRain({
        r0: rainState.r0,
        rv0: rainState.rv0,
        r1: rainState.r1,
      });

      restartRainVars({
        r0: rainState.r0,
        rv0: rainState.rv0,
        rv1: rainState.rv1,
      });

      swap(rainState, 'r0', 'r1');
      swap(rainState, 'rv0', 'rv1');
    });

    t += params.dt;
  }
}
