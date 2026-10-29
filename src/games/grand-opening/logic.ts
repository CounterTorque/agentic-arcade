import type { Difficulty, Rng } from '@arcade/sdk';

export interface RibbonState {
  /** X position of the ribbon center (posts move symmetrically around center) */
  x: number;
  /** Current velocity in px/s */
  velocity: number;
  /** Target velocity for smooth transitions (level 2+) */
  targetVelocity?: number;
  /** Time until next direction change (level 3) */
  nextChangeMs?: number;
}

export interface GameState {
  ribbon: RibbonState;
  /** X position of the red mark relative to ribbon center */
  markX: number;
  /** Width of the red mark in pixels */
  markWidth: number;
  /** Whether the scissors have been activated */
  snipped: boolean;
  /** Result of the snip: 'hit' | 'miss' | null */
  result: 'hit' | 'miss' | null;
  /** Base speed for this round */
  baseSpeed: number;
}

const STAGE_WIDTH = 960;
const RIBBON_Y = 300;
const RIBBON_LENGTH = 600;
const POST_SPACING = RIBBON_LENGTH;

/**
 * Calculate the mark width based on difficulty level
 */
function getMarkWidth(level: number): number {
  if (level === 1) return 30;
  if (level === 2) return 22;
  return 14;
}

/**
 * Calculate base speed based on difficulty
 */
function getBaseSpeed(difficulty: Difficulty): number {
  // Base speed at level 1, speed 1.0 is 80 px/s
  return 80 * difficulty.speed;
}

/**
 * Initialize the game state
 */
export function createState(difficulty: Difficulty, rng: Rng): GameState {
  const baseSpeed = getBaseSpeed(difficulty);
  const markWidth = getMarkWidth(difficulty.level);
  
  // Start ribbon at center
  const ribbonX = STAGE_WIDTH / 2;
  
  // Place mark randomly along the ribbon
  const maxMarkOffset = (RIBBON_LENGTH / 2) - markWidth;
  const markX = rng.range(-maxMarkOffset, maxMarkOffset);
  
  // Initial velocity
  let velocity = baseSpeed;
  if (difficulty.level >= 2) {
    // Start with a random direction
    velocity *= rng.chance(0.5) ? 1 : -1;
  }
  
  const ribbon: RibbonState = {
    x: ribbonX,
    velocity,
  };
  
  // Level 3: set up random direction changes
  if (difficulty.level >= 3) {
    ribbon.nextChangeMs = rng.range(800, 1500);
  }
  
  return {
    ribbon,
    markX,
    markWidth,
    snipped: false,
    result: null,
    baseSpeed,
  };
}

/**
 * Update the game state
 */
export function step(
  state: GameState,
  dtMs: number,
  snipPressed: boolean,
  difficulty: Difficulty,
  rng: Rng,
): void {
  // If already snipped, freeze the state
  if (state.snipped) return;
  
  const dt = dtMs / 1000;
  
  // Handle snip input
  if (snipPressed) {
    state.snipped = true;
    
    // Check if the scissors (at center) hit the mark
    const scissorsX = STAGE_WIDTH / 2;
    const markAbsoluteX = state.ribbon.x + state.markX;
    const markLeft = markAbsoluteX - state.markWidth / 2;
    const markRight = markAbsoluteX + state.markWidth / 2;
    
    state.result = (scissorsX >= markLeft && scissorsX <= markRight) ? 'hit' : 'miss';
    return;
  }
  
  // Update ribbon position based on difficulty level
  if (difficulty.level === 1) {
    // Level 1: constant speed
    state.ribbon.x += state.ribbon.velocity * dt;
  } else if (difficulty.level === 2) {
    // Level 2: speed up and slow down smoothly
    if (state.ribbon.targetVelocity === undefined) {
      state.ribbon.targetVelocity = state.baseSpeed * (rng.chance(0.5) ? 1 : -1);
    }
    
    // Smoothly interpolate velocity
    const velocityDiff = state.ribbon.targetVelocity - state.ribbon.velocity;
    const acceleration = 200 * difficulty.speed; // px/s²
    const maxChange = acceleration * dt;
    
    if (Math.abs(velocityDiff) < maxChange) {
      state.ribbon.velocity = state.ribbon.targetVelocity;
      // Pick a new target
      state.ribbon.targetVelocity = state.baseSpeed * (rng.chance(0.5) ? 1.5 : 0.5) * (rng.chance(0.5) ? 1 : -1);
    } else {
      state.ribbon.velocity += Math.sign(velocityDiff) * maxChange;
    }
    
    state.ribbon.x += state.ribbon.velocity * dt;
  } else {
    // Level 3: random direction changes
    if (state.ribbon.nextChangeMs !== undefined) {
      state.ribbon.nextChangeMs -= dtMs;
      
      if (state.ribbon.nextChangeMs <= 0) {
        // Reverse direction
        state.ribbon.velocity = -state.ribbon.velocity;
        state.ribbon.nextChangeMs = rng.range(600, 1200);
      }
    }
    
    state.ribbon.x += state.ribbon.velocity * dt;
  }
  
  // Keep ribbon within bounds (with some margin)
  const minX = POST_SPACING / 2 + 50;
  const maxX = STAGE_WIDTH - POST_SPACING / 2 - 50;
  
  if (state.ribbon.x < minX) {
    state.ribbon.x = minX;
    state.ribbon.velocity = Math.abs(state.ribbon.velocity);
    if (difficulty.level >= 3 && state.ribbon.nextChangeMs !== undefined) {
      state.ribbon.nextChangeMs = rng.range(600, 1200);
    }
  } else if (state.ribbon.x > maxX) {
    state.ribbon.x = maxX;
    state.ribbon.velocity = -Math.abs(state.ribbon.velocity);
    if (difficulty.level >= 3 && state.ribbon.nextChangeMs !== undefined) {
      state.ribbon.nextChangeMs = rng.range(600, 1200);
    }
  }
}

/**
 * Get the absolute position of the red mark
 */
export function getMarkPosition(state: GameState): { x: number; y: number } {
  return {
    x: state.ribbon.x + state.markX,
    y: RIBBON_Y,
  };
}

/**
 * Get the positions of the posts
 */
export function getPostPositions(state: GameState): { left: number; right: number } {
  return {
    left: state.ribbon.x - POST_SPACING / 2,
    right: state.ribbon.x + POST_SPACING / 2,
  };
}

export { RIBBON_Y, RIBBON_LENGTH, STAGE_WIDTH };
