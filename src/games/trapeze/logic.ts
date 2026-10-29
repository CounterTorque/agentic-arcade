import { type Difficulty } from '@arcade/sdk';

// Constants for trapeze game
const SWING_CENTER_Y = 100;
const ACROBAT_START_X = 200;
const PARTNER_START_X = 760;
const CATCH_ZONE_Y = 250;
const NET_Y = 600;

export interface TrapezeState {
  acrobatX: number;
  acrobatY: number;
  acrobatVx: number;
  acrobatVy: number;
  partnerX: number;
  partnerY: number;
  partnerVx: number;
  partnerVy: number;
  released: boolean;
  status: 'playing' | 'caught' | 'missed';
  acrobatPhase: number; // 0-1 for swing animation
  partnerPhase: number; // 0-1 for swing animation
}

export function createState(difficulty: Difficulty): TrapezeState {
  return {
    acrobatX: ACROBAT_START_X,
    acrobatY: SWING_CENTER_Y,
    acrobatVx: 0,
    acrobatVy: 0,
    partnerX: PARTNER_START_X,
    partnerY: SWING_CENTER_Y,
    partnerVx: 0,
    partnerVy: 0,
    released: false,
    status: 'playing',
    acrobatPhase: 0,
    partnerPhase: difficulty.level >= 2 ? 0.5 : 0, // Out of phase at level 2+
  };
}

export function step(s: TrapezeState, dtMs: number, actionPressed: boolean, difficulty: Difficulty): void {
  if (s.status !== 'playing') return;

  const dt = dtMs / 1000;
  const speed = difficulty.speed;

  // Swing periods based on difficulty level
  let acrobatPeriod = 2.0; // seconds
  let partnerPeriod = 2.0;
  if (difficulty.level >= 2) {
    acrobatPeriod = 1.8;
    partnerPeriod = 1.8;
  }
  if (difficulty.level >= 3) {
    acrobatPeriod = 1.5;
    partnerPeriod = 1.3;
  }

  // Scale periods by speed
  acrobatPeriod /= speed;
  partnerPeriod /= speed;

  // Update swing phases
  s.acrobatPhase += (dt / acrobatPeriod) * speed;
  s.partnerPhase += (dt / partnerPeriod) * speed;

  // Wrap phases
  if (s.acrobatPhase > 1) s.acrobatPhase -= 1;
  if (s.partnerPhase > 1) s.partnerPhase -= 1;

  // Calculate swing positions (pendulum motion)
  const acrobatSwingRadius = 150;
  const partnerSwingRadius = 150;

  // Acrobat swings from left to right
  const acrobatAngle = (s.acrobatPhase - 0.5) * Math.PI * 0.8; // -0.4π to 0.4π
  const newAcrobatX = ACROBAT_START_X + acrobatSwingRadius * Math.sin(acrobatAngle);
  const newAcrobatY = SWING_CENTER_Y + acrobatSwingRadius * (1 - Math.cos(acrobatAngle));

  // Partner swings from right to left
  const partnerAngle = (s.partnerPhase - 0.5) * Math.PI * 0.8;
  const newPartnerX = PARTNER_START_X - partnerSwingRadius * Math.sin(partnerAngle);
  const newPartnerY = SWING_CENTER_Y + partnerSwingRadius * (1 - Math.cos(partnerAngle));

  // Handle release
  if (actionPressed && !s.released) {
    s.released = true;
    // Capture velocity at release
    s.acrobatVx = (newAcrobatX - s.acrobatX) / dt;
    s.acrobatVy = (newAcrobatY - s.acrobatY) / dt;
  }

  // Update positions
  if (!s.released) {
    // Still on swing - update to swing position
    s.acrobatX = newAcrobatX;
    s.acrobatY = newAcrobatY;
  } else {
    // Released - apply gravity and continue with captured velocity
    const gravity = 1200 * speed;
    s.acrobatVy += gravity * dt;
    s.acrobatX += s.acrobatVx * dt;
    s.acrobatY += s.acrobatVy * dt;
  }

  // Always update partner position (still swinging)
  s.partnerX = newPartnerX;
  s.partnerY = newPartnerY;
  s.partnerVx = (newPartnerX - s.partnerX) / dt;
  s.partnerVy = (newPartnerY - s.partnerY) / dt;

  // Check for catch or miss
  if (s.released) {
    const catchTolerance = difficulty.level === 1 ? 40 : difficulty.level === 2 ? 30 : 20;
    const dx = Math.abs(s.acrobatX - s.partnerX);
    const dy = Math.abs(s.acrobatY - s.partnerY);

    if (dx < catchTolerance && dy < catchTolerance && s.acrobatY >= CATCH_ZONE_Y - 50 && s.acrobatY <= CATCH_ZONE_Y + 50) {
      s.status = 'caught';
    } else if (s.acrobatY > NET_Y) {
      s.status = 'missed';
    }
  }
}

export function isWin(s: TrapezeState): boolean {
  return s.status === 'caught';
}

export function isLose(s: TrapezeState): boolean {
  return s.status === 'missed';
}
