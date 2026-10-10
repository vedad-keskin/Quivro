import { Component, inject, input } from '@angular/core';
import { LanguageService } from '../core/language.service';

/** Compact reward badge. Hidden for an unboosted question. */
@Component({
  selector: 'app-question-boost',
  standalone: true,
  host: {
    '[class.on]': 'multiplier() > 1',
    '[attr.role]': 'multiplier() > 1 ? "img" : null',
    '[attr.aria-label]': 'multiplier() > 1 ? valueLabel() : null',
  },
  template: `
    @if (multiplier() > 1) {
      @for (animation of [{ pulse: pulse() }]; track animation.pulse) {
        @if (animation.pulse > 0) { <span class="boost-sweep" aria-hidden="true"></span> }
        <span class="badge" [class.pop]="animation.pulse > 0" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M13 2 4 14h7l-1 8 10-12h-7z" fill="currentColor" />
          </svg>
          {{ valueLabel() }}
        </span>
      }
    }
  `,
  styles: `
    :host { display: inline-flex; justify-self: end; border-radius: inherit; pointer-events: none; }
    :host:not(.on) { display: none; }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      min-height: 1.875rem;
      padding: 0.2rem 0.45rem;
      border: 2px solid var(--ink);
      border-radius: 8px;
      background: var(--q-gold);
      color: #0a0e27;
      box-shadow: 2px 2px 0 var(--ink);
      font-size: 0.875rem;
      font-weight: 900;
      line-height: 1;
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }
    svg { flex-shrink: 0; }
    .boost-sweep {
      position: absolute;
      inset: 0;
      border-radius: inherit;
      overflow: hidden;
    }
    .boost-sweep::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(110deg, transparent 20%, color-mix(in srgb, var(--q-gold) 35%, transparent) 50%, transparent 80%);
      animation: boost-sweep .6s ease-out both;
    }
    @keyframes boost-sweep {
      from { transform: translateX(-100%); }
      to { transform: translateX(100%); }
    }
    .pop { animation: boost-pop .45s ease-out; }
    @keyframes boost-pop {
      0% { transform: scale(.92); }
      40% { transform: scale(1.08); }
      100% { transform: scale(1); }
    }
    @media (prefers-reduced-motion: reduce) {
      .boost-sweep { display: none; }
      .pop { animation: none; }
    }
  `,
})
export class QuestionBoost {
  readonly lang = inject(LanguageService);
  readonly multiplier = input(1);
  readonly timed = input(false);
  readonly pulse = input(0);

  valueLabel(): string {
    return this.timed()
      ? `×${this.multiplier()}`
      : `${this.multiplier()} ${this.lang.t().points}`;
  }
}
