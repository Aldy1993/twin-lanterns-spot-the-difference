// Twin Lanterns — audio.js
// All sound is synthesised with WebAudio: no audio files, no network.
// The context is created lazily on the first user gesture (autoplay policy).

let ctx = null;
let muted = false;
let master = null;

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function setMuted(value) {
  muted = value;
  if (master) master.gain.value = muted ? 0 : 0.5;
}

export function isMuted() {
  return muted;
}

/** Call from any user gesture so later sounds are allowed to play. */
export function unlockAudio() {
  ensure();
}

function tone(freq, startAt, dur, type, vol, slideTo) {
  const ac = ensure();
  if (!ac || muted) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime + startAt);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ac.currentTime + startAt + dur);
  gain.gain.setValueAtTime(0, ac.currentTime + startAt);
  gain.gain.linearRampToValueAtTime(vol, ac.currentTime + startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + startAt + dur);
  osc.connect(gain);
  gain.connect(master);
  osc.start(ac.currentTime + startAt);
  osc.stop(ac.currentTime + startAt + dur + 0.05);
}

/** A soft click for buttons. */
export function clickBlip() {
  tone(660, 0, 0.07, 'sine', 0.25);
}

/** The satisfying chime on a found difference: a rising triad. */
export function findChime() {
  tone(523.25, 0, 0.16, 'sine', 0.35);
  tone(659.25, 0.07, 0.16, 'sine', 0.35);
  tone(783.99, 0.14, 0.28, 'sine', 0.4);
}

/** A low buzz on a wrong click. */
export function missBuzz() {
  tone(160, 0, 0.18, 'sawtooth', 0.18, 110);
}

/** A shimmer when a hint is spent. */
export function hintShimmer() {
  tone(880, 0, 0.3, 'sine', 0.2, 1320);
  tone(1174.66, 0.08, 0.3, 'sine', 0.15, 1568);
}

/** A short tick when the timer drops under 30 seconds. */
export function timerTick() {
  tone(980, 0, 0.05, 'square', 0.08);
}

/** The jingle when a scene is cleared. */
export function winJingle() {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((n, i) => tone(n, i * 0.11, 0.3, 'triangle', 0.35));
  tone(1318.5, 0.48, 0.5, 'triangle', 0.3);
}

/** A gentle descending phrase for time-up. */
export function losePhrase() {
  tone(392, 0, 0.25, 'triangle', 0.3);
  tone(329.63, 0.2, 0.25, 'triangle', 0.3);
  tone(261.63, 0.4, 0.5, 'triangle', 0.3);
}
