import { AfterViewInit, Component, ElementRef, OnDestroy, PLATFORM_ID, ViewChild, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';

@Component({
  selector: 'app-custom-cursor',
  standalone: true,
  template: `
    <div #dot class="cursor-dot" aria-hidden="true"></div>
    <div #ring class="cursor-ring" aria-hidden="true"></div>
  `,
  styles: [
    `
    :host {
      display: block;
    }
    .cursor-dot,
    .cursor-ring {
      position: fixed;
      top: 0;
      left: 0;
      z-index: 9999;
      pointer-events: none;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      will-change: transform;
    }
    .cursor-dot {
      width: 6px;
      height: 6px;
      background: #00e5ff;
      box-shadow: 0 0 8px 2px rgb(0 229 255 / 70%);
    }
    .cursor-ring {
      width: 34px;
      height: 34px;
      border: 1px solid rgb(0 229 255 / 55%);
      transition: width 0.25s ease, height 0.25s ease, border-color 0.25s ease, background 0.25s ease;
    }
    .cursor-ring.is-active {
      width: 54px;
      height: 54px;
      background: rgb(0 229 255 / 8%);
      border-color: #00e5ff;
    }
    @media (hover: none), (pointer: coarse) {
      :host { display: none; }
    }
    `,
  ],
})
export class CustomCursorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('dot') private readonly dotRef!: ElementRef<HTMLElement>;
  @ViewChild('ring') private readonly ringRef!: ElementRef<HTMLElement>;
  private readonly platformId = inject(PLATFORM_ID);

  private onMove?: (e: PointerEvent) => void;
  private onOver?: (e: PointerEvent) => void;
  private onOut?: (e: PointerEvent) => void;
  private moveDot?: gsap.QuickToFunc;
  private moveDotY?: gsap.QuickToFunc;
  private moveRing?: gsap.QuickToFunc;
  private moveRingY?: gsap.QuickToFunc;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const dot = this.dotRef.nativeElement;
    const ring = this.ringRef.nativeElement;

    this.moveDot = gsap.quickTo(dot, 'x', { duration: 0.1, ease: 'power3.out' });
    this.moveDotY = gsap.quickTo(dot, 'y', { duration: 0.1, ease: 'power3.out' });
    this.moveRing = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3.out' });
    this.moveRingY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3.out' });

    this.onMove = (e: PointerEvent): void => {
      this.moveDot?.(e.clientX);
      this.moveDotY?.(e.clientY);
      this.moveRing?.(e.clientX);
      this.moveRingY?.(e.clientY);
    };
    window.addEventListener('pointermove', this.onMove, { passive: true });

    this.onOver = (e: PointerEvent): void => {
      if ((e.target as HTMLElement)?.closest?.('.interactive, a, button')) {
        ring.classList.add('is-active');
      }
    };
    this.onOut = (e: PointerEvent): void => {
      if ((e.target as HTMLElement)?.closest?.('.interactive, a, button')) {
        ring.classList.remove('is-active');
      }
    };
    document.addEventListener('pointerover', this.onOver, { passive: true });
    document.addEventListener('pointerout', this.onOut, { passive: true });
    document.body.classList.add('custom-cursor-active');
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.onMove) window.removeEventListener('pointermove', this.onMove);
    if (this.onOver) document.removeEventListener('pointerover', this.onOver);
    if (this.onOut) document.removeEventListener('pointerout', this.onOut);
    document.body.classList.remove('custom-cursor-active');
  }
}
