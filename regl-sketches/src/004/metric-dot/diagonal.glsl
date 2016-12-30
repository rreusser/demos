float metricDot (vec4 gij, vec4 ui, vec4 vj) {
  return dot(gij * ui, vj);
    //gij.x * ui.x * vj.x +
    //gij.y * ui.y * vj.y +
    //gij.z * ui.z * vj.z +
    //gij.w * ui.w * vj.w;
}

#pragma glslify: export(metricDot)
