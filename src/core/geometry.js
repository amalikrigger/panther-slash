// Small math helpers used by the game rules.

/**
 * Does the line segment from (ax, ay) to (bx, by) pass through the circle at
 * (cx, cy) with radius r?
 *
 * We find the point on the segment closest to the circle's center and check
 * whether it is inside the circle. Testing the segment, and not only where the
 * pointer is now, matters: a fast swipe can jump right over an enemy between
 * two frames.
 */
export function segmentHitsCircle(ax, ay, bx, by, cx, cy, r) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  // t says how far along the segment the closest point is (0 = start, 1 = end).
  let t = lengthSquared === 0 ? 0 : ((cx - ax) * dx + (cy - ay) * dy) / lengthSquared;
  t = Math.max(0, Math.min(1, t));
  const closestX = ax + t * dx;
  const closestY = ay + t * dy;
  const distX = cx - closestX;
  const distY = cy - closestY;
  return distX * distX + distY * distY <= r * r;
}

export function randomBetween(min, max, random = Math.random) {
  return min + (max - min) * random();
}

/** Pick an item from a list, where items with a bigger `weight` are picked more often. */
export function pickWeighted(items, random = Math.random) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = random() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll < 0) return item;
  }
  return items[items.length - 1];
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}
