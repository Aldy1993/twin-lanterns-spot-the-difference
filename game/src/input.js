// Twin Lanterns — input.js
// Mouse, touch and keyboard input, translated into the game's 1280x800
// logical coordinates. No game rules live here: it only reports events.

import { FIELD, PANEL } from './config.js';

/**
 * Attach input to a canvas.
 * handlers: { onTap(x, y), onMove(x, y), onKey(key), onLeave() }
 * Returns { mouse, crosshair, setCrosshair(x, y, panel) }.
 */
export function attachInput(canvas, handlers) {
  const mouse = { x: FIELD.width / 2, y: FIELD.height / 2, inside: false, panel: -1 };
  // The keyboard crosshair: { panel: 0|1, x, y } in panel-local coordinates.
  const crosshair = { panel: 0, x: 300, y: 300, visible: false };

  function toLogical(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = FIELD.width / rect.width;
    const scaleY = FIELD.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  function panelAt(x, y) {
    if (y < PANEL.y || y > PANEL.y + PANEL.size) return -1;
    if (x >= PANEL.leftX && x <= PANEL.leftX + PANEL.size) return 0;
    if (x >= PANEL.rightX && x <= PANEL.rightX + PANEL.size) return 1;
    return -1;
  }

  canvas.addEventListener('pointermove', (event) => {
    const p = toLogical(event);
    mouse.x = p.x;
    mouse.y = p.y;
    mouse.inside = true;
    mouse.panel = panelAt(p.x, p.y);
    crosshair.visible = false;
    handlers.onMove(p.x, p.y);
  });

  canvas.addEventListener('pointerdown', (event) => {
    const p = toLogical(event);
    mouse.x = p.x;
    mouse.y = p.y;
    mouse.inside = true;
    mouse.panel = panelAt(p.x, p.y);
    handlers.onTap(p.x, p.y);
  });

  canvas.addEventListener('pointerleave', () => {
    mouse.inside = false;
    mouse.panel = -1;
    handlers.onLeave();
  });

  window.addEventListener('keydown', (event) => {
    const key = event.key;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(key)) {
      event.preventDefault();
    }
    if (key.startsWith('Arrow')) {
      crosshair.visible = true;
      const step = event.shiftKey ? 8 : 24;
      if (key === 'ArrowLeft') crosshair.x = Math.max(0, crosshair.x - step);
      if (key === 'ArrowRight') crosshair.x = Math.min(PANEL.size, crosshair.x + step);
      if (key === 'ArrowUp') crosshair.y = Math.max(0, crosshair.y - step);
      if (key === 'ArrowDown') crosshair.y = Math.min(PANEL.size, crosshair.y + step);
      handlers.onMove(
        (crosshair.panel === 0 ? PANEL.leftX : PANEL.rightX) + crosshair.x,
        PANEL.y + crosshair.y,
      );
      return;
    }
    if (key === 'Tab') {
      event.preventDefault();
      crosshair.visible = true;
      crosshair.panel = 1 - crosshair.panel;
      handlers.onMove(
        (crosshair.panel === 0 ? PANEL.leftX : PANEL.rightX) + crosshair.x,
        PANEL.y + crosshair.y,
      );
      return;
    }
    if (key === 'Enter' || key === ' ') {
      if (crosshair.visible) {
        handlers.onTap(
          (crosshair.panel === 0 ? PANEL.leftX : PANEL.rightX) + crosshair.x,
          PANEL.y + crosshair.y,
        );
      }
      return;
    }
    handlers.onKey(key);
  });

  return { mouse, crosshair, panelAt };
}
