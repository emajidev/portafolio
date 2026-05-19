import { Component, inject } from '@angular/core';
import { ScrollService } from '../../core/services/scroll.service';
import { ClawdComponent } from '../../features/mascot/clawd.component';

@Component({
  selector: 'app-footer-bar',
  standalone: true,
  imports: [ClawdComponent],
  template: `
    <div class="fixed inset-x-0 bottom-0 z-40 border-t border-matrix-neon/20 bg-[#050505]/90 backdrop-blur-md">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5">
        <app-clawd [small]="true" />
        <button type="button" class="interactive btn-primary text-sm py-2" (click)="go('contact')">Contactar →</button>
      </div>
    </div>
  `,
})
export class FooterBarComponent {
  private readonly scroll = inject(ScrollService);
  go(id: string): void {
    this.scroll.to(id);
  }
}
