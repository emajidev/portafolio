import { Component, OnDestroy, OnInit, PLATFORM_ID, inject, input, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MASCOT_MSGS } from '../../core/data/portfolio.data';
import { COLS, GRID, ROWS } from './clawd-pixel.grid';

@Component({
  selector: 'app-clawd',
  standalone: true,
  template: `
    <div class="clawd" [class.clawd--sm]="small()">
      @if (displayed()) {
        <div class="clawd-bubble">
          {{ displayed() }}<span class="type-cursor">|</span>
        </div>
      }
      <div class="clawd-pixels" [style.--cols]="cols" [style.--rows]="rows">
        @for (row of grid; track $index) {
          @for (cell of row; track $index) {
            @if (cell !== 0) {
              <span
                class="px"
                [class.px-on]="cell === 1"
                [class.px-eye]="cell === 2 && !blink()"
                [class.px-blink]="cell === 2 && blink()"
              ></span>
            } @else {
              <span class="px px-off"></span>
            }
          }
        }
      </div>
    </div>
  `,
  styles: [
    `
    .clawd {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .clawd--sm {
      transform: scale(0.42);
      transform-origin: left center;
    }
    .clawd-bubble {
      margin-bottom: 0.85rem;
      max-width: 280px;
      padding: 0.7rem 1rem;
      border: 1px solid rgb(139 255 77 / 35%);
      border-radius: 10px;
      background: rgb(8 8 8 / 92%);
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.78rem;
      color: #ededed;
      text-align: center;
      box-shadow: 0 0 20px rgb(139 255 77 / 8%);
      animation: bubble-in 0.4s ease;
    }
    .clawd-bubble::after {
      content: '';
      position: absolute;
      bottom: -7px;
      left: 50%;
      transform: translateX(-50%);
      border: 7px solid transparent;
      border-top-color: rgb(139 255 77 / 35%);
    }
    .type-cursor {
      color: #8bff4d;
      animation: blink 0.7s step-end infinite;
    }
    .clawd-pixels {
      --sz: 8px;
      display: grid;
      grid-template-columns: repeat(var(--cols), var(--sz));
      grid-template-rows: repeat(var(--rows), var(--sz));
      gap: 1px;
      filter: drop-shadow(0 0 20px rgb(57 255 20 / 55%));
      animation: float 5s ease-in-out infinite;
    }
    .clawd--sm .clawd-pixels { --sz: 5px; }
    .px { width: var(--sz); height: var(--sz); border-radius: 1px; }
    .px-off { background: transparent; }
    .px-on {
      background: #4ade80;
      box-shadow: 0 0 8px #39ff14;
    }
    .px-eye { background: #000; }
    .px-blink { background: #4ade80; }
    @keyframes float {
      50% { transform: translateY(-8px); }
    }
    @keyframes bubble-in {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes blink { 50% { opacity: 0; } }
    `,
  ],
})
export class ClawdComponent implements OnInit, OnDestroy {
  readonly small = input(false);
  readonly grid = GRID;
  readonly cols = COLS;
  readonly rows = ROWS;
  readonly displayed = signal('');
  readonly blink = signal(false);
  private readonly platformId = inject(PLATFORM_ID);
  private blinkTimer?: ReturnType<typeof setInterval>;
  private msgTimer?: ReturnType<typeof setInterval>;
  private msgIdx = 0;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.typeMessage(MASCOT_MSGS[0]);
    this.blinkTimer = setInterval(() => {
      this.blink.set(true);
      setTimeout(() => this.blink.set(false), 130);
    }, 3200);
    this.msgTimer = setInterval(() => {
      this.msgIdx = (this.msgIdx + 1) % MASCOT_MSGS.length;
      this.typeMessage(MASCOT_MSGS[this.msgIdx]);
    }, 8000);
  }

  ngOnDestroy(): void {
    clearInterval(this.blinkTimer);
    clearInterval(this.msgTimer);
  }

  private typeMessage(text: string): void {
    this.displayed.set('');
    let i = 0;
    const tick = (): void => {
      if (i < text.length) {
        this.displayed.update((d) => d + text[i++]);
        setTimeout(tick, 25 + Math.random() * 15);
      }
    };
    tick();
  }
}
