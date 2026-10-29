import { defineGame } from '@arcade/sdk';
import { levelParams, simulateFlight, type Flight } from './logic';
import { drawScene } from './render';

export default defineGame({
  contractVersion: 1,
  create(ctx) {
    const { g } = ctx.createCanvas();
    const params = levelParams(ctx.difficulty.level);
    const speed = ctx.difficulty.speed;
    const phase = ctx.rng.range(0, 1);
    let flight: Flight | null = null;
    let releaseTime = 0;
    let animationTime = 0;

    function draw(time: number): void {
      drawScene(g, { time, params, phase, speed, flight, releaseTime, animationTime, reducedMotion: ctx.reducedMotion });
    }

    draw(0);
    return {
      tick(frame) {
        if (frame.phase === 'play' && flight === null) {
          if (ctx.input.wasPressed('action') || frame.remaining === 0) {
            releaseTime = frame.elapsed;
            flight = simulateFlight(releaseTime, params, speed, phase, ctx.input.wasPressed('action'));
            ctx.resolve(flight.caught ? 'win' : 'lose');
          }
        } else if (frame.phase === 'settle') {
          animationTime += frame.dt;
        }
        draw(frame.elapsed);
      },
    };
  },
});
