/** Deterministic unique color per dataset slug (golden-angle hue spacing). */
export function datasetHue(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) | 0;
  const n = Math.abs(h);
  // golden angle for good distribution
  return (n * 137.508) % 360;
}

export function datasetColor(slug: string, sat = 72, light = 42): string {
  const hue = Math.round(datasetHue(slug));
  return `hsl(${hue} ${sat}% ${light}%)`;
}

export function datasetColorHex(slug: string): string {
  const hue = datasetHue(slug);
  const s = 0.62, l = 0.46;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (hue < 60) [r, g, b] = [c, x, 0];
  else if (hue < 120) [r, g, b] = [x, c, 0];
  else if (hue < 180) [r, g, b] = [0, c, x];
  else if (hue < 240) [r, g, b] = [0, x, c];
  else if (hue < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** A distinct hue-rotate for recoloring imagery basemap per dataset. */
export function datasetHueRotate(slug: string): number {
  return Math.round(datasetHue(slug));
}
