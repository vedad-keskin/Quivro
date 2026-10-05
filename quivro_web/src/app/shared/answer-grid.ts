import {
  afterNextRender,
  afterRenderEffect,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
} from '@angular/core';
import { avatarColor, avatarEmoji, type RoomPlayer } from '../core/room.models';

const COLORS = ['var(--answer-a)', 'var(--answer-b)', 'var(--answer-c)', 'var(--answer-d)'];
const LABELS = ['A', 'B', 'C', 'D'];
const MIN_FONT_PX = 14;

@Component({
  selector: 'app-answer-grid',
  template: `
    <div class="answers" [class.reveal]="revealed()">
      @for (option of options(); track $index; let i = $index) {
        <button
          type="button"
          class="answer"
          [style.--c]="COLORS[i]"
          [class.correct]="revealed() && correctIndex() === i"
          [class.wrong]="revealed() && correctIndex() !== i"
          [disabled]="disabled()"
          (click)="pick.emit(i)"
        >
          <span class="letter">{{ LABELS[i] }}</span>
          @if (revealed() && correctIndex() === i) {
            <span class="check" aria-hidden="true">✓</span>
          }
          <span class="text">
            <span class="fit">{{ option }}</span>
          </span>
          @if (revealed()) {
            @let choosers = (choicesByIndex()[i] ?? []);
            @if (choosers.length > 0) {
              <span class="pickers">
                @for (p of choosers; track p.id) {
                  <span
                    class="picker"
                    [style.background]="avatarColor(p.avatar)"
                    [title]="p.name"
                  >
                    {{ avatarEmoji(p.avatar) }}
                  </span>
                }
              </span>
            }
          }
        </button>
      }
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex: 1;
      min-height: 0;
      width: 100%;
    }
    .answers {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 1.1rem;
      flex: 1;
      width: 100%;
      height: 100%;
      min-height: 0;
    }
    .answer {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      justify-content: flex-start;
      gap: 0.75rem;
      min-height: 4.5rem;
      height: 100%;
      padding: 1.1rem 1.35rem 1.5rem;
      border: 3px solid var(--ink, #1a1530);
      border-radius: 20px;
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.28), transparent 40%),
        var(--c);
      color: #0f172a;
      font-weight: 800;
      text-align: left;
      cursor: pointer;
      box-shadow: 6px 6px 0 var(--ink, #1a1530);
      transition: transform 0.12s ease, filter 0.2s ease, opacity 0.2s ease,
        box-shadow 0.12s ease;
    }
    .answer:hover:not(:disabled) {
      transform: translate(-1px, -1px);
      box-shadow: 7px 7px 0 var(--ink, #1a1530);
    }
    .answer:active:not(:disabled) {
      transform: translate(4px, 4px);
      box-shadow: 2px 2px 0 var(--ink, #1a1530);
    }
    .answer:focus-visible {
      outline: 4px solid var(--bulb, #ffcc33);
      outline-offset: 3px;
    }
    .letter {
      align-self: flex-start;
      display: grid;
      place-items: center;
      width: clamp(2.75rem, 4.5vw, 3.5rem);
      height: clamp(2.75rem, 4.5vw, 3.5rem);
      border: 3px solid var(--ink, #1a1530);
      border-radius: 14px;
      background: var(--bulb, #ffcc33);
      box-shadow: 3px 3px 0 var(--ink, #1a1530);
      flex-shrink: 0;
      color: #1a1530;
      font-family: var(--display, inherit);
      font-size: clamp(1.4rem, 2.8vw, 1.9rem);
      font-weight: 400;
    }
    .check {
      position: absolute;
      top: -0.9rem;
      right: -0.9rem;
      width: 3rem;
      height: 3rem;
      display: grid;
      place-items: center;
      border: 3px solid var(--ink, #1a1530);
      border-radius: 50%;
      background: var(--q-lime, #84cc16);
      box-shadow: 3px 3px 0 var(--ink, #1a1530);
      color: #1a1530;
      font-size: 1.6rem;
      font-weight: 900;
      animation: stamp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }
    @keyframes stamp {
      from {
        transform: scale(2.2) rotate(-20deg);
        opacity: 0;
      }
    }
    @keyframes bounce {
      40% {
        transform: translateY(-8px) scale(1.02);
      }
    }
    .text {
      flex: 1;
      min-width: 0;
      min-height: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 0.35rem;
      text-align: center;
      line-height: 1.15;
      font-size: clamp(1.85rem, 4.5vw, 3.25rem);
      font-weight: 800;
      overflow: hidden;
    }
    .fit {
      max-width: 100%;
      overflow-wrap: break-word;
    }
    .pickers {
      position: absolute;
      right: 0.75rem;
      bottom: 0.65rem;
      display: flex;
      flex-direction: row-reverse;
    }
    .picker {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-size: 0.9rem;
      border: 2px solid var(--ink, #1a1530);
      margin-left: -0.5rem;
    }
    .reveal .answer.wrong {
      filter: grayscale(0.75);
      opacity: 0.45;
      transform: translate(4px, 4px);
      box-shadow: 2px 2px 0 var(--ink, #1a1530);
    }
    .reveal .answer.correct {
      z-index: 1;
      animation: bounce 0.5s ease-out;
    }
    @media (prefers-reduced-motion: reduce) {
      .check,
      .reveal .answer.correct {
        animation: none;
      }
    }
    @media (max-width: 720px) {
      .answers {
        grid-template-columns: 1fr;
        grid-template-rows: repeat(4, 1fr);
        gap: 0.85rem;
      }
      .answer {
        flex-direction: row;
        align-items: center;
        gap: 0.85rem;
        padding: 1rem 1.15rem;
        border-radius: 18px;
      }
      .letter {
        align-self: center;
        width: 2.4rem;
        height: 2.4rem;
        border-radius: 12px;
        font-size: 1.1rem;
      }
      .text {
        justify-content: flex-start;
        text-align: left;
        padding: 0;
        font-size: clamp(1.1rem, 4vw, 1.35rem);
      }
      .picker {
        width: 1.75rem;
        height: 1.75rem;
        margin-left: -0.45rem;
      }
    }
  `,
})
export class AnswerGrid {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  readonly COLORS = COLORS;
  readonly LABELS = LABELS;
  readonly avatarColor = avatarColor;
  readonly avatarEmoji = avatarEmoji;
  readonly options = input<[string, string, string, string] | string[]>([]);
  readonly revealed = input(false);
  readonly correctIndex = input<number | null>(null);
  readonly disabled = input(false);
  readonly choicesByIndex = input<Record<number, RoomPlayer[]>>({});
  readonly pick = output<number>();

  private resizeObserver: ResizeObserver | null = null;
  private fitScheduled = false;

  constructor() {
    afterNextRender(() => {
      const grid = this.host.nativeElement.querySelector('.answers');
      if (!grid) return;
      this.resizeObserver = new ResizeObserver(() => this.scheduleFit());
      this.resizeObserver.observe(grid);
      this.scheduleFit();
    });

    afterRenderEffect(() => {
      this.options();
      this.scheduleFit();
    });

    this.destroyRef.onDestroy(() => {
      this.resizeObserver?.disconnect();
      this.resizeObserver = null;
    });
  }

  private scheduleFit(): void {
    if (this.fitScheduled) return;
    this.fitScheduled = true;
    requestAnimationFrame(() => {
      this.fitScheduled = false;
      this.fitAllTexts();
    });
  }

  private fitAllTexts(): void {
    const texts = this.host.nativeElement.querySelectorAll('.text');
    for (const node of texts) {
      this.fitText(node as HTMLElement);
    }
  }

  private fitText(el: HTMLElement): void {
    const inner = el.querySelector('.fit') as HTMLElement | null;
    if (!inner) return;

    el.style.fontSize = '';
    const preferred = parseFloat(getComputedStyle(el).fontSize);
    if (!Number.isFinite(preferred) || preferred <= 0) return;

    const maxPx = preferred;
    const minPx = Math.min(MIN_FONT_PX, maxPx);
    const fits = () =>
      inner.offsetHeight <= el.clientHeight + 1 &&
      inner.offsetWidth <= el.clientWidth + 1;

    if (fits()) return;

    let lo = minPx;
    let hi = maxPx;
    let best = minPx;

    while (hi - lo > 0.5) {
      const mid = (lo + hi) / 2;
      el.style.fontSize = `${mid}px`;
      if (fits()) {
        best = mid;
        lo = mid;
      } else {
        hi = mid;
      }
    }

    el.style.fontSize = `${best}px`;
  }
}
