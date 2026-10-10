import { Component, input } from '@angular/core';

/** Decorative edge; the play page owns activation and question changes. */
@Component({
  selector: 'app-question-charge',
  host: { 'aria-hidden': 'true' },
  template: `
    <span class="outline" [class.activate]="activate()">
      <span class="rail"></span>
      <span class="edge"><i class="runner"></i></span>
    </span>
  `,
  styles: `
    :host {
      position: absolute;
      inset: calc(-1 * var(--boost-border, 3px));
      border-radius: inherit;
      pointer-events: none;
    }
    .outline { position: absolute; inset: 0; border-radius: inherit; }
    .rail {
      position: absolute;
      inset: -3px;
      border: 2px solid var(--q-yellow);
      border-radius: calc(var(--boost-radius, 18px) + 3px);
      box-shadow: 0 0 0 2px var(--ink);
    }
    .rail::after {
      content: '';
      position: absolute;
      inset: -2px;
      border-radius: inherit;
      box-shadow: 0 0 8px 1px var(--q-gold);
      opacity: .15;
      animation: charge-pulse 3.2s ease-in-out infinite;
    }
    /* The highlight can paint only the rounded border, never the card content. */
    .edge {
      display: none;
      position: absolute;
      inset: -5px;
      padding: 7px;
      border-radius: calc(var(--boost-radius, 18px) + 5px);
      mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
      mask-composite: exclude;
    }
    .activate .edge { display: block; }
    .runner {
      position: absolute;
      top: 0;
      left: 0;
      width: 64px;
      height: 8px;
      border-radius: 50%;
      offset-path: inset(3px round calc(var(--boost-radius, 18px) + 2px));
      offset-anchor: center;
      offset-rotate: auto;
      background: linear-gradient(90deg, transparent, var(--q-yellow) 40%, #fffbea 85%, transparent);
      box-shadow: 0 0 6px 2px #fff3a3;
      animation: charge-lap .95s ease-in-out both;
    }
    .activate .rail::after { animation-delay: .95s; }
    @keyframes charge-lap {
      0% { offset-distance: 0%; opacity: 0; }
      8%, 88% { opacity: 1; }
      100% { offset-distance: 100%; opacity: 0; }
    }
    @keyframes charge-pulse {
      0%, 100% { opacity: .12; }
      50% { opacity: .4; }
    }
    @media (prefers-reduced-motion: reduce) {
      .activate .edge { display: none; }
      .rail::after { animation: none; opacity: .15; }
    }
  `,
})
export class QuestionCharge {
  readonly activate = input(false);
}
