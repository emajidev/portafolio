import { Injectable, signal } from '@angular/core';
import { GameId } from '../../features/mascot/bit-game/bit-game.types';

@Injectable({ providedIn: 'root' })
export class BitGameService {
  readonly isOpen = signal(false);
  readonly initialGame = signal<GameId | null>(null);

  open(game: GameId | null = null): void {
    this.initialGame.set(game);
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }
}
