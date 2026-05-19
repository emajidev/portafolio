import { Component, inject, signal } from '@angular/core';
import { NAV } from '../../core/data/portfolio.data';
import { ScrollService } from '../../core/services/scroll.service';

@Component({
  selector: 'app-header',
  standalone: true,
  template: `
    <header
      class="header"
      [class.header--scrolled]="scroll.scrolled()"
    >
      <nav class="header-nav">
        <button type="button" class="interactive logo" (click)="go('hero')">
          Emanuel <span class="neon-text">J.M</span>
        </button>
        <ul class="nav-desktop">
          @for (n of nav; track n.id) {
            <li>
              <button
                type="button"
                class="nav-link interactive"
                [class.nav-link--active]="scroll.section() === n.id"
                (click)="go(n.id)"
              >
                {{ n.label }}
              </button>
            </li>
          }
        </ul>
        <button type="button" class="interactive menu-btn md:hidden" (click)="open.set(!open())">☰</button>
      </nav>
      @if (open()) {
        <div class="nav-mobile">
          @for (n of nav; track n.id) {
            <button type="button" class="interactive w-full py-2 text-left font-mono text-sm" (click)="go(n.id); open.set(false)">
              {{ n.label }}
            </button>
          }
        </div>
      }
    </header>
  `,
  styles: [
    `
    .header {
      position: fixed;
      inset: 0 0 auto;
      z-index: 50;
      border-bottom: 1px solid transparent;
      transition: all 0.3s;
    }
    .header--scrolled {
      border-color: rgb(139 255 77 / 12%);
      background: rgb(5 5 5 / 85%);
      backdrop-filter: blur(16px);
    }
    .header-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 72rem;
      margin: 0 auto;
      padding: 1rem 1.5rem;
    }
    .logo {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1.15rem;
      font-weight: 700;
    }
    .nav-desktop {
      display: none;
      gap: 1.75rem;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    @media (min-width: 768px) { .nav-desktop { display: flex; } }
    .nav-link {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      color: rgb(237 237 237 / 55%);
      transition: color 0.2s;
      background: none;
      border: none;
    }
    .nav-link:hover, .nav-link--active { color: #8bff4d; }
    .menu-btn {
      font-family: monospace;
      color: #8bff4d;
      background: none;
      border: none;
    }
    .nav-mobile {
      padding: 0.75rem 1.5rem 1rem;
      border-top: 1px solid rgb(255 255 255 / 5%);
    }
    `,
  ],
})
export class HeaderComponent {
  readonly nav = NAV;
  readonly open = signal(false);
  readonly scroll = inject(ScrollService);
  go(id: string): void {
    this.scroll.to(id);
  }
}
