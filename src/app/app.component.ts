import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatrixBgComponent } from './shared/components/matrix-bg/matrix-bg.component';
import { ScrollProgressComponent } from './shared/components/scroll-progress/scroll-progress.component';
import { PreloaderComponent } from './shared/components/preloader/preloader.component';
import { HeaderComponent } from './layout/header/header.component';
import { FooterBarComponent } from './layout/footer-bar/footer-bar.component';
import { ScrollService } from './core/services/scroll.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    MatrixBgComponent,
    ScrollProgressComponent,
    PreloaderComponent,
    HeaderComponent,
    FooterBarComponent,
  ],
  template: `
    @if (loading()) {
      <app-preloader (loaded)="loading.set(false)" />
    }
    <app-matrix-bg />
    <div class="ambient-glow" aria-hidden="true"></div>
    <app-scroll-progress />
    <app-header />
    <main class="relative z-10">
      <router-outlet />
    </main>
    <app-footer-bar />
  `,
  styles: [
    `
    .ambient-glow {
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      background:
        radial-gradient(ellipse 60% 40% at 20% 20%, rgb(57 255 20 / 5%), transparent),
        radial-gradient(ellipse 50% 35% at 80% 70%, rgb(139 255 77 / 4%), transparent);
    }
    `,
  ],
})
export class AppComponent implements OnInit {
  private readonly scroll = inject(ScrollService);
  private readonly platformId = inject(PLATFORM_ID);
  readonly loading = signal(true);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.loading.set(false);
      return;
    }
    this.scroll.init();
  }
}
