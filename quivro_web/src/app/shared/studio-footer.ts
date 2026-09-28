import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../core/language.service';

const CONTACT = 'contact@quivro.org';

/** Studio credit. Shared so home and create-round stay in sync. */
@Component({
  selector: 'app-studio-footer',
  imports: [RouterLink],
  template: `
    <footer class="site-footer">
      <span class="credit">
        <span>{{ lang.t().madeBy }}</span>
        <img class="studio-mark" src="/brand/nightfall-wordmark.png" alt="Nightfall Studio" />
      </span>
      <nav class="legal">
        <a routerLink="/privacy">{{ lang.t().privacy }}</a>
        <a routerLink="/data-deletion">{{ lang.t().dataDeletion }}</a>
        <a routerLink="/terms">{{ lang.t().terms }}</a>
      </nav>
      <a class="mail" [href]="'mailto:' + contact">{{ contact }}</a>
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
      gap: 0.7rem;
      margin-top: 0.5rem;
      padding-top: 1.1rem;
      padding-bottom: 0;
      border-top: 1px solid var(--q-border);
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--q-muted);
    }
    .legal {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 0.35rem 1.15rem;
    }
    .legal a,
    .mail {
      color: inherit;
      text-decoration: none;
    }
    .legal a:hover,
    .mail:hover {
      color: var(--q-navy);
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
  `,
})
export class StudioFooter {
  readonly lang = inject(LanguageService);
  readonly contact = CONTACT;
}
