import { Component, inject } from '@angular/core';
import { ScrollService } from '../../../core/services/scroll.service';

@Component({
  selector: 'app-scroll-top',
  standalone: true,
  template: `
    @if (scroll.scrolled()) {
      <button
        type="button"
        class="scroll-top interactive"
        aria-label="Volver arriba"
        (click)="scroll.to('hero')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 19V5" />
          <path d="M6 11l6-6 6 6" />
        </svg>
      </button>
    }
  `,
  styles: [
    `
    .scroll-top {
      position: fixed;
      left: 1.25rem;
      bottom: 4.75rem;
      z-index: 46;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.6rem;
      height: 2.6rem;
      border-radius: 999px;
      border: 1px solid rgb(0 229 255 / 30%);
      background: rgb(5 5 5 / 80%);
      color: #00e5ff;
      backdrop-filter: blur(8px);
      box-shadow: 0 0 16px rgb(0 229 255 / 15%);
      animation: scroll-top-in 0.3s ease forwards;
      transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s;
    }
    .scroll-top:hover {
      border-color: rgb(0 229 255 / 60%);
      box-shadow: 0 0 24px rgb(0 229 255 / 30%);
      transform: translateY(-3px);
    }
    .scroll-top svg {
      width: 1.15rem;
      height: 1.15rem;
    }
    @keyframes scroll-top-in {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @media (max-width: 640px) {
      .scroll-top { bottom: 4.5rem; left: 1rem; width: 2.35rem; height: 2.35rem; }
    }
    `,
  ],
})
export class ScrollTopComponent {
  readonly scroll = inject(ScrollService);
}
