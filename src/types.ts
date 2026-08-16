/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'GAMEOVER';

export interface GameStats {
  score: number;
  highScore: number;
  coins: number;
  distance: number;
  lives: number;
  multiplier: number;
  status: GameStatus;
}

export type Lane = -1 | 0 | 1; // Left, Center, Right

export type ObstacleType = 
  | 'GOOMBA' 
  | 'PIPE' 
  | 'FLOATING_PIPE' 
  | 'BLOCK' 
  | 'PITFALL' 
  | 'GAS_CANISTER' 
  | 'POWERUP'
  | 'CYBER_DRONE' 
  | 'NEON_BARRIER' 
  | 'HANGING_BARRIER' 
  | 'DATA_CUBE';

export interface GameEntity {
  id: string;
  type: ObstacleType | 'COIN';
  lane: Lane;
  z: number; // Position along the track
  y: number; // Height above the track
  hit: boolean; // True if player has collected/hit it
  width?: number;
  height?: number;
  speed?: number; // Side-to-side or forward speed if moving
}

export type Language = 'en' | 'ar' | 'es' | 'fr' | 'zh';
