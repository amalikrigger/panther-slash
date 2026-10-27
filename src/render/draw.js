// Small drawing helpers shared by the renderer and the effects.

// Pictures are drawn a bit bigger than the hit circle, because most of a
// sprite's corners are see-through.
const SPRITE_TO_RADIUS = 2.2;

/** Draw a sprite centered at (x, y), rotated, sized to match a hit radius. */
export function drawSprite(ctx, sprite, x, y, rotation, radius) {
  const longest = Math.max(sprite.width, sprite.height);
  const scale = (radius * SPRITE_TO_RADIUS) / longest;
  const w = sprite.width * scale;
  const h = sprite.height * scale;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.drawImage(sprite, -w / 2, -h / 2, w, h);
  ctx.restore();
}
