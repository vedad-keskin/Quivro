import { Component, input } from '@angular/core';

/** Decorative border only; the play page owns the question/ignition lifecycle. */
@Component({
  selector: 'app-question-flames',
  host: { 'aria-hidden': 'true' },
  template: `
    <div class="outside">
      <div class="fire" [class.ignite]="ignite()">
        <div class="rim"></div>
        @for (flame of flames; track flame) {
          <span class="flame" [style.--i]="flame" [style.offset-distance.%]="flame * 2.5">
            <svg viewBox="0 0 40 40" preserveAspectRatio="none" focusable="false">
              <g>
                <path class="red" d="M0 40C2 29 12 30 9 18C16 20 15 28 20 26C29 20 14 9 33 0C26 13 40 17 35 28C33 34 38 36 40 40Z" />
                <path class="orange" d="M2 40C7 32 16 35 14 25C20 29 23 31 26 23C28 17 24 12 29 7C27 20 36 22 31 32C29 37 36 36 38 40Z" />
                <path class="yellow" d="M5 40C10 35 18 38 20 31C23 34 28 31 28 25C33 34 24 36 34 40Z" />
                <path class="core" d="M12 40Q23 37 25 33Q23 39 31 40Z" />
              </g>
            </svg>
          </span>
        }
        @for (spark of sparks; track spark) {
          <i class="ember" [style.--i]="spark" [style.offset-distance.%]="spark"></i>
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      position: absolute;
      inset: calc(-1 * var(--flame-border, 3px));
      border-radius: inherit;
      pointer-events: none;
    }
    /* Cut out the card interior, including its rounded corners. */
    .outside {
      position: absolute;
      inset: -36px;
      padding: calc(36px + var(--flame-border, 3px));
      border-radius: calc(36px + var(--flame-radius, 18px));
      mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
      mask-composite: exclude;
    }
    .fire {
      position: absolute;
      inset: 36px;
      border-radius: var(--flame-radius, 18px);
      filter: drop-shadow(0 0 3px #f9731670);
    }
    .rim {
      position: absolute;
      inset: 0;
      border: 2px solid var(--q-yellow);
      border-radius: inherit;
      box-shadow: 0 0 0 1px var(--q-orange), 0 0 9px #ef444455;
    }
    .flame, .ember {
      position: absolute;
      top: 0;
      left: 0;
      offset-path: inset(1px round calc(var(--flame-radius, 18px) - 1px));
      offset-anchor: 50% 100%;
      offset-rotate: auto;
    }
    .flame {
      width: 36px;
      height: calc(12px * var(--flame-height-scale, 1));
      overflow: visible;
    }
    .flame svg { display: block; width: 100%; height: 100%; overflow: visible; }
    .flame:nth-of-type(4n + 2) svg { transform: scaleX(-1); }
    .flame:nth-of-type(-n + 16) { height: calc(23px * var(--flame-height-scale, 1)); }
    .flame:nth-of-type(3n) { height: calc(17px * var(--flame-height-scale, 1)); width: 29px; }
    .flame:nth-of-type(5n + 1) { height: calc(27px * var(--flame-height-scale, 1)); }
    .flame:nth-of-type(n + 20):nth-of-type(-n + 36) { height: calc(9px * var(--flame-height-scale, 1)); }
    .flame g {
      transform-origin: 20px 40px;
      animation: flicker calc(1.1s + var(--i) * .017s) ease-in-out infinite alternate;
      animation-delay: calc(var(--i) * -.23s);
    }
    .red { fill: var(--q-red); }
    .orange { fill: var(--q-orange); }
    .yellow { fill: var(--q-yellow); }
    .core { fill: #fff3a3; }
    .ember {
      width: 3px;
      height: 6px;
      border-radius: 80% 0 70% 30%;
      background: var(--q-yellow);
      box-shadow: 0 0 3px var(--q-red);
      animation: ember 2.8s ease-out infinite;
      animation-delay: calc(var(--i) * -.19s);
    }
    .ignite .flame { animation: ignition .42s ease-out both; transform-origin: 50% 100%; }
    .ignite .rim { animation: flash .42s ease-out; }
    @keyframes flicker {
      0%, 100% { transform: scale(.95, .78) skewX(-7deg); }
      45% { transform: scale(1.06, 1.03) skewX(5deg); }
      75% { transform: scale(.98, .9) skewX(-2deg); }
    }
    @keyframes ignition {
      0% { transform: scale(.65, .15); opacity: .4; }
      38% { transform: scale(1.12, 1.25); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes flash {
      35% { box-shadow: 0 0 0 2px #fff3a3, 0 0 17px var(--q-orange); }
    }
    @keyframes ember {
      0%, 20% { transform: translate(0, calc(-8px * var(--flame-height-scale, 1))) scale(.5); opacity: 0; }
      35% { opacity: .85; }
      85%, 100% { transform: translate(7px, calc(-30px * var(--flame-height-scale, 1))) scale(.2); opacity: 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      .flame, .ember { display: none; }
      .ignite .rim { animation: none; }
    }
  `,
})
export class QuestionFlames {
  readonly ignite = input(false);
  readonly flames = Array.from({ length: 40 }, (_, i) => i);
  readonly sparks = [4, 17, 31, 96];
}
