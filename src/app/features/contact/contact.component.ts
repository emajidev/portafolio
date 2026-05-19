import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RevealDirective } from '../../shared/directives/reveal.directive';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [ReactiveFormsModule, RevealDirective],
  template: `
    <section id="contact" class="section pb-36">
      <div class="container grid gap-10 lg:grid-cols-2 items-start">
        <div appReveal>
          <h2 class="section-title">¿Construimos el <span class="neon-text">futuro</span>?</h2>
          <p class="section-subtitle mt-3">Disponible para proyectos IA, consultoría DevOps y colaboraciones.</p>
          <div class="mt-8 flex flex-wrap gap-3">
            @for (s of socials; track s.label) {
              <a [href]="s.url" target="_blank" rel="noopener" class="social-link interactive">{{ s.label }}</a>
            }
          </div>
        </div>
        <form appReveal [delay]="100" class="contact-form" [formGroup]="form" (ngSubmit)="send()">
          @if (sent()) {
            <div class="sent-state">
              <span class="text-4xl">✓</span>
              <p class="mt-3 font-display text-xl text-matrix-neon">¡Mensaje enviado!</p>
            </div>
          } @else {
            <label class="field"><span>nombre</span><input formControlName="name" /></label>
            <label class="field"><span>email</span><input formControlName="email" type="email" /></label>
            <label class="field"><span>mensaje</span><textarea formControlName="message" rows="4"></textarea></label>
            <button type="submit" class="interactive btn-primary w-full" [disabled]="form.invalid">Enviar mensaje →</button>
          }
        </form>
      </div>
    </section>
    <footer class="py-8 text-center font-mono text-xs text-white/35 border-t border-white/5">
      © {{ year }} Emanuel J.M — Construido con Angular 18
    </footer>
  `,
  styles: [
    `
    .contact-form {
      padding: 1.5rem;
      border-radius: 1rem;
      border: 1px solid rgb(139 255 77 / 25%);
      background: rgb(17 17 17 / 70%);
      backdrop-filter: blur(16px);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .field span {
      display: block;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.7rem;
      color: #8bff4d;
      margin-bottom: 0.35rem;
    }
    .field input, .field textarea {
      width: 100%;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      border: 1px solid rgb(255 255 255 / 10%);
      background: rgb(0 0 0 / 40%);
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      color: #ededed;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .field input:focus, .field textarea:focus {
      border-color: rgb(139 255 77 / 50%);
      box-shadow: 0 0 12px rgb(139 255 77 / 15%);
    }
    .social-link {
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      border: 1px solid rgb(139 255 77 / 20%);
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      color: rgb(237 237 237 / 70%);
      transition: all 0.25s;
    }
    .social-link:hover {
      border-color: rgb(139 255 77 / 45%);
      color: #8bff4d;
    }
    .sent-state {
      text-align: center;
      padding: 3rem 1rem;
    }
    `,
  ],
})
export class ContactComponent {
  readonly year = new Date().getFullYear();
  readonly sent = signal(false);
  readonly socials = [
    { label: 'GitHub', url: 'https://github.com/emajidev' },
    { label: 'LinkedIn', url: 'https://linkedin.com' },
    { label: 'Email', url: 'mailto:contacto@emanueljm.dev' },
  ];
  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    message: ['', [Validators.required, Validators.minLength(8)]],
  });

  send(): void {
    if (this.form.invalid) return;
    const { name, email, message } = this.form.getRawValue();
    window.open(`mailto:contacto@emanueljm.dev?subject=Portfolio&body=${encodeURIComponent(`${name} (${email})\n\n${message}`)}`);
    this.sent.set(true);
    setTimeout(() => {
      this.sent.set(false);
      this.form.reset();
    }, 3500);
  }
}
