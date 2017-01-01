module.exports = function (regl) {
  return regl({
    vert: `
      precision mediump float;
      uniform sampler2D y;
      uniform sampler2D r;
      uniform mat4 projection, view;
      attribute vec2 xy;
      varying vec2 uv;
      uniform vec3 scale;
      varying float life;
      void main () {
        uv = xy;
        vec3 rp = texture2D(r, xy).xyz;
        vec3 p = texture2D(y, rp.xy).xyz * scale;
        vec3 srp = (rp * 2.0 - 1.0) * scale;
        gl_Position = projection * view * vec4(srp.x, srp.y, p.z + 0.01, 1);
        gl_PointSize = 4.0;
      }
    `,
    frag: `
      precision mediump float;
      varying vec2 uv;
      uniform sampler2D rv;
      uniform float alpha;
      void main () {
        float life = texture2D(rv, uv).z;
        gl_FragColor = vec4(0.5, 0.7, 1.0, alpha * life);
      }
    `,
    blend: {
      enable: true,
      func: {srcRGB: 'src alpha', srcAlpha: 1, dstRGB: 1, dstAlpha: 1},
      equation: {rgb: 'add', alpha: 'add'}
    },
    attributes: {
      xy: regl.prop('coords'),
    },
    uniforms: {
      y: regl.prop('y'),
      r: regl.prop('r'),
      rv: regl.prop('rv'),
      alpha: (context, props) => Math.sqrt(128 * 128 / props.r.width / props.r.height) * 0.5
    },
    depth: {
      enable: true,
      mask: true,
    },
    count: (context, props) => props.r.width * props.r.height,
    primitive: 'points'
  });
}
