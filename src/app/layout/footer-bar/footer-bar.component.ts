import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MascotChatService } from '../../core/services/mascot-chat.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { bitSound } from '../../shared/utils/bit-sound';

@Component({
  selector: 'app-footer-bar',
  standalone: true,
  imports: [FormsModule, IconComponent],
  template: `
    <div class="footer-bar fixed inset-x-0 bottom-0 z-40 border-t border-matrix-neon/20 bg-[#050505]/90 backdrop-blur-md">
      <div class="footer-inner mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
        <div class="davi-dialogs" aria-live="polite" aria-label="Tu mensaje para Davi">
          @if (chat.userPrompt(); as prompt) {
            <div class="davi-dialog" [class.davi-dialog--exit]="prompt.exiting">
              {{ prompt.text }}
            </div>
          }
        </div>

        <button
          type="button"
          class="interactive mute-btn shrink-0"
          [attr.aria-label]="muted() ? 'Activar sonido de Davi' : 'Silenciar a Davi'"
          (click)="toggleMute()"
        >
          <app-icon [name]="muted() ? 'volume-x' : 'volume'" class="mute-icon" />
        </button>

        <form class="flex min-w-0 flex-1 items-center gap-3" (ngSubmit)="onSend($event)">
          <input
            type="text"
            class="chat-input"
            [(ngModel)]="draft"
            name="daviChat"
            placeholder="Escribe a Davi..."
            maxlength="120"
            autocomplete="off"
            aria-label="Mensaje para Davi"
          />

          <button
            type="submit"
            class="interactive btn-primary shrink-0 text-sm py-2"
            [disabled]="!draft.trim()"
          >
            Enviar →
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
    .mute-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.1rem;
      height: 2.1rem;
      border-radius: 0.45rem;
      border: 1px solid rgb(0 229 255 / 25%);
      color: rgb(125 249 255 / 70%);
      transition: border-color 0.2s, color 0.2s;
    }
    .mute-btn:hover {
      border-color: rgb(0 229 255 / 55%);
      color: #00e5ff;
    }
    .mute-icon {
      width: 1.1rem;
      height: 1.1rem;
    }
    .chat-input {
      flex: 1;
      min-width: 0;
      padding: 0.55rem 0.85rem;
      border: 1px solid rgb(0 229 255 / 35%);
      border-radius: 0.45rem;
      background: rgb(0 0 0 / 55%);
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.78rem;
      color: #7df9ff;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .chat-input::placeholder {
      color: rgb(125 249 255 / 38%);
    }

    .chat-input:focus {
      border-color: #00e5ff;
      box-shadow: 0 0 0 2px rgb(0 229 255 / 18%);
    }

    .footer-inner {
      position: relative;
    }

    .davi-dialogs {
      position: absolute;
      right: 1rem;
      bottom: calc(100% + 0.5rem);
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.35rem;
      width: min(18rem, calc(100vw - 2rem));
      pointer-events: none;
      z-index: 1;
    }

    .davi-dialog {
      max-width: 100%;
      padding: 0.4rem 0.65rem;
      border: 1px solid rgb(0 229 255 / 45%);
      border-radius: 0.4rem;
      background: #000;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.7rem;
      line-height: 1.35;
      color: #7df9ff;
      text-align: right;
      box-shadow: 0 0 14px rgb(34 211 238 / 18%);
      animation: dialog-in-right 0.35s ease forwards;
    }

    .davi-dialog--exit {
      animation: dialog-out-right 0.32s ease forwards;
    }

    @keyframes dialog-in-right {
      from {
        opacity: 0;
        transform: translateX(18px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes dialog-out-right {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(22px);
      }
    }

    `,
  ],
})
export class FooterBarComponent {
  readonly chat = inject(MascotChatService);
  readonly muted = signal(bitSound.muted);

  draft = '';

  toggleMute(): void {
    const next = !this.muted();
    bitSound.setMuted(next);
    this.muted.set(next);
  }

  onSend(event: Event): void {
    event.preventDefault();
    const text = this.draft;
    if (!text.trim()) return;
    this.chat.send(text);
    this.draft = '';
  }
}
