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
  selector: 'app-matrix-bg',
  standalone: true,
  template: `<canvas #c class="matrix-canvas" aria-hidden="true"></canvas>`,
  styles: [
    `
    .matrix-canvas {
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      opacity: 0.22;
    }
    `,
  ],
})
export class MatrixBgComponent implements AfterViewInit, OnDestroy {
  @ViewChild('c') canvasRef!: ElementRef<HTMLCanvasElement>;
  private readonly platformId = inject(PLATFORM_ID);
  private raf = 0;
  private onResize?: () => void;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const chars = 'アイウエオカキクケコ0123456789ABCDEF';
    const size = 15;
    let cols = 0;
    let drops: number[] = [];

    const resize = (): void => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      cols = Math.floor(canvas.width / size);
      drops = Array(cols).fill(0).map(() => Math.random() * -40);
    };
    resize();
    this.onResize = resize;
    window.addEventListener('resize', resize);

    const draw = (): void => {
      ctx.fillStyle = 'rgba(5, 5, 5, 0.07)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${size}px "JetBrains Mono", monospace`;
      for (let i = 0; i < cols; i++) {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillStyle = i % 5 === 0 ? '#b8ff9a' : '#4ade80';
        ctx.fillText(ch, i * size, drops[i] * size);
        if (drops[i] * size > canvas.height && Math.random() > 0.98) drops[i] = 0;
        drops[i]++;
      }
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
