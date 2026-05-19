import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatrixBgComponent } from './shared/components/matrix-bg/matrix-bg.component';
import { HeaderComponent } from './layout/header/header.component';
import { FooterBarComponent } from './layout/footer-bar/footer-bar.component';
import { ScrollService } from './core/services/scroll.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatrixBgComponent, HeaderComponent, FooterBarComponent],
  template: `
    <app-matrix-bg />
    <div class="page-glow" aria-hidden="true"></div>
    <app-header />
    <main class="relative z-10">
      <router-outlet />
    </main>
    <app-footer-bar />
  `,
  styles: [
    `
    .page-glow {
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      background: radial-gradient(ellipse 70% 50% at 50% 0%, rgb(57 255 20 / 6%), transparent 60%);
    }
    `,
  ],
})
export class AppComponent implements OnInit {
  private readonly scroll = inject(ScrollService);
  private readonly platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) this.scroll.init();
  }
}

export { provideAnimations };
