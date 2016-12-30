#pragma glslify: snoise4 = require(glsl-noise/simplex/4d)

vec4 deriv (float t, vec4 y, vec4 v) {
  float tscale = 0.07 * t;
  return vec4(
    vec3(
      vec3(
        snoise4(vec4(y.xyz * 0.5, tscale)),
        snoise4(vec4(y.yzx * 0.5 + 0.02, tscale)),
        snoise4(vec4(y.zxy * 0.5 + 0.04, tscale))
      ) +
      -0.01 * (y.x * y.x + y.y * y.y + y.z * y.z) * y.xyz +
      -0.7 * v.xyz
    ),
    0.0
  );
}

#pragma glslify: export(deriv)
