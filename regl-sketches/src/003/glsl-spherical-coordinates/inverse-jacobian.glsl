/*
 * Returns the inverse jacobian matrix for spherical coordinates
 * defined by:
 *
 *   x = r cos(theta) sin(phi)
 *   y = r sin(theta) sin(phi)
 *   z = r cos(phi)
 *
 * That is,
 *
 *        [  dr    dr    dr  ]
 *        [  --    --    --  ]
 *        [  dx    dy    dz  ]
 *        [                  ]
 *   -1   [  dp    dp    dp  ]
 *  J   = [  --    --    --  ]
 *        [  dx    dy    dz  ]
 *        [                  ]
 *        [  dth   dth   dth ]
 *        [  --    --    --  ]
 *        [  dx    dy    dz  ]
 *
 */
mat3 inverseJacobian (vec3 rpt) {
  float or = 1.0 / rpt.x;
  float sth = sin(rpt.y);
  float cth = cos(rpt.y);
  float cphi = cos(rpt.z);
  float sphi = sin(rpt.z);

  return mat3(
    cth * sphi,
    -sth / sphi * or,
    cth * cphi * or,

    sth * sphi,
    cth / sphi * or,
    sth * cphi * or,

    cphi,
    0.0
    -sphi * or
  );
}

#pragma glslify: export(inverseJacobian)
