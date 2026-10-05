import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LanguageService } from '../core/language.service';
import type { UiStrings } from '../../i18n/en';

const CONTACT = 'contact@quivro.org';

const LINKS: readonly { to: string; key: keyof UiStrings; accent: string }[] = [
  { to: '/privacy', key: 'privacy', accent: 'var(--q-cyan)' },
  { to: '/data-deletion', key: 'dataDeletion', accent: 'var(--q-orange)' },
  { to: '/terms', key: 'terms', accent: 'var(--q-pink)' },
];

/** Studio credit and legal links, shared by every .q-show page. */
@Component({
  selector: 'app-studio-footer',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <footer class="site-footer">
      <div class="rule" aria-hidden="true">
        <i class="m1"></i><i class="m2"></i><i class="m3"></i>
      </div>
      <span class="credit">
        <span>{{ lang.t().madeBy }}</span>
        <img class="studio-mark" src="/brand/nightfall-wordmark.png" alt="Nightfall Studio" />
      </span>
      <nav class="legal">
        @for (link of links; track link.to) {
          <a class="tile" [routerLink]="link.to" routerLinkActive="on" [style.--accent]="link.accent">
            <span class="dot" aria-hidden="true"></span>{{ lang.t()[link.key] }}
          </a>
        }
      </nav>
      <div class="keys">
        <a class="tile" [href]="'mailto:' + contact">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <rect x="3" y="5.5" width="18" height="13" rx="2.5" fill="none" stroke="currentColor" stroke-width="2.4" />
            <path d="M4 7.5 L12 13 L20 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" />
          </svg>
          {{ contact }}
        </a>
        <button type="button" class="tile" (click)="toTop()">↑ {{ lang.t().backToTop }}</button>
      </div>
    </footer>
  `,
  styles: `
    :host {
      display: block;
    }
    .site-footer {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.9rem;
      margin-top: 1.25rem;
      padding-bottom: 0.5rem;
      font-size: 0.82rem;
      font-weight: 800;
      color: var(--q-muted);
    }
    .rule {
      position: relative;
      width: 100%;
      height: 3px;
      margin-bottom: 1.1rem;
      background: var(--ink);
      border-radius: 999px;
    }
    .rule i {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 34px;
      height: 12px;
      border: 3px solid var(--ink);
      border-radius: 999px;
    }
    .m1 {
      background: var(--q-cyan);
      transform: translate(calc(-50% - 42px), -50%) rotate(-20deg);
    }
    .m2 {
      background: var(--bulb);
      transform: translate(-50%, -50%) rotate(8deg);
    }
    .m3 {
      background: var(--q-pink);
      transform: translate(calc(-50% + 42px), -50%) rotate(-12deg);
    }
    .credit {
      display: inline-flex;
      align-items: center;
      gap: 0.55rem;
    }
    .studio-mark {
      height: 2.1rem;
      width: auto;
      display: block;
    }
    :host-context(html[data-theme='dark']) .studio-mark {
      /* The glyphs are --q-navy, which inverts to the cream of the original art. */
      filter: invert(1);
    }
    .legal,
    .keys {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.6rem;
    }
    .tile {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.4rem 0.8rem;
      border: 3px solid var(--ink);
      border-radius: 10px;
      background: var(--q-card);
      color: var(--q-navy);
      font: inherit;
      text-decoration: none;
      cursor: pointer;
      box-shadow: 0 3px 0 var(--ink);
      transition: transform 0.1s ease, box-shadow 0.1s ease, background 0.15s ease;
    }
    .tile:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 0 var(--ink);
    }
    .tile:active {
      transform: translateY(3px);
      box-shadow: 0 0 0 var(--ink);
    }
    .tile:focus-visible {
      outline: 3px solid var(--q-blue);
      outline-offset: 3px;
    }
    .dot {
      width: 10px;
      height: 10px;
      border: 2px solid var(--ink);
      border-radius: 50%;
      background: var(--accent);
    }
    .tile.on {
      background: var(--accent);
      color: #1a1530;
    }
    .tile.on .dot {
      background: var(--q-card);
    }
    @media (prefers-reduced-motion: reduce) {
      .tile {
        transition: none;
      }
    }
  `,
})
export class StudioFooter {
  readonly lang = inject(LanguageService);
  readonly contact = CONTACT;
  readonly links = LINKS;

  toTop(): void {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  }
}
