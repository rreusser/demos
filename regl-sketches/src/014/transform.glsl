vec2 transform (vec2 x, vec4 t) {
  return x * t.xy + t.zw;
}

#pragma glslify: export(transform);
