#pragma glslify: random = require(glsl-random)

uniform float rayleighTaylor;

vec3 u0 (vec2 xy) {
  // Rayleigh-Taylor instability:

  return rayleighTaylor * (
    vec3(
      0.0,
      0.0,
      smoothstep(0.5, -0.5,
        0.12 * random(xy) +
        0.22 * sin(xy.x * 3.14159 * 2.0) +
        xy.y / 0.03
      ) * 10.0
    )
  ) +
  (1.0 - rayleighTaylor) * (
    vec3(
      4.0 * (-1.0 + 2.0 * smoothstep( 0.1, -0.1,
        0.0 * random(xy) +
        0.22 * sin(xy.x * 3.14159 * 16.0) +
        xy.y / 0.03
      )),
      0.0,
      xy.y > 0.0 ? 0.0 : 10.0
    )
  );

  //return vec3(0.0, 0.0, smoothstep(0.5, -0.5, 0.2 * sin(xy.x * 8109250.0) + xy.y / 0.02) * 10.0);
  //vec2 r = xy - vec2(0.0, -0.75);
  //float r2 = dot(r, r);
  //return vec3(0.0, 0.0, 100.0 / (1.0 + 400.0 * r2));
}

#pragma glslify: export(u0)
