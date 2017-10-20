# demos

This is hopefully one repo to manage all the demos I've been accumulating or at least a place to dump the new ones. The goal here is to learn new things and test limits. 

## [plotly.js](https://github.com/plotly/plotly.js)
<table>
  <tr>
    <td width="300" valign="top">
      <a href="https://codepen.io/rsreusser/pen/RLBmbQ"><img src="./thumbs/n-body.jpg" alt="N-body gravitational trajectories" width="290"></a>
      <a href="https://en.wikipedia.org/wiki/N-body_problem">N-body</a> gravitational trajectories using <a href="https://github.com/scijs/ode45-cash-karp">RK4(5) Cash-Karp</a> adaptive integration.
    </td>
    <td width="300" valign="top">
      <a href="https://codepen.io/rsreusser/pen/BwRMRg"><img src="./thumbs/diffraction.jpg" alt="1D wave packet diffraction through a slit" width="290"></a>
      1D diffraction of a wave packet passing within a known range at a known time.
    </td>
    <td width="300" valign="top">
      <a href="http://rickyreusser.com/plotly-airfoil-example/"><img src="./thumbs/airfoil.png" alt="Karman-Trefftz airfoil" width="290"></a>
      Potential flow over a cylinder conformally mapped into an airfoil via the <a href="https://en.wikipedia.org/wiki/Joukowsky_transform#K.C3.A1rm.C3.A1n.E2.80.93Trefftz_transform">Karman-Trefftz</a> transform
    </td>
  </tr>
  <tr>
    <td width="300" valign="top">
      <a href="http://rickyreusser.com/demos/schrodinger-1d/"><img src="./thumbs/schrodingers-equation.jpg" alt="The Schrödinger Equation with a potential barrier in 1D, using the FFT for spatial differencing, RK-4 for temporal integration, and Perfectly Matched Layers (PML) for non-reflecting boundary conditions." width="290"></a>
      Frequency-domain solution of the 1D <a href="https://en.wikipedia.org/wiki/Schr%C3%B6dinger_equation">Schrodinger Equation</a> with Perfectly Matched Layers (PML)
    </td>
    <td width="300" valign="top">
      <a href="http://rickyreusser.com/demos/plots/tsucs2.html"><img src="./thumbs/tsucs2.jpg" alt="Precomputing a strange attractor (TSUCS2) and then animating it as a point cloud" width="290"></a>
      Three-Scroll Unified Chaotic System Attractor #2 (TSUCS2)
    </td>
    <td width="300" valign="top">
      <a href="http://codepen.io/rsreusser/pen/GjZwYb"><img src="./thumbs/sierpinski-pentagon.jpg" alt="Testing GPU limits using plotly.js point clouds" width="290"></a>
      ❄️❄️ Fractals ❄️❄️
    </td>
  </tr>
  <tr>
    <td width="300" valign="top">
      <a href="http://rickyreusser.com/gaussian-mixture-estimator/"><img src="./thumbs/gaussian-mixture-estimator.jpg" alt="Fitting n-dimensional Gaussian mixture models to scatter data" width="290"></a>
      Gaussian Mixture estimation via <a href="https://en.wikipedia.org/wiki/Expectation%E2%80%93maximization_algorithm">Expectation Maximization</a> (EM)
    </td>
    <td width="300" valign="top">
      <a href="http://rickyreusser.com/demos/plots/tinkerbell.html"><img src="./thumbs/tinkerbell.jpg" alt="The tinkerbell map using plotly's point cloud feature" width="290"></a>
      <a href="https://en.wikipedia.org/wiki/Tinkerbell_map">Tinkerbell map</a>
    </td>
    <td width="300" valign="top">
      <a href="http://rickyreusser.com/kmpp/"><img src="./thumbs/k-means.jpg" alt="K-means clustering" width="290"></a>
      <a href="https://en.wikipedia.org/wiki/K-means_clustering">K-means</a> clustering meets <a href="https://en.wikipedia.org/wiki/Lorenz_system">Lorenz Attractor</a>
    </td>
  </tr>
  <tr>
    <td width="300" valign="top">
      <a href="https://plot.ly/~rreusser/55.embed"><img src="./thumbs/thesis.jpg" alt="Guided Wave Transmission in a Ridge-Stiffened Plate" width="290"></a>
      <a href="https://s3.amazonaws.com/rickyreusser.com/wave-scattering-by-an-integral-stiffener.pdf">Ultrasonic waves</a>
    </td>
  </tr>
</table>

## [regl](https://github.com/regl-project/regl)
<table >
  <tr>
    <td width="300" valign="top">
      <a href="http://rickyreusser.com/demos/regl-sketches/016/"><img src="./thumbs/n-body-regl.jpg" alt="N-body gravitational trajectories" width="290"></a>
      <a href="https://en.wikipedia.org/wiki/N-body_problem">N-body</a> gravitational trajectories using <a href="https://github.com/scijs/ode45-cash-karp">RK4(5) Cash-Karp</a> adaptive integration.
    </td>
    <td width="300" valign="top">
      <a href="https://codepen.io/rsreusser/full/rGLRBV/"><img src="./thumbs/disco.jpg" alt="" width="290"></a>
      🕺
    </td>
    <td width="300" valign="top">
      <a href="http://rickyreusser.com/demos/regl-sketches/015/"><img src="./thumbs/kelvin-helmholtz.jpg" alt="" width="290"></a>
      <a href="https://en.wikipedia.org/wiki/Rayleigh%E2%80%93Taylor_instability">Rayleigh-Taylor</a> and <a href="https://en.wikipedia.org/wiki/Kelvin%E2%80%93Helmholtz_instability">Kelvin-Helmholtz</a> hydrodynamic instabilities.
    </td>
  </tr>
  <tr>
    <td width="300" valign="top">
      <a href="http://rickyreusser.com/demos/regl-sketches/014/"><img src="./thumbs/fluid.jpg" alt="" width="290"></a>
      Classic fluid simulation from <a href="https://graphics.stanford.edu/papers/smoke/smoke.pdf">Visual Simulation of Smoke</a>.
    </td>
    <td width="300" valign="top">
      <a href="http://rickyreusser.com/747-model"><img src="./thumbs/747.png" alt="" width="290"></a>
      747 (modeled with <a href="http://www.wings3d.com/">Wings&nbsp;3D</a>)
    </td>
    <td width="300" valign="top">
      <a href="http://rickyreusser.com/sailplane-model"><img src="./thumbs/sailplane.png" alt="" width="290"></a>
      Sailplane (modeled with <a href="http://www.wings3d.com/">Wings&nbsp;3D</a>)
    </td>
  </tr>
  <tr>
    <td width="300" valign="top">
      <a href="http://rickyreusser.com/demos/regl-sketches/013"><img src="./thumbs/vortex.jpg" alt="" width="290"></a>
      <a href="https://en.wikipedia.org/wiki/Vortex">Vortex</a>, rendered as a signed distance function
    </td>
    <td width="300" valign="top">
      <a href="http://rickyreusser.com/demos/regl-sketches/012"><img src="./thumbs/torus.jpg" alt="" width="290"></a>
      <a href="https://en.wikipedia.org/wiki/Umbilic_torus">Umbilic Torus</a>
    </td>
    <td width="300" valign="top">
      <a href="http://rickyreusser.com/demos/regl-sketches/011"><img src="./thumbs/reprise.jpg" alt="" width="290"></a>
      Fun with the SoundCloud API, Part 2: this time with <a href="https://github.com/Erkaman/glsl-godrays">godrays</a>
    </td>
  </tr>
  <tr>
    <td width="300" valign="top">
      <a href="http://rickyreusser.com/demos/regl-sketches/010"><img src="./thumbs/flow.png" alt="" width="290"></a>
      Analytical fluid flow over an airfoil using the <a href="https://en.wikipedia.org/wiki/Joukowsky_transform#K.C3.A1rm.C3.A1n.E2.80.93Trefftz_transform">Kármán–Trefftz</a> transform. Computed and visualized in a single GPU pass.
    </td>
    <td width="300" valign="top">
      <a href="http://rickyreusser.com/demos/regl-sketches/009"><img src="./thumbs/logistic.jpg" alt="" width="290"></a>
      Chaos via the <a href="https://en.wikipedia.org/wiki/Logistic_map">logistic map</a>: <code>x[n+1] = r*x[n]*(1-x[n])</code>
    </td>
    <td width="300" valign="top">
      <a href="http://rickyreusser.com/demos/regl-sketches/008"><img src="./thumbs/roots.jpg" alt="" width="290"></a>
      Roots of a polynomial with random coefficients
    </td>
  </tr>
  <tr>
    <td width="300" valign="top">
      <a href="http://rickyreusser.com/demos/regl-sketches/007"><img src="./thumbs/sprites.jpg" alt="" width="290"></a>
      Motion blur the simple way
    </td>
    <td width="300" valign="top">
      <a href="http://rickyreusser.com/demos/regl-sketches/006"><img src="./thumbs/ambient-occlusion.jpg" alt="Ambient Occlusion" width="290"></a>
      Screen Space Ambient Occlusion (SSAO)
    </td>
    <td width="300" valign="top">
      <a href="http://rickyreusser.com/demos/regl-sketches/005"><img src="./thumbs/erosion.jpg" alt="" width="290"></a>
      GPGPU <a href="https://gist.github.com/rreusser/b3c4621064c16233591a09541d3e59b7">Erosion</a>
    </td>
  </tr>
  <tr>
    <td width="300" valign="top">
      <a href="http://rickyreusser.com/demos/regl-sketches/004"><img src="./thumbs/particles.jpg" alt="" width="290"></a>
      GPU particle simulation
    </td>
    <td width="300" valign="top">
      <a href="http://rickyreusser.com/demos/regl-sketches/003"><img src="./thumbs/schwarzschild.jpg" alt="" width="290"></a>
      Integrating GPGPU particle trajectories in Schwarzschild spacetime (a black hole!)
    </td>
    <td width="300" valign="top">
      <a href="http://rickyreusser.com/demos/regl-sketches/002"><img src="./thumbs/flamms-paraboloid.jpg" alt="" width="290"></a>
      <a href="https://en.wikipedia.org/wiki/Schwarzschild_metric#Flamm.27s_paraboloid">Flamm's parabaloid</a> (subject to caveats, a representation of curved spacetime around a black hole)
    </td>
  </tr>
  <tr>
    <td width="300" valign="top">
      <a href="http://rickyreusser.com/demos/regl-sketches/001"><img src="./thumbs/blob.jpg" alt="" width="290"></a>
      Fun with the SoundCloud API, Part 1
    </td>
    <td width="300" valign="top">
      <a href="http://rickyreusser.com/demos/lorenz/"><img src="./thumbs/attractors.jpg" alt="Strange attractors computed and displayed on the GPU" width="290"></a>
      Integrating Strange Attractors on the GPU
    </td>
    <td width="300" valign="top">
      <a href="http://rickyreusser.com/demos/gravity/"><img src="./thumbs/gravity.jpg" alt="2D not-particularly-physical gravity as a semi-lagrangian continuum" width="290"></a>
      1M particles interacting as a <a href="https://en.wikipedia.org/wiki/Poisson%27s_equation#Newtonian_gravity">two-dimensional gravitational continuum</a>
    </td>
  </tr>
  <tr>
    <td width="300" valign="top">
      <a href="http://rickyreusser.com/demos/waves/"><img src="./thumbs/waves.jpg" alt="" width="290"></a>
      2D wave equation
    </td>
    <td width="300" valign="top">
      <a href="http://rickyreusser.com/complex-zeros-delves-lyness/lamb.html"><img src="./thumbs/lamb-dispersion.jpg" alt="" width="290"></a>
      The <a href="https://en.wikipedia.org/wiki/Lamb_waves">Lamb wave</a> dispersion relation in the complex plane
    </td>
    <td width="300" valign="top">
      <a href="http://rickyreusser.com/complex-zeros-delves-lyness/zeros.html"><img src="./thumbs/zeros.jpg" alt="" width="290"></a>
      Computing the zeros of a complex analytic function via contour integration
    </td>
  </tr>
  <tr>
    <td width="300" valign="top">
      <a href="http://rickyreusser.com/demos/smooth-life/"><img src="./thumbs/smooth-life.jpg" alt="" width="290"></a>
      <a href="https://arxiv.org/abs/1111.1567">Smooth Life</a> on the GPU
    </td>
    <td width="300" valign="top">
      <a href="http://rickyreusser.com/demos/carpet"><img src="./thumbs/carpet.jpg" alt="" width="290"></a>
      Carpet plots
    </td>
    <td width="300" valign="top">
      <a href="http://rickyreusser.com/demos/schrodinger/"><img src="./thumbs/schrodinger.jpg" alt="Because twitter" width="290"></a>
      Schrodinger
    </td>
  </tr>
  <tr>
    <td width="300" valign="top">
      <a href="http://rickyreusser.com/demos/regl-scan/"><img src="./thumbs/scan.jpg" alt="A scan operation on the GPU" width="290"></a>
      GPGPU <a href="https://en.wikipedia.org/wiki/Prefix_sum">prefix sum</a>
    </td>
    <td width="300" valign="top">
      <a href="http://rickyreusser.com/demos/elastodynamics/"><img src="./thumbs/rayleigh-waves.jpg" alt="" width="290"></a>
      <a href="https://en.wikipedia.org/wiki/Rayleigh_wave">Rayleigh waves</a> in an elastic medium
    </td>
    <td width="300" valign="top">
      <a href="http://rickyreusser.com/demos/catmull-rom"><img src="./thumbs/catmull-rom.jpg" alt="" width="290"></a>
      Catmull-Rom splines
    </td>
  </tr>
  <tr>
    <td width="300" valign="top">
      <a href="http://codepen.io/rsreusser/pen/apbrRg"><img src="./thumbs/recursion.jpg" alt="" width="290"></a>
      Recursion!
    </td>
    <td width="300" valign="top">
      <a href="http://demos.rickyreusser.com/ndarray-transfinite-interpolation/volume.html"><img src="./thumbs/transfinite-interpolation.jpg" alt="" width="290"></a>
      <a href="https://en.wikipedia.org/wiki/Transfinite_interpolation">Transfinite interpolation</a>
    </td>
  </tr>
</table>

## [d3.js](https://d3js.org/)
<table>
  <tr>
    <td width="300" valign="top">
      <a href="http://rickyreusser.com/demos/brachistochrone/"><img src="./thumbs/brachistochrone.jpg" alt="" width="290"></a>
      <a href="https://en.wikipedia.org/wiki/Brachistochrone_curve">Brachistochrone</a> (curve of fastest descent)
    </td>
    <td width="300" valign="top">
      <a href="http://rickyreusser.com/demos/fresnel"><img src="./thumbs/fresnel.jpg" alt="" width="290"></a>
      <a href="https://en.wikipedia.org/wiki/Fresnel_equations">Fresnel reflection</a>
    </td>
    <td width="300" valign="top">
      <a href="http://rickyreusser.com/demos/principle-of-least-action/"><img src="./thumbs/least-action.jpg" alt="" width="290"></a>
      <a href="https://en.wikipedia.org/wiki/Principle_of_least_action">Principle of Least Action</a>
    </td>
  </tr>
  <tr>
    <td width="300" valign="top">
      <a href="https://t.d3fc.io/status/742340688562552833"><img src="./thumbs/jukowski.jpg" alt="" width="290"></a>
      <code>/*airfoil*/P([rn(0,7,.01).map(i=></code>
      <code>(x=111*c(i)-10,y=111*s(i)+c(t/1e3)</code>
      <code>*10,$=(x*x+y*y)/1e4,[x+x/$,y-y/$])</code>
      <code>)]).a('d',ln())</code>
    </td>
  </tr>
<table>

## canvas
<table>
  <tr>
    <td width="300" valign="top">
      <a href="http://rickyreusser.com/demos/double-pendulum/"><img src="./thumbs/pendulum.jpg" alt="" width="290"></a>
      Double-pendulum chaos
    </td>
    <td width="300" valign="top">
      <a href="https://github.com/rreusser/demos/tree/master/first-order-wave-equation#first-order-wave-equation"><img src="./thumbs/first-order-wave-equation.jpg" alt="" width="290"></a>
      Numerical methods for the first-order wave equation
    </td>
  </tr>
</table>

## [three.js](https://threejs.org/)
<table>
  <tr>
    <td width="300" valign="top">
      <a href="http://rickyreusser.com/2016/02/07/hyperbolic-grid-generation/"><img src="./thumbs/grid-generation.jpg" alt="" width="290"></a>
      Hyperbolic Grid Generation
    </td>
  </tr>
</table>

&copy; 2016 Ricky Reusser. MIT License.
