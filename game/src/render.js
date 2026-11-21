// Twin Lanterns — render.js
// Everything the player sees while playing: the header, the two picture
// panels with their found-markers, the magnifier lens, the footer dots.
// Menus (title, intro, results) live in ui.js. Scenes are pre-rendered once
// per scene into offscreen canvases — the frame itself is just drawImage.

import { FIELD, PANEL, HEADER, FOOTER, PALETTE, FONT, DIFFS_PER_SCENE, SCENE_TIME } from './config.js';
import { paintScene } from './scenes.js';

/** Pre-render both panels of a scene: left is the original, right carries all 7 differences. */
export function buildPanels(scene) {
  const left = document.createElement('canvas');
  left.width = PANEL.size;
  left.height = PANEL.size;
  const right = document.createElement('canvas');
  right.width = PANEL.size;
  right.height = PANEL.size;
  paintScene(scene, left.getContext('2d'), new Set());
  paintScene(scene, right.getContext('2d'), new Set([0, 1, 2, 3, 4, 5, 6]));
  return { left, right };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function text(ctx, str, x, y, size, color, weight = 600, align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

/** The header: title, scene name, score, combo and the timer bar. */
function drawHeader(ctx, S, now) {
  ctx.fillStyle = PALETTE.header;
  ctx.fillRect(0, 0, FIELD.width, HEADER.height);
  ctx.fillStyle = PALETTE.panelEdge;
  ctx.fillRect(0, HEADER.height - 2, FIELD.width, 2);

  text(ctx, '🏮 Twin Lanterns', 24, 26, 24, PALETTE.gold, 800);
  text(ctx, `Scene ${S.sceneIndex + 1} of 5 — ${S.scene.name}`, 24, 54, 14, PALETTE.muted, 500);

  // Found counter, big and centred: the judge's first criterion counts it.
  const found = S.found.size;
  text(ctx, `Found ${found} / ${DIFFS_PER_SCENE}`, FIELD.width / 2, 26, 26, PALETTE.text, 800, 'center');
  text(ctx, found === DIFFS_PER_SCENE ? 'All found!' : `${DIFFS_PER_SCENE - found} still hidden`, FIELD.width / 2, 54, 13, PALETTE.gold, 600, 'center');

  text(ctx, `Score ${S.score.toLocaleString()}`, FIELD.width - 24, 22, 20, PALETTE.text, 700, 'right');
  if (S.combo > 1) {
    text(ctx, `Combo ×${S.combo.toFixed(1)}`, FIELD.width - 24, 50, 14, PALETTE.coral, 700, 'right');
  } else {
    text(ctx, `Best ${Math.max(S.best, S.score).toLocaleString()}`, FIELD.width - 24, 50, 13, PALETTE.muted, 500, 'right');
  }

  // Timer bar under the header text.
  const frac = Math.max(0, S.timeLeft / SCENE_TIME);
  const barX = 24, barW = FIELD.width - 48, barY = HEADER.height - 8;
  ctx.fillStyle = '#3a2d5c';
  roundRect(ctx, barX, barY, barW, 5, 2.5);
  ctx.fill();
  const low = S.timeLeft <= 30;
  const pulse = low ? 0.65 + 0.35 * Math.sin(now / 130) : 1;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = low ? PALETTE.timerLow : PALETTE.timerFull;
  roundRect(ctx, barX, barY, barW * frac, 5, 2.5);
  ctx.fill();
  ctx.globalAlpha = 1;
  const secs = Math.ceil(S.timeLeft);
  text(ctx, `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`, FIELD.width - 24, barY + 2, 12, low ? PALETTE.timerLow : PALETTE.muted, 700, 'right');
}

/** The seven progress dots in the footer. */
function drawDots(ctx, S) {
  const cy = FOOTER.y + 30;
  text(ctx, 'Differences', 24, cy, 14, PALETTE.muted, 600);
  for (let i = 0; i < DIFFS_PER_SCENE; i++) {
    const x = 140 + i * 30;
    ctx.beginPath();
    ctx.arc(x, cy, 9, 0, Math.PI * 2);
    if (S.found.has(i)) {
      ctx.fillStyle = PALETTE.gold;
      ctx.fill();
      ctx.fillStyle = '#7a5c00';
      ctx.font = `800 11px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✓', x, cy + 0.5);
    } else {
      ctx.strokeStyle = PALETTE.muted;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

/** A gold ring on a found difference, popping in over 300 ms. */
function drawFoundMarkers(ctx, S, now) {
  const scene = S.scene;
  for (const i of S.found) {
    const d = scene.diffs[i];
    const age = now - (S.foundAt[i] ?? now);
    const pop = age < 300 ? 1.5 - (age / 300) * 0.5 : 1;
    for (const px of [PANEL.leftX, PANEL.rightX]) {
      const cx = px + d.x, cy = PANEL.y + d.y;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(pop, pop);
      ctx.strokeStyle = PALETTE.foundRing;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, d.r + 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 217, 77, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, d.r + 9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}

/** Fading red X marks where the player clicked wrong. */
function drawMissMarks(ctx, S, now) {
  for (const m of S.missMarks) {
    const age = now - m.at;
    if (age > 700) continue;
    const alpha = 1 - age / 700;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = PALETTE.missMark;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    const r = 12;
    ctx.beginPath();
    ctx.moveTo(m.x - r, m.y - r); ctx.lineTo(m.x + r, m.y + r);
    ctx.moveTo(m.x + r, m.y - r); ctx.lineTo(m.x - r, m.y + r);
    ctx.stroke();
    ctx.restore();
  }
}

/** The pulsing hint ring around one unfound difference, on both panels. */
function drawHint(ctx, S, now) {
  if (S.hintTarget < 0 || now > S.hintUntil) return;
  const d = S.scene.diffs[S.hintTarget];
  const pulse = 1 + 0.12 * Math.sin(now / 160);
  for (const px of [PANEL.leftX, PANEL.rightX]) {
    const cx = px + d.x, cy = PANEL.y + d.y;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pulse, pulse);
    ctx.strokeStyle = PALETTE.hintRing;
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 7]);
    ctx.beginPath();
    ctx.arc(0, 0, d.r + 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  ctx.setLineDash([]);
  text(ctx, 'Hint: look inside the ring', FIELD.width / 2, FOOTER.y + 62, 13, PALETTE.hintRing, 600, 'center');
}

/** The magnifier lens: a 2x zoomed circle following the mouse over a panel. */
function drawMagnifier(ctx, S) {
  if (!S.magnifier || !S.mouse.inside || S.mouse.panel < 0) return;
  const panel = S.mouse.panel === 0 ? S.panels.left : S.panels.right;
  const px = S.mouse.panel === 0 ? PANEL.leftX : PANEL.rightX;
  const lx = S.mouse.x - px, ly = S.mouse.y - PANEL.y;
  const R = 84, ZOOM = 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(S.mouse.x, S.mouse.y, R, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(panel, lx - R / ZOOM, ly - R / ZOOM, (2 * R) / ZOOM, (2 * R) / ZOOM, S.mouse.x - R, S.mouse.y - R, 2 * R, 2 * R);
  // Re-draw any found rings inside the lens so the zoom stays truthful.
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.arc(S.mouse.x, S.mouse.y, R, 0, Math.PI * 2);
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

/** The keyboard crosshair. */
function drawCrosshair(ctx, S) {
  const c = S.crosshair;
  if (!c.visible || S.screen !== 'playing') return;
  const px = c.panel === 0 ? PANEL.leftX : PANEL.rightX;
  const x = px + c.x, y = PANEL.y + c.y;
  ctx.save();
  ctx.strokeStyle = PALETTE.text;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 20, y); ctx.lineTo(x - 8, y);
  ctx.moveTo(x + 8, y); ctx.lineTo(x + 20, y);
  ctx.moveTo(x, y - 20); ctx.lineTo(x, y - 8);
  ctx.moveTo(x, y + 8); ctx.lineTo(x, y + 20);
  ctx.stroke();
  ctx.restore();
}

/** The whole in-game frame. */
export function drawFrame(ctx, S, now) {
  ctx.fillStyle = PALETTE.backdrop;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  drawHeader(ctx, S, now);

  // Panels.
  for (const [panel, px] of [[S.panels.left, PANEL.leftX], [S.panels.right, PANEL.rightX]]) {
    ctx.drawImage(panel, px, PANEL.y);
    ctx.strokeStyle = PALETTE.panelEdge;
    ctx.lineWidth = 3;
    ctx.strokeRect(px, PANEL.y, PANEL.size, PANEL.size);
  }
  text(ctx, 'A', PANEL.leftX + 12, PANEL.y + 20, 13, 'rgba(245,239,226,0.75)', 700);
  text(ctx, 'B', PANEL.rightX + 12, PANEL.y + 20, 13, 'rgba(245,239,226,0.75)', 700);

  drawFoundMarkers(ctx, S, now);
  drawMissMarks(ctx, S, now);
  drawHint(ctx, S, now);

  // Footer.
  ctx.fillStyle = PALETTE.footer;
  ctx.fillRect(0, FOOTER.y, FIELD.width, FOOTER.height);
  ctx.fillStyle = PALETTE.panelEdge;
  ctx.fillRect(0, FOOTER.y, FIELD.width, 2);
  drawDots(ctx, S);

  drawMagnifier(ctx, S);
  drawCrosshair(ctx, S);

  if (S.screen === 'paused') {
    ctx.fillStyle = 'rgba(23, 18, 36, 0.72)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    text(ctx, 'Paused', FIELD.width / 2, FIELD.height / 2 - 30, 44, PALETTE.text, 800, 'center');
    text(ctx, 'Press P or click Resume to keep hunting', FIELD.width / 2, FIELD.height / 2 + 18, 16, PALETTE.muted, 500, 'center');
  }
}
