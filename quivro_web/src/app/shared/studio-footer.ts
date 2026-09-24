import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../core/language.service';

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
        <span class="dot" aria-hidden="true">·</span>
        <a routerLink="/data-deletion">{{ lang.t().dataDeletion }}</a>
      </nav>
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
      gap: 0.85rem;
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--q-muted);
    }
    .legal {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 0.45rem 0.55rem;
    }
    .legal a {
      color: inherit;
      text-decoration: none;
      text-underline-offset: 3px;
    }
    .legal a:hover {
      text-decoration: underline;
    }
    .credit {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
    .studio-mark {
      height: 1.85rem;
      width: auto;
      display: block;
      opacity: 0.78;
    }
    :host-context(html[data-theme='dark']) .studio-mark {
      /* The glyphs are --q-navy, which inverts to the cream of the original art. */
      filter: invert(1);
    }
  `,
})
export class StudioFooter {
  readonly lang = inject(LanguageService);
}
