// Twin Lanterns — main.js
// The state machine and the frame loop. The game is "Twin Lanterns", a
// spot-the-difference game: two near-identical pictures side by side, seven
// differences hidden in the right one, five hand-painted scenes.
//
// Screens: title, howto, intro, playing, paused, sceneComplete, gameComplete,
// timeUp. Every transition goes through S.actions so the screenshot stager
// (shots.js) and the keyboard use the same paths a player does.

import { FIELD, PANEL, SCENE_TIME, MISS_PENALTY, HINTS_PER_SCENE, HINT_COOLDOWN, HINT_COST, FIND_POINTS, COMBO_STEP, COMBO_MAX, TIME_BONUS_PER_SECOND, DIFFS_PER_SCENE, BEST_KEY } from './config.js';
import { SCENES } from './scenes.js';
import { buildPanels, drawFrame } from './render.js';
import { Buttons, drawTitle, drawHowTo, drawIntro, drawSceneComplete, drawGameComplete, drawTimeUp, drawFooterButtons } from './ui.js';
import { attachInput } from './input.js';
import { unlockAudio, clickBlip, findChime, missBuzz, hintShimmer, timerTick, winJingle, losePhrase, setMuted, isMuted } from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

canvas.width = FIELD.width;
canvas.height = FIELD.height;

function fitCanvas() {
  const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
  canvas.style.width = `${Math.floor(FIELD.width * scale)}px`;
  canvas.style.height = `${Math.floor(FIELD.height * scale)}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

const store = {
  get(key, fallback) {
    try {
      const v = window.localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Private mode or no storage: the game still plays, bests just don't persist.
    }
  },
};

// ---------- state ----------

const S = {
  screen: 'title',
  sceneIndex: 0,
  scene: SCENES[0],
  panels: null,
  previews: [],
  found: new Set(),
  foundAt: {},
  score: 0,
  combo: 1,
  timeLeft: SCENE_TIME,
  hintsLeft: HINTS_PER_SCENE,
  hintCooldownUntil: 0,
  hintTarget: -1,
  hintUntil: 0,
  misses: 0,
  magnifier: false,
  muted: isMuted(),
  mouse: { x: 640, y: 400, inside: false, panel: -1 },
  crosshair: { panel: 0, x: 300, y: 300, visible: false },
  missMarks: [],
  totalScore: 0,
  sceneScores: [],
  stars: [],
  totalMisses: 0,
  totalHints: 0,
  lastSceneScore: 0,
  best: store.get(BEST_KEY, 0),
  unlocked: store.get('twin-lanterns.unlocked', 0),
  lastTickSecond: -1,
  actions: {},
};

function announce(msg) {
  statusEl.textContent = msg;
}

// Pre-render every scene's left panel once, for the title-screen cards.
function buildPreviews() {
  S.previews = SCENES.map((scene) => {
    const { left } = buildPanels(scene);
    const small = document.createElement('canvas');
    small.width = 188;
    small.height = 62;
    // Crop the content-rich middle band (y 150-450) instead of squashing
    // the whole square: the thumbnails stay readable at a glance.
    small.getContext('2d').drawImage(left, 0, 150, 600, 300, 0, 0, 188, 62);
    return small;
  });
}

function startScenePanels() {
  S.panels = buildPanels(S.scene);
}

// ---------- actions ----------

function playScene(index) {
  S.sceneIndex = index;
  S.scene = SCENES[index];
  startScenePanels();
  S.screen = 'intro';
}

function startScene() {
  S.found = new Set();
  S.foundAt = {};
  S.score = 0;
  S.combo = 1;
  S.timeLeft = SCENE_TIME;
  S.hintsLeft = HINTS_PER_SCENE;
  S.hintCooldownUntil = 0;
  S.hintTarget = -1;
  S.hintUntil = 0;
  S.misses = 0;
  S.missMarks = [];
  S.lastTickSecond = -1;
  S.screen = 'playing';
  announce(`${S.scene.name}. Find ${DIFFS_PER_SCENE} differences.`);
}

function sceneComplete() {
  const timeBonus = Math.ceil(S.timeLeft) * TIME_BONUS_PER_SECOND;
  const sceneScore = S.score + timeBonus;
  S.lastSceneScore = sceneScore;
  S.totalScore += sceneScore;
  S.sceneScores[S.sceneIndex] = sceneScore;
  const stars = S.timeLeft >= 60 && S.misses === 0 ? 3 : S.timeLeft >= 25 ? 2 : 1;
  S.stars[S.sceneIndex] = stars;
  S.totalMisses += S.misses;
  S.totalHints += HINTS_PER_SCENE - S.hintsLeft;
  if (S.sceneIndex >= S.unlocked && S.sceneIndex < SCENES.length - 1) {
    S.unlocked = S.sceneIndex + 1;
    store.set('twin-lanterns.unlocked', S.unlocked);
  } else if (S.sceneIndex === SCENES.length - 1) {
    S.unlocked = SCENES.length - 1;
    store.set('twin-lanterns.unlocked', S.unlocked);
  }
  if (S.totalScore > S.best) {
    S.best = S.totalScore;
    store.set(BEST_KEY, S.best);
  }
  winJingle();
  S.screen = 'sceneComplete';
  announce(`Scene complete! ${stars} stars, ${sceneScore} points.`);
}

function nextScene() {
  if (S.sceneIndex === SCENES.length - 1) {
    S.screen = 'gameComplete';
    announce(`All five scenes cleared. Total score ${S.totalScore}.`);
    return;
  }
  playScene(S.sceneIndex + 1);
}

function timeUp() {
  losePhrase();
  S.screen = 'timeUp';
  announce(`Time up on ${S.scene.name}. You found ${S.found.size} of ${DIFFS_PER_SCENE}.`);
}

/** Test one click against the scene's differences. */
function checkPoint(x, y) {
  const panelIndex = x >= PANEL.leftX && x <= PANEL.leftX + PANEL.size
    ? 0
    : x >= PANEL.rightX && x <= PANEL.rightX + PANEL.size ? 1 : -1;
  if (panelIndex < 0 || y < PANEL.y || y > PANEL.y + PANEL.size) return;
  const lx = x - (panelIndex === 0 ? PANEL.leftX : PANEL.rightX);
  const ly = y - PANEL.y;
  let best = -1;
  let bestDist = Infinity;
  S.scene.diffs.forEach((d, i) => {
    if (S.found.has(i)) return;
    const dist = Math.hypot(lx - d.x, ly - d.y);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  });
  const d = S.scene.diffs[best];
  if (best >= 0 && bestDist <= d.r + 10) {
    S.found.add(best);
    S.foundAt[best] = performance.now();
    const gained = Math.round(FIND_POINTS * S.combo);
    S.score += gained;
    S.combo = Math.min(COMBO_MAX, S.combo + COMBO_STEP);
    S.hintTarget = -1;
    findChime();
    announce(`Found ${d.label}! ${S.found.size} of ${DIFFS_PER_SCENE}. +${gained} points.`);
    if (S.found.size === DIFFS_PER_SCENE) sceneComplete();
  } else {
    S.misses += 1;
    S.combo = 1;
    S.timeLeft = Math.max(0, S.timeLeft - MISS_PENALTY);
    S.missMarks.push({ x, y, at: performance.now() });
    missBuzz();
    announce(`Nothing there — 3 seconds lost.`);
  }
}

function useHint() {
  const now = performance.now();
  if (S.screen !== 'playing' || S.hintsLeft <= 0 || now < S.hintCooldownUntil) return;
  const remaining = S.scene.diffs.map((d, i) => i).filter((i) => !S.found.has(i));
  if (remaining.length === 0) return;
  S.hintTarget = remaining[Math.floor(Math.random() * remaining.length)];
  S.hintUntil = now + 5000;
  S.hintsLeft -= 1;
  S.hintCooldownUntil = now + HINT_COOLDOWN * 1000;
  S.score = Math.max(0, S.score - HINT_COST);
  hintShimmer();
  announce(`Hint: look inside the blue ring. ${S.hintsLeft} hints left.`);
}

S.actions = {
  playScene: (i) => { clickBlip(); playScene(i); },
  startScene: () => { clickBlip(); startScene(); },
  nextScene: () => { clickBlip(); nextScene(); },
  replayScene: () => { clickBlip(); playScene(S.sceneIndex); startScene(); },
  retryScene: () => { clickBlip(); playScene(S.sceneIndex); startScene(); },
  playAgain: () => {
    clickBlip();
    S.totalScore = 0;
    S.sceneScores = [];
    S.stars = [];
    S.totalMisses = 0;
    S.totalHints = 0;
    playScene(0);
  },
  toTitle: () => { clickBlip(); S.screen = 'title'; },
  howTo: () => { clickBlip(); S.screen = 'howto'; },
  hint: useHint,
  toggleMagnifier: () => { clickBlip(); S.magnifier = !S.magnifier; },
  toggleSound: () => {
    setMuted(!isMuted());
    S.muted = isMuted();
    clickBlip();
  },
  pause: () => {
    if (S.screen === 'playing') { S.screen = 'paused'; clickBlip(); }
    else if (S.screen === 'paused') { S.screen = 'playing'; clickBlip(); }
  },
  restartScene: () => { clickBlip(); playScene(S.sceneIndex); startScene(); },
};

// ---------- input wiring ----------

const buttons = new Buttons();
const input = attachInput(canvas, {
  onTap(x, y) {
    unlockAudio();
    if (buttons.hit(x, y)) return;
    if (S.screen === 'playing') checkPoint(x, y);
    else if (S.screen === 'paused') S.actions.pause();
  },
  onMove(x, y) {
    S.mouse.x = x;
    S.mouse.y = y;
    S.mouse.inside = true;
    S.mouse.panel = input.panelAt(x, y);
    buttons.move(x, y);
  },
  onKey(key) {
    unlockAudio();
    if (key === 'm' || key === 'M') S.actions.toggleMagnifier();
    else if (key === 'h' || key === 'H') useHint();
    else if (key === 'p' || key === 'P' || key === 'Escape') S.actions.pause();
    else if (key === 'r' || key === 'R') {
      if (S.screen === 'sceneComplete' || S.screen === 'timeUp' || S.screen === 'gameComplete') S.actions.replayScene();
      else if (S.screen === 'playing') S.actions.restartScene();
    } else if (key === 'Enter' && S.screen === 'title') S.actions.playScene(S.unlocked);
  },
  onLeave() {
    S.mouse.inside = false;
    S.mouse.panel = -1;
  },
});
S.mouse = input.mouse;
S.crosshair = input.crosshair;

// ---------- frame loop ----------

let lastNow = performance.now();

function frame(now) {
  const dt = Math.min(0.1, (now - lastNow) / 1000);
  lastNow = now;

  if (S.screen === 'playing') {
    S.timeLeft -= dt;
    if (S.timeLeft <= 30) {
      const sec = Math.ceil(S.timeLeft);
      if (sec !== S.lastTickSecond && sec > 0) {
        S.lastTickSecond = sec;
        timerTick();
      }
    }
    if (S.timeLeft <= 0) {
      S.timeLeft = 0;
      timeUp();
    }
    S.missMarks = S.missMarks.filter((m) => now - m.at < 700);
  }

  buttons.begin();
  ctx.clearRect(0, 0, FIELD.width, FIELD.height);
  if (S.screen === 'playing' || S.screen === 'paused') {
    drawFrame(ctx, S, now);
    drawFooterButtons(ctx, S, buttons);
    if (S.screen === 'paused') {
      buttons.add('resume', 490, 470, 300, 52, '▶  Resume', () => S.actions.pause(), { fontSize: 19 });
      buttons.draw(ctx);
    }
  } else if (S.screen === 'title') {
    drawTitle(ctx, S, buttons);
  } else if (S.screen === 'howto') {
    drawHowTo(ctx, S, buttons);
  } else if (S.screen === 'intro') {
    drawIntro(ctx, S, buttons);
  } else if (S.screen === 'sceneComplete') {
    drawSceneComplete(ctx, S, buttons);
  } else if (S.screen === 'gameComplete') {
    drawGameComplete(ctx, S, buttons);
  } else if (S.screen === 'timeUp') {
    drawTimeUp(ctx, S, buttons);
  }

  requestAnimationFrame(frame);
}

// ---------- boot ----------

// A read-only handle for play-testing in the browser console.
window.__twinLanterns = S;

buildPreviews();
S.panels = buildPanels(SCENES[0]);
stageShot(S, new URLSearchParams(window.location.search));
requestAnimationFrame(frame);
