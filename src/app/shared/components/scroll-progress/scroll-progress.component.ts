import { Component, inject } from '@angular/core';
import { ScrollService } from '../../../core/services/scroll.service';

@Component({
  selector: 'app-scroll-progress',
  standalone: true,
  template: `
    <div class="scroll-bar" [style.width.%]="scroll.progress()" role="progressbar" aria-hidden="true"></div>
  `,
  styles: [
    `
    .scroll-bar {
      position: fixed;
      top: 0;
      left: 0;
      z-index: 9999;
      height: 2px;
      background: linear-gradient(90deg, #7df9ff, #00e5ff, #22d3ee);
      box-shadow: 0 0 8px #00e5ff;
      transition: width 0.1s linear;
    }
    `,
  ],
})
export class ScrollProgressComponent {
  readonly scroll = inject(ScrollService);
}
