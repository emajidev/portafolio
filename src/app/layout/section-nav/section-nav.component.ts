import { Component, inject } from '@angular/core';
import { NAV } from '../../core/data/portfolio.data';
import { ScrollService } from '../../core/services/scroll.service';

@Component({
  selector: 'app-section-nav',
  standalone: true,
  template: `
    <nav class="section-nav" aria-label="Navegación por secciones">
      @for (n of nav; track n.id) {
        <button
          type="button"
          class="dot interactive"
          [class.dot--active]="scroll.section() === n.id"
          (click)="scroll.to(n.id)"
          [attr.aria-label]="'Ir a ' + n.label"
          [attr.aria-current]="scroll.section() === n.id ? 'true' : null"
        >
          <span class="dot__mark"></span>
          <span class="dot__tooltip">{{ n.label }}</span>
        </button>
      }
    </nav>
  `,
  styles: [
    `
    .section-nav {
      position: fixed;
      right: 1.5rem;
      top: 50%;
      transform: translateY(-50%);
      z-index: 44;
      display: none;
      flex-direction: column;
      align-items: center;
      gap: 0.85rem;
    }
    @media (min-width: 1024px) {
      .section-nav { display: flex; }
    }
    .dot {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.1rem;
      height: 1.1rem;
    }
    .dot__mark {
      width: 0.45rem;
      height: 0.45rem;
      border-radius: 999px;
      border: 1px solid rgb(0 229 255 / 40%);
      background: transparent;
      transition: all 0.3s ease;
    }
    .dot:hover .dot__mark {
      border-color: #00e5ff;
      background: rgb(0 229 255 / 30%);
    }
    .dot--active .dot__mark {
      background: #00e5ff;
      border-color: #00e5ff;
      box-shadow: 0 0 10px rgb(0 229 255 / 70%);
      transform: scale(1.5);
    }
    .dot__tooltip {
      position: absolute;
      right: calc(100% + 0.65rem);
      top: 50%;
      transform: translateY(-50%) translateX(4px);
      padding: 0.3rem 0.6rem;
      border-radius: 0.35rem;
      border: 1px solid rgb(0 229 255 / 30%);
      background: rgb(5 5 5 / 92%);
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.68rem;
      white-space: nowrap;
      color: #7df9ff;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease, transform 0.2s ease;
    }
    .dot:hover .dot__tooltip,
    .dot:focus-visible .dot__tooltip {
      opacity: 1;
      transform: translateY(-50%) translateX(0);
    }
    `,
  ],
})
export class SectionNavComponent {
  readonly scroll = inject(ScrollService);
  readonly nav = NAV;
}
