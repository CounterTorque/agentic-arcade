import type { GameContext } from '@arcade/sdk';
import type { TrapezeState } from './logic';
import { getAcrobatPosition, getPartnerPosition } from './logic';

interface Assets {
  acrobat: HTMLImageElement;
  partner: HTMLImageElement;
  trapezeBar: HTMLImageElement;
  acrobatSuccess: HTMLImageElement;
  acrobatFail: HTMLImageElement;
}

export function createRenderer(ctx: GameContext, assets: Assets) {
  const { canvas, g } = ctx.createCanvas();
  ctx.root.appendChild(canvas);
  
  let currentPose: 'normal' | 'success' | 'fail' = 'normal';
  
  function draw(state: TrapezeState): void {
    // Clear canvas
    g.fillStyle = '#87CEEB'; // Sky blue background
    g.fillRect(0, 0, 960, 720);
    
    // Draw safety net at bottom
    drawNet(g);
    
    // Draw trapeze structures
    drawTrapeze(g, 240, 100, state.acrobatAngle, state.ropeLength, !state.released);
    drawTrapeze(g, 720, 100, state.partnerAngle, state.ropeLength, true);
    
    // Draw partner
    const partnerPos = getPartnerPosition(state);
    drawPerson(g, partnerPos.x, partnerPos.y, assets.partner, state.partnerAngle);
    
    // Draw acrobat
    const acrobatPos = getAcrobatPosition(state);
    let acrobatImage = assets.acrobat;
    if (currentPose === 'success') {
      acrobatImage = assets.acrobatSuccess;
    } else if (currentPose === 'fail') {
      acrobatImage = assets.acrobatFail;
    }
    drawPerson(g, acrobatPos.x, acrobatPos.y, acrobatImage, state.released ? 0 : state.acrobatAngle);
    
    // Draw trajectory hint when not released
    if (!state.released && !state.caught && !state.missed) {
      drawTrajectoryHint(g, state);
    }
  }
  
  function drawNet(g: CanvasRenderingContext2D): void {
    g.strokeStyle = '#666';
    g.lineWidth = 2;
    
    // Draw net pattern
    const netY = 650;
    const netWidth = 960;
    const spacing = 40;
    
    // Horizontal lines
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.moveTo(0, netY + i * 20);
      g.lineTo(netWidth, netY + i * 20);
      g.stroke();
    }
    
    // Vertical lines
    for (let x = 0; x < netWidth; x += spacing) {
      g.beginPath();
      g.moveTo(x, netY);
      g.lineTo(x, netY + 40);
      g.stroke();
    }
  }
  
  function drawTrapeze(
    g: CanvasRenderingContext2D,
    pivotX: number,
    pivotY: number,
    angle: number,
    ropeLength: number,
    showBar: boolean
  ): void {
    // Draw support structure
    g.strokeStyle = '#333';
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(pivotX, 0);
    g.lineTo(pivotX, pivotY);
    g.stroke();
    
    // Draw pivot point
    g.fillStyle = '#666';
    g.beginPath();
    g.arc(pivotX, pivotY, 8, 0, Math.PI * 2);
    g.fill();
    
    if (showBar) {
      // Draw ropes
      const barX = pivotX + ropeLength * Math.sin(angle);
      const barY = pivotY + ropeLength * Math.cos(angle);
      
      g.strokeStyle = '#666';
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(pivotX - 10, pivotY);
      g.lineTo(barX - 40, barY);
      g.stroke();
      
      g.beginPath();
      g.moveTo(pivotX + 10, pivotY);
      g.lineTo(barX + 40, barY);
      g.stroke();
      
      // Draw bar
      g.save();
      g.translate(barX, barY);
      g.rotate(angle);
      g.drawImage(assets.trapezeBar, -50, -10, 100, 20);
      g.restore();
    }
  }
  
  function drawPerson(
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    image: HTMLImageElement,
    angle: number
  ): void {
    g.save();
    g.translate(x, y);
    g.rotate(angle);
    g.drawImage(image, -30, -40, 60, 80);
    g.restore();
  }
  
  function drawTrajectoryHint(g: CanvasRenderingContext2D, state: TrapezeState): void {
    // Draw a faint arc showing potential trajectory
    const pivotX = 240;
    const pivotY = 100;
    const angle = state.acrobatAngle;
    const startX = pivotX + state.ropeLength * Math.sin(angle);
    const startY = pivotY + state.ropeLength * Math.cos(angle);
    
    g.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    g.lineWidth = 2;
    g.setLineDash([5, 5]);
    g.beginPath();
    g.moveTo(startX, startY);
    
    // Simple parabolic arc
    const steps = 20;
    const angularVel = state.acrobatAngularVelocity;
    const tangentialSpeed = state.ropeLength * angularVel;
    const vx = tangentialSpeed * Math.cos(angle);
    let vy = tangentialSpeed * Math.sin(angle);
    let px = startX;
    let py = startY;
    
    for (let i = 0; i < steps; i++) {
      const dt = 0.05; // 50ms steps
      vy += 600 * dt;
      px += vx * dt;
      py += vy * dt;
      
      if (py > 650) break; // Stop at net
      g.lineTo(px, py);
    }
    
    g.stroke();
    g.setLineDash([]);
  }
  
  function setPose(pose: 'success' | 'fail'): void {
    currentPose = pose;
  }
  
  function dispose(): void {
    canvas.remove();
  }
  
  return { draw, setPose, dispose };
}
