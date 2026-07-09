import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  CATEGORIES,
  ROUND_LENGTH_PRESETS,
  type CategoryId,
} from '../../../data/questions/types';
import { GameRoomService } from '../../core/game-room.service';
import { LanguageService } from '../../core/language.service';
import { normalizeRoundLength } from '../../core/round-generator.service';
import { LangToggle } from '../../shared/lang-toggle';

@Component({
  selector: 'app-create-round',
  imports: [FormsModule, RouterLink, LangToggle],
  template: `
    <div class="q-page">
      <header class="top">
        <a routerLink="/" class="q-btn q-btn-ghost">← {{ lang.t().back }}</a>
        <app-lang-toggle />
      </header>

      <div class="q-card panel">
        <h1>{{ lang.t().createRound }}</h1>

        <section>
          <label class="q-label">{{ lang.t().categories }}</label>
          <div class="chips">
            @for (cat of categories; track cat) {
              <button
                type="button"
                class="q-chip"
                [class.active]="selected().includes(cat)"
                (click)="toggleCategory(cat)"
              >
                {{ categoryLabel(cat) }}
              </button>
            }
          </div>
          @if (selected().length === 0) {
            <p class="hint warn">{{ lang.t().selectAtLeastOne }}</p>
          }
        </section>

        <section>
          <label class="q-label">{{ lang.t().roundLength }}</label>
          <div class="chips">
            @for (n of presets; track n) {
              <button
                type="button"
                class="q-chip"
                [class.active]="!customMode() && length() === n"
                (click)="pickPreset(n)"
              >
                {{ n }}
              </button>
            }
            <button
              type="button"
              class="q-chip"
              [class.active]="customMode()"
              (click)="customMode.set(true)"
            >
              {{ lang.t().custom }}
            </button>
          </div>
          @if (customMode()) {
            <input
              class="q-input custom-input"
              type="number"
              min="3"
              max="60"
              [ngModel]="customLength()"
              (ngModelChange)="onCustom($event)"
            />
          }
          <p class="hint">
            {{ effectiveLength() }} {{ lang.t().questions }}
            · {{ bandSize() }} {{ lang.t().easy }} /
            {{ bandSize() }} {{ lang.t().medium }} /
            {{ bandSize() }} {{ lang.t().hard }}
          </p>
        </section>

        @if (!rooms.isLive) {
          <p class="hint warn">{{ lang.t().firebaseMissing }}</p>
        }

        <button
          type="button"
          class="q-btn q-btn-primary"
          [disabled]="selected().length === 0 || creating()"
          (click)="create()"
        >
          {{ lang.t().generateCode }}
        </button>
      </div>
    </div>
  `,
  styles: `
    .top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }
    .panel {
      max-width: 720px;
      margin: 0 auto;
      display: grid;
      gap: 1.5rem;
    }
    h1 {
      margin: 0;
      font-size: clamp(1.6rem, 3vw, 2.2rem);
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
    }
    .hint {
      margin: 0.65rem 0 0;
      color: var(--q-muted);
      font-weight: 600;
    }
    .warn {
      color: #c2410c;
    }
    .custom-input {
      margin-top: 0.75rem;
      max-width: 10rem;
    }
  `,
})
export class CreateRoundPage {
  readonly lang = inject(LanguageService);
  readonly rooms = inject(GameRoomService);
  private readonly router = inject(Router);

  readonly categories = CATEGORIES;
  readonly presets = ROUND_LENGTH_PRESETS;
  readonly selected = signal<CategoryId[]>([...CATEGORIES]);
  readonly length = signal(15);
  readonly customMode = signal(false);
  readonly customLength = signal(15);
  readonly creating = signal(false);

  readonly effectiveLength = computed(() =>
    normalizeRoundLength(this.customMode() ? this.customLength() : this.length()),
  );
  readonly bandSize = computed(() => this.effectiveLength() / 3);

  categoryLabel(cat: CategoryId): string {
    return this.lang.t()[cat];
  }

  toggleCategory(cat: CategoryId): void {
    const cur = this.selected();
    this.selected.set(
      cur.includes(cat) ? cur.filter((c) => c !== cat) : [...cur, cat],
    );
  }

  pickPreset(n: number): void {
    this.customMode.set(false);
    this.length.set(n);
  }

  onCustom(value: number | string): void {
    this.customLength.set(Number(value) || 3);
  }

  async create(): Promise<void> {
    if (this.selected().length === 0 || this.creating()) return;
    this.creating.set(true);
    try {
      const code = await this.rooms.createRoom({
        categories: this.selected(),
        roundLength: this.effectiveLength(),
        language: this.lang.lang(),
      });
      await this.router.navigate(['/lobby', code]);
    } catch (e) {
      console.error(e);
      alert(this.lang.t().createFailed);
    } finally {
      this.creating.set(false);
    }
  }
}
