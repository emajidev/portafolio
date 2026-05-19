import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PROJECTS, SKILLS, EXPERIENCES } from '../../core/data/portfolio.data';
import { ClawdComponent } from '../../features/mascot/clawd.component';
import { ScrollService } from '../../core/services/scroll.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ClawdComponent, ReactiveFormsModule],
  template: `
    <!-- HERO -->
    <section id="hero" class="relative min-h-screen flex items-center pt-24 pb-16 px-4 md:px-6">
      <div class="relative z-10 mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-2 lg:gap-16 items-center">
        <div>
          <p class="font-mono text-sm text-matrix-terminal">&gt; {{ role() }}<span class="animate-pulse">_</span></p>
          <h1 class="mt-3 font-display text-4xl font-bold md:text-5xl">Emanuel <span class="neon-text">J.M</span></h1>
          <h2 class="mt-4 text-2xl font-semibold leading-snug md:text-3xl">
            Impulsando el <span class="neon-text">Futuro con IA</span> y <span class="neon-text">DevOps</span>
          </h2>
          <p class="mt-4 text-white/65 max-w-lg leading-relaxed">
            Ingeniero backend especializado en IA, automatización, DevOps y arquitecturas escalables.
          </p>
          <div class="mt-8 flex flex-wrap gap-3">
            <button type="button" class="interactive btn-primary" (click)="go('projects')">Ver Proyectos →</button>
            <button type="button" class="interactive btn-secondary" (click)="go('contact')">Contactar</button>
          </div>
        </div>
        <div class="flex justify-center lg:justify-end">
          <app-clawd />
        </div>
      </div>
    </section>

    <!-- ABOUT -->
    <section id="about" class="py-20 px-4 md:px-6 border-t border-white/5">
      <div class="mx-auto max-w-6xl">
        <h2 class="section-title">Sobre <span class="neon-text">mí</span></h2>
        <p class="section-subtitle mt-2">8+ años construyendo sistemas backend, cloud e IA en producción.</p>
        <div class="mt-10 grid gap-4 sm:grid-cols-3">
          @for (c of aboutCards; track c.t) {
            <article class="glass-neon rounded-xl p-5">
              <span class="text-2xl">{{ c.i }}</span>
              <h3 class="mt-2 font-semibold text-matrix-neon">{{ c.t }}</h3>
              <p class="mt-1 text-sm text-white/60">{{ c.d }}</p>
            </article>
          }
        </div>
      </div>
    </section>

    <!-- SKILLS -->
    <section id="skills" class="py-20 px-4 md:px-6 border-t border-white/5">
      <div class="mx-auto max-w-6xl">
        <h2 class="section-title">Stack <span class="neon-text">DevOps</span></h2>
        <div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          @for (s of skills; track s.name) {
            <article class="glass-neon rounded-xl p-4">
              <div class="flex justify-between"><span>{{ s.icon }}</span><span class="font-mono text-xs text-matrix-neon">{{ s.level }}%</span></div>
              <h3 class="mt-2 font-medium">{{ s.name }}</h3>
              <div class="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
                <div class="h-full bg-matrix-neon rounded-full" [style.width.%]="s.level"></div>
              </div>
            </article>
          }
        </div>
      </div>
    </section>

    <!-- PROJECTS -->
    <section id="projects" class="py-20 px-4 md:px-6 border-t border-white/5">
      <div class="mx-auto max-w-6xl">
        <h2 class="section-title">Proyectos <span class="neon-text">IA</span></h2>
        <div class="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          @for (p of projects; track p.id) {
            <article class="glass-neon rounded-xl p-5 transition hover:border-matrix-neon/50 hover:shadow-neon-sm" [class.md:col-span-2]="p.featured">
              <div class="flex gap-1 flex-wrap">
                @for (t of p.tags; track t) {
                  <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-matrix-neon/10 text-matrix-neon">{{ t }}</span>
                }
              </div>
              <h3 class="mt-3 font-display font-semibold text-lg">{{ p.title }}</h3>
              <p class="mt-2 text-sm text-white/60">{{ p.description }}</p>
            </article>
          }
        </div>
      </div>
    </section>

    <!-- AI LAB -->
    <section id="ai-lab" class="py-20 px-4 md:px-6 border-t border-white/5">
      <div class="mx-auto max-w-6xl">
        <h2 class="section-title">AI <span class="neon-text">Lab</span></h2>
        <div class="mt-6 glass-neon rounded-xl p-4 font-mono text-sm text-matrix-terminal">
          <p>&gt; clawd&#64;lab ~ status</p>
          <p class="text-matrix-neon mt-1">[OK] 4 experimentos activos</p>
          <p class="text-white/50 mt-1">[ML] Pipeline sync — running</p>
        </div>
      </div>
    </section>

    <!-- EXPERIENCE -->
    <section id="experience" class="py-20 px-4 md:px-6 border-t border-white/5">
      <div class="mx-auto max-w-6xl">
        <h2 class="section-title">Experiencia</h2>
        <div class="mt-10 flex gap-4 overflow-x-auto pb-4">
          @for (e of exp; track e.company) {
            <article class="glass-neon shrink-0 w-72 rounded-xl p-5">
              <p class="font-mono text-xs text-matrix-terminal">{{ e.period }}</p>
              <h3 class="mt-2 font-semibold text-matrix-neon">{{ e.role }}</h3>
              <p class="font-medium">{{ e.company }}</p>
              <p class="mt-2 text-sm text-white/60">{{ e.impact }}</p>
            </article>
          }
        </div>
      </div>
    </section>

    <!-- CONTACT -->
    <section id="contact" class="py-20 px-4 md:px-6 border-t border-white/5 pb-32">
      <div class="mx-auto max-w-6xl grid gap-10 lg:grid-cols-2">
        <div>
          <h2 class="section-title">Contacto</h2>
          <p class="section-subtitle mt-2">¿Construimos algo increíble?</p>
        </div>
        <form class="glass-neon rounded-xl p-6 space-y-4" [formGroup]="form" (ngSubmit)="send()">
          <input formControlName="name" placeholder="Nombre" class="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 font-mono text-sm outline-none focus:border-matrix-neon" />
          <input formControlName="email" type="email" placeholder="Email" class="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 font-mono text-sm outline-none focus:border-matrix-neon" />
          <textarea formControlName="message" rows="4" placeholder="Mensaje" class="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 font-mono text-sm outline-none focus:border-matrix-neon resize-none"></textarea>
          <button type="submit" class="interactive btn-primary w-full" [disabled]="form.invalid">Enviar →</button>
        </form>
      </div>
    </section>

    <footer class="py-8 text-center font-mono text-xs text-white/40 border-t border-white/5">
      © {{ year }} Emanuel J.M — Angular 18 + Tailwind
    </footer>
  `,
})
export class HomePage implements OnInit {
  readonly skills = SKILLS;
  readonly projects = PROJECTS;
  readonly exp = EXPERIENCES;
  readonly year = new Date().getFullYear();
  readonly role = signal('Backend Engineer');
  readonly aboutCards = [
    { i: '⚡', t: 'Experiencia', d: 'Sistemas en producción a escala.' },
    { i: '🎯', t: 'Filosofía', d: 'Automatizar, medir, iterar.' },
    { i: '🚀', t: 'Objetivos', d: 'IA accesible en producción.' },
  ];
  private readonly scroll = inject(ScrollService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    message: ['', Validators.required],
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const roles = ['Backend Engineer', 'IA & DevOps', 'Cloud Architect'];
    let i = 0;
    setInterval(() => this.role.set(roles[i++ % roles.length]), 3000);
  }

  go(id: string): void {
    this.scroll.to(id);
  }

  send(): void {
    if (this.form.invalid) return;
    const { name, email, message } = this.form.getRawValue();
    window.open(`mailto:contacto@emanueljm.dev?subject=Portfolio&body=${encodeURIComponent(`${name} (${email})\n\n${message}`)}`);
  }
}
