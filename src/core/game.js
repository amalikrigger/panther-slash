// The game rules: throwing things, slicing them, scoring, lives and the timer.
//
// This file never touches the screen, the mouse or the speakers. It gets told
// how much time passed and where the blade moved, updates its state, and
// reports what happened as a list of events ("slice", "miss", "bomb", ...).
// The renderer and sound code react to those events. Keeping the rules
// separate means you can read (and test) them without the drawing code in the way.

import { segmentHitsCircle, randomBetween, pickWeighted, clamp, lerp } from './geometry.js';

/**
 * classic:   3 lives, a bomb ends the game
 * challenge: timed round, bombs cost points, Panther Frenzy at the end
 * attract:   harmless enemies on the title screen; nothing is scored or lost
 * @typedef {'classic' | 'challenge' | 'attract'} GameMode
 */

export class Game {
  /**
   * @param {object} options
   * @param {GameMode} options.mode
   * @param {object} options.rules   values from config.js (see buildRules in main.js)
   * @param {() => number} [options.random]  swap in a seeded random for tests
   */
  constructor({ mode, rules, random = Math.random }) {
    this.mode = mode;
    this.rules = rules;
    this.random = random;

    this.isOver = false;
    this.endReason = null; // 'time' | 'lives' | 'bomb'
    this.score = 0;
    this.lives = rules.lives;
    this.timeLeft = rules.roundSeconds;
    this.elapsed = 0;

    this.entities = []; // everything currently flying
    this.nextThrowIn = rules.spawn.firstThrowDelay;
    this.slowTimeLeft = 0; // seconds of Frost Orb slow-down left
    this.frenzyStarted = false;

    // Combo tracking: slices close together in time form a combo.
    this.comboCount = 0;
    this.comboTimer = 0;

    this.stats = { sliced: 0, missed: 0, bombs: 0, bestCombo: 0, criticals: 0, panthers: 0 };
    this.events = [];
    this.nextId = 1;
  }

  /**
   * Advance the game by `dt` seconds.
   * @param {number} dt
   * @param {Array<[number, number, number, number]>} bladeSegments  [ax, ay, bx, by] in world units
   * @param {{left: number, right: number, top: number, bottom: number}} bounds  the visible world
   * @returns {Array<object>} what happened this step
   */
  update(dt, bladeSegments, bounds) {
    this.events = [];
    if (this.isOver) {
      // Let whatever is still in the air fall off the screen, but nothing
      // counts any more.
      this.moveEntities(dt);
      this.removeFallen(bounds);
      return this.events;
    }

    // The Frost Orb slows the world (throws and movement) but not the round
    // timer, so a frozen moment is a real advantage.
    const worldDt = this.slowTimeLeft > 0 ? dt * this.rules.frostOrb.slowFactor : dt;
    this.slowTimeLeft = Math.max(0, this.slowTimeLeft - dt);

    this.elapsed += dt;
    this.updateTimer(dt);
    this.updateFrenzy();
    this.updateSpawning(worldDt, bounds);
    this.moveEntities(worldDt);
    if (!this.isOver) this.checkSlices(bladeSegments);
    this.removeFallen(bounds);
    this.updateCombo(dt);
    return this.events;
  }

  updateTimer(dt) {
    if (this.mode !== 'challenge') return;
    this.timeLeft = Math.max(0, this.timeLeft - dt);
    if (this.timeLeft === 0) this.end('time');
  }

  /** Is it the end-of-round Panther Frenzy right now? */
  get inFrenzy() {
    return this.mode === 'challenge' && !this.isOver && this.timeLeft <= this.rules.frenzy.lastSeconds;
  }

  updateFrenzy() {
    if (this.frenzyStarted || !this.inFrenzy) return;
    this.frenzyStarted = true;
    this.events.push({ type: 'frenzy' });
  }

  updateSpawning(dt, bounds) {
    if (this.isOver) return;
    this.nextThrowIn -= dt;
    if (this.nextThrowIn > 0) return;

    const spawn = this.rules.spawn;
    let interval = Math.max(spawn.minInterval, spawn.startInterval - spawn.intervalShrink * this.elapsed);
    if (this.inFrenzy) interval *= this.rules.frenzy.intervalFactor;
    this.nextThrowIn = interval;
    this.throwVolley(bounds);
  }

  /** How far into the game we are, from 0 (start) to 1 (late game). */
  get progress() {
    return clamp(this.elapsed / this.rules.spawn.lateGameAfter, 0, 1);
  }

  throwVolley(bounds) {
    const spawn = this.rules.spawn;
    const maxCount = Math.round(lerp(spawn.maxPerThrow, spawn.maxPerThrowLate, this.progress));
    const count = Math.floor(randomBetween(spawn.minPerThrow, maxCount + 1, this.random));
    const bombsAllowed = this.mode !== 'attract' && !(this.inFrenzy && !this.rules.frenzy.bombs);
    const bombChance = bombsAllowed ? lerp(spawn.bombChanceStart, spawn.bombChanceLate, this.progress) : 0;

    for (let i = 0; i < count; i++) {
      // Never make the very first thing of a volley a bomb, so every throw
      // has at least one thing worth slicing.
      const isBomb = i > 0 && this.random() < bombChance;
      this.launch(isBomb ? this.makeBomb() : this.makeEnemy(), bounds);
    }
    // Bonus targets: not in attract mode, where nothing counts.
    if (this.mode !== 'attract') {
      if (this.random() < this.rules.goldenPanther.chancePerThrow) this.launch(this.makePanther(), bounds);
      if (this.random() < this.rules.frostOrb.chancePerThrow) this.launch(this.makeFrostOrb(), bounds);
    }
    this.events.push({ type: 'throw', count });
  }

  makeEnemy() {
    const type = pickWeighted(this.rules.enemies, this.random);
    return { kind: 'enemy', type, radius: type.radius, points: type.points };
  }

  makeBomb() {
    const bomb = this.rules.bomb;
    return { kind: 'bomb', type: { id: 'bomb', ...bomb }, radius: bomb.radius, points: 0 };
  }

  makePanther() {
    const panther = this.rules.goldenPanther;
    return { kind: 'panther', type: { id: 'panther', ...panther }, radius: panther.radius, points: panther.points };
  }

  makeFrostOrb() {
    const orb = this.rules.frostOrb;
    return { kind: 'frost', type: { id: 'frost', ...orb }, radius: orb.radius, points: orb.points };
  }

  /**
   * Throw something up from below the screen so it peaks at a random height.
   * We work out the launch speed from the height we want it to reach, so
   * throws look right on short landscape screens and tall portrait ones.
   */
  launch(entity, bounds) {
    const spawn = this.rules.spawn;
    const g = this.rules.gravity;
    const height = bounds.bottom - bounds.top;
    const margin = entity.radius * 1.5;

    const startX = randomBetween(bounds.left + margin, bounds.right - margin, this.random);
    const startY = bounds.bottom + entity.radius;
    const apexY = bounds.top + height * randomBetween(spawn.apexMin, spawn.apexMax, this.random);

    // Physics: to rise a height h against gravity g you need speed sqrt(2gh).
    const rise = startY - apexY;
    const vy = -Math.sqrt(2 * g * rise);
    const flightTime = (2 * -vy) / g;

    // Drift toward a random landing spot that is still on screen.
    const landX = randomBetween(bounds.left + margin, bounds.right - margin, this.random);
    const vx = (landX - startX) / flightTime;

    Object.assign(entity, {
      id: this.nextId++,
      x: startX,
      y: startY,
      vx,
      vy,
      rotation: randomBetween(0, Math.PI * 2, this.random),
      spin: randomBetween(-spawn.spinMax, spawn.spinMax, this.random),
      hasRisen: false, // becomes true once it's on screen; stops "misses" before it appears
      sliced: false,
    });
    this.entities.push(entity);
  }

  moveEntities(dt) {
    const g = this.rules.gravity;
    for (const e of this.entities) {
      e.vy += g * dt;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.rotation += e.spin * dt;
    }
  }

  checkSlices(segments) {
    if (segments.length === 0) return;
    for (const e of this.entities) {
      if (e.sliced) continue;
      for (const [ax, ay, bx, by] of segments) {
        if (segmentHitsCircle(ax, ay, bx, by, e.x, e.y, e.radius)) {
          this.slice(e, Math.atan2(by - ay, bx - ax));
          break;
        }
      }
      if (this.isOver) return;
    }
  }

  slice(entity, angle) {
    entity.sliced = true;

    if (entity.kind === 'bomb') {
      this.stats.bombs++;
      // A bomb breaks the combo: no bonus, but it still counts for "best combo".
      this.stats.bestCombo = Math.max(this.stats.bestCombo, this.comboCount);
      this.comboCount = 0;
      if (this.mode === 'classic' && this.rules.bomb.classicEndsGame) {
        this.events.push({ type: 'bomb', entity, penalty: 0 });
        this.end('bomb');
      } else {
        const penalty = Math.min(this.score, this.rules.bomb.challengePenalty);
        this.score -= penalty;
        this.events.push({ type: 'bomb', entity, penalty });
      }
      return;
    }

    const critical = this.random() < this.rules.scoring.criticalChance;
    const points = entity.points * (critical ? 2 : 1);
    this.score += points;
    this.stats.sliced++;
    if (critical) this.stats.criticals++;
    if (entity.kind === 'panther') this.stats.panthers++;
    if (entity.kind === 'frost') {
      this.slowTimeLeft = this.rules.frostOrb.seconds;
      this.events.push({ type: 'frost', entity, seconds: this.rules.frostOrb.seconds });
    }

    this.comboCount++;
    this.comboTimer = this.rules.scoring.comboWindow;

    this.events.push({ type: 'slice', entity, angle, points, critical });
  }

  removeFallen(bounds) {
    const keep = [];
    for (const e of this.entities) {
      if (e.sliced) continue; // the renderer takes over sliced things (halves, splats)
      if (e.y < bounds.bottom) e.hasRisen = true;
      const fellOff = e.hasRisen && e.vy > 0 && e.y - e.radius > bounds.bottom;
      if (!fellOff) {
        keep.push(e);
        continue;
      }
      if (e.kind === 'enemy' && !this.isOver) this.miss(e);
    }
    this.entities = keep;
  }

  miss(entity) {
    this.stats.missed++;
    this.events.push({ type: 'miss', entity });
    if (this.mode !== 'classic') return;
    this.lives = Math.max(0, this.lives - 1);
    if (this.lives === 0) this.end('lives');
  }

  updateCombo(dt) {
    if (this.comboCount === 0) return;
    this.comboTimer -= dt;
    if (this.comboTimer > 0) return;
    this.finishCombo();
  }

  finishCombo() {
    const { comboMin, comboBonusPerHit } = this.rules.scoring;
    if (this.comboCount >= comboMin) {
      const bonus = this.comboCount * comboBonusPerHit;
      this.score += bonus;
      this.events.push({ type: 'combo', count: this.comboCount, bonus });
    }
    this.stats.bestCombo = Math.max(this.stats.bestCombo, this.comboCount);
    this.comboCount = 0;
  }

  end(reason) {
    if (this.isOver) return;
    // A combo still in progress when the round ends still counts.
    if (this.comboCount > 0) this.finishCombo();
    this.isOver = true;
    this.endReason = reason;
    this.events.push({ type: 'end', reason });
  }
}
