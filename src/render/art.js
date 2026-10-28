// Enemy art drawn with code.
//
// Each function below draws one enemy into a square canvas once, when the game
// loads. After that the game just copies that picture, which is fast. These
// are "drawn:<name>" in config.js.
//
// Every drawing fits inside a circle of radius R around the center, so a drawn
// enemy and a student's PNG line up with the hit circle the same way.
//
// Want to add one? Write a function like drawGhost, add it to DRAWINGS at the
// bottom, then add an entry to ENEMIES in config.js with art: 'drawn:<name>'.

export const SPRITE_SIZE = 256;
const R = SPRITE_SIZE * 0.45; // the drawing's radius inside the sprite

const OUTLINE = '#1a0a1f';

function drawPumpkin(ctx) {
  // Stem first, so the pumpkin body overlaps its base.
  ctx.fillStyle = '#4a7a1f';
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-10, -R * 0.62);
  ctx.quadraticCurveTo(-6, -R * 0.98, 16, -R * 1.0);
  ctx.lineTo(20, -R * 0.86);
  ctx.quadraticCurveTo(8, -R * 0.8, 12, -R * 0.62);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Body: overlapping ribs, darker at the edges, so it looks round.
  const ribs = [
    { x: -R * 0.48, w: R * 0.52 },
    { x: R * 0.48, w: R * 0.52 },
    { x: -R * 0.24, w: R * 0.55 },
    { x: R * 0.24, w: R * 0.55 },
    { x: 0, w: R * 0.5 },
  ];
  for (const rib of ribs) {
    const gradient = ctx.createRadialGradient(rib.x - rib.w * 0.3, -R * 0.3, 4, rib.x, 0, R);
    gradient.addColorStop(0, '#ffb347');
    gradient.addColorStop(0.55, '#ff7a1a');
    gradient.addColorStop(1, '#b8420a');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(rib.x, R * 0.06, rib.w, R * 0.74, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(120, 40, 0, 0.6)';
    ctx.stroke();
  }

  // Carved face, glowing from a candle inside.
  const glow = ctx.createRadialGradient(0, R * 0.1, 4, 0, R * 0.1, R * 0.7);
  glow.addColorStop(0, '#fff7b0');
  glow.addColorStop(0.5, '#ffd23f');
  glow.addColorStop(1, '#ff9a00');
  ctx.fillStyle = glow;
  ctx.strokeStyle = '#5a1f00';
  ctx.lineWidth = 4;
  const eye = (side) => {
    ctx.beginPath();
    ctx.moveTo(side * R * 0.12, -R * 0.05);
    ctx.lineTo(side * R * 0.5, -R * 0.05);
    ctx.lineTo(side * R * 0.3, -R * 0.38);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };
  eye(-1);
  eye(1);
  // Jagged grin.
  ctx.beginPath();
  ctx.moveTo(-R * 0.58, R * 0.18);
  ctx.quadraticCurveTo(0, R * 0.42, R * 0.58, R * 0.18);
  ctx.quadraticCurveTo(R * 0.4, R * 0.62, 0, R * 0.62);
  ctx.quadraticCurveTo(-R * 0.4, R * 0.62, -R * 0.58, R * 0.18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Teeth cut back into the grin.
  ctx.fillStyle = '#e8691a';
  for (const tx of [-R * 0.22, R * 0.18]) {
    ctx.fillRect(tx, R * 0.27, R * 0.12, R * 0.14);
  }
}

function drawGhost(ctx) {
  const body = new Path2D();
  body.moveTo(-R * 0.78, R * 0.75);
  body.lineTo(-R * 0.78, -R * 0.1);
  body.bezierCurveTo(-R * 0.78, -R * 1.05, R * 0.78, -R * 1.05, R * 0.78, -R * 0.1);
  body.lineTo(R * 0.78, R * 0.75);
  // Wavy hem.
  const waves = 4;
  for (let i = 0; i < waves; i++) {
    const x0 = R * 0.78 - (i * R * 1.56) / waves;
    const x1 = x0 - (R * 1.56) / waves;
    body.quadraticCurveTo((x0 + x1) / 2, i % 2 ? R * 1.0 : R * 0.55, x1, R * 0.75);
  }
  body.closePath();

  const gradient = ctx.createRadialGradient(-R * 0.3, -R * 0.5, 6, 0, 0, R * 1.1);
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(0.7, '#e6f0ff');
  gradient.addColorStop(1, '#a9bde0');
  ctx.fillStyle = gradient;
  ctx.fill(body);
  ctx.lineWidth = 7;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke(body);

  // Big friendly eyes with shine.
  ctx.fillStyle = '#1b1030';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(side * R * 0.3, -R * 0.2, R * 0.13, R * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#fff';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(side * R * 0.3 - R * 0.04, -R * 0.28, R * 0.05, 0, Math.PI * 2);
    ctx.fill();
  }
  // "Boo!" mouth.
  ctx.fillStyle = '#3b1030';
  ctx.beginPath();
  ctx.ellipse(0, R * 0.18, R * 0.12, R * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
  // Cheeks.
  ctx.fillStyle = 'rgba(255, 120, 170, 0.45)';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(side * R * 0.52, R * 0.05, R * 0.12, R * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBat(ctx) {
  // Wings: scalloped bottom edge.
  const wing = (side) => {
    const p = new Path2D();
    p.moveTo(side * R * 0.2, -R * 0.15);
    p.quadraticCurveTo(side * R * 0.6, -R * 0.65, side * R * 1.0, -R * 0.35);
    p.quadraticCurveTo(side * R * 0.92, R * 0.1, side * R * 0.95, R * 0.3);
    p.quadraticCurveTo(side * R * 0.8, R * 0.1, side * R * 0.62, R * 0.28);
    p.quadraticCurveTo(side * R * 0.5, R * 0.05, side * R * 0.32, R * 0.25);
    p.quadraticCurveTo(side * R * 0.28, R * 0.05, side * R * 0.15, R * 0.15);
    p.closePath();
    return p;
  };
  const wingFill = ctx.createLinearGradient(0, -R * 0.6, 0, R * 0.4);
  wingFill.addColorStop(0, '#7b3fc4');
  wingFill.addColorStop(1, '#3a1666');
  for (const side of [-1, 1]) {
    const p = wing(side);
    ctx.fillStyle = wingFill;
    ctx.fill(p);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#d9b3ff'; // light rim so it shows against the dark sky
    ctx.stroke(p);
    // Wing bones.
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(217, 179, 255, 0.5)';
    ctx.beginPath();
    ctx.moveTo(side * R * 0.25, -R * 0.1);
    ctx.lineTo(side * R * 0.62, R * 0.22);
    ctx.moveTo(side * R * 0.3, -R * 0.15);
    ctx.lineTo(side * R * 0.92, R * 0.25);
    ctx.stroke();
  }

  // Body and head.
  ctx.fillStyle = '#4b1d80';
  ctx.strokeStyle = '#d9b3ff';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.ellipse(0, R * 0.05, R * 0.3, R * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Ears.
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * R * 0.08, -R * 0.3);
    ctx.lineTo(side * R * 0.24, -R * 0.62);
    ctx.lineTo(side * R * 0.28, -R * 0.22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // Glowing eyes.
  ctx.fillStyle = '#ffe14d';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(side * R * 0.12, -R * 0.08, R * 0.08, R * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#1a0a1f';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(side * R * 0.12, -R * 0.06, R * 0.04, 0, Math.PI * 2);
    ctx.fill();
  }
  // Fangs.
  ctx.fillStyle = '#fff';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * R * 0.03, R * 0.12);
    ctx.lineTo(side * R * 0.11, R * 0.12);
    ctx.lineTo(side * R * 0.07, R * 0.24);
    ctx.closePath();
    ctx.fill();
  }
}

function drawCandyCorn(ctx) {
  // A rounded triangle, point up, in three stripes.
  const shape = new Path2D();
  shape.moveTo(0, -R * 0.98);
  shape.quadraticCurveTo(R * 0.2, -R * 0.9, R * 0.72, R * 0.6);
  shape.quadraticCurveTo(R * 0.8, R * 0.92, 0, R * 0.92);
  shape.quadraticCurveTo(-R * 0.8, R * 0.92, -R * 0.72, R * 0.6);
  shape.quadraticCurveTo(-R * 0.2, -R * 0.9, 0, -R * 0.98);
  shape.closePath();

  ctx.save();
  ctx.clip(shape);
  ctx.fillStyle = '#ffd23f';
  ctx.fillRect(-R, R * 0.3, R * 2, R);
  ctx.fillStyle = '#ff7a1a';
  ctx.fillRect(-R, -R * 0.28, R * 2, R * 0.6);
  ctx.fillStyle = '#fff8e7';
  ctx.fillRect(-R, -R, R * 2, R * 0.72);
  // Shine down the left side.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.beginPath();
  ctx.ellipse(-R * 0.28, 0, R * 0.1, R * 0.6, 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.lineWidth = 7;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke(shape);

  // Cute face in the orange band.
  ctx.fillStyle = OUTLINE;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(side * R * 0.18, R * 0.0, R * 0.07, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, R * 0.08, R * 0.12, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();
}

function drawEyeball(ctx) {
  const white = ctx.createRadialGradient(-R * 0.3, -R * 0.35, 6, 0, 0, R * 0.9);
  white.addColorStop(0, '#ffffff');
  white.addColorStop(0.75, '#f3e6e6');
  white.addColorStop(1, '#d9a6a6');
  ctx.fillStyle = white;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.88, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 7;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();

  // Spooky red veins, wiggling in from the edge.
  ctx.strokeStyle = '#d6223b';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    const angle = (i / 7) * Math.PI * 2 + 0.3;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * R * 0.85, Math.sin(angle) * R * 0.85);
    ctx.quadraticCurveTo(
      Math.cos(angle + 0.25) * R * 0.65, Math.sin(angle + 0.25) * R * 0.65,
      Math.cos(angle - 0.1) * R * 0.5, Math.sin(angle - 0.1) * R * 0.5,
    );
    ctx.stroke();
  }

  // Iris, pupil, shine.
  const iris = ctx.createRadialGradient(R * 0.1, R * 0.05, 2, R * 0.1, R * 0.05, R * 0.4);
  iris.addColorStop(0, '#b6ff6b');
  iris.addColorStop(1, '#2f8a1f');
  ctx.fillStyle = iris;
  ctx.beginPath();
  ctx.arc(R * 0.1, R * 0.05, R * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0b0610';
  ctx.beginPath();
  ctx.arc(R * 0.1, R * 0.05, R * 0.19, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(R * 0.0, -R * 0.06, R * 0.08, 0, Math.PI * 2);
  ctx.fill();
}

/** A gold medallion with a panther face: the rare bonus target. */
function drawPanther(ctx) {
  // Medallion.
  const coin = ctx.createRadialGradient(-R * 0.35, -R * 0.4, 6, 0, 0, R);
  coin.addColorStop(0, '#fff3b0');
  coin.addColorStop(0.45, '#F6BC1B');
  coin.addColorStop(1, '#a86f00');
  ctx.fillStyle = coin;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.95, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#701114';
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(112, 17, 20, 0.5)';
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.8, 0, Math.PI * 2);
  ctx.stroke();

  // Panther head silhouette in maroon.
  ctx.fillStyle = '#701114';
  // Ears: short and rounded, like a big cat's (pointy ones look like a house cat).
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(side * R * 0.4, -R * 0.4, R * 0.17, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#c4474c';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(side * R * 0.4, -R * 0.4, R * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#701114';
  ctx.beginPath();
  ctx.moveTo(0, -R * 0.5);
  ctx.bezierCurveTo(R * 0.55, -R * 0.52, R * 0.66, -R * 0.1, R * 0.5, R * 0.2);
  ctx.bezierCurveTo(R * 0.38, R * 0.5, R * 0.18, R * 0.62, 0, R * 0.62);
  ctx.bezierCurveTo(-R * 0.18, R * 0.62, -R * 0.38, R * 0.5, -R * 0.5, R * 0.2);
  ctx.bezierCurveTo(-R * 0.66, -R * 0.1, -R * 0.55, -R * 0.52, 0, -R * 0.5);
  ctx.fill();

  // Eyes: gold, narrowed.
  ctx.fillStyle = '#ffe680';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * R * 0.08, -R * 0.12);
    ctx.quadraticCurveTo(side * R * 0.24, -R * 0.26, side * R * 0.38, -R * 0.16);
    ctx.quadraticCurveTo(side * R * 0.24, -R * 0.02, side * R * 0.08, -R * 0.12);
    ctx.fill();
  }
  ctx.fillStyle = '#1a0a1f';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(side * R * 0.23, -R * 0.14, R * 0.025, R * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Muzzle and nose.
  ctx.fillStyle = '#a3262b';
  ctx.beginPath();
  ctx.ellipse(0, R * 0.3, R * 0.24, R * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a0a1f';
  ctx.beginPath();
  ctx.moveTo(-R * 0.09, R * 0.14);
  ctx.lineTo(R * 0.09, R * 0.14);
  ctx.lineTo(0, R * 0.25);
  ctx.closePath();
  ctx.fill();
  // Whiskers.
  ctx.strokeStyle = '#ffe680';
  ctx.lineWidth = 2.5;
  for (const side of [-1, 1]) {
    for (const dy of [-0.02, 0.06]) {
      ctx.beginPath();
      ctx.moveTo(side * R * 0.18, R * (0.3 + dy));
      ctx.lineTo(side * R * 0.52, R * (0.26 + dy * 2));
      ctx.stroke();
    }
  }
}

/** The Frost Orb power-up: an icy ball with a big snowflake. */
function drawFrost(ctx) {
  const ice = ctx.createRadialGradient(-R * 0.3, -R * 0.35, 6, 0, 0, R * 0.9);
  ice.addColorStop(0, '#ffffff');
  ice.addColorStop(0.45, '#9fe8ff');
  ice.addColorStop(1, '#2b7bd6');
  ctx.fillStyle = ice;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.88, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#0d2a5c';
  ctx.stroke();

  // Six-armed snowflake.
  ctx.strokeStyle = '#ffffff';
  ctx.lineCap = 'round';
  for (let arm = 0; arm < 6; arm++) {
    ctx.save();
    ctx.rotate((arm / 6) * Math.PI * 2);
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -R * 0.66);
    ctx.stroke();
    ctx.lineWidth = 6;
    for (const along of [0.32, 0.5]) {
      ctx.beginPath();
      ctx.moveTo(-R * 0.14, -R * (along + 0.1));
      ctx.lineTo(0, -R * along);
      ctx.lineTo(R * 0.14, -R * (along + 0.1));
      ctx.stroke();
    }
    ctx.restore();
  }
  // Shine.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.beginPath();
  ctx.ellipse(-R * 0.42, -R * 0.45, R * 0.16, R * 0.08, -0.7, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * The bomb: a spiky black ball with a skull. The spikes make it look
 * different from every enemy even for players who can't tell colors apart.
 */
function drawBomb(ctx) {
  const spikes = 12;
  const spiky = new Path2D();
  for (let i = 0; i <= spikes * 2; i++) {
    const angle = (i / (spikes * 2)) * Math.PI * 2;
    const radius = i % 2 === 0 ? R * 0.95 : R * 0.72;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) spiky.moveTo(x, y);
    else spiky.lineTo(x, y);
  }
  spiky.closePath();
  ctx.fillStyle = '#2a0d12';
  ctx.fill(spiky);
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#ff2d3d'; // red danger rim
  ctx.stroke(spiky);

  const ball = ctx.createRadialGradient(-R * 0.25, -R * 0.3, 4, 0, 0, R * 0.72);
  ball.addColorStop(0, '#5a5a66');
  ball.addColorStop(1, '#0b0a10');
  ctx.fillStyle = ball;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.7, 0, Math.PI * 2);
  ctx.fill();

  // Skull.
  ctx.fillStyle = '#f2f2f2';
  ctx.beginPath();
  ctx.arc(0, -R * 0.08, R * 0.34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-R * 0.2, R * 0.12, R * 0.4, R * 0.2);
  ctx.fillStyle = '#0b0a10';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(side * R * 0.13, -R * 0.08, R * 0.09, R * 0.11, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(0, R * 0.04);
  ctx.lineTo(-R * 0.05, R * 0.13);
  ctx.lineTo(R * 0.05, R * 0.13);
  ctx.closePath();
  ctx.fill();
  for (const tx of [-0.1, 0, 0.1]) {
    ctx.fillRect(R * (tx - 0.015), R * 0.2, R * 0.03, R * 0.12);
  }
}

const DRAWINGS = {
  pumpkin: drawPumpkin,
  ghost: drawGhost,
  bat: drawBat,
  candy: drawCandyCorn,
  eyeball: drawEyeball,
  panther: drawPanther,
  frost: drawFrost,
  bomb: drawBomb,
};

/** Names you can use as "drawn:<name>" in config.js. */
export const DRAWN_NAMES = Object.keys(DRAWINGS);

/** Draw a named enemy into a new canvas. Returns null for unknown names. */
export function makeDrawnSprite(name) {
  const draw = DRAWINGS[name];
  if (!draw) return null;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SPRITE_SIZE;
  const ctx = canvas.getContext('2d');
  ctx.translate(SPRITE_SIZE / 2, SPRITE_SIZE / 2);
  ctx.lineJoin = 'round';
  draw(ctx);
  return canvas;
}
