const quads = require('./quads');
const tessellate = require('./tessellate');
const glslify = require('glslify');

module.exports = function (regl) {
  let nu = 72;
  let nv = 48;
  const torusQuads = quads(
    (pu, pv) => {
      let u = pu * Math.PI;
      let v = pv * Math.PI * 2;
      let cu = Math.cos(u)
      let cu2 = cu * cu;
      let cu3 = cu2 * cu;
      let cu4 = cu2 * cu2;
      let cu5 = cu3 * cu2;
      let cu6 = cu3 * cu3;
      let cu7 = cu4 * cu3;
      let su = Math.sin(u)
      let cv = Math.cos(v)
      let sv = Math.sin(v)
      return [
        -2/15 * cu * (3 * cv - 30 * su + 90 * cu4 * su
        - 60 * cu6 * su + 5 * cu * cv * su),
        -1/15 * su * (3 * cv - 3 * cu2 * cv - 48 * cu4 * cv + 48 * cu6
        * cv - 60 * su + 5 * cu * cv * su - 5 * cu3 * cv * su - 80
        * cu5 * cv * su + 80 * cu7 * cv * su) - 2,
        2/15 * (3 + 5 * cu * su) * sv
      ].map(x => x * 3)
    },
    nu, nv,
    true,
    false, false,
    true, true,
    {uv: (u, v) => [u * nu, v * nv]}
  );

  const torus = tessellate(
    torusQuads.cells,
    torusQuads.positions,
    {uv: torusQuads.uv, normals: torusQuads.normals}
  );

  const drawTorus = regl({
    vert: glslify(`
      precision mediump float;

      attribute vec3 position;
      attribute vec3 normal;
      attribute vec2 auv;
      uniform mat4 projection, view;
      uniform vec3 eye;
      varying vec3 eyedir, n;
      varying vec2 uv;
      void main () {
        uv = auv;
        mat3 view3 = mat3(view);
        eyedir = view3 * normalize(position - eye);
        n = view3 * normalize(normal);

        gl_Position = projection * view * vec4(position, 1);
      }
    `),
    frag: glslify(`
      #extension GL_OES_standard_derivatives : enable

      precision mediump float;

      #pragma glslify: matcap = require(matcap)
      #pragma glslify: grid = require(glsl-solid-wireframe/cartesian/scaled)

      uniform float ugrid;
      uniform sampler2D texture;
      varying vec3 eyedir, n;
      varying vec2 uv;

      void main () {
        vec2 texuv = matcap(eyedir, n);
        vec3 color = texture2D(texture, texuv).xyz;
        color += (-0.1 * grid(uv, 1.0) + 0.1) * ugrid;
        gl_FragColor = vec4(color, 1);
      }
    `),
    uniforms: {
      texture: regl.prop('texture'),
      ugrid: regl.prop('grid')
    },
    attributes: {
      position: torus.positions,
      normal: torus.normals,
      auv: torus.uv,
    },
    elements: torus.cells,
    count: torus.cells.length * 3
  });

  return drawTorus;
};
