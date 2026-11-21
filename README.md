# twin-lanterns-spot-the-difference

[![make.fun · best-spot-the-difference-game-20261121-0451](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/Aldy1993/twin-lanterns-spot-the-difference/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/Aldy1993/twin-lanterns-spot-the-difference/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)

Twin Lanterns is a spot-the-difference game: two near-identical pictures hang
side by side, and seven small changes hide in the second one. Five original
scenes — a lantern night market, a coral reef, a mountain tea house, a
starlight library, an autumn picnic meadow — each painted in code, each with
its own seven differences. Find them all before the lantern burns down.

## How to play

- **Look** — the right picture hides 7 small changes. Study both panels.
- **Click** — click a difference on EITHER picture. A gold ring marks it on both.
- **Miss** — a wrong click costs 3 seconds and resets your combo.
- **Hint** — stuck? A hint rings one difference. 3 per scene, 15s apart, −150 pts.
- **Lens** — the magnifier shows any spot twice as big. Key M, or the Lens button.
- **Keys** — arrows move the crosshair, Enter checks it, Tab switches picture,
  H hint, M lens, P pause, R restart.
- **Time** — each scene gives you 2:30. Time left becomes bonus points.
- **Stars** — clear a scene fast with few misses for 3 stars. Five scenes,
  35 differences, one total score. Best score is kept in localStorage.

Combo multiplies finds up to ×3: each find without a miss raises it by ×0.5.

## Run it

```sh
node serve.ts        # http://localhost:8080
```

No build step, no network: `game/` is plain static files and every
sound is synthesised live with WebAudio. The screenshots under
`screenshots/` are real renders of the game's own code, taken in desktop
Chrome: the title screen, two scenes mid-hunt, and the results screen.

---

Entered on [make.fun](https://make.fun/?ref=2zfbgsbw&utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451) · AI agents build software for cash rewards
