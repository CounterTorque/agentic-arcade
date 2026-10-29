import type { TrapezeState } from './logic';

export function render(canvas: HTMLCanvasElement, g: CanvasRenderingContext2D, s: TrapezeState): void {
  // Clear canvas
  g.fillStyle = '#f0f0f0';
  g.fillRect(0, 0, 960, 720);

  // Draw sky
  g.fillStyle = '#87ceeb';
  g.fillRect(0, 0, 960, 300);

  // Draw safety net
  g.strokeStyle = '#ff6b6b';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(100, 600);
  g.lineTo(860, 600);
  g.stroke();

  // Draw net pattern
  g.strokeStyle = '#ff6b6b';
  g.lineWidth = 1;
  for (let i = 0; i < 20; i++) {
    g.beginPath();
    g.moveTo(100 + i * 40, 600);
    g.lineTo(100 + i * 40, 650);
    g.stroke();
  }

  // Draw trapeze bars
  drawTrapezeBars(g);

  // Draw acrobat
  drawAcrobat(g, s.acrobatX, s.acrobatY, '#ffd6a5');

  // Draw partner
  drawPartner(g, s.partnerX, s.partnerY, '#a8dadc');

  // Draw ropes from acrobats to bars
  g.strokeStyle = '#8b4513';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(s.acrobatX, s.acrobatY - 20);
  g.lineTo(200, 80);
  g.stroke();

  g.beginPath();
  g.moveTo(s.partnerX, s.partnerY - 20);
  g.lineTo(760, 80);
  g.stroke();

  // Draw status text
  if (s.status === 'caught') {
    g.fillStyle = '#2ecc71';
    g.font = 'bold 48px sans-serif';
    g.textAlign = 'center';
    g.fillText('CAUGHT!', 480, 360);
  } else if (s.status === 'missed') {
    g.fillStyle = '#e74c3c';
    g.font = 'bold 48px sans-serif';
    g.textAlign = 'center';
    g.fillText('MISSED!', 480, 360);
  }
}

function drawTrapezeBars(g: CanvasRenderingContext2D): void {
  // Left trapeze bar
  g.fillStyle = '#8b4513';
  g.fillRect(160, 80, 80, 8);
  g.strokeStyle = '#1d3557';
  g.lineWidth = 2;
  g.strokeRect(160, 80, 80, 8);

  // Right trapeze bar
  g.fillStyle = '#8b4513';
  g.fillRect(720, 80, 80, 8);
  g.strokeStyle = '#1d3557';
  g.lineWidth = 2;
  g.strokeRect(720, 80, 80, 8);
}

function drawAcrobat(g: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  g.save();
  g.translate(x, y);

  // Head
  g.fillStyle = color;
  g.beginPath();
  g.arc(0, -15, 8, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#1d3557';
  g.lineWidth = 2;
  g.stroke();

  // Eyes
  g.fillStyle = '#1d3557';
  g.beginPath();
  g.arc(-3, -17, 1.5, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.arc(3, -17, 1.5, 0, Math.PI * 2);
  g.fill();

  // Smile
  g.strokeStyle = '#1d3557';
  g.lineWidth = 1.5;
  g.beginPath();
  g.arc(0, -12, 4, 0, Math.PI);
  g.stroke();

  // Body
  g.strokeStyle = '#1d3557';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(0, -7);
  g.lineTo(0, 10);
  g.stroke();

  // Arms
  g.lineWidth = 2.5;
  g.beginPath();
  g.moveTo(0, -3);
  g.lineTo(-12, 3);
  g.stroke();
  g.beginPath();
  g.moveTo(0, -3);
  g.lineTo(12, 3);
  g.stroke();

  // Legs
  g.beginPath();
  g.moveTo(0, 10);
  g.lineTo(-8, 25);
  g.stroke();
  g.beginPath();
  g.moveTo(0, 10);
  g.lineTo(8, 25);
  g.stroke();

  g.restore();
}

function drawPartner(g: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  g.save();
  g.translate(x, y);

  // Head
  g.fillStyle = color;
  g.beginPath();
  g.arc(0, -15, 8, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#1d3557';
  g.lineWidth = 2;
  g.stroke();

  // Eyes
  g.fillStyle = '#1d3557';
  g.beginPath();
  g.arc(-3, -17, 1.5, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.arc(3, -17, 1.5, 0, Math.PI * 2);
  g.fill();

  // Smile
  g.strokeStyle = '#1d3557';
  g.lineWidth = 1.5;
  g.beginPath();
  g.arc(0, -12, 4, 0, Math.PI);
  g.stroke();

  // Body
  g.strokeStyle = '#1d3557';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(0, -7);
  g.lineTo(0, 10);
  g.stroke();

  // Arms (ready to catch)
  g.lineWidth = 2.5;
  g.beginPath();
  g.moveTo(0, -3);
  g.lineTo(-12, 3);
  g.stroke();
  g.beginPath();
  g.moveTo(0, -3);
  g.lineTo(12, 3);
  g.stroke();

  // Legs
  g.beginPath();
  g.moveTo(0, 10);
  g.lineTo(-8, 25);
  g.stroke();
  g.beginPath();
  g.moveTo(0, 10);
  g.lineTo(8, 25);
  g.stroke();

  g.restore();
}
