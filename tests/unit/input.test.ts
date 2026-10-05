import { describe, expect, it } from 'vitest';
import { InputController } from '../../src/framework/runtime/input';

describe('InputController', () => {
  it('latches presses until endFrame', () => {
    const i = new InputController();
    i.press('action');
    expect(i.api.isDown('action')).toBe(true);
    expect(i.api.wasPressed('action')).toBe(true);
    i.endFrame();
    expect(i.api.isDown('action')).toBe(true);
    expect(i.api.wasPressed('action')).toBe(false);
    i.release('action');
    expect(i.api.wasReleased('action')).toBe(true);
    i.endFrame();
    expect(i.api.wasReleased('action')).toBe(false);
  });

  it('registers a tap within a single frame', () => {
    const i = new InputController();
    i.tap('up');
    expect(i.api.isDown('up')).toBe(false);
    expect(i.api.wasPressed('up')).toBe(true);
    expect(i.api.wasReleased('up')).toBe(true);
  });

  it('reset clears everything', () => {
    const i = new InputController();
    i.press('left');
    i.setPointer(5, 6, true);
    i.reset();
    expect(i.api.isDown('left')).toBe(false);
    expect(i.api.wasPressed('left')).toBe(false);
    expect(i.api.pointer.down).toBe(false);
  });

  describe('attached', () => {
    const setup = () => {
      const i = new InputController();
      const stageEl = document.createElement('div');
      stageEl.getBoundingClientRect = () => ({ left: 100, top: 50, width: 480, height: 360 }) as DOMRect;
      const detach = i.attach(window, stageEl, () => 0.5);
      return { i, stageEl, detach };
    };
    const key = (type: string, k: string, init: KeyboardEventInit = {}) => {
      const e = new KeyboardEvent(type, { key: k, cancelable: true, ...init });
      window.dispatchEvent(e);
      return e;
    };

    it('maps keys, prevents default and ignores repeats', () => {
      const { i, detach } = setup();
      const e = key('keydown', ' ');
      expect(e.defaultPrevented).toBe(true);
      expect(i.api.wasPressed('action')).toBe(true);
      i.endFrame();
      key('keydown', ' ', { repeat: true });
      expect(i.api.wasPressed('action')).toBe(false);
      key('keyup', ' ');
      expect(i.api.isDown('action')).toBe(false);
      key('keydown', 'ArrowLeft');
      key('keydown', 'D');
      expect(i.api.isDown('left')).toBe(true);
      expect(i.api.isDown('right')).toBe(true);
      expect(key('keydown', 'q').defaultPrevented).toBe(false);
      detach();
      i.reset();
      key('keydown', 'w');
      expect(i.api.isDown('up')).toBe(false);
    });

    it('keeps an action down while any bound key is held', () => {
      const { i, detach } = setup();
      key('keydown', 'z');
      key('keydown', 'Enter');
      key('keyup', 'z');
      expect(i.api.isDown('action')).toBe(true);
      key('keyup', 'Enter');
      expect(i.api.isDown('action')).toBe(false);
      detach();
    });

    it('maps pointer events to stage coordinates', () => {
      const { i, stageEl, detach } = setup();
      const ev = (type: string, init: object) => {
        const e = new MouseEvent(type, { bubbles: true, ...init }) as MouseEvent & { pointerId?: number };
        stageEl.dispatchEvent(e);
      };
      ev('pointermove', { clientX: 220, clientY: 150 });
      expect(i.api.pointer).toEqual({ x: 240, y: 200, down: false, inside: true });
      ev('pointerdown', { clientX: 220, clientY: 150, button: 0 });
      expect(i.api.pointer.down).toBe(true);
      expect(i.api.wasPressed('action')).toBe(true);
      ev('pointerup', { clientX: 220, clientY: 150, button: 0 });
      expect(i.api.isDown('action')).toBe(false);
      ev('pointermove', { clientX: 0, clientY: 0 });
      expect(i.api.pointer.inside).toBe(false);
      detach();
    });
  });
});
