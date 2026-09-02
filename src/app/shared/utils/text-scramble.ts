import gsap from 'gsap';

const CHARS = '!<>-_\\/[]{}—=+*^?#________アイウエオカキクケコ01';

/** Matrix-style "decoding" text transition, driven by GSAP's ticker. */
export class TextScramble {
  private frame = 0;
  private queue: { from: string; to: string; start: number; end: number; char?: string }[] = [];
  private resolve = (): void => {};
  private tick = (): void => this.update();

  constructor(private readonly el: HTMLElement) {}

  setText(newText: string): Promise<void> {
    const oldText = this.el.textContent ?? '';
    const length = Math.max(oldText.length, newText.length);
    const promise = new Promise<void>((resolve) => (this.resolve = resolve));
    this.queue = [];
    for (let i = 0; i < length; i++) {
      const from = oldText[i] ?? '';
      const to = newText[i] ?? '';
      const start = Math.floor(Math.random() * 24);
      const end = start + Math.floor(Math.random() * 24);
      this.queue.push({ from, to, start, end });
    }
    gsap.ticker.remove(this.tick);
    this.frame = 0;
    gsap.ticker.add(this.tick);
    return promise;
  }

  private update(): void {
    let output = '';
    let complete = 0;
    for (let i = 0; i < this.queue.length; i++) {
      const item = this.queue[i];
      if (this.frame >= item.end) {
        complete++;
        output += item.to;
      } else if (this.frame >= item.start) {
        if (!item.char || Math.random() < 0.28) {
          item.char = CHARS[Math.floor(Math.random() * CHARS.length)];
        }
        output += item.char;
      } else {
        output += item.from;
      }
    }
    this.el.textContent = output;
    if (complete === this.queue.length) {
      gsap.ticker.remove(this.tick);
      this.resolve();
    } else {
      this.frame++;
    }
  }

  destroy(): void {
    gsap.ticker.remove(this.tick);
  }
}
