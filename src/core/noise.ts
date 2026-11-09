// Veyra ile sayısal uyum: H32 normal çarpma kullanır; Math.imul ile değiştirme.
export const H32 = (a: number, b: number): number => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
export function vnoise(x: number, y: number): number {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = H32(xi, yi), b = H32(xi + 1, yi), c = H32(xi, yi + 1), d = H32(xi + 1, yi + 1);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}
export function fbm(x: number, y: number, oct = 4): number {
  let v = 0, amp = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { v += amp * vnoise(x * f, y * f); f *= 2.03; amp *= 0.5; }
  return v / (1 - Math.pow(0.5, oct));
}
