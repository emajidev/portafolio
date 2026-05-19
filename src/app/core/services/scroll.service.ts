import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ScrollService {
  private readonly platformId = inject(PLATFORM_ID);
  readonly progress = signal(0);
  readonly section = signal('hero');
  readonly scrolled = signal(false);
  readonly isScrolling = signal(false);
  readonly scrollDirection = signal<'up' | 'down' | 'idle'>('idle');

  private lastScrollY = 0;
  private scrollIdleTimer?: ReturnType<typeof setTimeout>;

  init(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      const delta = y - this.lastScrollY;
      if (Math.abs(delta) > 1) {
        this.scrollDirection.set(delta > 0 ? 'down' : 'up');
        this.isScrolling.set(true);
        clearTimeout(this.scrollIdleTimer);
        this.scrollIdleTimer = setTimeout(() => {
          this.isScrolling.set(false);
          this.scrollDirection.set('idle');
        }, 140);
      }
      this.lastScrollY = y;
      this.scrolled.set(y > 30);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      this.progress.set(max > 0 ? (y / max) * 100 : 0);
      for (const id of ['contact', 'experience', 'ai-lab', 'projects', 'skills', 'about', 'hero']) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 100) {
          this.section.set(id);
          break;
        }
      }
    }, { passive: true });
  }

  to(id: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }
}
