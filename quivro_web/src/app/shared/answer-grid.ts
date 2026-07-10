import { Component, input, output } from '@angular/core';
import { avatarColor, avatarEmoji, type RoomPlayer } from '../core/room.models';

const COLORS = ['var(--answer-a)', 'var(--answer-b)', 'var(--answer-c)', 'var(--answer-d)'];
const LABELS = ['A', 'B', 'C', 'D'];

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
          <span class="text">{{ option }}</span>
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
    .answers {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .answer {
      position: relative;
      display: flex;
      align-items: center;
      gap: 0.85rem;
      min-height: 5rem;
      padding: 1rem 1.15rem;
      border: none;
      border-radius: 18px;
      background: var(--c);
      color: #0f172a;
      font-weight: 800;
      font-size: clamp(1rem, 2vw, 1.35rem);
      text-align: left;
      cursor: pointer;
      box-shadow: 0 8px 18px color-mix(in srgb, var(--c) 35%, transparent);
      transition: transform 0.15s ease, filter 0.2s ease, opacity 0.2s ease;
    }
    .answer:hover:not(:disabled) {
      transform: translateY(-2px) scale(1.01);
    }
    .letter {
      display: grid;
      place-items: center;
      width: 2.2rem;
      height: 2.2rem;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.55);
      flex-shrink: 0;
    }
    .text {
      flex: 1;
      min-width: 0;
    }
    .pickers {
      position: absolute;
      right: 0.65rem;
      bottom: 0.55rem;
      display: flex;
      flex-direction: row-reverse;
    }
    .picker {
      width: 1.85rem;
      height: 1.85rem;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-size: 0.85rem;
      border: 2px solid #fff;
      margin-left: -0.45rem;
      box-shadow: 0 2px 6px rgba(15, 23, 42, 0.18);
    }
    .reveal .answer.wrong {
      filter: grayscale(0.7) brightness(0.85);
      opacity: 0.7;
    }
    .reveal .answer.correct {
      outline: 4px solid #fff;
      transform: scale(1.03);
    }
    @media (max-width: 720px) {
      .answers {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class AnswerGrid {
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
}
