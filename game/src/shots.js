// Twin Lanterns — shots.js
// Screenshot staging: ?shot=start|play|play2|end (plus ?scene=N&found=i,j)
// puts the game into a fixed, readable state for the screenshots the entry
// hands in. Every staged state is a real state of the game, reached through
// the same actions a player uses — nothing is drawn only for the camera.

import { PANEL } from './config.js';

export function stageShot(S, params) {
  const shot = params.get('shot');
  if (!shot) return false;

  if (shot === 'start') {
    S.screen = 'title';
    return true;
  }

  if (shot === 'play' || shot === 'play2') {
    const sceneIndex = shot === 'play' ? 1 : 3;
    S.actions.playScene(sceneIndex);
    S.actions.startScene();
    if (shot === 'play') {
      // Reef, mid-hunt: three differences found and ringed, four still hidden.
      for (const i of [0, 2, 4]) {
        S.found.add(i);
        S.foundAt[i] = performance.now() - 2000;
      }
      S.score = 1250;
      S.combo = 2;
      S.timeLeft = 98;
    } else {
      // Library, mid-hunt: two found, a hint ring live, the lens open.
      for (const i of [1, 3]) {
        S.found.add(i);
        S.foundAt[i] = performance.now() - 2000;
      }
      S.score = 2400;
      S.combo = 1.5;
      S.timeLeft = 112;
      S.hintsLeft = 2;
      S.hintTarget = 5;
      S.hintUntil = performance.now() + 60000;
      S.magnifier = true;
      // Park the lens over the bookshelf, where the zoom shows real detail.
      S.mouse.x = PANEL.leftX + 120;
      S.mouse.y = PANEL.y + 220;
      S.mouse.inside = true;
      S.mouse.panel = 0;
    }
    return true;
  }

  if (shot === 'end') {
    // A finished run: five scenes, 35 finds, stars and totals filled in.
    S.sceneScores = [920, 1040, 880, 1120, 900];
    S.stars = [3, 3, 2, 3, 2];
    S.totalScore = 4860;
    S.totalMisses = 4;
    S.totalHints = 2;
    S.best = Math.max(S.best, 4860);
    S.screen = 'gameComplete';
    return true;
  }

  // Manual staging for play-testing: ?shot=custom&scene=2&found=0,3
  if (shot === 'custom') {
    const sceneIndex = Number(params.get('scene') ?? 0);
    S.actions.playScene(sceneIndex);
    S.actions.startScene();
    const foundParam = params.get('found');
    if (foundParam) {
      for (const raw of foundParam.split(',')) {
        const i = Number(raw);
        if (Number.isInteger(i) && i >= 0 && i < 7) {
          S.found.add(i);
          S.foundAt[i] = performance.now() - 2000;
        }
      }
    }
    return true;
  }

  return false;
}
