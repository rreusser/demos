/*
 * Returns the jacobian matrix for spherical coordinates defined
 * by:
 *
 *   x = r cos(theta) sin(phi)
 *   y = r sin(theta) sin(phi)
 *   z = r cos(phi)
 *
 * That is,
 *
 *      [  dx    dx    dx  ]
 *      [  --    --    --  ]
 *      [  dr    dp    dth ]
 *      [                  ]
 *      [  dy    dy    dy  ]
 *  J = [  --    --    --  ]
 *      [  dr    dp    dth ]
 *      [                  ]
 *      [  dz    dz    dz  ]
 *      [  --    --    --  ]
 *      [  dr    dp    dth ]
 *
 */
mat3 jacobian (vec3 rpt) {
  float r = rpt.x;
  float sth = sin(rpt.y);
  float cth = cos(rpt.y);
  float sphi = sin(rpt.z);
  float cphi = cos(rpt.z);

  return mat3(
    cth * sphi,
    sth * sphi,
    cphi,

    -r * sth * sphi,
    r * cth * sphi,
    0.0,

    r * cth * cphi,
    r * sth * cphi,
    -r * sphi
  );
}

#pragma glslify: export(jacobian)
