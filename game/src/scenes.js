// Twin Lanterns — scenes.js
// Five original scenes, each painted in code on a 600x600 canvas from a
// seeded RNG, so the left and right panels are pixel-identical except for
// the seven differences the game applies to the right one.
//
// Each scene: { id, name, sub, seed, paint(ctx, rng, mods), diffs }
//   paint draws the base scene; `mods` is a Set of difference indices that
//   are active for this panel (empty for the left panel, all seven never —
//   only the differences the player has NOT found yet... no: the right
//   panel always carries all seven; the left carries none).
//   diffs: [{ x, y, r, label }] — the click target of each difference.

import { hashSeed, mulberry32, range, int, pick } from './random.js';
import { SCENE_META } from './config.js';

// ---------- small canvas helpers (local to the painters) ----------

function circle(ctx, x, y, r, fill) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

function ellipse(ctx, x, y, rx, ry, fill) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

function rr(ctx, x, y, w, h, r, fill) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}

function poly(ctx, points, fill) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

/** A four-point sparkle star. */
function sparkle(ctx, x, y, r, fill) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fillStyle = fill;
  ctx.fill();
}

function vgrad(ctx, stops) {
  const g = ctx.createLinearGradient(0, 0, 0, 600);
  for (const [at, color] of stops) g.addColorStop(at, color);
  return g;
}

// ---------- Scene 1: Lantern Night Market ----------

function paintMarket(ctx, rng, mods) {
  ctx.fillStyle = vgrad(ctx, [[0, '#241d4e'], [0.55, '#4a2f5e'], [1, '#7a4a63']]);
  ctx.fillRect(0, 0, 600, 600);

  // Stars, seeded so both panels match.
  for (let i = 0; i < 42; i++) {
    const x = range(rng, 8, 592), y = range(rng, 8, 240);
    circle(ctx, x, y, range(rng, 0.8, 2.2), rng() < 0.5 ? '#ffe9a8' : '#ffffff');
  }
  // Diff 5: one extra bright star on the right panel.
  if (mods.has(5)) sparkle(ctx, 520, 60, 10, '#fff3b0');

  // Diff 0: the moon — a crescent on the left, full and gold on the right.
  if (mods.has(0)) {
    circle(ctx, 480, 90, 30, '#ffd94d');
    circle(ctx, 480, 90, 26, '#f2c94c');
  } else {
    circle(ctx, 480, 90, 30, '#ffe9a8');
    circle(ctx, 494, 82, 26, '#241d4e');
  }

  // Distant rooftops.
  ctx.fillStyle = '#2e2450';
  poly(ctx, [[0, 600], [0, 420], [90, 360], [180, 420], [260, 380], [340, 430], [430, 380], [520, 430], [600, 390], [600, 600]], '#2e2450');
  ctx.fillStyle = '#241d4e';
  for (const [x, y] of [[60, 392], [150, 402], [300, 408], [470, 404]]) {
    rr(ctx, x, y, 18, 24, 2, '#ffd94d');
  }

  // Lantern string across the top.
  ctx.strokeStyle = '#1c1436';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(20, 96);
  ctx.quadraticCurveTo(300, 150, 580, 96);
  ctx.stroke();
  const lanternXs = [80, 190, 300, 410, 520];
  const lanternCols = ['#ff5a4e', '#f2c94c', '#ff8a5c', '#f2c94c', '#ff5a4e'];
  lanternXs.forEach((x, i) => {
    // Diff 1: the middle lantern is missing on the right panel.
    if (i === 2 && mods.has(1)) return;
    const y = 96 + Math.sin((x / 600) * Math.PI) * 44 + 8;
    ctx.strokeStyle = '#1c1436';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y - 26); ctx.lineTo(x, y - 12); ctx.stroke();
    ellipse(ctx, x, y, 17, 22, lanternCols[i]);
    ctx.fillStyle = '#c9a227';
    ctx.fillRect(x - 17, y - 4, 34, 3);
    ctx.fillRect(x - 17, y + 6, 34, 3);
    ellipse(ctx, x, y - 23, 6, 4, '#c9a227');
    ellipse(ctx, x, y + 23, 6, 4, '#c9a227');
  });

  // Left stall: striped awning, counter, jars.
  const stripeCols = ['#ff7a6b', '#f5efe2', '#ff7a6b', '#f5efe2', '#ff7a6b', '#f5efe2', '#ff7a6b'];
  for (let i = 0; i < 7; i++) {
    // Diff 6: one awning stripe is teal on the right panel.
    const col = i === 3 && mods.has(6) ? '#4fc3b8' : stripeCols[i];
    poly(ctx, [[40 + i * 28, 300], [68 + i * 28, 300], [64 + i * 28, 340], [36 + i * 28, 340]], col);
  }
  rr(ctx, 36, 296, 208, 12, 4, '#3a2d5c');
  rr(ctx, 44, 340, 192, 90, 6, '#6b4a2f');
  rr(ctx, 44, 340, 192, 10, 4, '#8a6238');
  // Jars on the counter.
  const jarCols = ['#7bc96f', '#f2c94c', '#ff8a5c'];
  jarCols.forEach((c, i) => {
    const x = 70 + i * 62;
    rr(ctx, x, 296, 40, 44, 8, c);
    rr(ctx, x + 4, 288, 32, 10, 4, '#3a2d5c');
  });

  // Hanging TEA sign. Diff 4: its lantern glows green on the right.
  ctx.strokeStyle = '#1c1436'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(90, 150); ctx.lineTo(90, 168); ctx.stroke();
  rr(ctx, 58, 168, 64, 40, 6, mods.has(4) ? '#7bc96f' : '#ff5a4e');
  ctx.fillStyle = '#241d4e';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('TEA', 90, 189);

  // Diff 2: the cat napping on the awning.
  if (!mods.has(2)) {
    ellipse(ctx, 150, 258, 30, 16, '#2e2a33');
    circle(ctx, 172, 244, 12, '#2e2a33');
    poly(ctx, [[164, 236], [168, 222], [174, 234]], '#2e2a33');
    poly(ctx, [[178, 234], [184, 222], [186, 236]], '#2e2a33');
    ctx.strokeStyle = '#2e2a33'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(122, 262); ctx.quadraticCurveTo(106, 246, 116, 232); ctx.stroke();
    circle(ctx, 176, 242, 2, '#ffd94d');
  }

  // Right stall: fruit stand.
  rr(ctx, 384, 440, 176, 14, 4, '#8a6238');
  rr(ctx, 392, 454, 12, 66, 3, '#6b4a2f');
  rr(ctx, 540, 454, 12, 66, 3, '#6b4a2f');
  // Oranges in a pyramid; diff 3 removes one.
  const orangeSpots = [[420, 428], [452, 428], [484, 428], [516, 428], [436, 404], [468, 404], [500, 404], [452, 380], [484, 380], [468, 356]];
  orangeSpots.forEach(([x, y], i) => {
    if (i === 9 && mods.has(3)) return;
    circle(ctx, x, y, 13, '#ff8a3c');
    circle(ctx, x - 4, y - 4, 3, '#ffb37a');
  });
  // Price tag.
  rr(ctx, 520, 470, 34, 22, 4, '#f5efe2');
  ctx.fillStyle = '#241d4e'; ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('5¢', 537, 482);

  // Cobblestones at the bottom.
  ctx.fillStyle = '#3a2f52';
  ctx.fillRect(0, 520, 600, 80);
  for (let i = 0; i < 26; i++) {
    const x = range(rng, 6, 580), y = range(rng, 526, 590);
    ellipse(ctx, x, y, range(rng, 14, 26), range(rng, 6, 10), rng() < 0.5 ? '#453a63' : '#332a4d');
  }
  // Potted plant, bottom right.
  rr(ctx, 548, 556, 34, 30, 4, '#b5533c');
  circle(ctx, 565, 540, 16, '#4f9e57');
  circle(ctx, 552, 548, 12, '#5cb368');
  circle(ctx, 578, 548, 12, '#3f8a48');
}

const MARKET_DIFFS = [
  { x: 480, y: 90, r: 34, label: 'the moon' },
  { x: 300, y: 120, r: 30, label: 'a paper lantern' },
  { x: 150, y: 255, r: 36, label: 'the cat on the awning' },
  { x: 468, y: 356, r: 24, label: 'an orange on the fruit stand' },
  { x: 90, y: 180, r: 26, label: 'the TEA sign lantern' },
  { x: 520, y: 60, r: 16, label: 'a bright star' },
  { x: 240, y: 320, r: 28, label: 'an awning stripe' },
];

// ---------- Scene 2: Coral Reef ----------

function paintReef(ctx, rng, mods) {
  ctx.fillStyle = vgrad(ctx, [[0, '#0e6b7d'], [0.6, '#0a4a63'], [1, '#083049']]);
  ctx.fillRect(0, 0, 600, 600);

  // Light rays from the surface.
  ctx.fillStyle = 'rgba(255, 244, 190, 0.10)';
  for (const [x, w] of [[60, 46], [210, 30], [360, 52], [500, 34]]) {
    poly(ctx, [[x, 0], [x + w, 0], [x + w + 90, 600], [x + 90, 600]], 'rgba(255, 244, 190, 0.10)');
  }

  // Bubbles, seeded. Diff 2 adds one bright cluster on the right.
  for (let i = 0; i < 22; i++) {
    const x = range(rng, 20, 580), y = range(rng, 60, 540);
    circle(ctx, x, y, range(rng, 2, 6), 'rgba(220, 245, 255, 0.55)');
  }
  if (mods.has(2)) {
    for (const [x, y, r] of [[520, 120, 7], [534, 104, 5], [508, 102, 4], [528, 88, 3]]) {
      circle(ctx, x, y, r, 'rgba(220, 245, 255, 0.85)');
    }
  }

  // Sandy floor.
  ctx.fillStyle = '#d9c08a';
  ctx.beginPath(); ctx.moveTo(0, 540); ctx.quadraticCurveTo(300, 500, 600, 545); ctx.lineTo(600, 600); ctx.lineTo(0, 600); ctx.closePath(); ctx.fill();
  for (let i = 0; i < 18; i++) {
    const x = range(rng, 10, 590), y = range(rng, 545, 590);
    ellipse(ctx, x, y, range(rng, 3, 7), range(rng, 2, 4), '#c4a76e');
  }

  // Seaweed. Diff 6: the tall blade on the left is short on the right.
  const weed = (x, h, col) => {
    ctx.strokeStyle = col; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, 560);
    ctx.quadraticCurveTo(x - 14, 560 - h * 0.5, x + 8, 560 - h);
    ctx.stroke();
  };
  weed(80, mods.has(6) ? 60 : 130, '#3f9e57');
  weed(104, 100, '#57b368');
  weed(560, 110, '#3f9e57');
  weed(584, 80, '#57b368');

  // Corals.
  const coralBranch = (x, y, len, ang, col, depth) => {
    if (depth === 0) return;
    const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
    ctx.strokeStyle = col; ctx.lineWidth = 7 - depth; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke();
    coralBranch(x2, y2, len * 0.72, ang - 0.5, col, depth - 1);
    coralBranch(x2, y2, len * 0.72, ang + 0.45, col, depth - 1);
  };
  coralBranch(110, 545, 46, -Math.PI / 2 - 0.3, '#ff7a9e', 3);
  coralBranch(120, 545, 40, -Math.PI / 2 + 0.4, '#ff7a9e', 3);
  coralBranch(480, 548, 42, -Math.PI / 2, '#ff9e5c', 3);
  // Centre purple coral; diff 4 removes its right branch.
  coralBranch(300, 550, 44, -Math.PI / 2 - 0.35, '#b678e8', 3);
  if (!mods.has(4)) coralBranch(318, 512, 34, -Math.PI / 2 + 0.55, '#b678e8', 2);

  // Anemone.
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI / 2 + (i - 4) * 0.16;
    ctx.strokeStyle = '#ff8ab0'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(210, 552);
    ctx.quadraticCurveTo(210 + Math.cos(a) * 22, 552 + Math.sin(a) * 26, 210 + Math.cos(a) * 40, 552 + Math.sin(a) * 46);
    ctx.stroke();
  }

  // Fish. Diff 1: the yellow fish turns blue on the right.
  const fish = (x, y, s, col, flip) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(flip ? -s : s, s);
    ellipse(ctx, 0, 0, 26, 14, col);
    poly(ctx, [[-22, 0], [-34, -12], [-34, 12]], col);
    circle(ctx, 12, -3, 3, '#12303f');
    ctx.restore();
  };
  fish(180, 200, 1, mods.has(1) ? '#4f9ef2' : '#f2c94c', false);
  fish(340, 150, 0.8, '#ff8a5c', true);
  fish(90, 330, 0.7, '#ff7a9e', false);
  fish(520, 250, 0.9, '#7bc96f', true);
  fish(260, 90, 0.6, '#e8e4f5', false);

  // Diff 0: the turtle, gliding mid-water.
  if (!mods.has(0)) {
    ellipse(ctx, 430, 300, 44, 28, '#5a8a5c');
    circle(ctx, 478, 296, 14, '#6fae6b');
    circle(ctx, 482, 292, 2.5, '#12303f');
    ellipse(ctx, 430, 300, 30, 18, '#7ba05c');
    const flipper = (x, y, dx, dy) => {
      ctx.strokeStyle = '#5a8a5c'; ctx.lineWidth = 10; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx, y + dy); ctx.stroke();
    };
    flipper(400, 316, -18, 14); flipper(458, 316, 16, 14);
    flipper(404, 284, -14, -12); flipper(456, 284, 14, -12);
  }

  // Diff 3: the starfish — orange on the left, violet on the right.
  const starfish = (x, y, col) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      const a2 = a + Math.PI / 5;
      ctx.lineTo(x + Math.cos(a) * 26, y + Math.sin(a) * 26);
      ctx.lineTo(x + Math.cos(a2) * 11, y + Math.sin(a2) * 11);
    }
    ctx.closePath(); ctx.fill();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      circle(ctx, x + Math.cos(a) * 13, y + Math.sin(a) * 13, 2.5, 'rgba(255,255,255,0.7)');
    }
  };
  starfish(120, 520, mods.has(3) ? '#b678e8' : '#ff8a3c');

  // Diff 5: the treasure chest — shut on the left, open and glowing on the right.
  rr(ctx, 448, 516, 64, 34, 6, '#6b4a2f');
  ctx.fillStyle = '#c9a227';
  ctx.fillRect(448, 528, 64, 6);
  circle(ctx, 480, 532, 6, '#ffd94d');
  if (mods.has(5)) {
    poly(ctx, [[448, 516], [512, 516], [500, 484], [460, 484]], '#8a6238');
    circle(ctx, 480, 506, 14, 'rgba(255, 217, 77, 0.85)');
    sparkle(ctx, 470, 496, 7, '#fff3b0');
    sparkle(ctx, 492, 502, 5, '#fff3b0');
  } else {
    rr(ctx, 448, 500, 64, 18, 8, '#8a6238');
  }

  // Small shells.
  for (const [x, y, c] of [[240, 566, '#ff9e9e'], [350, 572, '#e8e4f5'], [540, 566, '#ffd94d']]) {
    ellipse(ctx, x, y, 10, 7, c);
  }
}

const REEF_DIFFS = [
  { x: 430, y: 300, r: 40, label: 'the turtle' },
  { x: 180, y: 200, r: 26, label: 'a yellow fish' },
  { x: 520, y: 110, r: 20, label: 'a cluster of bubbles' },
  { x: 120, y: 520, r: 28, label: 'the starfish' },
  { x: 336, y: 486, r: 26, label: 'a coral branch' },
  { x: 480, y: 510, r: 34, label: 'the treasure chest lid' },
  { x: 80, y: 500, r: 30, label: 'a tall seaweed blade' },
];

// ---------- Scene 3: Mountain Tea House ----------

function paintTeaHouse(ctx, rng, mods) {
  ctx.fillStyle = vgrad(ctx, [[0, '#f7b267'], [0.45, '#e08a7a'], [0.7, '#8a5a7d'], [1, '#4a3a63']]);
  ctx.fillRect(0, 0, 600, 600);

  // Diff 1: the moon — pale gold on the left, rose pink on the right.
  circle(ctx, 500, 90, 30, mods.has(1) ? '#ff9eb0' : '#ffe9a8');
  circle(ctx, 500, 90, 22, mods.has(1) ? '#ff7a9e' : '#fff3c4');

  // Clouds. Diff 4 adds one on the right.
  const cloud = (x, y, s) => {
    ctx.fillStyle = 'rgba(255, 236, 220, 0.85)';
    ellipse(ctx, x, y, 42 * s, 14 * s, 'rgba(255, 236, 220, 0.85)');
    ellipse(ctx, x - 24 * s, y + 6 * s, 24 * s, 10 * s, 'rgba(255, 236, 220, 0.85)');
    ellipse(ctx, x + 26 * s, y + 6 * s, 26 * s, 11 * s, 'rgba(255, 236, 220, 0.85)');
  };
  cloud(120, 120, 1);
  cloud(330, 70, 0.8);
  if (mods.has(4)) cloud(200, 80, 0.9);

  // Mountain ridges.
  poly(ctx, [[0, 600], [0, 330], [120, 250], [230, 330], [340, 260], [470, 350], [600, 300], [600, 600]], '#5c4a72');
  poly(ctx, [[0, 600], [0, 420], [150, 340], [280, 420], [420, 350], [600, 430], [600, 600]], '#46355c');
  // Snow caps.
  poly(ctx, [[104, 262], [120, 250], [136, 262], [128, 268], [120, 262], [112, 268]], '#f5efe2');
  poly(ctx, [[324, 272], [340, 260], [356, 272], [348, 278], [340, 272], [332, 278]], '#f5efe2');

  // The pagoda.
  const pagoda = (cx, baseY) => {
    ctx.fillStyle = '#7a3b2e';
    rr(ctx, cx - 46, baseY - 150, 92, 150, 4, '#8a4a35');
    // Roof tiers.
    for (let t = 0; t < 3; t++) {
      const y = baseY - 150 - t * 42;
      const w = 130 - t * 16;
      poly(ctx, [[cx - w / 2 - 12, y], [cx + w / 2 + 12, y], [cx + w / 2 - 8, y - 26], [cx - w / 2 + 8, y - 26]], '#3a2d5c');
      poly(ctx, [[cx - w / 2 - 12, y], [cx + w / 2 + 12, y], [cx, y - 34]], '#2c2340');
    }
    // Diff 3: the window glows on the left, dark on the right.
    rr(ctx, cx - 12, baseY - 120, 24, 30, 4, mods.has(3) ? '#3a2d5c' : '#ffd94d');
    rr(ctx, cx - 34, baseY - 60, 20, 26, 3, mods.has(3) ? '#3a2d5c' : '#ffd94d');
    rr(ctx, cx + 14, baseY - 60, 20, 26, 3, mods.has(3) ? '#3a2d5c' : '#ffd94d');
    // Door.
    rr(ctx, cx - 14, baseY - 34, 28, 34, 10, '#3a2d5c');
  };
  pagoda(300, 470);

  // Cherry tree. Diff 2 removes one blossom branch on the right.
  ctx.strokeStyle = '#4a2f25'; ctx.lineWidth = 12; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(140, 470); ctx.quadraticCurveTo(130, 360, 150, 260); ctx.stroke();
  ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(146, 330); ctx.quadraticCurveTo(110, 290, 90, 250); ctx.stroke();
  if (!mods.has(2)) {
    ctx.beginPath(); ctx.moveTo(148, 300); ctx.quadraticCurveTo(190, 260, 210, 220); ctx.stroke();
  }
  const blossom = (x, y, r) => {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      circle(ctx, x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.5, '#ffb7c9');
    }
    circle(ctx, x, y, r * 0.45, '#ffd94d');
  };
  blossom(150, 210, 34);
  blossom(96, 240, 26);
  if (!mods.has(2)) blossom(210, 214, 26);
  blossom(120, 180, 22);
  // Falling petals.
  for (let i = 0; i < 12; i++) {
    const x = range(rng, 60, 260), y = range(rng, 260, 470);
    ellipse(ctx, x, y, 5, 3, '#ffb7c9');
  }

  // Bamboo, right side.
  for (const x of [540, 566]) {
    ctx.strokeStyle = '#5a9e4f'; ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, 470); ctx.lineTo(x + 6, 300); ctx.stroke();
    ctx.fillStyle = '#6fbf63';
    ellipse(ctx, x + 10, 330, 18, 8, '#6fbf63');
    ellipse(ctx, x - 4, 360, 16, 7, '#6fbf63');
  }

  // Koi pond.
  ellipse(ctx, 300, 520, 210, 46, '#3d6b8a');
  ellipse(ctx, 300, 520, 196, 38, '#4a7d9e');
  const koi = (x, y, col, flip) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(flip ? -1 : 1, 1);
    ellipse(ctx, 0, 0, 22, 9, col);
    poly(ctx, [[-20, 0], [-30, -8], [-30, 8]], col);
    circle(ctx, 12, -2, 2, '#12303f');
    ctx.restore();
  };
  koi(250, 510, '#ff8a3c', false);
  koi(330, 532, '#f5efe2', true);
  // Diff 0: the third koi is gone on the right.
  if (!mods.has(0)) koi(380, 514, '#ffd94d', false);

  // Wooden bridge over the pond. Diff 6: one plank is pale on the right.
  for (let i = 0; i < 7; i++) {
    const x = 210 + i * 26;
    rr(ctx, x, 486, 22, 12, 3, i === 3 && mods.has(6) ? '#e8dcc0' : '#8a6238');
  }
  ctx.strokeStyle = '#6b4a2f'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(206, 486); ctx.quadraticCurveTo(300, 470, 394, 486); ctx.stroke();

  // Diff 5: the stone lantern — lit on the left, dark on the right.
  rr(ctx, 508, 440, 26, 60, 4, '#7a7a82');
  rr(ctx, 496, 428, 50, 14, 4, '#8a8a92');
  rr(ctx, 500, 500, 42, 10, 3, '#8a8a92');
  if (mods.has(5)) {
    rr(ctx, 512, 446, 18, 16, 3, '#3a2d5c');
  } else {
    circle(ctx, 521, 454, 9, '#ffd94d');
    circle(ctx, 521, 454, 14, 'rgba(255, 217, 77, 0.35)');
  }

  // Grass at the bottom.
  ctx.fillStyle = '#3f6b3a';
  ctx.fillRect(0, 560, 600, 40);
  for (let i = 0; i < 30; i++) {
    const x = range(rng, 6, 594);
    ctx.strokeStyle = '#57a04e'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, 598); ctx.lineTo(x + 3, 586); ctx.stroke();
  }
}

const TEA_HOUSE_DIFFS = [
  { x: 380, y: 514, r: 26, label: 'a koi fish' },
  { x: 500, y: 90, r: 30, label: 'the moon' },
  { x: 210, y: 214, r: 30, label: 'a cherry branch' },
  { x: 300, y: 340, r: 22, label: 'a pagoda window' },
  { x: 200, y: 80, r: 28, label: 'a cloud' },
  { x: 521, y: 454, r: 24, label: 'the stone lantern flame' },
  { x: 300, y: 492, r: 26, label: 'a bridge plank' },
];

// ---------- Scene 4: Starlight Library ----------

function paintLibrary(ctx, rng, mods) {
  ctx.fillStyle = vgrad(ctx, [[0, '#6b4a2f'], [1, '#4a3220']]);
  ctx.fillRect(0, 0, 600, 600);

  // Window with night sky. Diff 3: crescent moon vs full moon.
  rr(ctx, 420, 56, 150, 170, 8, '#241d4e');
  rr(ctx, 428, 64, 134, 154, 6, '#2e2450');
  for (let i = 0; i < 16; i++) {
    const x = range(rng, 438, 552), y = range(rng, 74, 200);
    circle(ctx, x, y, range(rng, 1, 2.4), '#fff3b0');
  }
  // Diff 5: one extra bright star in the window.
  if (mods.has(5)) sparkle(ctx, 520, 90, 9, '#fff3b0');
  if (mods.has(3)) {
    circle(ctx, 480, 130, 22, '#ffe9a8');
  } else {
    circle(ctx, 480, 130, 22, '#ffe9a8');
    circle(ctx, 492, 122, 19, '#2e2450');
  }
  ctx.strokeStyle = '#8a6238'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(495, 64); ctx.lineTo(495, 218); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(428, 141); ctx.lineTo(562, 141); ctx.stroke();
  // Curtains.
  poly(ctx, [[408, 48], [440, 48], [428, 240], [404, 240]], '#a03d40');
  poly(ctx, [[550, 48], [582, 48], [586, 240], [562, 240]], '#a03d40');

  // Bookshelves, left and right.
  const shelf = (x, y, w, h) => {
    rr(ctx, x, y, w, h, 6, '#5a3d24');
    for (let s = 0; s < 3; s++) {
      const sy = y + 14 + s * ((h - 28) / 3);
      rr(ctx, x + 8, sy + (h - 28) / 3 - 8, w - 16, 8, 2, '#3a2a18');
      let bx = x + 12;
      while (bx < x + w - 22) {
        const bw = range(rng, 12, 20), bh = range(rng, 34, 52);
        const cols = ['#b5533c', '#3f6b8a', '#4f9e57', '#c9a227', '#7a4a8a', '#2f5d50'];
        rr(ctx, bx, sy + (h - 28) / 3 - 8 - bh, bw, bh, 2, pick(rng, cols));
        bx += bw + 2;
      }
    }
  };
  shelf(36, 120, 170, 360);
  shelf(394, 250, 176, 230);
  // Diff 2: one book spine on the top-left shelf changes colour.
  // (Repainted deterministically after the seeded shelf so it always lands.)
  rr(ctx, 96, 138, 15, 44, 2, mods.has(2) ? '#3f6b8a' : '#b5533c');

  // Hanging lamp.
  ctx.strokeStyle = '#2c2340'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(300, 0); ctx.lineTo(300, 84); ctx.stroke();
  poly(ctx, [[272, 84], [328, 84], [312, 116], [288, 116]], '#c9a227');
  circle(ctx, 300, 122, 12, '#ffe9a8');
  circle(ctx, 300, 122, 26, 'rgba(255, 233, 168, 0.25)');

  // Armchair.
  rr(ctx, 210, 400, 130, 110, 18, '#7a3b4a');
  rr(ctx, 220, 360, 110, 60, 16, '#8a4a5a');
  rr(ctx, 196, 420, 22, 70, 10, '#7a3b4a');
  rr(ctx, 332, 420, 22, 70, 10, '#7a3b4a');

  // Rug.
  ellipse(ctx, 300, 540, 150, 34, '#a03d40');
  ellipse(ctx, 300, 540, 118, 24, '#c96a5a');
  ellipse(ctx, 300, 540, 84, 16, '#e8a87a');

  // Diff 0: the cat curled on the rug.
  if (!mods.has(0)) {
    ellipse(ctx, 300, 528, 34, 16, '#e8a87a');
    circle(ctx, 328, 516, 12, '#e8a87a');
    poly(ctx, [[320, 508], [324, 494], [330, 506]], '#e8a87a');
    poly(ctx, [[334, 506], [340, 494], [342, 508]], '#e8a87a');
    ctx.strokeStyle = '#e8a87a'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(268, 532); ctx.quadraticCurveTo(252, 540, 262, 548); ctx.stroke();
  }

  // Side table with candles. Diff 1: one candle is missing on the right.
  rr(ctx, 420, 400, 110, 12, 4, '#6b4a2f');
  rr(ctx, 470, 412, 10, 60, 3, '#5a3d24');
  const candle = (x, h, lit) => {
    rr(ctx, x, 400 - h, 12, h, 3, '#f5efe2');
    if (lit) {
      ellipse(ctx, x + 6, 400 - h - 8, 4, 8, '#ff9e3c');
      circle(ctx, x + 6, 400 - h - 8, 9, 'rgba(255, 158, 60, 0.3)');
    }
  };
  candle(432, 34, true);
  if (!mods.has(1)) candle(462, 44, true);
  candle(494, 30, true);

  // Teapot and cup. Diff 4: the cup is gone on the right.
  ellipse(ctx, 452, 392, 20, 12, '#3f6b8a');
  poly(ctx, [[470, 386], [484, 380], [484, 392]], '#3f6b8a');
  rr(ctx, 446, 372, 12, 10, 3, '#3f6b8a');
  if (!mods.has(4)) {
    rr(ctx, 500, 388, 18, 12, 3, '#f5efe2');
    ctx.strokeStyle = '#f5efe2'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(520, 394, 6, -Math.PI / 2, Math.PI / 2); ctx.stroke();
  }

  // Diff 6: the globe — its landmass sits on the other side on the right.
  circle(ctx, 110, 460, 26, '#4f9ef2');
  ctx.fillStyle = '#7bc96f';
  ctx.beginPath();
  if (mods.has(6)) {
    ctx.arc(118, 462, 12, 0, Math.PI * 2);
    ctx.arc(100, 448, 7, 0, Math.PI * 2);
  } else {
    ctx.arc(102, 456, 12, 0, Math.PI * 2);
    ctx.arc(120, 472, 7, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(110, 460, 28, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(110, 488); ctx.lineTo(110, 506); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(92, 506); ctx.lineTo(128, 506); ctx.stroke();

  // Stacked books on the floor, under the side table — clear of the cat.
  rr(ctx, 400, 568, 70, 12, 3, '#3f6b8a');
  rr(ctx, 406, 556, 60, 12, 3, '#b5533c');
  rr(ctx, 412, 544, 48, 12, 3, '#4f9e57');
}

const LIBRARY_DIFFS = [
  { x: 300, y: 528, r: 36, label: 'the cat on the rug' },
  { x: 468, y: 366, r: 22, label: 'a candle' },
  { x: 103, y: 160, r: 22, label: 'a book spine' },
  { x: 480, y: 130, r: 28, label: 'the moon in the window' },
  { x: 509, y: 394, r: 20, label: 'the teacup' },
  { x: 520, y: 90, r: 16, label: 'a bright star' },
  { x: 110, y: 460, r: 28, label: 'the globe' },
];

// ---------- Scene 5: Autumn Picnic Meadow ----------

function paintMeadow(ctx, rng, mods) {
  ctx.fillStyle = vgrad(ctx, [[0, '#ffe3a1'], [0.5, '#ffd27a'], [1, '#f7b267']]);
  ctx.fillRect(0, 0, 600, 600);

  // Diff 5: the sun — rays on the left, plain on the right.
  circle(ctx, 520, 80, 34, '#ffd94d');
  if (!mods.has(5)) {
    ctx.strokeStyle = '#f2c94c'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(520 + Math.cos(a) * 42, 80 + Math.sin(a) * 42);
      ctx.lineTo(520 + Math.cos(a) * 56, 80 + Math.sin(a) * 56);
      ctx.stroke();
    }
  }

  // Clouds. Diff 4 adds one on the right.
  const cloud = (x, y, s) => {
    ctx.fillStyle = 'rgba(255, 251, 240, 0.95)';
    ellipse(ctx, x, y, 44 * s, 15 * s, 'rgba(255, 251, 240, 0.95)');
    ellipse(ctx, x - 26 * s, y + 6 * s, 26 * s, 11 * s, 'rgba(255, 251, 240, 0.95)');
    ellipse(ctx, x + 28 * s, y + 6 * s, 28 * s, 12 * s, 'rgba(255, 251, 240, 0.95)');
  };
  cloud(300, 100, 1);
  cloud(430, 170, 0.7);
  if (mods.has(4)) cloud(120, 90, 0.85);

  // Diff 0: the kite — three tail bows on the left, two on the right.
  const kite = (x, y) => {
    poly(ctx, [[x, y - 34], [x + 26, y], [x, y + 34], [x - 26, y]], '#ff5a4e');
    poly(ctx, [[x, y - 34], [x + 26, y], [x, y]], '#ff8a5c');
    ctx.strokeStyle = '#7a4a2f'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y + 34);
    ctx.quadraticCurveTo(x - 20, y + 90, x + 4, y + 130); ctx.stroke();
    const bows = mods.has(0) ? 2 : 3;
    for (let i = 0; i < bows; i++) {
      const by = y + 62 + i * 34;
      poly(ctx, [[x - 8, by - 6], [x + 8, by - 6], [x, by + 8]], '#f2c94c');
    }
  };
  kite(420, 150);

  // Oak tree.
  ctx.fillStyle = '#6b4a2f';
  ctx.beginPath(); ctx.moveTo(104, 480); ctx.lineTo(116, 330); ctx.lineTo(132, 330); ctx.lineTo(146, 480); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#6b4a2f'; ctx.lineWidth = 9; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(120, 360); ctx.quadraticCurveTo(80, 320, 66, 280); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(124, 350); ctx.quadraticCurveTo(160, 310, 178, 272); ctx.stroke();
  const foliage = (x, y, r, col) => circle(ctx, x, y, r, col);
  foliage(120, 260, 62, '#c96a2e');
  foliage(70, 290, 44, '#d97e35');
  foliage(172, 288, 46, '#b85c28');
  foliage(120, 210, 40, '#e08a3c');
  // Falling leaves.
  for (let i = 0; i < 14; i++) {
    const x = range(rng, 40, 260), y = range(rng, 300, 480);
    ellipse(ctx, x, y, 6, 3, pick(rng, ['#e08a3c', '#f2c94c', '#c96a2e']));
  }

  // Meadow.
  ctx.fillStyle = vgrad(ctx, [[0, '#8ab84f'], [1, '#5a9e4f']]);
  ctx.beginPath(); ctx.moveTo(0, 470); ctx.quadraticCurveTo(300, 430, 600, 470); ctx.lineTo(600, 600); ctx.lineTo(0, 600); ctx.closePath(); ctx.fill();
  for (let i = 0; i < 26; i++) {
    const x = range(rng, 8, 592), y = range(rng, 480, 592);
    ctx.strokeStyle = '#4f8a44'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 2, y - 8); ctx.stroke();
  }

  // Flowers. Diff 6: one daisy is violet on the right.
  const flower = (x, y, petal) => {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      circle(ctx, x + Math.cos(a) * 7, y + Math.sin(a) * 7, 5, petal);
    }
    circle(ctx, x, y, 5, '#ffd94d');
  };
  flower(150, 540, mods.has(6) ? '#b678e8' : '#f5efe2');
  flower(90, 500, '#f5efe2');
  flower(540, 460, '#ff9e9e');
  flower(480, 560, '#f5efe2');

  // Diff 2: the mushroom by the oak.
  if (!mods.has(2)) {
    rr(ctx, 514, 516, 12, 18, 3, '#f5efe2');
    ctx.beginPath(); ctx.arc(520, 516, 20, Math.PI, 0); ctx.closePath();
    ctx.fillStyle = '#e5534b'; ctx.fill();
    circle(ctx, 512, 506, 3, '#f5efe2');
    circle(ctx, 526, 510, 3, '#f5efe2');
  }

  // Picnic blanket.
  for (let rI = 0; rI < 4; rI++) {
    for (let cI = 0; cI < 6; cI++) {
      rr(ctx, 250 + cI * 26, 500 + rI * 20, 26, 20, 2, (rI + cI) % 2 === 0 ? '#f5efe2' : '#e5534b');
    }
  }
  // Basket.
  rr(ctx, 380, 520, 56, 34, 6, '#8a6238');
  ctx.fillStyle = '#6b4a2f';
  ctx.fillRect(380, 532, 56, 4);
  ctx.fillRect(380, 544, 56, 4);
  ctx.strokeStyle = '#6b4a2f'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(408, 520, 16, Math.PI, 0); ctx.stroke();
  // Apples on the blanket. Diff 3 removes one.
  const appleSpots = [[280, 490], [310, 492], [340, 490]];
  appleSpots.forEach(([x, y], i) => {
    if (i === 2 && mods.has(3)) return;
    circle(ctx, x, y, 10, '#e5534b');
    ctx.strokeStyle = '#4f9e57'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y - 10); ctx.lineTo(x + 3, y - 16); ctx.stroke();
  });
  // Sandwich.
  poly(ctx, [[360, 486], [384, 486], [372, 502]], '#f2d8a0');
  poly(ctx, [[360, 486], [384, 486], [372, 494]], '#7bc96f');

  // Diff 1: butterflies — one is orange on the left, blue on the right.
  const butterfly = (x, y, col, s) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ellipse(ctx, -7, -4, 9, 6, col);
    ellipse(ctx, 7, -4, 9, 6, col);
    ellipse(ctx, -6, 6, 7, 5, col);
    ellipse(ctx, 6, 6, 7, 5, col);
    ctx.strokeStyle = '#3a2d5c'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(0, 8); ctx.stroke();
    ctx.restore();
  };
  butterfly(200, 300, mods.has(1) ? '#4f9ef2' : '#ff8a3c', 1);
  butterfly(330, 240, '#ff7a9e', 0.8);
  butterfly(480, 330, '#f2c94c', 0.9);
}

const MEADOW_DIFFS = [
  { x: 420, y: 212, r: 26, label: 'a kite tail bow' },
  { x: 200, y: 300, r: 24, label: 'a butterfly' },
  { x: 520, y: 516, r: 24, label: 'the mushroom' },
  { x: 340, y: 490, r: 22, label: 'an apple on the blanket' },
  { x: 120, y: 90, r: 26, label: 'a cloud' },
  { x: 520, y: 80, r: 30, label: 'the sun' },
  { x: 150, y: 540, r: 22, label: 'a daisy' },
];

// ---------- the scene table ----------

const PAINTS = [paintMarket, paintReef, paintTeaHouse, paintLibrary, paintMeadow];
const DIFF_LISTS = [MARKET_DIFFS, REEF_DIFFS, TEA_HOUSE_DIFFS, LIBRARY_DIFFS, MEADOW_DIFFS];

export const SCENES = SCENE_META.map((meta, i) => ({
  ...meta,
  seed: hashSeed(`twin-lanterns:${meta.id}`),
  paint: PAINTS[i],
  diffs: DIFF_LISTS[i],
}));

/** A fresh RNG for one panel of one scene. */
export function sceneRng(scene) {
  return mulberry32(scene.seed);
}

/** Paint one scene into a panel-sized context; `mods` holds the active diffs. */
export function paintScene(scene, ctx, mods) {
  ctx.save();
  ctx.clearRect(0, 0, 600, 600);
  scene.paint(ctx, sceneRng(scene), mods);
  ctx.restore();
}
