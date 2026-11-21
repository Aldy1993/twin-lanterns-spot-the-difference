// Twin Lanterns — ui.js
// Buttons and menu screens: title, how-to, scene intro, scene-complete,
// results and time-up. The in-game frame lives in render.js.

import { FIELD, PANEL, FOOTER, PALETTE, FONT, DIFFS_PER_SCENE, SCENE_TIME, HINTS_PER_SCENE, HINT_COOLDOWN } from './config.js';
import { SCENES } from './scenes.js';

/** A tiny button registry, rebuilt each frame for the current screen. */
export class Buttons {
  constructor() {
    this.list = [];
    this.hoverId = null;
  }

  begin() {
    this.list = [];
  }

  add(id, x, y, w, h, label, action, opts = {}) {
    this.list.push({ id, x, y, w, h, label, action, ...opts });
  }

  move(x, y) {
    this.hoverId = null;
    for (const b of this.list) {
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) this.hoverId = b.id;
    }
  }

  hit(x, y) {
    for (const b of this.list) {
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        b.action();
        return b.id;
      }
    }
    return null;
  }

  draw(ctx) {
    for (const b of this.list) {
      // Invisible buttons (e.g. a whole scene card) still hit-test and
      // hover, but never paint over the art beneath them: on hover they
      // get a gold outline instead of a fill.
      if (b.invisible) {
        if (this.hoverId === b.id) {
          ctx.save();
          ctx.strokeStyle = PALETTE.gold;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(b.x, b.y, b.w, b.h, 10);
          ctx.stroke();
          ctx.restore();
        }
        continue;
      }
      const hover = this.hoverId === b.id;
      const disabled = b.disabled;
      ctx.save();
      if (disabled) ctx.globalAlpha = 0.45;
      ctx.fillStyle = hover ? PALETTE.buttonHover : PALETTE.button;
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, b.w, b.h, 10);
      ctx.fill();
      ctx.strokeStyle = PALETTE.buttonEdge;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = PALETTE.text;
      ctx.font = `700 ${b.fontSize ?? 16}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 1);
      ctx.restore();
    }
  }
}

function text(ctx, str, x, y, size, color, weight = 600, align = 'center') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function panel(ctx, x, y, w, h, fill = 'rgba(30, 23, 48, 0.92)') {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 18);
  ctx.fill();
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.lineWidth = 2;
  ctx.stroke();
}

/** The footer buttons while playing: hint, magnifier, sound, pause. */
export function drawFooterButtons(ctx, S, buttons) {
  const y = FOOTER.y + 12;
  const hintReady = S.hintsLeft > 0 && S.hintCooldownUntil <= performance.now();
  const hintLabel = S.hintsLeft > 0
    ? (hintReady ? `💡 Hint (${S.hintsLeft})` : `💡 Hint ${Math.ceil((S.hintCooldownUntil - performance.now()) / 1000)}s`)
    : '💡 Hint (0)';
  buttons.add('hint', 360, y, 150, 34, hintLabel, () => S.actions.hint(), { disabled: !hintReady });
  buttons.add('magnifier', 522, y, 168, 34, S.magnifier ? '🔍 Lens: ON (M)' : '🔍 Lens: OFF (M)', () => S.actions.toggleMagnifier());
  buttons.add('sound', 702, y, 150, 34, S.muted ? '🔇 Sound: OFF' : '🔊 Sound: ON', () => S.actions.toggleSound());
  buttons.add('pause', 864, y, 130, 34, '⏸ Pause (P)', () => S.actions.pause());
  buttons.add('restart', 1006, y, 130, 34, '↺ Restart', () => S.actions.restartScene());
  buttons.add('menu', 1148, y, 108, 34, '☰ Menu', () => S.actions.toTitle());
  text(ctx, 'Click a difference on either picture · Arrows + Enter work too · H hint · M lens', FIELD.width / 2, FOOTER.y + 66, 13, PALETTE.muted, 500);
  buttons.draw(ctx);
}

/** Title screen, with the five scene cards. */
export function drawTitle(ctx, S, buttons) {
  ctx.fillStyle = PALETTE.backdrop;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  // A soft lantern glow behind the title.
  const glow = ctx.createRadialGradient(640, 220, 40, 640, 220, 420);
  glow.addColorStop(0, 'rgba(242, 201, 76, 0.16)');
  glow.addColorStop(1, 'rgba(242, 201, 76, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, FIELD.width, 560);

  text(ctx, '🏮', 640, 96, 64, PALETTE.gold, 800);
  text(ctx, 'TWIN LANTERNS', 640, 168, 58, PALETTE.gold, 800);
  text(ctx, 'Spot the Difference', 640, 216, 26, PALETTE.text, 600);
  text(ctx, 'Two pictures hang side by side. Seven small changes hide in the second one.', 640, 254, 16, PALETTE.muted, 500);
  text(ctx, 'Find them all before the lantern burns down — five scenes, 35 differences.', 640, 280, 16, PALETTE.muted, 500);

  // Scene cards.
  const cardW = 216, cardH = 148, gap = 16;
  const totalW = 5 * cardW + 4 * gap;
  const x0 = (FIELD.width - totalW) / 2;
  SCENES.forEach((scene, i) => {
    const x = x0 + i * (cardW + gap);
    const y = 320;
    const unlocked = i <= S.unlocked;
    ctx.save();
    if (!unlocked) ctx.globalAlpha = 0.45;
    panel(ctx, x, y, cardW, cardH);
    text(ctx, `Scene ${i + 1}`, x + cardW / 2, y + 30, 15, PALETTE.gold, 700);
    // A tiny painted preview of the scene.
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x + 14, y + 48, cardW - 28, 62, 8);
    ctx.clip();
    ctx.drawImage(S.previews[i], x + 14, y + 48, cardW - 28, 62);
    ctx.restore();
    ctx.strokeStyle = PALETTE.panelEdge;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x + 14, y + 48, cardW - 28, 62, 8);
    ctx.stroke();
    const name = scene.name.replace('Lantern Night ', '').replace('Mountain ', '').replace('Starlight ', '').replace('Autumn Picnic ', '');
    text(ctx, unlocked ? name : '🔒 Locked', x + cardW / 2, y + 130, 14, PALETTE.text, 600);
    ctx.restore();
    if (unlocked) {
      buttons.add(`scene-${i}`, x, y, cardW, cardH, '', () => S.actions.playScene(i), { fontSize: 1, invisible: true });
    }
  });

  buttons.add('play', 490, 510, 300, 56, '▶  Play', () => S.actions.playScene(S.unlocked), { fontSize: 22 });
  buttons.add('howto', 490, 582, 300, 44, 'How to play', () => S.actions.howTo());
  if (S.best > 0) text(ctx, `Best total score: ${S.best.toLocaleString()}`, 640, 664, 15, PALETTE.muted, 600);
  text(ctx, 'Mouse or touch to click · Arrow keys + Enter · H hint · M magnifier · P pause', 640, 700, 13, PALETTE.muted, 500);
  text(ctx, 'Original art, painted in code — no photo, no copy. Sound is synthesised live.', 640, 726, 13, PALETTE.muted, 500);
  buttons.draw(ctx);
}

/** How-to screen. */
export function drawHowTo(ctx, S, buttons) {
  ctx.fillStyle = PALETTE.backdrop;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  panel(ctx, 290, 90, 700, 560);
  text(ctx, 'How to play', 640, 140, 34, PALETTE.gold, 800);
  const lines = [
    ['👀  Look', 'Two pictures sit side by side. The right one hides 7 small changes.'],
    ['🖱  Click', 'Click a difference on EITHER picture. A gold ring marks it — on both.'],
    ['❌  Miss', 'A wrong click costs 3 seconds and resets your combo.'],
    ['💡  Hint', 'Stuck? A hint rings one difference. 3 per scene, 15s apart, −150 pts.'],
    ['🔍  Lens', 'Hold the magnifier over a spot to see it twice as big. Key M.'],
    ['⌨️  Keys', 'Arrows move the crosshair, Enter checks it, Tab switches picture.'],
    ['⏱  Time', 'Each scene gives you 2:30. Time left becomes bonus points.'],
    ['⭐  Stars', 'Clear a scene fast with few misses for 3 stars. Five scenes, 35 finds.'],
  ];
  lines.forEach(([head, body], i) => {
    const y = 196 + i * 52;
    text(ctx, head, 340, y, 17, PALETTE.text, 700, 'left');
    text(ctx, body, 520, y, 15, PALETTE.muted, 500, 'left');
  });
  buttons.add('back', 490, 580, 300, 50, '←  Back', () => S.actions.toTitle(), { fontSize: 18 });
  buttons.draw(ctx);
}

/** The card shown before each scene starts. */
export function drawIntro(ctx, S, buttons) {
  ctx.fillStyle = PALETTE.backdrop;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  const scene = S.scene;
  // The scene itself, dimmed, behind the card.
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.drawImage(S.panels.left, PANEL.leftX, PANEL.y);
  ctx.drawImage(S.panels.right, PANEL.rightX, PANEL.y);
  ctx.restore();
  panel(ctx, 390, 240, 500, 300);
  text(ctx, `Scene ${S.sceneIndex + 1} of 5`, 640, 290, 16, PALETTE.gold, 700);
  text(ctx, scene.name, 640, 330, 32, PALETTE.text, 800);
  text(ctx, scene.sub, 640, 372, 16, PALETTE.muted, 500);
  text(ctx, `Find all ${DIFFS_PER_SCENE} differences in ${Math.floor(SCENE_TIME / 60)}:${String(SCENE_TIME % 60).padStart(2, '0')}`, 640, 410, 16, PALETTE.text, 600);
  buttons.add('start', 490, 446, 300, 52, '▶  Start hunting', () => S.actions.startScene(), { fontSize: 19 });
  buttons.add('back2', 540, 510, 200, 36, '←  Scene list', () => S.actions.toTitle());
  buttons.draw(ctx);
}

/** Stars earned on the scene-complete screen. */
function starsFor(S) {
  if (S.timeLeft >= 60 && S.misses === 0) return 3;
  if (S.timeLeft >= 25) return 2;
  return 1;
}

export function drawSceneComplete(ctx, S, buttons) {
  ctx.fillStyle = PALETTE.backdrop;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  panel(ctx, 390, 170, 500, 420);
  const stars = starsFor(S);
  text(ctx, '★'.repeat(stars) + '☆'.repeat(3 - stars), 640, 220, 44, PALETTE.gold, 800);
  text(ctx, 'Scene complete!', 640, 276, 32, PALETTE.text, 800);
  text(ctx, `${S.scene.name} — all ${DIFFS_PER_SCENE} differences found`, 640, 316, 16, PALETTE.muted, 500);
  text(ctx, `Finds  ${S.found.size} × 100  +  time bonus  ${Math.ceil(S.timeLeft) * 10}`, 640, 366, 16, PALETTE.text, 600);
  text(ctx, `Scene score  ${S.lastSceneScore.toLocaleString()}`, 640, 398, 20, PALETTE.gold, 700);
  text(ctx, `Total so far  ${S.totalScore.toLocaleString()}`, 640, 430, 16, PALETTE.muted, 600);
  const last = S.sceneIndex === SCENES.length - 1;
  buttons.add('next', 490, 470, 300, 52, last ? '🏆  See results' : '▶  Next scene', () => S.actions.nextScene(), { fontSize: 19 });
  buttons.add('replay', 540, 534, 200, 36, '↺  Replay scene', () => S.actions.replayScene());
  buttons.draw(ctx);
}

/** The final results screen. */
export function drawGameComplete(ctx, S, buttons) {
  ctx.fillStyle = PALETTE.backdrop;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  const glow = ctx.createRadialGradient(640, 300, 40, 640, 300, 460);
  glow.addColorStop(0, 'rgba(242, 201, 76, 0.18)');
  glow.addColorStop(1, 'rgba(242, 201, 76, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, FIELD.width, 700);
  panel(ctx, 340, 120, 600, 500);
  text(ctx, '🏆', 640, 176, 56, PALETTE.gold, 800);
  text(ctx, 'All five scenes cleared!', 640, 232, 32, PALETTE.text, 800);
  text(ctx, `35 differences found · ${S.totalMisses} misses · ${S.totalHints} hints used`, 640, 272, 16, PALETTE.muted, 500);
  const totalStars = S.stars.reduce((a, b) => a + b, 0);
  text(ctx, '★'.repeat(totalStars) + '☆'.repeat(15 - totalStars), 640, 316, 30, PALETTE.gold, 800);
  text(ctx, `Total score  ${S.totalScore.toLocaleString()}`, 640, 366, 26, PALETTE.gold, 800);
  if (S.totalScore >= S.best) text(ctx, '🎉 New best score!', 640, 402, 17, PALETTE.teal, 700);
  else text(ctx, `Best score  ${S.best.toLocaleString()}`, 640, 402, 16, PALETTE.muted, 600);
  SCENES.forEach((scene, i) => {
    text(ctx, `${scene.name} — ${S.sceneScores[i]?.toLocaleString() ?? 0} pts · ${'★'.repeat(S.stars[i] ?? 0)}`, 640, 446 + i * 26, 15, PALETTE.text, 500);
  });
  buttons.add('again', 440, 560, 180, 50, '↺  Play again', () => S.actions.playAgain(), { fontSize: 18 });
  buttons.add('menu2', 660, 560, 180, 50, '☰  Scene list', () => S.actions.toTitle(), { fontSize: 18 });
  buttons.draw(ctx);
}

/** Time ran out. */
export function drawTimeUp(ctx, S, buttons) {
  ctx.fillStyle = PALETTE.backdrop;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  panel(ctx, 390, 200, 500, 340);
  text(ctx, '⏳', 640, 256, 52, PALETTE.gold, 800);
  text(ctx, 'The lantern burned down…', 640, 316, 30, PALETTE.text, 800);
  text(ctx, `${S.scene.name} — you found ${S.found.size} of ${DIFFS_PER_SCENE} differences`, 640, 356, 16, PALETTE.muted, 500);
  text(ctx, 'The unfound ones stay hidden — try the scene again.', 640, 384, 15, PALETTE.muted, 500);
  buttons.add('retry', 490, 430, 300, 52, '↺  Retry scene', () => S.actions.retryScene(), { fontSize: 19 });
  buttons.add('menu3', 540, 494, 200, 36, '☰  Scene list', () => S.actions.toTitle());
  buttons.draw(ctx);
}
