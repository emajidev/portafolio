import { Component, inject, signal } from '@angular/core';
import { NAV } from '../../core/data/portfolio.data';
import { ScrollService } from '../../core/services/scroll.service';

@Component({
  selector: 'app-header',
  standalone: true,
  template: `
    <header class="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md">
      <nav class="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
        <button type="button" class="interactive font-display text-lg font-bold" (click)="go('hero')">
          Emanuel <span class="neon-text">J.M</span>
        </button>
        <ul class="hidden gap-6 md:flex">
          @for (n of nav; track n.id) {
            <li>
              <button type="button" class="interactive font-mono text-sm text-white/60 hover:text-matrix-neon" (click)="go(n.id)">
                {{ n.label }}
              </button>
            </li>
          }
        </ul>
        <button type="button" class="interactive md:hidden font-mono text-matrix-neon" (click)="open.set(!open())">☰</button>
      </nav>
      @if (open()) {
        <div class="border-t border-white/5 px-4 py-3 md:hidden">
          @for (n of nav; track n.id) {
            <button type="button" class="interactive block w-full py-2 text-left font-mono text-sm" (click)="go(n.id); open.set(false)">
              {{ n.label }}
            </button>
          }
        </div>
      }
    </header>
  `,
})
export class HeaderComponent {
  readonly nav = NAV;
  readonly open = signal(false);
  private readonly scroll = inject(ScrollService);
  go(id: string): void {
    this.scroll.to(id);
  }
}
