const glslify = require('glslify');

module.exports = function (regl) {
  return regl({
    vert: glslify(`
      #pragma glslify: toCartesian = require(./glsl-spherical-coordinates/to-cartesian)
      #pragma glslify: flamm = require(./flamms-paraboloid)

      precision mediump float;
      attribute vec2 xy;
      uniform sampler2D y;
      uniform mat4 view, projection;
      uniform vec3 eye;
      uniform float maxLife;
      uniform float rs, paraboloid;
      varying float td;
      varying float life;
      varying float r;
      void main () {
        vec4 pos = texture2D(y, xy);
        life = smoothstep(maxLife, maxLife * 0.9, pos.w);
        r = pos.x;
        vec3 xyz = toCartesian(pos.xyz);
        xyz.z *= (1.0 - paraboloid);
        float offset = flamm(rs, 20.0);
        xyz.z += paraboloid * (flamm(rs, r) - offset);
        xyz.z += ((eye.z + offset) > flamm(rs, length(eye.xy)) ? 0.1 : -0.1) * paraboloid;
        gl_Position = projection * view * vec4(xyz, 1);
        gl_PointSize = 2.0;
      }
    `),
    frag: `
      precision mediump float;
      uniform float rs;
      uniform float alpha;
      varying float life;
      varying float r;
      void main () {
        float gam = 1.0 - rs / r;
        float redshift = gam;
        gl_FragColor = vec4(1.0, life * redshift, life * redshift, alpha * life * (0.3 + 0.8 * redshift));
      }
    `,
    attributes: {xy: regl.prop('texcoords')},
    uniforms: {
      y: regl.prop('data'),
      rs: regl.prop('rs'),
      alpha: regl.prop('alpha'),
      maxLife: regl.prop('maxLife'),
      paraboloid: regl.prop('paraboloid')
    },
    depth: {
      enable: true, //(context, props) => props.paraboloid > 1e-4 ? true : false,
      mask: true
    },
    blend: {
      enable: true,
      func: {srcRGB: 'src alpha', srcAlpha: 1, dstRGB: 1, dstAlpha: 1},
      equation: {rgb: 'add', alpha: 'add'}
    },
    primitive: 'points',
    count: (context, props) => props.data.width * props.data.height
  });
};
