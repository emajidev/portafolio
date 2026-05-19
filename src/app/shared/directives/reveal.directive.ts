import { Directive, ElementRef, OnDestroy, OnInit, PLATFORM_ID, inject, input } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({ selector: '[appReveal]', standalone: true })
export class RevealDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);
  private obs?: IntersectionObserver;
  readonly delay = input(0);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const el = this.el.nativeElement;
    el.classList.add('reveal-hidden');
    el.style.transitionDelay = `${this.delay()}ms`;
    this.obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add('reveal-visible');
          el.classList.remove('reveal-hidden');
          this.obs?.unobserve(el);
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    this.obs.observe(el);
  }

  ngOnDestroy(): void {
    this.obs?.disconnect();
  }
}
