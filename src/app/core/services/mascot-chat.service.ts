import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { EXPERIENCES, MASCOT_ANNOYED_MSGS, MASCOT_IDLE_MSGS, MASCOT_LAUGH_MSGS, MASCOT_MSGS, PROJECTS, SKILLS } from '../data/portfolio.data';

export type Sentiment = 'yes' | 'no' | 'neutral';

export interface MascotDialog {
  id: number;
  text: string;
  exiting: boolean;
  sentiment: Sentiment;
}

const GREETINGS = [
  '¡Hola! Soy Davi. ¿En qué te ayudo?',
  '¡Hey! Pregúntame por proyectos, skills o experiencia.',
  '¡Buenas! Davi en línea.',
];

const NEGATIVE_WORDS = /tonto|malo|feo|odio|aburrid|apesta|no sirve|inútil|basura|horrible|peor/i;
const NAME_INTRO = /\b(?:me llamo|mi nombre es)\s+([a-záéíóúñ]{2,20})/i;

const TOPIC_REPLIES: { test: RegExp; replies: string[] }[] = [
  {
    test: /proyecto|project|demo|portfolio/i,
    replies: [
      'Sube a Proyectos — hay demos y repos reales, no inventados.',
      'Mis builds favoritos están en la sección Proyectos.',
    ],
  },
  {
    test: /\bia\b|\bai\b|ml|machine|llm|lab|agente/i,
    replies: [
      'Pasa por AI Lab: agentes reales en producción (anti-fraude, RAG, soporte IT).',
      'IA Lab es donde muestro los agentes que ya corren en producción.',
    ],
  },
  {
    test: /skill|stack|tech|tecnolog|lenguaje/i,
    replies: ['Skills tiene el stack completo verificado.', 'Pregúntame por una tecnología específica, ej: "sabes Python?"'],
  },
  {
    test: /contact|email|mail|linkedin|github|escrib|whatsapp|telefono/i,
    replies: [
      'Usa el botón Contactar → o la sección Contact arriba.',
      '¿Quieres hablar en serio? Ve a Contact, ahí está el WhatsApp y LinkedIn reales.',
    ],
  },
  {
    test: /experiencia|trabajo|cv|curriculum|empresa/i,
    replies: ['Experience resume 7 años de trayectoria real.', 'Mira Experience para el timeline con empresas reales.'],
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

  private userName?: string;
  private nextId = 0;
  private userPromptTimer?: ReturnType<typeof setTimeout>;
  private userPromptRemoveTimer?: ReturnType<typeof setTimeout>;
  private readonly dismissTimers = new Map<number, ReturnType<typeof setTimeout>>();
  private readonly removeTimers = new Map<number, ReturnType<typeof setTimeout>>();

  private lastSpokeAt = 0;
  private idleTimer?: ReturnType<typeof setTimeout>;
  private idleChatterStarted = false;
  private static readonly IDLE_MIN_GAP_MS = 16000;

  private static readonly USER_PROMPT_VISIBLE_MS = 5500;

  send(text: string): void {
    const trimmed = text.trim();
    if (!trimmed) return;

    this.showUserPrompt(trimmed);
    this.userMessageSent.next();

    const { text: reply, sentiment } = this.buildReply(trimmed);
    setTimeout(() => this.push(reply, sentiment), 380);
  }

  /** Saluda espontáneamente (usado para el saludo inicial del mascot). */
  greet(): void {
    this.push(this.pick(GREETINGS), 'yes');
  }

  /** Arranca la charla espontánea: Davi comenta algo cada cierto tiempo si nadie le ha hablado. */
  startIdleChatter(): void {
    if (this.idleChatterStarted) return;
    this.idleChatterStarted = true;

    const scheduleNext = (): void => {
      const wait = 18000 + Math.random() * 14000;
      this.idleTimer = setTimeout(() => {
        if (Date.now() - this.lastSpokeAt >= MascotChatService.IDLE_MIN_GAP_MS) {
          const text = this.pick([...MASCOT_IDLE_MSGS, ...MASCOT_MSGS]);
          const sentiment: Sentiment = Math.random() > 0.35 ? 'yes' : 'neutral';
          this.push(text, sentiment);
        }
        scheduleNext();
      }, wait);
    };
    scheduleNext();
  }

  stopIdleChatter(): void {
    clearTimeout(this.idleTimer);
    this.idleChatterStarted = false;
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

  private buildReply(input: string): { text: string; sentiment: Sentiment } {
    const lower = input.toLowerCase();

    const nameMatch = input.match(NAME_INTRO);
    if (nameMatch) {
      this.userName = nameMatch[1][0].toUpperCase() + nameMatch[1].slice(1);
      return { text: `¡Un gusto, ${this.userName}! Ya te tengo en mi registro. ¿Qué quieres ver primero?`, sentiment: 'yes' };
    }

    if (/^hola|^hey|^buenas|^hi\b|^hello/i.test(lower)) {
      const greet = this.pick(GREETINGS);
      return { text: this.userName ? `¡Hola de nuevo, ${this.userName}!` : greet, sentiment: 'yes' };
    }

    if (/gracias|thanks|thx|genial|cool|excelente|impresionante/i.test(lower)) {
      return { text: this.pick(['¡De nada!', '¡Un placer!', 'Davi siempre contento de ayudar.']), sentiment: 'yes' };
    }

    if (NEGATIVE_WORDS.test(lower)) {
      return { text: this.pick(MASCOT_ANNOYED_MSGS), sentiment: 'no' };
    }

    if (/quién|quien|eres real|eres ia|eres un bot|mascot|davi\?/i.test(lower)) {
      return { text: 'Soy Davi — un Bit flotante que vive en este portafolio. Solo sé decir sí, no, y ayudarte a navegar.', sentiment: 'neutral' };
    }

    const project = PROJECTS.find((p) => {
      const key = p.title.toLowerCase().replace(/\s*\(.*\)/, '');
      return lower.includes(key) || lower.includes(p.id.replace(/-/g, ' ')) || lower.includes(p.id.replace(/-/g, ''));
    });
    if (project) {
      return { text: `${project.title}: ${project.tagline ?? project.description}`, sentiment: 'yes' };
    }

    const skill = SKILLS.find((s) => {
      const key = s.name.toLowerCase().split(/[\s/(]/)[0];
      return key.length > 2 && lower.includes(key);
    });
    if (skill) {
      return { text: `Sí, trabajo con ${skill.name} — ${skill.level}% de dominio, lo vas a ver en varios proyectos.`, sentiment: 'yes' };
    }

    const exp = EXPERIENCES.find((e) => lower.includes(e.company.toLowerCase().replace(/\s*inc\.?/, '')));
    if (exp) {
      return { text: `${exp.company} (${exp.role}): ${exp.impact}`, sentiment: 'neutral' };
    }

    for (const topic of TOPIC_REPLIES) {
      if (topic.test.test(input)) return { text: this.pick(topic.replies), sentiment: 'neutral' };
    }

    if (/\?/.test(input)) {
      return {
        text: this.pick([
          'Buena pregunta. Explora las secciones — hay pistas por todas partes.',
          'Hmm… prueba Projects o AI Lab, ahí está la respuesta.',
          ...MASCOT_MSGS,
        ]),
        sentiment: 'neutral',
      };
    }

    const words = input.split(/\s+/).filter((w) => w.length > 4);
    if (words.length) {
      const w = words[Math.floor(Math.random() * words.length)];
      return { text: `"${w}"... interesante. Pregúntame sobre proyectos, skills o experiencia.`, sentiment: 'neutral' };
    }

    return { text: this.pick([...MASCOT_MSGS, ...MASCOT_LAUGH_MSGS]), sentiment: 'neutral' };
  }

  private push(text: string, sentiment: Sentiment, visibleMs = 4800): void {
    this.lastSpokeAt = Date.now();
    const id = ++this.nextId;
    this.dialogs.update((list) => {
      const next = [...list, { id, text, exiting: false, sentiment }];
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
