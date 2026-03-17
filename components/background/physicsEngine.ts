import type { IconObject } from "./iconObjects";

export type PhysicsState = {
  width: number;
  height: number;
  icons: IconObject[];
};
const EDGE_RESTITUTION = 0.9;
const ACTIVE_FRICTION = 0.994;
const IDLE_FRICTION = 0.98;
const MAX_SPEED = 0.8;

export type PointerForce = {
  x: number;
  y: number;
  radius: number;
  strength: number;
};

export function stepPhysics(
  state: PhysicsState,
  dtMs: number,
  pointerForce?: PointerForce,
  isIdle = false
): PhysicsState {
  const dt = dtMs;
  const icons = state.icons.map((icon) => ({ ...icon }));
  const friction = isIdle ? IDLE_FRICTION : ACTIVE_FRICTION;

  for (const icon of icons) {
    if (pointerForce && !isIdle) {
      applyPointerForce(icon, pointerForce);
    }

    icon.x += icon.vx * dt;
    icon.y += icon.vy * dt;
    icon.rotation += icon.rotationSpeed * dt;

    icon.vx *= friction;
    icon.vy *= friction;

    clampVelocity(icon);
    handleBounds(icon, state.width, state.height);
  }

  applyOverlapRepulsion(icons, state.width, state.height);

  return { ...state, icons };
}

function applyPointerForce(icon: IconObject, pointer: PointerForce) {
  const dx = icon.x - pointer.x;
  const dy = icon.y - pointer.y;
  const distSq = dx * dx + dy * dy;
  const radiusSq = pointer.radius * pointer.radius;
  if (distSq > radiusSq || distSq === 0) return;

  const dist = Math.sqrt(distSq);
  const nx = dx / dist;
  const ny = dy / dist;
  const falloff = 1 - dist / pointer.radius;
  const force = pointer.strength * falloff;

  icon.vx += nx * force;
  icon.vy += ny * force;
}

function clampVelocity(icon: IconObject) {
  const speedSq = icon.vx * icon.vx + icon.vy * icon.vy;
  const maxSq = MAX_SPEED * MAX_SPEED;
  if (speedSq > maxSq) {
    const speed = Math.sqrt(speedSq);
    const scale = MAX_SPEED / speed;
    icon.vx *= scale;
    icon.vy *= scale;
  }
}

function handleBounds(icon: IconObject, width: number, height: number) {
  const r = icon.radius;

  if (icon.x - r < 0) {
    icon.x = r;
    icon.vx = -icon.vx * EDGE_RESTITUTION;
  } else if (icon.x + r > width) {
    icon.x = width - r;
    icon.vx = -icon.vx * EDGE_RESTITUTION;
  }

  if (icon.y - r < 0) {
    icon.y = r;
    icon.vy = -icon.vy * EDGE_RESTITUTION;
  } else if (icon.y + r > height) {
    icon.y = height - r;
    icon.vy = -icon.vy * EDGE_RESTITUTION;
  }
}

function applyOverlapRepulsion(icons: IconObject[], width: number, height: number) {
  // Lightweight neighbour-only repulsion to avoid heavy N^2 collision checks.
  for (let i = 1; i < icons.length; i++) {
    const a = icons[i - 1];
    const b = icons[i];

    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const minDist = a.radius + b.radius;
    const distSq = dx * dx + dy * dy;

    if (distSq === 0 || distSq >= minDist * minDist) continue;

    const dist = Math.sqrt(distSq) || 0.001;
    const nx = dx / dist;
    const ny = dy / dist;
    const overlap = (minDist - dist) * 0.5;

    a.x -= nx * overlap;
    a.y -= ny * overlap;
    b.x += nx * overlap;
    b.y += ny * overlap;

    handleBounds(a, width, height);
    handleBounds(b, width, height);
  }
}

