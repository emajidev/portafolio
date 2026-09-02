import { Component, ElementRef, OnDestroy, PLATFORM_ID, ViewChild, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BitGameService } from '../../../core/services/bit-game.service';
import { bitSound } from '../../../shared/utils/bit-sound';
import { GAME_META, GameCallbacks, GameEngine, GameId, GameResult, ThreeModule } from './bit-game.types';
import { PongEngine } from './engines/pong.engine';
import { InvadersEngine } from './engines/invaders.engine';
import { TronEngine } from './engines/tron.engine';

type Phase = 'select' | 'countdown' | 'playing' | 'over';

@Component({
  selector: 'app-bit-game-modal',
  standalone: true,
  template: `
    @if (shown()) {
      <div class="bg-backdrop" [class.bg-backdrop--exit]="closing()" (click)="requestClose()">
        <div class="bg-frame" [class.bg-frame--exit]="closing()" (click)="$event.stopPropagation()">
          <div class="bg-topbar">
            <span class="bg-title">{{ game() ? gameMeta[game()!].title : 'BIT ARCADE' }}</span>
            <button type="button" class="bg-close interactive" (click)="requestClose()" aria-label="Cerrar juego">✕</button>
          </div>

          @if (phase() === 'select') {
            <div class="bg-select">
              <p class="bg-select__hint">Elige un juego contra Bit</p>
              <div class="bg-select__grid">
                @for (id of gameIds; track id) {
                  <button type="button" class="bg-game-card interactive" (click)="selectGame(id)">
                    <span class="bg-game-card__icon">{{ gameMeta[id].icon }}</span>
                    <span class="bg-game-card__title">{{ gameMeta[id].title }}</span>
                  </button>
                }
              </div>
            </div>
          } @else {
            <div class="bg-stage">
              <div class="bg-hud">
                <span class="bg-hud__score bg-hud__score--player">YOU {{ playerScore() }}</span>
                <span class="bg-hud__vs">VS</span>
                <span class="bg-hud__score bg-hud__score--bit">BIT {{ bitScore() }}</span>
              </div>

              <div class="bg-canvas-wrap">
                <canvas #gameCanvas class="bg-canvas"></canvas>

                @if (phase() === 'countdown') {
                  <div class="bg-overlay">
                    <span class="bg-countdown-text">{{ countdownText() }}</span>
                  </div>
                }

                @if (phase() === 'over' && result(); as r) {
                  <div class="bg-overlay bg-overlay--over">
                    <div
                      class="bg-face"
                      [class.bg-face--happy]="r.winner === 'bit'"
                      [class.bg-face--sad]="r.winner === 'player'"
                      [class.bg-face--draw]="r.winner === 'draw'"
                    >
                      <span class="bg-face__eye bg-face__eye--l"></span>
                      <span class="bg-face__eye bg-face__eye--r"></span>
                      <span class="bg-face__mouth"></span>
                    </div>
                    <h3 class="bg-result-text" [class.bg-result-text--lose]="r.winner === 'bit'" [class.bg-result-text--draw]="r.winner === 'draw'">
                      {{ r.winner === 'player' ? 'YOU WIN' : r.winner === 'bit' ? 'GAME OVER' : 'DRAW' }}
                    </h3>
                    <p class="bg-result-score">FINAL SCORE — YOU {{ r.playerScore }} : {{ r.bitScore }} BIT</p>
                    <div class="bg-result-actions">
                      <button type="button" class="bg-btn interactive" (click)="playAgain()">JUGAR DE NUEVO</button>
                      <button type="button" class="bg-btn bg-btn--ghost interactive" (click)="backToSelect()">OTRO JUEGO</button>
                    </div>
                  </div>
                }
              </div>
              <p class="bg-hint">{{ game() ? gameMeta[game()!].hint : '' }}</p>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [
    `
    .bg-backdrop {
      position: fixed;
      inset: 0;
      z-index: 6000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      background: rgb(0 0 0 / 82%);
      backdrop-filter: blur(6px);
      animation: bg-fade-in 0.3s ease forwards;
    }
    .bg-backdrop::before {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      background: repeating-linear-gradient(0deg, rgb(0 229 255 / 3%) 0px, transparent 1px, transparent 3px);
      mix-blend-mode: screen;
    }
    .bg-backdrop--exit { animation: bg-fade-out 0.42s ease forwards; }

    .bg-frame {
      position: relative;
      width: 100%;
      max-width: 40rem;
      max-height: 92vh;
      overflow-y: auto;
      border-radius: 0.75rem;
      border: 2px solid rgb(0 229 255 / 55%);
      background: rgb(5 8 12 / 96%);
      box-shadow: 0 0 50px rgb(0 229 255 / 25%), inset 0 0 30px rgb(0 229 255 / 6%);
      animation: crt-on 0.42s cubic-bezier(0.2, 0.9, 0.3, 1) forwards;
      transform-origin: center;
    }
    .bg-frame--exit { animation: crt-off 0.42s ease forwards; }

    .bg-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.85rem 1rem;
      border-bottom: 1px solid rgb(0 229 255 / 20%);
    }
    .bg-title {
      font-family: 'Press Start 2P', 'JetBrains Mono', monospace;
      font-size: 0.7rem;
      letter-spacing: 0.05em;
      color: #00e5ff;
      text-shadow: 0 0 10px rgb(0 229 255 / 55%);
    }
    .bg-close {
      color: #00e5ff;
      font-family: monospace;
      font-size: 1rem;
      line-height: 1;
      padding: 0.25rem 0.5rem;
    }

    .bg-select { padding: 1.5rem 1.25rem 2rem; }
    .bg-select__hint {
      text-align: center;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      color: rgb(237 237 237 / 60%);
      margin-bottom: 1.25rem;
    }
    .bg-select__grid {
      display: grid;
      gap: 0.85rem;
      grid-template-columns: repeat(auto-fit, minmax(9.5rem, 1fr));
    }
    .bg-game-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.6rem;
      padding: 1.5rem 0.75rem;
      border-radius: 0.75rem;
      border: 1px solid rgb(0 229 255 / 25%);
      background: rgb(17 17 17 / 60%);
      transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s;
    }
    .bg-game-card:hover {
      border-color: rgb(0 229 255 / 60%);
      box-shadow: 0 0 26px rgb(0 229 255 / 18%);
      transform: translateY(-2px);
    }
    .bg-game-card__icon { font-size: 1.8rem; color: #00e5ff; }
    .bg-game-card__title {
      font-family: 'Press Start 2P', 'JetBrains Mono', monospace;
      font-size: 0.6rem;
      letter-spacing: 0.04em;
      color: #ededed;
      text-align: center;
    }

    .bg-stage { padding: 0.75rem 1rem 1.25rem; }
    .bg-hud {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-family: 'Press Start 2P', 'JetBrains Mono', monospace;
      font-size: 0.65rem;
      padding: 0.35rem 0.15rem 0.75rem;
    }
    .bg-hud__score--player { color: #ffd500; text-shadow: 0 0 8px rgb(255 213 0 / 45%); }
    .bg-hud__score--bit { color: #00e5ff; text-shadow: 0 0 8px rgb(0 229 255 / 45%); }
    .bg-hud__vs { color: rgb(237 237 237 / 35%); font-size: 0.55rem; }

    .bg-canvas-wrap {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 10;
      border-radius: 0.5rem;
      overflow: hidden;
      border: 1px solid rgb(0 229 255 / 25%);
      background: radial-gradient(ellipse at center, rgb(0 40 48 / 40%), rgb(2 4 6 / 90%));
    }
    .bg-canvas { display: block; width: 100%; height: 100%; touch-action: none; }

    .bg-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      background: rgb(0 0 0 / 55%);
      text-align: center;
      padding: 1rem;
      animation: bg-fade-in 0.25s ease forwards;
    }
    .bg-countdown-text {
      font-family: 'Press Start 2P', monospace;
      font-size: clamp(1.8rem, 8vw, 3rem);
      color: #ffd500;
      text-shadow: 0 0 20px rgb(255 213 0 / 65%);
      animation: bg-countdown-pulse 0.6s ease infinite;
    }

    .bg-face {
      position: relative;
      width: 4.5rem;
      height: 4.5rem;
      border-radius: 50%;
      border: 2px solid currentColor;
      color: #00e5ff;
      box-shadow: 0 0 20px currentColor;
    }
    .bg-face--happy { color: #ffd500; animation: bg-face-bounce 0.55s ease infinite; }
    .bg-face--sad { color: #ff3b3b; animation: bg-face-slump 1.5s ease infinite; }
    .bg-face__eye {
      position: absolute;
      top: 1.4rem;
      width: 0.45rem;
      height: 0.45rem;
      border-radius: 50%;
      background: currentColor;
    }
    .bg-face__eye--l { left: 1.15rem; }
    .bg-face__eye--r { right: 1.15rem; }
    .bg-face__mouth {
      position: absolute;
      left: 50%;
      bottom: 1.1rem;
      width: 1.4rem;
      height: 1.4rem;
      border: 0.15rem solid transparent;
      border-radius: 50%;
      transform: translateX(-50%);
    }
    .bg-face--happy .bg-face__mouth {
      border-bottom-color: currentColor;
      border-left-color: currentColor;
      transform: translateX(-50%) rotate(-45deg) translateY(-0.15rem);
    }
    .bg-face--sad .bg-face__mouth {
      border-top-color: currentColor;
      border-left-color: currentColor;
      transform: translateX(-50%) rotate(45deg) translateY(0.25rem);
    }
    .bg-face--draw .bg-face__mouth {
      width: 1rem;
      height: 0.14rem;
      background: currentColor;
      border: none;
      transform: translateX(-50%);
    }

    .bg-result-text {
      font-family: 'Press Start 2P', monospace;
      font-size: clamp(1rem, 5vw, 1.5rem);
      letter-spacing: 0.04em;
      color: #ffd500;
      text-shadow: 0 0 12px rgb(255 213 0 / 70%), 0 0 26px rgb(255 213 0 / 40%);
      animation: bg-text-pulse 1.4s ease infinite;
    }
    .bg-result-text--lose {
      color: #ff3b3b;
      text-shadow: 0 0 12px rgb(255 59 59 / 70%), 0 0 26px rgb(255 59 59 / 40%);
    }
    .bg-result-text--draw {
      color: #00e5ff;
      text-shadow: 0 0 12px rgb(0 229 255 / 70%), 0 0 26px rgb(0 229 255 / 40%);
    }
    .bg-result-score {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.72rem;
      color: rgb(237 237 237 / 75%);
    }
    .bg-result-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
      justify-content: center;
      margin-top: 0.5rem;
    }
    .bg-btn {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.68rem;
      padding: 0.55rem 1rem;
      border-radius: 999px;
      background: #00e5ff;
      color: #050505;
      font-weight: 600;
    }
    .bg-btn--ghost {
      background: transparent;
      color: #00e5ff;
      border: 1px solid rgb(0 229 255 / 55%);
    }

    .bg-hint {
      margin-top: 0.6rem;
      text-align: center;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.68rem;
      color: rgb(237 237 237 / 45%);
    }

    @keyframes bg-fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes bg-fade-out { from { opacity: 1; } to { opacity: 0; } }
    @keyframes crt-on {
      0% { opacity: 0; transform: scaleY(0.02) scaleX(0.6); filter: brightness(3); }
      55% { opacity: 1; transform: scaleY(1.03) scaleX(1.01); filter: brightness(1.5); }
      100% { opacity: 1; transform: scaleY(1) scaleX(1); filter: brightness(1); }
    }
    @keyframes crt-off {
      0% { opacity: 1; transform: scaleY(1) scaleX(1); filter: brightness(1); }
      35% { opacity: 1; transform: scaleY(1) scaleX(1.02); filter: brightness(2.4); }
      100% { opacity: 0; transform: scaleY(0.01) scaleX(0.7); filter: brightness(0.2); }
    }
    @keyframes bg-countdown-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
    @keyframes bg-text-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.75; } }
    @keyframes bg-face-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
    @keyframes bg-face-slump { 0%, 100% { transform: rotate(0deg) translateY(0); } 50% { transform: rotate(-4deg) translateY(3px); } }
    `,
  ],
})
export class BitGameModalComponent implements OnDestroy {
  @ViewChild('gameCanvas') private readonly canvasRef?: ElementRef<HTMLCanvasElement>;

  private readonly bitGame = inject(BitGameService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly gameMeta = GAME_META;
  readonly gameIds: GameId[] = ['pong', 'invaders', 'tron'];

  readonly shown = signal(false);
  readonly closing = signal(false);
  readonly phase = signal<Phase>('select');
  readonly game = signal<GameId | null>(null);
  readonly countdownText = signal('3');
  readonly playerScore = signal(0);
  readonly bitScore = signal(0);
  readonly result = signal<GameResult | null>(null);

  private threeModule?: ThreeModule;
  private engine?: GameEngine;
  private resizeObserver?: ResizeObserver;
  private countdownTimer?: ReturnType<typeof setTimeout>;
  private mounted = false;

  private readonly escHandler = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this.shown() && !this.closing()) this.requestClose();
  };

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('keydown', this.escHandler);
    }

    effect(
      () => {
        if (this.bitGame.isOpen() && !this.mounted) {
          this.mounted = true;
          this.shown.set(true);
          this.closing.set(false);
          this.phase.set('select');
          this.game.set(null);
          this.playerScore.set(0);
          this.bitScore.set(0);
          this.result.set(null);
        }
      },
      { allowSignalWrites: true },
    );
  }

  selectGame(id: GameId): void {
    this.game.set(id);
    this.playerScore.set(0);
    this.bitScore.set(0);
    this.result.set(null);
    this.phase.set('countdown');
    this.runCountdown();
  }

  playAgain(): void {
    this.disposeEngine();
    this.playerScore.set(0);
    this.bitScore.set(0);
    this.result.set(null);
    this.phase.set('countdown');
    this.runCountdown();
  }

  backToSelect(): void {
    this.disposeEngine();
    this.game.set(null);
    this.result.set(null);
    this.phase.set('select');
  }

  requestClose(): void {
    if (!this.shown() || this.closing()) return;
    this.closing.set(true);
    clearTimeout(this.countdownTimer);
    this.disposeEngine();
    setTimeout(() => {
      this.shown.set(false);
      this.closing.set(false);
      this.mounted = false;
      this.phase.set('select');
      this.game.set(null);
      this.result.set(null);
      this.bitGame.close();
    }, 420);
  }

  private runCountdown(): void {
    const seq = ['3', '2', '1', 'GO!'];
    let i = 0;
    const step = (): void => {
      this.countdownText.set(seq[i]);
      bitSound.playCountdownTick();
      i++;
      if (i < seq.length) {
        this.countdownTimer = setTimeout(step, 650);
      } else {
        this.countdownTimer = setTimeout(() => {
          this.phase.set('playing');
          void this.createEngine();
        }, 500);
      }
    };
    step();
  }

  private async createEngine(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.threeModule) this.threeModule = await import('three');
    if (!this.shown() || this.phase() !== 'playing') return;

    const canvas = this.canvasRef?.nativeElement;
    const id = this.game();
    if (!canvas || !id) return;

    const rect = canvas.getBoundingClientRect();
    const callbacks: GameCallbacks = {
      onScore: (p, b) => {
        this.playerScore.set(p);
        this.bitScore.set(b);
      },
      onEnd: (result) => this.handleEnd(result),
    };

    if (id === 'pong') this.engine = new PongEngine(canvas, this.threeModule, callbacks);
    else if (id === 'invaders') this.engine = new InvadersEngine(canvas, this.threeModule, callbacks);
    else this.engine = new TronEngine(canvas, this.threeModule, callbacks);

    this.engine.resize(rect.width, rect.height);
    this.engine.start();

    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (box) this.engine?.resize(box.width, box.height);
    });
    this.resizeObserver.observe(canvas);
  }

  private handleEnd(result: GameResult): void {
    this.result.set(result);
    this.phase.set('over');
    if (result.winner === 'player') bitSound.playWin();
    else if (result.winner === 'bit') bitSound.playLose();
  }

  private disposeEngine(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    this.engine?.dispose();
    this.engine = undefined;
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) window.removeEventListener('keydown', this.escHandler);
    clearTimeout(this.countdownTimer);
    this.disposeEngine();
  }
}
