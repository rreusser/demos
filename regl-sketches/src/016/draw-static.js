module.exports = function (regl) {
  return regl({
    vert: `
      precision mediump float;

      attribute vec3 xyz, uvw;
      attribute float dir;
      uniform mat4 viewproj;
      uniform float aspect, lineWidth;
      varying float v;

      void main () {

        vec2 t = normalize((viewproj * vec4(uvw, 0)).yx);
        t.y = -t.y;
        t.x *= aspect;
        t *= lineWidth;

        vec4 screenpos = (viewproj * vec4(xyz, 1));
        screenpos /= screenpos.w;

        v = dir;

        gl_Position = screenpos + dir * vec4(t, 0, 0);

      }
    `,
    frag: `
      precision mediump float;
      uniform vec3 color;
      uniform float lineHalfWidthPixels;
      varying float v;

      void main () {
        gl_FragColor = vec4(color, clamp((1.0 - 2.0 * abs((0.5 + 0.5 * v) - 0.5)) * lineHalfWidthPixels, 0.0, 1.0));
      }
    `,
    depth: {enable: false},
    blend: {
      enable: true,
      func: {
        srcRGB: 'src alpha',
        srcAlpha: 1,
        dstRGB: 'one minus src alpha',
        dstAlpha: 1
      },
      equation: {
        rgb: 'add',
        alpha: 'add'
      },
    },
    attributes: {
      xyz: regl.prop('xyz'),
      uvw: regl.prop('uvw'),
      dir: regl.prop('dir'),
    },
    uniforms: {
      color: regl.prop('color')
    },
    primitive: 'triangles',
    elements: regl.prop('els'),
    count: regl.prop('count')
  });
};

