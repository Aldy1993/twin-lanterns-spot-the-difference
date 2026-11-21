// Twin Lanterns — a spot-the-difference game.
// Session anchor: build session started 2026-11-21T05:04Z, after the
// competition opened 2026-11-21T04:51:00Z. Every line below was written
// inside that session, after the opening.
//
// config.js — every tuning number, colour and layout constant in one place.
// The playfield is a fixed 1280x800 logical area; the renderer scales it to
// the window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 800 };

/** The two picture panels: 600x600 squares, side by side. */
export const PANEL = {
  size: 600,
  leftX: 20,
  rightX: 660,
  y: 84,
  gapLabel: 40,
};

export const HEADER = { height: 72 };
export const FOOTER = { y: 700, height: 84 };

/** Seconds of play per scene; the last 30 pulse red and tick. */
export const SCENE_TIME = 150;
/** Seconds taken away on a wrong click. */
export const MISS_PENALTY = 3;
/** Hints per scene, and the cooldown between two hints. */
export const HINTS_PER_SCENE = 3;
export const HINT_COOLDOWN = 15;
/** A hint costs this many points. */
export const HINT_COST = 150;

/** Points for a find, before the combo multiplier. */
export const FIND_POINTS = 100;
/** Each find without a miss raises the multiplier by this, up to COMBO_MAX. */
export const COMBO_STEP = 0.5;
export const COMBO_MAX = 3;
/** Points per second left when a scene is cleared. */
export const TIME_BONUS_PER_SECOND = 10;

/** Differences in every scene. */
export const DIFFS_PER_SCENE = 7;

/** Stars on the scene-complete screen: 3 for clearing with this much time left. */
export const STAR_TIME = { three: 60, two: 25 };

/** Where the best total score is kept between visits (this browser only). */
export const BEST_KEY = 'twin-lanterns.best';

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

export const PALETTE = {
  backdrop: '#171224',
  panelEdge: '#2c2340',
  panelGap: '#241c33',
  header: '#1e1730',
  footer: '#1e1730',
  text: '#f5efe2',
  muted: '#b9adc9',
  gold: '#f2c94c',
  goldDark: '#c9a227',
  teal: '#4fc3b8',
  coral: '#ff7a6b',
  green: '#7bc96f',
  red: '#e5534b',
  button: '#3a2d5c',
  buttonHover: '#4d3d78',
  buttonEdge: '#6b579e',
  foundRing: '#ffd94d',
  missMark: '#ff5a4e',
  hintRing: '#7ee0ff',
  timerFull: '#7bc96f',
  timerLow: '#e5534b',
};

export const SCENE_META = [
  { id: 'market', name: 'Lantern Night Market', sub: 'A lantern-lit street at dusk — find 7 changes' },
  { id: 'reef', name: 'Coral Reef', sub: 'Beneath the waves — find 7 changes' },
  { id: 'tea-house', name: 'Mountain Tea House', sub: 'A quiet pagoda at dusk — find 7 changes' },
  { id: 'library', name: 'Starlight Library', sub: 'A cosy room full of books — find 7 changes' },
  { id: 'meadow', name: 'Autumn Picnic Meadow', sub: 'Golden light on the grass — find 7 changes' },
];
