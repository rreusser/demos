<!--{{{
  "name": "Poisson Gravity",
  "author": "Ricky Reusser"
}}}-->

# Poisson Gravity

[Newton's Law of Universal Gravitation](https://en.wikipedia.org/wiki/Newton%27s_law_of_universal_gravitation) states that the force between two masses is proportional to the masses and inversely proportional to the square of the distance between the masses, that is, $$F = G \frac{m_1 m_2}{r^2}.$$
It's a lovely law, but for computation it means every particle interacts with every other particle, an $O(n^2)$ operations that quickly becomes prohibitive.

One way to avoid this issue is by grouping the particles hierarchically. That is, a from far away, a tightly packed cluster of particles looks just like a single particle. This is the basis of the [Barnes-Hut](https://en.wikipedia.org/wiki/Barnes%E2%80%93Hut_simulation) method. Of course the particles aren't a single particle, so you get into [multipole expansion](https://en.wikipedia.org/wiki/Multipole_expansion) that expands the clusters using spherical harmonics. It gets sorta complicated.

So today, I'll take a slightly different approach and model the mass as a continuum. ddsplat the particles onto a periodid grid in order to solve for the gravitational potential. Once we have the gravitational potential, computing the force on each particle is trivial.

Guass's law for gravity says that the divergence of the gravitational field is proportional to the mass density at each point, or $$\nabla \cdot \mathbf{g} = -4 \pi G \rho.$$


