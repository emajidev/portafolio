import { Component, OnDestroy, OnInit, PLATFORM_ID, inject, input, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MASCOT_MSGS } from '../../core/data/portfolio.data';
import { Cell, COLS, GRID, ROWS } from './clawd-pixel.grid';

@Component({
  selector: 'app-clawd',
  standalone: true,
  template: `
    <div class="clawd" [class.clawd--sm]="small()">
      @if (msg()) {
        <div class="clawd-bubble">{{ msg() }}</div>
      }
      <div class="clawd-pixels" [style.--cols]="cols" [style.--rows]="rows">
        @for (row of grid; track $index; let ri = $index) {
          @for (cell of row; track $index; let ci = $index) {
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
      transform: scale(0.45);
      transform-origin: left center;
    }
    .clawd-bubble {
      margin-bottom: 0.75rem;
      max-width: 260px;
      padding: 0.6rem 0.9rem;
      border: 1px solid rgb(139 255 77 / 35%);
      border-radius: 8px;
      background: rgb(10 10 10 / 90%);
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      color: #ededed;
      text-align: center;
    }
    .clawd-pixels {
      --sz: 7px;
      display: grid;
      grid-template-columns: repeat(var(--cols), var(--sz));
      grid-template-rows: repeat(var(--rows), var(--sz));
      gap: 1px;
      filter: drop-shadow(0 0 16px rgb(57 255 20 / 50%));
      animation: float 5s ease-in-out infinite;
    }
    .clawd--sm .clawd-pixels {
      --sz: 5px;
    }
    .px {
      width: var(--sz);
      height: var(--sz);
      border-radius: 1px;
    }
    .px-off {
      background: transparent;
    }
    .px-on {
      background: #4ade80;
      box-shadow: 0 0 6px #39ff14;
    }
    .px-eye {
      background: #000;
    }
    .px-blink {
      background: #4ade80;
    }
    @keyframes float {
      50% {
        transform: translateY(-6px);
      }
    }
    `,
  ],
})
export class ClawdComponent implements OnInit, OnDestroy {
  readonly small = input(false);
  readonly grid = GRID;
  readonly cols = COLS;
  readonly rows = ROWS;
  readonly msg = signal('');
  readonly blink = signal(false);
  private readonly platformId = inject(PLATFORM_ID);
  private timer?: ReturnType<typeof setInterval>;
  private msgIdx = 0;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.nextMsg();
    this.timer = setInterval(() => {
      this.blink.set(true);
      setTimeout(() => this.blink.set(false), 120);
    }, 3500);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private nextMsg(): void {
    this.msg.set(MASCOT_MSGS[this.msgIdx++ % MASCOT_MSGS.length]);
  }
}
