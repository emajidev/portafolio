import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { GridBgComponent } from './shared/components/grid-bg/grid-bg.component';
import { ScrollProgressComponent } from './shared/components/scroll-progress/scroll-progress.component';
import { PreloaderComponent } from './shared/components/preloader/preloader.component';
import { HeaderComponent } from './layout/header/header.component';
import { FooterBarComponent } from './layout/footer-bar/footer-bar.component';
import { ScrollService } from './core/services/scroll.service';
import { CustomCursorComponent } from './shared/components/custom-cursor/custom-cursor.component';
import { BitMascotComponent } from './features/mascot/bit-mascot.component';
import { BitGameModalComponent } from './features/mascot/bit-game/bit-game-modal.component';
import { MascotChatService } from './core/services/mascot-chat.service';
import { RadioPlayerComponent } from './shared/components/radio-player/radio-player.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    GridBgComponent,
    ScrollProgressComponent,
    PreloaderComponent,
    HeaderComponent,
    FooterBarComponent,
    CustomCursorComponent,
    BitMascotComponent,
    BitGameModalComponent,
    RadioPlayerComponent,
  ],
  template: `
    @if (loading()) {
      <app-preloader (loaded)="loading.set(false)" />
    }
    <app-grid-bg />
    <div class="ambient-glow" aria-hidden="true"></div>
    <app-custom-cursor />
    <app-scroll-progress />
    <app-header />
    <main class="relative z-10">
      <router-outlet />
    </main>
    <app-bit-mascot />
    <app-bit-game-modal />
    <app-radio-player />
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
        radial-gradient(ellipse 60% 40% at 20% 20%, rgb(34 211 238 / 5%), transparent),
        radial-gradient(ellipse 50% 35% at 80% 70%, rgb(0 229 255 / 4%), transparent);
    }
    `,
  ],
})
export class AppComponent implements OnInit {
  private readonly scroll = inject(ScrollService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly mascotChat = inject(MascotChatService);
  readonly loading = signal(true);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.loading.set(false);
      return;
    }
    this.scroll.init();
    setTimeout(() => this.mascotChat.greet(), 2200);
    this.mascotChat.startIdleChatter();
    this.mascotChat.startPlayInvites();
  }
}
