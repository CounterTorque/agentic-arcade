import type { Difficulty } from '@arcade/sdk';

export interface TrapezeState {
  // Acrobat swing
  acrobatAngle: number; // radians
  acrobatAngularVelocity: number;
  acrobatPeriod: number; // ms for full swing
  
  // Partner swing
  partnerAngle: number; // radians
  partnerAngularVelocity: number;
  partnerPeriod: number;
  
  // Game state
  released: boolean;
  releaseTime: number;
  acrobatX: number;
  acrobatY: number;
  acrobatVelX: number;
  acrobatVelY: number;
  
  // Outcome
  caught: boolean;
  missed: boolean;
  
  // Config
  catchTolerance: number;
  ropeLength: number;
  speed: number;
}

export function createState(difficulty: Difficulty): TrapezeState {
  const { speed, level } = difficulty;
  
  // Level configuration from spec:
  // 1: Both swings in phase; catch tolerance 40px
  // 2: Swings slightly out of phase; tolerance 30px
  // 3: Swings fully out of phase with faster periods; tolerance 20px
  
  let catchTolerance: number;
  let phaseOffset: number; // radians
  let basePeriod: number; // ms at speed 1.0
  
  switch (level) {
    case 1:
      catchTolerance = 40;
      phaseOffset = 0;
      basePeriod = 2000;
      break;
    case 2:
      catchTolerance = 30;
      phaseOffset = Math.PI / 4; // 45 degrees out of phase
      basePeriod = 1800;
      break;
    case 3:
      catchTolerance = 20;
      phaseOffset = Math.PI; // 180 degrees out of phase
      basePeriod = 1500;
      break;
    default:
      catchTolerance = 40;
      phaseOffset = 0;
      basePeriod = 2000;
  }
  
  // Scale period by speed
  const acrobatPeriod = basePeriod / speed;
  const partnerPeriod = basePeriod / speed;
  
  // Start acrobat at left side of swing
  const acrobatStartAngle = -Math.PI / 3; // -60 degrees
  
  // Partner starts with phase offset
  const partnerStartAngle = -Math.PI / 3 + phaseOffset;
  
  const ropeLength = 180;
  
  return {
    acrobatAngle: acrobatStartAngle,
    acrobatAngularVelocity: (2 * Math.PI) / acrobatPeriod,
    acrobatPeriod,
    
    partnerAngle: partnerStartAngle,
    partnerAngularVelocity: (2 * Math.PI) / partnerPeriod,
    partnerPeriod,
    
    released: false,
    releaseTime: 0,
    acrobatX: 0,
    acrobatY: 0,
    acrobatVelX: 0,
    acrobatVelY: 0,
    
    caught: false,
    missed: false,
    
    catchTolerance,
    ropeLength,
    speed,
  };
}

export function step(state: TrapezeState, dt: number, actionPressed: boolean): void {
  if (state.caught || state.missed) {
    return; // Game over
  }
  
  if (!state.released) {
    // Update acrobat swing
    updateSwing(state, 'acrobat', dt);
    
    // Check for release
    if (actionPressed) {
      releaseAcrobat(state);
    }
  } else {
    // Acrobat is in flight
    updateFlight(state, dt);
    
    // Check for catch
    checkCatch(state);
  }
  
  // Always update partner swing
  updateSwing(state, 'partner', dt);
}

function updateSwing(state: TrapezeState, who: 'acrobat' | 'partner', dt: number): void {
  const angleKey = who === 'acrobat' ? 'acrobatAngle' : 'partnerAngle';
  const velocityKey = who === 'acrobat' ? 'acrobatAngularVelocity' : 'partnerAngularVelocity';
  
  // Simple harmonic motion for pendulum
  // Update angle based on time
  state[angleKey] += state[velocityKey] * dt;
  
  // Keep angle in reasonable range
  if (state[angleKey] > Math.PI * 2) {
    state[angleKey] -= Math.PI * 2;
  }
}

function releaseAcrobat(state: TrapezeState): void {
  state.released = true;
  state.releaseTime = 0;
  
  // Calculate release velocity based on swing
  // Velocity is tangent to the circle at release point
  const angle = state.acrobatAngle;
  const angularVel = state.acrobatAngularVelocity;
  
  // Tangential velocity = radius * angular velocity
  const tangentialSpeed = state.ropeLength * angularVel;
  
  // Velocity direction is perpendicular to rope
  state.acrobatVelX = tangentialSpeed * Math.cos(angle);
  state.acrobatVelY = tangentialSpeed * Math.sin(angle);
  
  // Initial position at end of rope
  const pivotX = 240; // Left side pivot
  const pivotY = 100;
  state.acrobatX = pivotX + state.ropeLength * Math.sin(angle);
  state.acrobatY = pivotY + state.ropeLength * Math.cos(angle);
}

function updateFlight(state: TrapezeState, dt: number): void {
  const dtSec = dt / 1000;
  const gravity = 600; // pixels per second squared
  
  // Update velocity
  state.acrobatVelY += gravity * dtSec;
  
  // Update position
  state.acrobatX += state.acrobatVelX * dtSec;
  state.acrobatY += state.acrobatVelY * dtSec;
  
  state.releaseTime += dt;
  
  // Check if fell into net (below screen)
  if (state.acrobatY > 720) {
    state.missed = true;
  }
}

function checkCatch(state: TrapezeState): void {
  // Partner position
  const partnerPivotX = 720; // Right side pivot
  const partnerPivotY = 100;
  const partnerX = partnerPivotX + state.ropeLength * Math.sin(state.partnerAngle);
  const partnerY = partnerPivotY + state.ropeLength * Math.cos(state.partnerAngle);
  
  // Check distance
  const dx = state.acrobatX - partnerX;
  const dy = state.acrobatY - partnerY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance < state.catchTolerance) {
    state.caught = true;
  }
}

export function getAcrobatPosition(state: TrapezeState): { x: number; y: number } {
  if (state.released) {
    return { x: state.acrobatX, y: state.acrobatY };
  }
  
  const pivotX = 240;
  const pivotY = 100;
  return {
    x: pivotX + state.ropeLength * Math.sin(state.acrobatAngle),
    y: pivotY + state.ropeLength * Math.cos(state.acrobatAngle),
  };
}

export function getPartnerPosition(state: TrapezeState): { x: number; y: number } {
  const pivotX = 720;
  const pivotY = 100;
  return {
    x: pivotX + state.ropeLength * Math.sin(state.partnerAngle),
    y: pivotY + state.ropeLength * Math.cos(state.partnerAngle),
  };
}
