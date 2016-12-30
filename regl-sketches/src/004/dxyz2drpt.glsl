vec3 dxyz2drpt (vec3 p0, vec3 dp) {
  return vec3(
    cos(p0.z) * sin(p0.y) * dp.x +
    sin(p0.z) * sin(p0.y) * dp.y +
    cos(p0.y) * dp.z,

    cos(p0.z) * cos(p0.y) / p0.x * dp.x +
    sin(p0.z) * cos(p0.y) / p0.x * dp.y -
    sin(p0.y) / p0.x * dp.z,

   -sin(p0.z) / sin(p0.y) / p0.x * dp.x +
    cos(p0.z) / sin(p0.y) / p0.x * dp.y
  );
}
