/*
 * (z, y, z) --> (r, phi, theta)
 *
 *              z
 *             |
 *             |  phi    r
 *             |--_    o
 *             |   \  /|
 *             |    /  |
 *             |  /    |
 *             |/      |     y
 *             +-------+-----
 *            / \      |
 *          /     \    |
 *        /     __- \  |
 *      /-------      \|
 *  x /   theta        o
 *
 *
 */
vec3 toSpherical (vec3 xyz) {
  float r = length(xyz);
  float rxy = length(xyz.xy);
  float theta = atan(xyz.y, xyz.x);
  float phi = asin(rxy / r);
  return vec3(r, phi, theta);
}

#pragma glslify: export(toSpherical)
