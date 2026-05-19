import { Directive, ElementRef, HostListener, PLATFORM_ID, inject, input } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({ selector: '[appTilt]', standalone: true })
export class TiltDirective {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);
  readonly intensity = input(10);

  @HostListener('mousemove', ['$event'])
  move(e: MouseEvent): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const r = this.el.nativeElement.getBoundingClientRect();
    const rx = ((e.clientY - r.top) / r.height - 0.5) * -this.intensity();
    const ry = ((e.clientX - r.left) / r.width - 0.5) * this.intensity();
    this.el.nativeElement.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.02,1.02,1.02)`;
  }

  @HostListener('mouseleave')
  leave(): void {
    this.el.nativeElement.style.transform = '';
    this.el.nativeElement.style.transition = 'transform 0.4s ease';
  }

  @HostListener('mouseenter')
  enter(): void {
    this.el.nativeElement.style.transition = 'transform 0.1s ease';
  }
}
