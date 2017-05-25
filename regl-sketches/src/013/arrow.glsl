float arrow (vec2 uv, float tl, float tw, float ar) {
  float oar = 1.0 / ar;
  vec2 uvrel = vec2(abs(uv.x - 0.5), uv.y - tl);

  vec2 dr = vec2((1.0 - tl) * oar, 0.5);
  dr /= length(dr);
  dr.y *= oar;

  return
    max(
      dot(uvrel - vec2(0.5, 0.0), dr),
      min(
        (tl - uv.y) * oar,
        max(
          uvrel.x - tw * 0.5,
          -uv.y * oar
        )
      )
    )
  ;
}

#pragma glslify: export(arrow)
