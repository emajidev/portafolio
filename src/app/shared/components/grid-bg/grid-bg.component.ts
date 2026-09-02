import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-grid-bg',
  standalone: true,
  template: `<canvas #c class="grid-canvas" aria-hidden="true"></canvas>`,
  styles: [
    `
    .grid-canvas {
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      opacity: 0.4;
    }
    `,
  ],
})
export class GridBgComponent implements AfterViewInit, OnDestroy {
  @ViewChild('c') canvasRef!: ElementRef<HTMLCanvasElement>;
  private readonly platformId = inject(PLATFORM_ID);
  private raf = 0;
  private onResize?: () => void;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 0;
    let height = 0;
    let horizonY = 0;

    const resize = (): void => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      horizonY = height * 0.4;
    };
    resize();
    this.onResize = resize;
    window.addEventListener('resize', resize);

    const rows = 26;
    const cols = 22;
    let progress = 0;

    const draw = (): void => {
      ctx.fillStyle = '#03050a';
      ctx.fillRect(0, 0, width, height);

      const glow = ctx.createRadialGradient(width / 2, horizonY, 0, width / 2, horizonY, width * 0.5);
      glow.addColorStop(0, 'rgba(0, 229, 255, 0.16)');
      glow.addColorStop(1, 'rgba(0, 229, 255, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      ctx.lineTo(width, horizonY);
      ctx.stroke();

      const vpX = width / 2;
      for (let i = 0; i <= cols; i++) {
        const bx = (i / cols - 0.5) * width * 2.4;
        const t = Math.abs(i / cols - 0.5) * 2;
        ctx.strokeStyle = `rgba(0, 229, 255, ${0.16 - t * 0.08})`;
        ctx.beginPath();
        ctx.moveTo(vpX, horizonY);
        ctx.lineTo(vpX + bx, height);
        ctx.stroke();
      }

      for (let i = 0; i < rows; i++) {
        const t = ((i + progress) % rows) / rows;
        const y = horizonY + Math.pow(t, 2.6) * (height - horizonY);
        ctx.strokeStyle = `rgba(0, 229, 255, ${0.5 - t * 0.46})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      if (reducedMotion) return;
      progress += 0.0065 * rows;
      this.raf = requestAnimationFrame(draw);
    };
    draw();
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    cancelAnimationFrame(this.raf);
    if (this.onResize) window.removeEventListener('resize', this.onResize);
  }
}
