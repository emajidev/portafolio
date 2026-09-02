import { Directive, ElementRef, OnDestroy, OnInit, PLATFORM_ID, inject, input } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';

@Directive({ selector: '[appReveal]', standalone: true })
export class RevealDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);
  private obs?: IntersectionObserver;
  readonly delay = input(0);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const el = this.el.nativeElement;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      gsap.set(el, { opacity: 1, clearProps: 'transform' });
      return;
    }

    gsap.set(el, { opacity: 0, y: 36, scale: 0.97 });
    this.obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          gsap.to(el, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.9,
            delay: this.delay() / 1000,
            ease: 'power3.out',
          });
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
