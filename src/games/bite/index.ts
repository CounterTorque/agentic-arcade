import { defineGame } from '@arcade/sdk';
import { bobberDip, bobberState, createSchedule, judgePress, levelParams, windowRealMs, type Verdict } from './logic';

const WATER = 420;
const BOBBER_X = 520;

export default defineGame({
  contractVersion: 1,

  create(ctx) {
    const schedule = createSchedule(ctx.difficulty.level, ctx.rng);
    const speed = ctx.difficulty.speed;
    const windowMs = windowRealMs(levelParams(ctx.difficulty.level).windowMs, speed);
    const { g } = ctx.createCanvas();
    let verdict: Verdict | null = null;
    let frozenTime = 0;
    let settleTime = 0;

    function draw(gameT: number): void {
      const state = bobberState(gameT, schedule);
      const dip = bobberDip(gameT, schedule);
      const bobberY = 390 + dip * 110;
      g.fillStyle = '#b9e4e6';
      g.fillRect(0, 0, 960, WATER);
      g.fillStyle = '#eaf5ce';
      g.beginPath();
      g.arc(784, 105, 54, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#79b5a3';
      g.beginPath();
      g.moveTo(0, 335);
      g.quadraticCurveTo(190, 240, 360, 350);
      g.quadraticCurveTo(650, 225, 960, 340);
      g.lineTo(960, WATER);
      g.lineTo(0, WATER);
      g.fill();
      g.fillStyle = '#318d9d';
      g.fillRect(0, WATER, 960, 300);
      g.fillStyle = '#52acb4';
      for (const [x, y, w] of [[90, 480, 130], [690, 480, 160], [240, 590, 150], [720, 620, 110]]) {
        g.fillRect(x!, y!, w!, 5);
      }
      g.strokeStyle = '#416c55';
      g.lineWidth = 7;
      for (const x of [32, 62, 92, 852, 884, 916]) {
        g.beginPath();
        g.moveTo(x, 500);
        g.quadraticCurveTo(x - 15, 430, x + 5, 364);
        g.stroke();
      }
      g.strokeStyle = '#715036';
      g.lineWidth = 13;
      g.beginPath();
      g.moveTo(0, 260);
      g.quadraticCurveTo(170, 90, 355, 105);
      g.stroke();
      g.strokeStyle = '#37525c';
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(355, 105);
      g.quadraticCurveTo(470, 180, BOBBER_X, verdict === 'hooked' || verdict === 'fake' || verdict === 'early' ? 275 : bobberY);
      g.stroke();

      if (verdict === 'hooked') {
        const jump = ctx.reducedMotion ? 0 : Math.sin(Math.min(1, settleTime / 500) * Math.PI) * 35;
        g.save();
        g.translate(BOBBER_X, 320 - jump);
        g.fillStyle = '#f4b95f';
        g.beginPath();
        g.ellipse(0, 0, 73, 38, -0.2, 0, Math.PI * 2);
        g.fill();
        g.beginPath();
        g.moveTo(-58, 0);
        g.lineTo(-104, -35);
        g.lineTo(-96, 30);
        g.closePath();
        g.fill();
        g.fillStyle = '#283b43';
        g.beginPath();
        g.arc(40, -12, 6, 0, Math.PI * 2);
        g.fill();
        g.restore();
      } else if (verdict === 'fake' || verdict === 'early') {
        g.strokeStyle = '#e8f2ef';
        g.lineWidth = 7;
        g.beginPath();
        g.moveTo(BOBBER_X, 275);
        g.lineTo(BOBBER_X, 315);
        g.arc(BOBBER_X - 15, 315, 15, 0, Math.PI);
        g.stroke();
      } else {
        g.save();
        g.beginPath();
        g.rect(0, 0, 960, WATER);
        g.clip();
        g.fillStyle = '#f5f5df';
        g.beginPath();
        g.arc(BOBBER_X, bobberY, 46, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#e55242';
        g.beginPath();
        g.arc(BOBBER_X, bobberY, 46, Math.PI, 0);
        g.fill();
        g.strokeStyle = '#394e52';
        g.lineWidth = 4;
        g.beginPath();
        g.arc(BOBBER_X, bobberY, 46, 0, Math.PI * 2);
        g.stroke();
        g.restore();
      }

      if (!ctx.reducedMotion && !verdict && state !== 'calm') {
        g.strokeStyle = '#d8f5ef';
        g.lineWidth = 5;
        g.beginPath();
        g.ellipse(BOBBER_X, WATER + 5, 85 + dip * 35, 14 + dip * 8, 0, 0, Math.PI * 2);
        g.stroke();
      }
      if (!verdict && state === 'bite') {
        g.fillStyle = '#fff4a6';
        g.font = 'bold 72px system-ui, sans-serif';
        g.textAlign = 'center';
        g.fillText('!', BOBBER_X, 345);
      }
      g.textAlign = 'center';
      if (verdict) {
        const labels = { hooked: 'GOT ONE!', fake: 'FAKE BITE!', early: 'TOO EARLY!', missed: 'GOT AWAY!' };
        g.fillStyle = verdict === 'hooked' ? '#fff4a6' : '#fff3e5';
        g.font = 'bold 58px system-ui, sans-serif';
        g.fillText(labels[verdict], 480, 115);
      } else {
        g.fillStyle = '#24494c';
        g.font = 'bold 30px system-ui, sans-serif';
        g.fillText('WAIT FOR THE PLUNGE!', 480, 65);
        g.fillStyle = '#e6f7f0';
        g.font = 'bold 25px system-ui, sans-serif';
        g.fillText('SPACE / CLICK TO HOOK', 480, 675);
      }
    }

    draw(0);
    return {
      tick(frame) {
        if (frame.phase === 'play' && verdict === null) {
          const gameT = frame.elapsed * speed;
          if (frame.elapsed >= schedule.biteAt / speed + windowMs) {
            verdict = 'missed';
          } else if (ctx.input.wasPressed('action')) {
            verdict = judgePress(bobberState(gameT, schedule));
          } else if (frame.remaining === 0) {
            verdict = 'missed';
          }
          if (verdict !== null) {
            frozenTime = gameT;
            ctx.resolve(verdict === 'hooked' ? 'win' : 'lose');
          }
        } else if (frame.phase === 'settle') {
          settleTime += frame.dt;
        }
        draw(verdict === null ? frame.elapsed * speed : frozenTime);
      },
      end(outcome) {
        if (verdict === null) verdict = outcome === 'win' ? 'hooked' : 'missed';
        draw(frozenTime);
      },
    };
  },
});
