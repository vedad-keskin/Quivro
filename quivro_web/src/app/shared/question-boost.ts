import { Component, effect, ElementRef, inject, input, viewChild } from '@angular/core';
import lottie, { type AnimationItem } from 'lottie-web/build/player/lottie_light';
import { LanguageService } from '../core/language.service';

/** Corner flame with the boosted point value. Hidden at 1×. */
@Component({
  selector: 'app-question-boost',
  standalone: true,
  host: {
    '[class.on]': 'multiplier() > 1',
    '[class.large]': 'large()',
    '[attr.role]': 'multiplier() > 1 ? "img" : null',
    '[attr.aria-label]': 'multiplier() > 1 ? valueLabel() : null',
  },
  template: `
    @if (multiplier() > 1) {
      <div class="crop" aria-hidden="true">
        <div class="fire" #fire></div>
      </div>
      <span class="label" aria-hidden="true">
        @for (key of [pulse()]; track key) {
          <b class="value" [class.pop]="key > 0">{{ valueLabel() }}</b>
        }
      </span>
    }
  `,
  styles: `
    :host.on {
      position: absolute;
      top: -1rem;
      right: 0.35rem;
      z-index: 6;
      --boost: 1;
      width: 3.6rem;
      height: 3.7rem;
      pointer-events: none;
      transform-origin: 100% 0;
      transform: scale(var(--boost));
    }
    :host.on.large { --boost: 1.1; }
    :host:not(.on) { display: none; }
    .crop {
      position: absolute;
      inset: 0 0 0.72rem;
      overflow: hidden;
      transform: translateY(-1.2rem);
    }
    .fire {
      position: absolute;
      left: 50%;
      bottom: 0;
      width: 4rem;
      height: 4rem;
      transform: translateX(-50%);
    }
    .label {
      position: absolute;
      left: 50%;
      bottom: calc(0.05rem + 1.2rem);
      z-index: 1;
      transform: translateX(-50%);
    }
    .value {
      display: block;
      padding: 0.14rem 0.32rem;
      border: 2px solid var(--ink);
      border-radius: 8px;
      background: var(--q-gold);
      color: #0a0e27;
      box-shadow: 2px 2px 0 var(--ink);
      font-size: 0.72rem;
      font-weight: 900;
      line-height: 1;
      letter-spacing: 0.01em;
      white-space: nowrap;
    }
    .pop { animation: boost-pop .6s ease-out; }
    @keyframes boost-pop {
      0% { transform: scale(.8); }
      35% { transform: scale(1.12); }
      100% { transform: scale(1); }
    }
    @media (prefers-reduced-motion: reduce) {
      .pop { animation: none; }
    }
  `,
})
export class QuestionBoost {
  readonly lang = inject(LanguageService);
  readonly multiplier = input(1);
  /** Current-question badge, larger than the up-next one. */
  readonly large = input(false);
  readonly timed = input(false);
  readonly pulse = input(0);
  private readonly fire = viewChild<ElementRef<HTMLElement>>('fire');

  constructor() {
    effect((onCleanup) => {
      const el = this.fire()?.nativeElement;
      if (!el) return;
      const reduced =
        typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
      const anim: AnimationItem = lottie.loadAnimation({
        container: el,
        renderer: 'svg',
        loop: !reduced,
        autoplay: !reduced,
        path: '/animations/fire.json',
      });
      if (reduced) anim.addEventListener('DOMLoaded', () => anim.goToAndStop(0, true));
      onCleanup(() => anim.destroy());
    });
  }

  valueLabel(): string {
    return this.timed()
      ? `×${this.multiplier()}`
      : `${this.multiplier()} ${this.lang.t().points}`;
  }
}
