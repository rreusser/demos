kill(all);

x: r * cos(theta) * sin(phi);
y: r * sin(theta) * sin(phi);
z: r * cos(phi);

/*
 * Jacobian:
 *
 * [  dx    dx    dx  ] [ dr  ]     [ dx ]
 * [  --    --    --  ] [     ]     [    ]
 * [  dr    dp    dth ] [ dp  ]  =  [ dy ]
 * [                  ] [     ]     [    ]
 * [  dy    dy    dy  ] [ dth ]     [ dz ]
 * [  --    --    --  ]
 * [  dr    dp    dth ]
 * [                  ]
 * [  dz    dz    dz  ]
 * [  --    --    --  ]
 * [  dr    dp    dth ]
 *
 */

J: matrix(
  [diff(x, r), diff(x, phi), diff(x, theta)],
  [diff(y, r), diff(y, phi), diff(y, theta)],
  [diff(z, r), diff(z, phi), diff(z, theta)]
);

Ji: trigsimp(factor(invert(J)));

drpt: matrix([dr], [dphi], [dtheta]);

dxyz: J . drpt;
