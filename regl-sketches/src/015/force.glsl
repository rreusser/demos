uniform vec4 mouse;
uniform vec2 duv, der1;
uniform sampler2D vorticity;
uniform float buoyancy;

vec3 force (vec2 xy, vec2 uv, float T) {
  float wz = texture2D(vorticity, uv).x;
  float wn = texture2D(vorticity, vec2(uv.x, uv.y + duv.y)).x;
  float ws = texture2D(vorticity, vec2(uv.x, uv.y - duv.y)).x;
  float we = texture2D(vorticity, vec2(uv.x + duv.x, uv.y)).x;
  float ww = texture2D(vorticity, vec2(uv.x - duv.x, uv.y)).x;

  // Gradient of absolute value of omega:
  vec2 gaw = vec2(abs(we) - abs(ww), abs(wn) - abs(ws)) * der1;

  // Normalized:
  vec2 N = gaw / (length(gaw) + 1.0e-8);

  vec2 confinement = duv * vec2(N.y, -N.x) * wz;

  float r2 = length(xy - mouse.xy);
  float spot = 1.0 / (1.0 + 50.0 * r2);
  return vec3(
      0.0,
      T * buoyancy,
      0.0 //20000.0 * spot * (0.01 + 2.0 * length(mouse.zw)) - 1.0 * T
    ) +
    vec3(confinement * 150.0, 0.0)
    /*vec3(
      spot * mouse.zw * 100000.0,
      0.0
    )*/
  ;
}

#pragma glslify: export(force)
