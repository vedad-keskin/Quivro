import { Component, inject } from '@angular/core';
import { LanguageService } from '../core/language.service';

/** Studio credit. Shared so home and create-round stay in sync. */
@Component({
  selector: 'app-studio-footer',
  imports: [],
  template: `
    <footer class="site-footer">
      <span>{{ lang.t().madeBy }}</span>
      <img class="studio-mark" src="/brand/nightfall-wordmark.png" alt="Nightfall Studio" />
    </footer>
  `,
  styles: `
    :host {
      display: block;
    }
    .site-footer {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--q-muted);
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
