/*
 * (r, theta, phi) --> (x, y, z)
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
vec3 toCartesian(vec3 rtp) {
  float rsphi = rtp.x * sin(rtp.z);
  return vec3(
    cos(rtp.y) * rsphi,
    sin(rtp.y) * rsphi,
    rtp.x * cos(rtp.z)
  );
}

#pragma glslify: export(toCartesian)
