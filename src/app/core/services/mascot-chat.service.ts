import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { MASCOT_LAUGH_MSGS, MASCOT_MSGS } from '../data/portfolio.data';

export interface MascotDialog {
  id: number;
  text: string;
  exiting: boolean;
}

const GREETINGS = [
  '¡Hola! Soy Davi. ¿En qué te ayudo?',
  '¡Hey! Pregúntame por proyectos, IA o contacto.',
  '¡Buenas! Davi en línea.',
];

const TOPIC_REPLIES: { test: RegExp; replies: string[] }[] = [
  {
    test: /proyecto|project|demo|portfolio/i,
    replies: [
      'Sube a Proyectos — hay demos y repos.',
      'Mis builds favoritos están en la sección Proyectos.',
    ],
  },
  {
    test: /ia|ai|ml|machine|llm|lab/i,
    replies: [
      'Pasa por AI Lab: experimentos y betas en vivo.',
      'IA Lab es donde pruebo cosas nuevas. ¡Míralo!',
    ],
  },
  {
    test: /skill|stack|tech|tecnolog/i,
    replies: ['Skills tiene el mapa completo del stack.', 'Revisa Skills para ver con qué trabajo.'],
  },
  {
    test: /contact|email|mail|linkedin|github|escrib/i,
    replies: [
      'Usa el botón Contactar → o la sección Contact arriba.',
      '¿Quieres hablar en serio? Ve a Contact.',
    ],
  },
  {
    test: /experiencia|trabajo|cv|curriculum/i,
    replies: ['Experience resume mi trayectoria.', 'Mira Experience para el timeline.'],
  },
  {
    test: /gracias|thanks|thx|genial|cool|buen/i,
    replies: ['¡De nada!', '¡Un placer!', 'Davi siempre contento de ayudar.'],
  },
  {
    test: /quién|quien|eres|davi|mascot/i,
    replies: [
      'Soy Davi, tu copiloto pixel por este portafolio.',
      'Davi a la orden — guía, bromas y píxeles verdes.',
    ],
  },
];

export interface UserPromptBubble {
  text: string;
  exiting: boolean;
}

@Injectable({ providedIn: 'root' })
export class MascotChatService {
  readonly dialogs = signal<MascotDialog[]>([]);
  /** Mensaje que el usuario acaba de enviar (visible arriba del footer). */
  readonly userPrompt = signal<UserPromptBubble | null>(null);
  readonly userMessageSent = new Subject<void>();

  private nextId = 0;
  private userPromptTimer?: ReturnType<typeof setTimeout>;
  private userPromptRemoveTimer?: ReturnType<typeof setTimeout>;
  private readonly dismissTimers = new Map<number, ReturnType<typeof setTimeout>>();
  private readonly removeTimers = new Map<number, ReturnType<typeof setTimeout>>();

  private static readonly USER_PROMPT_VISIBLE_MS = 5500;

  send(text: string): void {
    const trimmed = text.trim();
    if (!trimmed) return;

    this.showUserPrompt(trimmed);
    this.userMessageSent.next();

    const reply = this.buildReply(trimmed);
    setTimeout(() => this.push(reply), 380);
  }

  private showUserPrompt(text: string): void {
    if (this.userPromptTimer) {
      clearTimeout(this.userPromptTimer);
      this.userPromptTimer = undefined;
    }
    if (this.userPromptRemoveTimer) {
      clearTimeout(this.userPromptRemoveTimer);
      this.userPromptRemoveTimer = undefined;
    }

    this.userPrompt.set({ text, exiting: false });

    this.userPromptTimer = setTimeout(
      () => this.hideUserPrompt(),
      MascotChatService.USER_PROMPT_VISIBLE_MS,
    );
  }

  private hideUserPrompt(): void {
    if (this.userPromptTimer) {
      clearTimeout(this.userPromptTimer);
      this.userPromptTimer = undefined;
    }

    const current = this.userPrompt();
    if (!current || current.exiting) return;

    this.userPrompt.set({ ...current, exiting: true });

    this.userPromptRemoveTimer = setTimeout(() => {
      this.userPrompt.set(null);
      this.userPromptRemoveTimer = undefined;
    }, 320);
  }

  private buildReply(input: string): string {
    const lower = input.toLowerCase();

    if (/^hola|^hey|^buenas|^hi\b|^hello/i.test(lower)) {
      return this.pick(GREETINGS);
    }

    for (const topic of TOPIC_REPLIES) {
      if (topic.test.test(input)) return this.pick(topic.replies);
    }

    if (/\?/.test(input)) {
      return this.pick([
        'Buena pregunta. Explora las secciones — hay pistas por todas partes.',
        'Hmm… prueba Projects o AI Lab, ahí está la respuesta.',
        ...MASCOT_MSGS,
      ]);
    }

    return this.pick([...MASCOT_MSGS, ...MASCOT_LAUGH_MSGS]);
  }

  private push(text: string, visibleMs = 4800): void {
    const id = ++this.nextId;
    this.dialogs.update((list) => {
      const next = [...list, { id, text, exiting: false }];
      return next.length > 3 ? next.slice(-3) : next;
    });

    const dismissTimer = setTimeout(() => this.dismiss(id), visibleMs);
    this.dismissTimers.set(id, dismissTimer);
  }

  private dismiss(id: number): void {
    clearTimeout(this.dismissTimers.get(id));
    this.dismissTimers.delete(id);

    this.dialogs.update((list) =>
      list.map((d) => (d.id === id ? { ...d, exiting: true } : d)),
    );

    const removeTimer = setTimeout(() => {
      this.dialogs.update((list) => list.filter((d) => d.id !== id));
      this.removeTimers.delete(id);
    }, 320);
    this.removeTimers.set(id, removeTimer);
  }

  private pick(pool: string[]): string {
    return pool[Math.floor(Math.random() * pool.length)];
  }
}
