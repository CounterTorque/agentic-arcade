import { STAGE_HEIGHT, STAGE_WIDTH, type CanvasHandle, type Stage } from './types';

export function createCanvas(
  root: HTMLElement,
  stage: () => Stage,
  opts: { pixelArt?: boolean } = {},
): CanvasHandle & { resize(): void } {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = `position:absolute;left:0;top:0;width:${STAGE_WIDTH}px;height:${STAGE_HEIGHT}px;`;
  if (opts.pixelArt) canvas.style.imageRendering = 'pixelated';
  root.appendChild(canvas);
  const g = canvas.getContext('2d')!;
  const resize = () => {
    const factor = Math.max(0.01, stage().scale * (globalThis.devicePixelRatio || 1));
    canvas.width = Math.round(STAGE_WIDTH * factor);
    canvas.height = Math.round(STAGE_HEIGHT * factor);
    g.setTransform(factor, 0, 0, factor, 0, 0);
    if (opts.pixelArt) g.imageSmoothingEnabled = false;
  };
  resize();
  return { canvas, g, resize };
}
