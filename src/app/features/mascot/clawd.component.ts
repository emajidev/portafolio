import {
  afterNextRender,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild,
  computed,
  inject,
  input,
  Renderer2,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subscription } from 'rxjs';
import { MascotChatService } from '../../core/services/mascot-chat.service';
import { ScrollService } from '../../core/services/scroll.service';
import { MASCOT_ANNOYED_MSGS, MASCOT_LAUGH_MSGS, MASCOT_MSGS } from '../../core/data/portfolio.data';
import { COLS, ClawdFace, FACE_GRIDS, ROWS } from './clawd-pixel.grid';

const FRICTION = 0.988;
const BOUNCE = 0.72;
const STOP_SPEED = 0.4;
const EDGE_PAD = 8;

@Component({
  selector: 'app-clawd',
  standalone: true,
  template: `
    <div
      #clawdRoot
      class="clawd"
      [class.clawd--hero]="variant() === 'hero'"
      [class.clawd--sm]="small()"
      [class.clawd--detached]="isDetached()"
      [class.clawd--dragging]="isDragging()"
      [class.clawd--flying]="isFlying()"
      [class.clawd--scrolling]="scroll.isScrolling()"
      [style.left.px]="isDetached() ? posX() : null"
      [style.top.px]="isDetached() ? posY() : null"
      [style.width.px]="isDetached() ? detachedW() : null"
      [style.height.px]="isDetached() ? detachedH() : null"
      (pointerdown)="onPointerDown($event)"
    >
      <div
        class="clawd-body"
        role="button"
        tabindex="0"
        [attr.aria-label]="ariaLabel()"
        (click)="onSmallClick($event)"
        (keydown.enter)="onKeyboardHappy($event)"
        (keydown.space)="onKeyboardHappy($event)"
      >
        <div class="clawd-glow" aria-hidden="true"></div>
        <div
          class="clawd-pixels"
          [class.clawd-pixels--laugh]="reacting() === 'happy'"
          [class.clawd-pixels--annoyed]="face() === 'annoyed'"
          [class.clawd-pixels--airborne]="limbActive()"
          [class.clawd-pixels--scroll-up]="scroll.scrollDirection() === 'up'"
          [class.clawd-pixels--scroll-down]="scroll.scrollDirection() === 'down'"
          [style.--cols]="cols"
          [style.--rows]="rows"
        >
          @for (row of activeGrid(); track $index; let rowIdx = $index) {
            @for (cell of row; track $index; let colIdx = $index) {
              @if (cell !== 0) {
                <span
                  class="px"
                  [class.px-on]="cell === 1"
                  [class.px-eye]="cell === 2 && !blink()"
                  [class.px-blink]="cell === 2 && blink()"
                  [class.px-happy-eye]="cell === 3"
                  [class.px-smile]="cell === 4"
                  [class.px-brow]="cell === 5"
                  [class.px-angry-eye]="cell === 6"
                  [class.px-frown]="cell === 7"
                  [class.px-hand]="isHand(rowIdx, colIdx)"
                  [class.px-hand-left]="isHand(rowIdx, colIdx) && isLeft(colIdx)"
                  [class.px-hand-right]="isHand(rowIdx, colIdx) && !isLeft(colIdx)"
                  [class.px-foot]="isFoot(rowIdx, colIdx)"
                  [class.px-foot-left]="isFoot(rowIdx, colIdx) && isLeft(colIdx)"
                  [class.px-foot-right]="isFoot(rowIdx, colIdx) && !isLeft(colIdx)"
                ></span>
              } @else {
                <span class="px px-off"></span>
              }
            }
          }
        </div>
      </div>

      @if (bubbleVisible() && !small()) {
        <div
          class="comic-bubble"
          [class.comic-bubble--exit]="exiting()"
          role="status"
          aria-live="polite"
        >
          <svg class="comic-frame" viewBox="0 0 300 94" preserveAspectRatio="none" aria-hidden="true">
            <path
              class="comic-frame-path"
              d="M 18 1 H 282 A 17 17 0 0 1 299 18 V 56 A 17 17 0 0 1 282 73 H 255 L 242 93 L 229 73 H 18 A 17 17 0 0 1 1 56 V 18 A 17 17 0 0 1 18 1 Z"
            />
          </svg>
          <p>
            {{ displayed() }}<span class="type-cursor">|</span>
          </p>
        </div>
      }
    </div>
  `,
  styles: [
    `
    .clawd {
      position: relative;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }

    .clawd--hero:not(.clawd--detached) {
      animation: float 5s ease-in-out infinite;
    }

    .clawd--detached {
      animation: none;
    }

    .clawd--hero {
      width: 100%;
      max-width: 26rem;
      min-height: 12rem;
      justify-content: flex-end;
      margin: 0 auto;
    }

    .clawd--detached.clawd--detached {
      position: fixed !important;
      z-index: 9999;
      max-width: none;
      min-height: auto;
      margin: 0;
      box-sizing: border-box;
      cursor: grabbing;
      animation: none;
    }

    .clawd--dragging,
    .clawd--flying {
      cursor: grabbing;
    }

    .clawd--sm {
      animation: none !important;
      transform: none !important;
      flex-shrink: 0;
    }

    .clawd--sm .clawd-body,
    .clawd--sm .clawd-pixels,
    .clawd--sm .clawd-glow {
      animation: none !important;
      transform: none !important;
    }

    .clawd--sm .px:not(.px-hand):not(.px-foot) {
      animation: none !important;
      transform: none !important;
    }

    .clawd--sm .px-happy-eye {
      transform: scaleY(0.3) !important;
    }

    .clawd-body {
      position: relative;
      z-index: 2;
      flex-shrink: 0;
      display: flex;
      justify-content: center;
      cursor: grab;
      outline: none;
      touch-action: none;
      user-select: none;
    }

    .clawd--detached .clawd-body {
      animation: float 5s ease-in-out infinite;
    }

    .clawd--detached .clawd-body,
    .clawd--dragging .clawd-body {
      cursor: grabbing;
    }

    .clawd-body:focus-visible .clawd-pixels {
      outline: 2px solid #8bff4d;
      outline-offset: 4px;
    }

    .clawd--hero .clawd-body {
      margin-right: 0.5rem;
    }

    .comic-bubble {
      --bubble-stroke: #8bff4d;
      --bubble-text: #00ff88;
      position: absolute;
      right: 0;
      bottom: calc(100% + 2px);
      z-index: 1;
      width: min(20rem, calc(100vw - 4rem));
      padding: 1rem 1.25rem 1.35rem;
      background: #000;
      pointer-events: none;
      animation: bubble-in-left 0.4s ease forwards;
    }

    .clawd--detached .comic-bubble {
      animation: none;
    }

    .clawd--hero .comic-bubble {
      right: -0.25rem;
      transform-origin: 80% bottom;
    }

    .comic-frame {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: visible;
      pointer-events: none;
    }

    .comic-frame-path {
      fill: #000;
      stroke: var(--bubble-stroke);
      stroke-width: 2;
      vector-effect: non-scaling-stroke;
    }

    .comic-bubble--exit {
      animation: bubble-out-left 0.35s ease forwards;
    }

    .comic-bubble p {
      position: relative;
      z-index: 1;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      line-height: 1.5;
      color: var(--bubble-text);
      margin: 0;
      text-align: left;
    }

    .type-cursor {
      color: #39ff14;
      animation: blink 0.7s step-end infinite;
    }

    .clawd-glow {
      position: absolute;
      bottom: -8px;
      left: 50%;
      transform: translateX(-50%);
      width: 140px;
      height: 24px;
      background: radial-gradient(ellipse, rgb(57 255 20 / 40%), transparent 70%);
      filter: blur(8px);
    }

    .clawd-pixels {
      --sz: 9px;
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: repeat(var(--cols), var(--sz));
      grid-template-rows: repeat(var(--rows), var(--sz));
      gap: 1px;
      filter: drop-shadow(0 0 22px rgb(57 255 20 / 55%));
      overflow: visible;
    }

    .clawd--dragging .clawd-pixels,
    .clawd--flying .clawd-pixels,
    .clawd--detached .clawd-pixels,
    .clawd--scrolling .clawd-pixels {
      overflow: visible;
    }

    .clawd--dragging:not(.clawd--detached):not(.clawd--sm),
    .clawd--flying:not(.clawd--detached):not(.clawd--sm),
    .clawd--scrolling:not(.clawd--detached):not(.clawd--sm) {
      animation: float 5s ease-in-out infinite, body-fly-tilt 0.28s ease-in-out infinite alternate;
    }

    .clawd--dragging.clawd--detached .clawd-body,
    .clawd--flying.clawd--detached .clawd-body,
    .clawd--scrolling.clawd--detached .clawd-body {
      animation: float 5s ease-in-out infinite, body-fly-tilt 0.28s ease-in-out infinite alternate;
    }

    .clawd-pixels--scroll-up .px-hand-left,
    .clawd-pixels--scroll-up .px-hand-right {
      animation-direction: alternate-reverse;
    }

    .clawd-pixels--scroll-up .px-foot-left,
    .clawd-pixels--scroll-up .px-foot-right {
      animation-direction: alternate;
    }

    .clawd-pixels--scroll-down .px-hand-left,
    .clawd-pixels--scroll-down .px-hand-right {
      animation-duration: 0.16s;
    }

    .clawd-pixels--scroll-down .px-foot-left,
    .clawd-pixels--scroll-down .px-foot-right {
      animation-duration: 0.14s;
    }

    .clawd-pixels--airborne .px-hand,
    .clawd-pixels--airborne .px-foot {
      z-index: 2;
    }

    .clawd-pixels--airborne .px-hand-left {
      transform-origin: 80% 90%;
      animation: fly-hand-left 0.22s ease-in-out infinite alternate;
    }

    .clawd-pixels--airborne .px-hand-right {
      transform-origin: 20% 90%;
      animation: fly-hand-right 0.22s ease-in-out infinite alternate;
    }

    .clawd-pixels--airborne .px-foot-left {
      transform-origin: 70% 10%;
      animation: fly-foot-left 0.2s ease-in-out infinite alternate-reverse;
    }

    .clawd-pixels--airborne .px-foot-right {
      transform-origin: 30% 10%;
      animation: fly-foot-right 0.2s ease-in-out infinite alternate-reverse;
    }

    .clawd--sm.clawd--scrolling .clawd-pixels--airborne .px-hand-left {
      animation: fly-hand-left 0.22s ease-in-out infinite alternate !important;
    }

    .clawd--sm.clawd--scrolling .clawd-pixels--airborne .px-hand-right {
      animation: fly-hand-right 0.22s ease-in-out infinite alternate !important;
    }

    .clawd--sm.clawd--scrolling .clawd-pixels--airborne .px-foot-left {
      animation: fly-foot-left 0.2s ease-in-out infinite alternate-reverse !important;
    }

    .clawd--sm.clawd--scrolling .clawd-pixels--airborne .px-foot-right {
      animation: fly-foot-right 0.2s ease-in-out infinite alternate-reverse !important;
    }

    .clawd-pixels--laugh {
      animation: laugh-shake 0.55s ease-in-out !important;
    }

    .clawd-pixels--annoyed.clawd-pixels--annoyed {
      animation: annoyed-shake 0.35s ease-in-out;
    }

    .clawd--flying .clawd-pixels--annoyed,
    .clawd-pixels--airborne.clawd-pixels--annoyed {
      animation: none;
    }

    .clawd-body:has(.clawd-pixels--laugh) .clawd-glow {
      animation: glow-laugh 0.55s ease-in-out;
    }

    .clawd--dragging .clawd-glow,
    .clawd--flying .clawd-glow,
    .clawd--detached:has(.px-angry-eye) .clawd-glow {
      animation: glow-annoyed 0.45s ease-in-out;
    }

    .clawd--hero .clawd-pixels {
      --sz: 10px;
    }

    .clawd--sm .clawd-pixels {
      --sz: 6px;
    }

    .clawd--sm .clawd-glow {
      width: 72px;
      height: 14px;
    }

    .px {
      width: var(--sz);
      height: var(--sz);
      border-radius: 1px;
    }
    .px-off { background: transparent; }
    .px-on {
      background: #4ade80;
      box-shadow: 0 0 8px #39ff14;
    }
    .px-eye { background: #000; }
    .px-blink { background: #4ade80; }
    .px-happy-eye {
      background: #4ade80;
      box-shadow: 0 0 6px #39ff14;
      transform: scaleY(0.55);
    }
    .px-smile {
      background: #39ff14;
      box-shadow: 0 0 10px #39ff14;
    }
    .px-brow {
      background: #22c55e;
      box-shadow: 0 0 4px #16a34a;
    }
    .px-angry-eye {
      background: #000;
      box-shadow: inset 0 2px 0 #ef4444;
    }
    .px-frown {
      background: #4ade80;
      box-shadow: 0 0 4px #22c55e;
    }

    @keyframes float {
      50% { transform: translateY(-10px); }
    }
    @keyframes body-fly-tilt {
      from { transform: rotate(-6deg) translateY(-2px); }
      to { transform: rotate(6deg) translateY(2px); }
    }
    @keyframes fly-hand-left {
      from { transform: translate(-4px, -7px) rotate(-40deg); }
      to { transform: translate(2px, 1px) rotate(8deg); }
    }
    @keyframes fly-hand-right {
      from { transform: translate(4px, -7px) rotate(40deg); }
      to { transform: translate(-2px, 1px) rotate(-8deg); }
    }
    @keyframes fly-foot-left {
      from { transform: translate(-3px, 6px) rotate(28deg); }
      to { transform: translate(1px, -4px) rotate(-12deg); }
    }
    @keyframes fly-foot-right {
      from { transform: translate(3px, 6px) rotate(-28deg); }
      to { transform: translate(-1px, -4px) rotate(12deg); }
    }
    @keyframes laugh-shake {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      15% { transform: translate(-3px, -4px) rotate(-8deg); }
      30% { transform: translate(4px, 2px) rotate(8deg); }
      45% { transform: translate(-4px, -2px) rotate(-6deg); }
      60% { transform: translate(3px, 1px) rotate(6deg); }
      75% { transform: translate(-2px, -1px) rotate(-4deg); }
      90% { transform: translate(1px, 0) rotate(3deg); }
    }
    @keyframes glow-laugh {
      0%, 100% { opacity: 1; transform: translateX(-50%) scale(1); }
      50% { opacity: 0.85; transform: translateX(-50%) scale(1.25); }
    }
    @keyframes annoyed-shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }
    @keyframes glow-annoyed {
      0%, 100% { opacity: 1; filter: hue-rotate(0deg); }
      50% { opacity: 0.7; filter: hue-rotate(-40deg); }
    }
    @keyframes bubble-in-left {
      from { opacity: 0; transform: translateX(28px) scale(0.94); }
      to { opacity: 1; transform: translateX(0) scale(1); }
    }
    @keyframes bubble-out-left {
      from { opacity: 1; transform: translateX(0) scale(1); }
      to { opacity: 0; transform: translateX(-24px) scale(0.92); }
    }
    @keyframes blink {
      50% { opacity: 0; }
    }

    @media (max-width: 640px) {
      .comic-bubble {
        width: min(18rem, calc(100vw - 3rem));
        right: -0.5rem;
      }
    }
    `,
  ],
})
export class ClawdComponent implements OnInit, OnDestroy {
  @ViewChild('clawdRoot') clawdRef?: ElementRef<HTMLElement>;

  readonly small = input(false);
  readonly variant = input<'default' | 'hero'>('default');
  readonly cols = COLS;
  readonly rows = ROWS;
  readonly displayed = signal('');
  readonly exiting = signal(false);
  readonly bubbleVisible = signal(false);
  readonly blink = signal(false);
  readonly face = signal<ClawdFace>('neutral');
  readonly reacting = signal<'happy' | 'annoyed' | null>(null);
  readonly isDetached = signal(false);
  readonly isDragging = signal(false);
  readonly isFlying = signal(false);
  readonly posX = signal(0);
  readonly posY = signal(0);
  readonly detachedW = signal(0);
  readonly detachedH = signal(0);
  readonly activeGrid = computed(() => FACE_GRIDS[this.face()]);
  readonly limbActive = computed(
    () =>
      this.isDragging() ||
      this.isFlying() ||
      this.scroll.isScrolling(),
  );
  readonly dragEnabled = computed(() => this.variant() === 'hero' && !this.small());
  readonly scroll = inject(ScrollService);
  readonly ariaLabel = computed(() =>
    this.dragEnabled()
      ? 'Davi. Arrastra y suelta; choca con los bordes. Clic corto para reir.'
      : 'Davi, mascota interactiva.',
  );

  private readonly platformId = inject(PLATFORM_ID);
  private readonly renderer = inject(Renderer2);
  private readonly mascotChat = inject(MascotChatService);
  private chatSub?: Subscription;
  private anchor: Comment | null = null;
  private blinkTimer?: ReturnType<typeof setInterval>;
  private msgTimer?: ReturnType<typeof setInterval>;
  private msgIdx = 0;
  private typeTimeout?: ReturnType<typeof setTimeout>;
  private cycleTimeout?: ReturnType<typeof setTimeout>;
  private reactTimeout?: ReturnType<typeof setTimeout>;
  private rafId = 0;
  private velX = 0;
  private velY = 0;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private lastMoveX = 0;
  private lastMoveY = 0;
  private lastMoveTime = 0;
  private totalDragDist = 0;
  private bouncePulse = false;
  private pointerActive = false;
  private dragStarted = false;

  private readonly onDocMove = (e: PointerEvent): void => this.handlePointerMove(e);
  private readonly onDocUp = (e: PointerEvent): void => this.handlePointerUp(e);

  constructor() {
    afterNextRender(() => {
      if (!this.dragEnabled()) return;
      requestAnimationFrame(() => requestAnimationFrame(() => this.mountAsFixed()));
    });
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.small()) {
      this.chatSub = this.mascotChat.userMessageSent.subscribe(() => {
        if (!this.isDragging() && !this.isFlying()) this.triggerHappy();
      });
      this.blinkTimer = setInterval(() => {
        if (this.face() !== 'neutral') return;
        this.blink.set(true);
        setTimeout(() => this.blink.set(false), 130);
      }, 3200);
      return;
    }

    this.showMessage(0);
    this.blinkTimer = setInterval(() => {
      if (this.face() !== 'neutral') return;
      this.blink.set(true);
      setTimeout(() => this.blink.set(false), 130);
    }, 3200);
    this.msgTimer = setInterval(() => {
      if (this.isDragging() || this.isFlying()) return;
      this.msgIdx = (this.msgIdx + 1) % MASCOT_MSGS.length;
      this.transitionToMessage(this.msgIdx);
    }, 9000);
  }

  ngOnDestroy(): void {
    this.chatSub?.unsubscribe();
    clearInterval(this.blinkTimer);
    clearInterval(this.msgTimer);
    clearTimeout(this.typeTimeout);
    clearTimeout(this.cycleTimeout);
    clearTimeout(this.reactTimeout);
    this.stopPhysics();
    this.removeDocListeners();
  }

  onPointerDown(event: PointerEvent): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.dragEnabled()) return;

    this.stopPhysics();
    this.pointerActive = true;
    this.dragStarted = false;
    this.totalDragDist = 0;
    this.lastMoveX = event.clientX;
    this.lastMoveY = event.clientY;
    this.lastMoveTime = performance.now();
    this.velX = 0;
    this.velY = 0;

    document.addEventListener('pointermove', this.onDocMove);
    document.addEventListener('pointerup', this.onDocUp);
    document.addEventListener('pointercancel', this.onDocUp);
  }

  onSmallClick(event: Event): void {
    if (!this.small()) return;
    event.stopPropagation();
    this.triggerHappy();
  }

  onKeyboardHappy(event: Event): void {
    event.preventDefault();
    if (!this.isDragging() && !this.isFlying()) this.triggerHappy();
  }

  isHand(row: number, col: number): boolean {
    return row <= 1 && (col === 2 || col === 3 || col === 8 || col === 9);
  }

  isFoot(row: number, col: number): boolean {
    if (row === 6) return col <= 1 || col >= 10;
    if (row === 8) return col === 2 || col === 3 || col === 8 || col === 9;
    return false;
  }

  isLeft(col: number): boolean {
    return col < 6;
  }

  private handlePointerMove(event: PointerEvent): void {
    if (!this.pointerActive) return;

    this.totalDragDist += Math.abs(event.clientX - this.lastMoveX) + Math.abs(event.clientY - this.lastMoveY);

    if (!this.dragStarted && this.totalDragDist > 10) {
      this.dragStarted = true;
      this.isDragging.set(true);
      this.mountForDrag(event);
      this.setAnnoyedMode(true);
      this.showAnnoyedBubble();
      event.preventDefault();
    }

    if (!this.isDragging()) return;

    const x = event.clientX - this.dragOffsetX;
    const y = event.clientY - this.dragOffsetY;
    const clamped = this.clampPosition(x, y);
    this.applyViewportPosition(clamped.x, clamped.y);

    const now = performance.now();
    const dt = Math.max(now - this.lastMoveTime, 1);
    this.velX = ((event.clientX - this.lastMoveX) / dt) * 16;
    this.velY = ((event.clientY - this.lastMoveY) / dt) * 16;
    this.lastMoveX = event.clientX;
    this.lastMoveY = event.clientY;
    this.lastMoveTime = now;
  }

  private handlePointerUp(event: PointerEvent): void {
    if (!this.pointerActive) return;
    this.pointerActive = false;
    this.removeDocListeners();

    if (!this.dragStarted) {
      this.triggerHappy();
      return;
    }

    this.isDragging.set(false);
    const speed = Math.hypot(this.velX, this.velY);
    if (this.totalDragDist < 14 && speed < 3) {
      this.triggerHappy();
      return;
    }

    this.startPhysics();
    event.preventDefault();
  }

  /** Fija en viewport al cargar (hero). */
  private mountAsFixed(): void {
    if (!isPlatformBrowser(this.platformId) || this.isDetached()) return;
    const el = this.clawdRef?.nativeElement;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const parent = el.parentNode;
    if (parent && !this.anchor) {
      this.anchor = this.renderer.createComment('clawd-anchor');
      this.renderer.insertBefore(parent, this.anchor, el);
    }

    this.renderer.appendChild(document.body, el);
    el.style.width = `${rect.width}px`;
    el.style.height = `${rect.height}px`;
    this.detachedW.set(rect.width);
    this.detachedH.set(rect.height);
    this.applyViewportPosition(rect.left, rect.top);
    this.isDetached.set(true);
  }

  private mountForDrag(event: PointerEvent): void {
    if (!this.isDetached()) {
      this.mountAsFixed();
    }
    this.dragOffsetX = event.clientX - this.posX();
    this.dragOffsetY = event.clientY - this.posY();
  }

  private startPhysics(): void {
    this.isFlying.set(true);
    this.setAnnoyedMode(true);

    const step = (): void => {
      this.velX *= FRICTION;
      this.velY *= FRICTION;

      let x = this.posX() + this.velX;
      let y = this.posY() + this.velY;
      const bounds = this.getBounds();

      if (x <= bounds.minX) {
        x = bounds.minX;
        this.velX = Math.abs(this.velX) * BOUNCE;
        this.pulseBounce();
      } else if (x >= bounds.maxX) {
        x = bounds.maxX;
        this.velX = -Math.abs(this.velX) * BOUNCE;
        this.pulseBounce();
      }

      if (y <= bounds.minY) {
        y = bounds.minY;
        this.velY = Math.abs(this.velY) * BOUNCE;
        this.pulseBounce();
      } else if (y >= bounds.maxY) {
        y = bounds.maxY;
        this.velY = -Math.abs(this.velY) * BOUNCE;
        this.pulseBounce();
      }

      this.applyViewportPosition(x, y);

      const speed = Math.hypot(this.velX, this.velY);
      if (speed < STOP_SPEED) {
        this.isFlying.set(false);
        this.reactTimeout = setTimeout(() => this.resetFace(), 1400);
        this.rafId = 0;
        return;
      }

      this.rafId = requestAnimationFrame(step);
    };

    this.rafId = requestAnimationFrame(step);
  }

  private pulseBounce(): void {
    if (this.bouncePulse) return;
    this.bouncePulse = true;
    this.reacting.set('annoyed');
    setTimeout(() => {
      this.bouncePulse = false;
      if (this.isFlying() || this.isDragging()) this.reacting.set(null);
    }, 280);
  }

  private getBounds(): { minX: number; minY: number; maxX: number; maxY: number } {
    const el = this.clawdRef?.nativeElement;
    const w = el?.offsetWidth ?? 200;
    const h = el?.offsetHeight ?? 160;
    return {
      minX: EDGE_PAD,
      minY: EDGE_PAD,
      maxX: Math.max(EDGE_PAD, window.innerWidth - w - EDGE_PAD),
      maxY: Math.max(EDGE_PAD, window.innerHeight - h - EDGE_PAD),
    };
  }

  private clampPosition(x: number, y: number): { x: number; y: number } {
    const b = this.getBounds();
    return {
      x: Math.min(b.maxX, Math.max(b.minX, x)),
      y: Math.min(b.maxY, Math.max(b.minY, y)),
    };
  }

  /** Posición fija en viewport (no se mueve con el scroll). */
  private applyViewportPosition(x: number, y: number): void {
    this.posX.set(x);
    this.posY.set(y);
    const el = this.clawdRef?.nativeElement;
    if (el && this.isDetached()) {
      el.style.position = 'fixed';
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.zIndex = '9999';
      el.style.margin = '0';
    }
  }

  private stopPhysics(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
    this.isFlying.set(false);
  }

  private removeDocListeners(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    document.removeEventListener('pointermove', this.onDocMove);
    document.removeEventListener('pointerup', this.onDocUp);
    document.removeEventListener('pointercancel', this.onDocUp);
  }

  private setAnnoyedMode(active: boolean): void {
    if (active) {
      this.face.set('annoyed');
      this.reacting.set(null);
    }
  }

  private showAnnoyedBubble(): void {
    if (this.small()) return;
    this.exiting.set(false);
    this.bubbleVisible.set(true);
    const msg = MASCOT_ANNOYED_MSGS[Math.floor(Math.random() * MASCOT_ANNOYED_MSGS.length)];
    this.displayed.set(msg);
  }

  triggerHappy(): void {
    if (!isPlatformBrowser(this.platformId) || this.isDragging() || this.isFlying()) return;

    this.stopPhysics();
    this.reacting.set('happy');
    this.face.set('happy');
    clearTimeout(this.typeTimeout);
    clearTimeout(this.reactTimeout);

    if (!this.small()) {
      this.exiting.set(false);
      this.bubbleVisible.set(true);
      const msg = MASCOT_LAUGH_MSGS[Math.floor(Math.random() * MASCOT_LAUGH_MSGS.length)];
      this.displayed.set(msg);
    }

    this.reactTimeout = setTimeout(() => this.resetFace(), 580);
  }

  private resetFace(): void {
    this.reacting.set(null);
    this.face.set('neutral');
    if (!this.small() && !this.isDragging() && !this.isFlying()) {
      this.showMessage(this.msgIdx);
    }
  }

  private transitionToMessage(idx: number): void {
    clearTimeout(this.typeTimeout);
    this.exiting.set(true);
    this.cycleTimeout = setTimeout(() => {
      this.exiting.set(false);
      this.bubbleVisible.set(false);
      this.displayed.set('');
      this.showMessage(idx);
    }, 340);
  }

  private showMessage(idx: number): void {
    const text = MASCOT_MSGS[idx % MASCOT_MSGS.length];
    this.bubbleVisible.set(true);
    this.typeMessage(text);
  }

  private typeMessage(text: string): void {
    this.displayed.set('');
    let i = 0;
    const tick = (): void => {
      if (i < text.length) {
        this.displayed.update((d) => d + text[i++]);
        this.typeTimeout = setTimeout(tick, 28 + Math.random() * 12);
      }
    };
    tick();
  }
}
