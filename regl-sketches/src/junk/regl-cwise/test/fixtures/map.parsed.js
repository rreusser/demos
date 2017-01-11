module.exports = {
  frag: `precision mediump float;
varying vec2 uv;
uniform vec2 du;
uniform vec2 dv;
uniform float a;
uniform sampler2D xTexture;
uniform sampler2D yTexture;
uniform sampler2D zTexture;
uniform vec2 z;
vec4 compute (float a, vec4 s, vec4 x, vec4 y, vec4 z, vec4 n, vec4 e, vec2 z, vec4 w) {
  return a * x + y;
}
void main () {
  vec4 s = texture2D(zTexture, uv + vec2(0.0, -1.00000000 * dv));
  vec4 x = texture2D(xTexture, uv);
  vec4 y = texture2D(yTexture, uv);
  vec4 z = texture2D(zTexture, uv);
  vec4 n = texture2D(zTexture, uv + vec2(0.0, 1.00000000 * dv));
  vec4 e = texture2D(zTexture, uv + vec2(1.00000000 * du, 0.0));
  vec4 w = texture2D(zTexture, uv + vec2(-1.00000000 * du, 0.0));
  gl_FragColor = compute(a, s, x, y, z, n, e, z, w);
}`,
  vert: `precision mediump float;
attribute vec2 xy;
varying vec2 uv;
void main () {
  uv = 0.5 * (xy + 1.0);
  gl_Position = vec4(xy, 0, 1);
}`,
  attrName: 'xy',
  destProp: 'dest',
  invokeArgs: ['a', 'xTexture', 'yTexture', 'zTexture', 'z']
};
