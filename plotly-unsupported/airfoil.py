import numpy as np
import json

r = np.linspace(0, 1, 101)
th = np.linspace(0, np.pi * 2.0, 100, endpoint=True)
rr, tth = np.meshgrid(r, th)

n = 1.94
mux = -0.08
muy = 0.08
Rmin = np.sqrt(muy * muy + (1.0 - mux)**2.0)
Rmax = 10.0

zzeta = (mux + (Rmin * (1.0 - rr) + Rmax * rr) * np.cos(tth)) + \
  1.0j * (muy + (Rmin * (1.0 - rr) + Rmax * rr) * np.sin(tth))

zz = n * ((1.0 + 1.0 / zzeta)**n + (1.0 - 1.0 / zzeta)**n) / ((1.0 + 1.0 / zzeta)**n - (1.0 - 1.0 / zzeta)**n)
dzdzeta = 4.0 * n * n / (zzeta**2.0 - 1.0) * ((1.0 + 1.0 / zzeta)**n * (1.0 - 1.0 / zzeta)**n) / ((1.0 + 1.0 / zzeta)**n - (1.0 - 1.0 / zzeta)**n)**2

f = open('data.json', 'w')
json.dump(dict(
  x=np.real(zz).tolist(),
  y=np.imag(zz).tolist(),
  ), f)
f.close()

