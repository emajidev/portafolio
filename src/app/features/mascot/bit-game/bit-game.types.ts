import type * as THREE from 'three';

export type ThreeModule = typeof THREE;

export type GameId = 'pong' | 'invaders' | 'tron';

export interface GameResult {
  winner: 'player' | 'bit' | 'draw';
  playerScore: number;
  bitScore: number;
}

export interface GameCallbacks {
  onScore: (playerScore: number, bitScore: number) => void;
  onEnd: (result: GameResult) => void;
}

export interface GameEngine {
  start(): void;
  dispose(): void;
  resize(width: number, height: number): void;
}

export const GAME_META: Record<GameId, { title: string; icon: string; hint: string }> = {
  pong: { title: 'BIT PONG', icon: '◉', hint: 'Mueve el mouse o ↑ / ↓' },
  invaders: { title: 'BIT INVADERS', icon: '▲', hint: 'Mueve con ← / → y dispara con ESPACIO' },
  tron: { title: 'BIT CYCLES', icon: '◆', hint: 'Gira con ← / → o W / A / S / D' },
};
