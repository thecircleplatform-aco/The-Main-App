export type IconKind =
  | "circle"
  | "triangle"
  | "square"
  | "node";

export type IconObject = {
  id: number;
  kind: IconKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
};

export const ICON_KINDS: IconKind[] = [
  "circle",
  "triangle",
  "square",
  "node",
];

export function createRandomIcons(
  count: number,
  width: number,
  height: number
): IconObject[] {
  if (width <= 0 || height <= 0) {
    return [];
  }

  const icons: IconObject[] = [];
  const max = Math.min(count, 7);

  for (let i = 0; i < max; i++) {
    const radius = randomInRange(32, 64);
    const kind =
      Math.random() < 0.45
        ? "circle"
        : ICON_KINDS[Math.floor(Math.random() * ICON_KINDS.length)];

    icons.push({
      id: i,
      kind,
      // Random positions across the entire viewport so the
      // background elements fill the whole screen, while keeping
      // each icon fully inside the viewport.
      x: randomInRange(radius, width - radius),
      y: randomInRange(radius, height - radius),
      vx: randomInRange(-0.06, 0.06),
      vy: randomInRange(-0.06, 0.06),
      radius,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: randomInRange(-0.0015, 0.0015),
      opacity: randomInRange(0.25, 0.35),
    });
  }

  return icons;
}

function randomInRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

