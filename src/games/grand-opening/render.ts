import type { GameContext } from '@arcade/sdk';
import type { GameState } from './logic';
import { RIBBON_Y, RIBBON_LENGTH, STAGE_WIDTH, getMarkPosition, getPostPositions } from './logic';

const POST_WIDTH = 20;
const POST_HEIGHT = 200;
const RIBBON_HEIGHT = 8;
const SCISSORS_SIZE = 80;
const CROWD_Y = 550;

export function createRenderer(ctx: GameContext) {
  const { g } = ctx.createCanvas();
  
  function drawBackground() {
    // Sky
    g.fillStyle = '#87CEEB';
    g.fillRect(0, 0, STAGE_WIDTH, 500);
    
    // Ground
    g.fillStyle = '#90EE90';
    g.fillRect(0, 500, STAGE_WIDTH, 220);
  }
  
  function drawPosts(state: GameState) {
    const posts = getPostPositions(state);
    
    // Left post
    g.fillStyle = '#8B4513';
    g.fillRect(posts.left - POST_WIDTH / 2, RIBBON_Y - POST_HEIGHT / 2, POST_WIDTH, POST_HEIGHT);
    
    // Right post
    g.fillRect(posts.right - POST_WIDTH / 2, RIBBON_Y - POST_HEIGHT / 2, POST_WIDTH, POST_HEIGHT);
    
    // Post tops (decorative)
    g.fillStyle = '#FFD700';
    g.beginPath();
    g.arc(posts.left, RIBBON_Y - POST_HEIGHT / 2, 15, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.arc(posts.right, RIBBON_Y - POST_HEIGHT / 2, 15, 0, Math.PI * 2);
    g.fill();
  }
  
  function drawRibbon(state: GameState) {
    const posts = getPostPositions(state);
    
    // Ribbon
    g.fillStyle = '#FF6B6B';
    g.fillRect(posts.left, RIBBON_Y - RIBBON_HEIGHT / 2, RIBBON_LENGTH, RIBBON_HEIGHT);
    
    // Red mark
    const mark = getMarkPosition(state);
    g.fillStyle = '#DC143C';
    g.fillRect(
      mark.x - state.markWidth / 2,
      mark.y - RIBBON_HEIGHT / 2 - 8,
      state.markWidth,
      RIBBON_HEIGHT + 16
    );
    
    // Mark indicator (small lines above and below)
    g.strokeStyle = '#8B0000';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(mark.x - state.markWidth / 2, mark.y - 20);
    g.lineTo(mark.x - state.markWidth / 2, mark.y - 12);
    g.moveTo(mark.x + state.markWidth / 2, mark.y - 20);
    g.lineTo(mark.x + state.markWidth / 2, mark.y - 12);
    g.moveTo(mark.x - state.markWidth / 2, mark.y + 12);
    g.lineTo(mark.x - state.markWidth / 2, mark.y + 20);
    g.moveTo(mark.x + state.markWidth / 2, mark.y + 12);
    g.lineTo(mark.x + state.markWidth / 2, mark.y + 20);
    g.stroke();
  }
  
  function drawScissors(state: GameState, reducedMotion: boolean) {
    const centerX = STAGE_WIDTH / 2;
    const centerY = RIBBON_Y - 100;
    
    // Animate scissors when snipped
    let offsetY = 0;
    let rotation = 0;
    
    if (state.snipped && !reducedMotion) {
      offsetY = 30; // Move down when cutting
      rotation = 0.1; // Slight rotation
    }
    
    g.save();
    g.translate(centerX, centerY + offsetY);
    g.rotate(rotation);
    
    // Scissors body
    g.fillStyle = '#C0C0C0';
    
    // Left blade
    g.beginPath();
    g.moveTo(-SCISSORS_SIZE / 3, 0);
    g.lineTo(-SCISSORS_SIZE / 2, -SCISSORS_SIZE / 2);
    g.lineTo(-SCISSORS_SIZE / 3 + 5, -SCISSORS_SIZE / 2 + 10);
    g.closePath();
    g.fill();
    
    // Right blade
    g.beginPath();
    g.moveTo(SCISSORS_SIZE / 3, 0);
    g.lineTo(SCISSORS_SIZE / 2, -SCISSORS_SIZE / 2);
    g.lineTo(SCISSORS_SIZE / 3 - 5, -SCISSORS_SIZE / 2 + 10);
    g.closePath();
    g.fill();
    
    // Handles (circles)
    g.fillStyle = '#4169E1';
    g.beginPath();
    g.arc(-SCISSORS_SIZE / 3, 0, 12, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.arc(SCISSORS_SIZE / 3, 0, 12, 0, Math.PI * 2);
    g.fill();
    
    // Center screw
    g.fillStyle = '#696969';
    g.beginPath();
    g.arc(0, -10, 6, 0, Math.PI * 2);
    g.fill();
    
    g.restore();
  }
  
  function drawCrowd(state: GameState) {
    // Simple crowd representation
    const crowdCount = 8;
    const spacing = STAGE_WIDTH / (crowdCount + 1);
    
    for (let i = 0; i < crowdCount; i++) {
      const x = spacing * (i + 1);
      const y = CROWD_Y;
      
      // Determine if happy or sad based on result
      let faceColor = '#FFE4B5'; // Neutral
      let expression = 'neutral';
      
      if (state.result === 'hit') {
        faceColor = '#FFE4B5';
        expression = 'happy';
      } else if (state.result === 'miss') {
        faceColor = '#D3D3D3';
        expression = 'sad';
      }
      
      // Head
      g.fillStyle = faceColor;
      g.beginPath();
      g.arc(x, y, 20, 0, Math.PI * 2);
      g.fill();
      
      // Face
      g.fillStyle = '#000';
      
      if (expression === 'happy') {
        // Happy eyes
        g.beginPath();
        g.arc(x - 7, y - 5, 2, 0, Math.PI * 2);
        g.arc(x + 7, y - 5, 2, 0, Math.PI * 2);
        g.fill();
        
        // Smile
        g.beginPath();
        g.arc(x, y + 3, 8, 0, Math.PI);
        g.stroke();
      } else if (expression === 'sad') {
        // Sad eyes
        g.beginPath();
        g.arc(x - 7, y - 5, 2, 0, Math.PI * 2);
        g.arc(x + 7, y - 5, 2, 0, Math.PI * 2);
        g.fill();
        
        // Frown
        g.beginPath();
        g.arc(x, y + 10, 8, Math.PI, 0);
        g.stroke();
      } else {
        // Neutral eyes
        g.beginPath();
        g.arc(x - 7, y - 5, 2, 0, Math.PI * 2);
        g.arc(x + 7, y - 5, 2, 0, Math.PI * 2);
        g.fill();
        
        // Neutral mouth
        g.beginPath();
        g.moveTo(x - 6, y + 5);
        g.lineTo(x + 6, y + 5);
        g.stroke();
      }
      
      // Body (simple rectangle)
      g.fillStyle = '#4169E1';
      g.fillRect(x - 10, y + 20, 20, 30);
    }
  }
  
  function drawCutEffect(state: GameState) {
    if (!state.snipped) return;
    
    const centerX = STAGE_WIDTH / 2;
    
    // Draw cut line
    g.strokeStyle = state.result === 'hit' ? '#FFD700' : '#FF0000';
    g.lineWidth = 3;
    g.setLineDash([5, 5]);
    g.beginPath();
    g.moveTo(centerX, RIBBON_Y - 50);
    g.lineTo(centerX, RIBBON_Y + 50);
    g.stroke();
    g.setLineDash([]);
    
    // Result text
    if (state.result) {
      g.font = 'bold 48px system-ui, sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      
      if (state.result === 'hit') {
        g.fillStyle = '#FFD700';
        g.strokeStyle = '#000';
        g.lineWidth = 3;
        g.strokeText('PERFECT!', centerX, 100);
        g.fillText('PERFECT!', centerX, 100);
      } else {
        g.fillStyle = '#FF0000';
        g.strokeStyle = '#000';
        g.lineWidth = 3;
        g.strokeText('MISSED!', centerX, 100);
        g.fillText('MISSED!', centerX, 100);
      }
    }
  }
  
  return {
    draw(state: GameState) {
      g.clearRect(0, 0, STAGE_WIDTH, 720);
      
      drawBackground();
      drawCrowd(state);
      drawPosts(state);
      drawRibbon(state);
      drawScissors(state, ctx.reducedMotion);
      drawCutEffect(state);
    },
  };
}
