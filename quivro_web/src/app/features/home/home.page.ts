import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../core/language.service';
import { SettingsChips } from '../../shared/settings-chips';
import { StudioFooter } from '../../shared/studio-footer';

@Component({
  selector: 'app-home',
  imports: [RouterLink, SettingsChips, StudioFooter],
  template: `
    <div class="q-page home">
      <header>
        <app-settings-chips />
      </header>

      <section class="hero">
        <div class="brand">
          <img class="logo" src="/logo/logo.png" alt="Quivro" />
          <div class="q-brand-line"></div>
        </div>
        <p class="tagline">{{ lang.t().tagline }}</p>

        <div class="actions">
          <a routerLink="/create" class="q-btn q-btn-outline">{{ lang.t().createRound }}</a>
        </div>
      </section>

      <app-studio-footer />
    </div>
  `,
  styles: `
    .home {
      display: grid;
      /* Header, hero, footer. The 1fr row lets the hero absorb the slack so the
         footer stays on the bottom edge instead of below the fold. */
      grid-template-rows: auto 1fr auto;
      min-height: calc(100dvh - 2.5rem);
      gap: 1rem;
    }
    header {
      display: flex;
      justify-content: flex-end;
    }
    .hero {
      display: grid;
      place-content: center;
      justify-items: center;
      text-align: center;
      gap: 1.1rem;
    }
    .brand {
      display: grid;
      justify-items: center;
      gap: 0;
    }
    .logo {
      width: min(420px, 78vw);
      margin-top: 0.25rem;
      display: block;
      transition: filter 0.3s ease;
    }
    :host-context(html[data-theme='dark']) .logo {
      /* Dark wordmark in the asset — invert + hue restore keeps the Q gradient readable. */
      filter: invert(1) hue-rotate(180deg) brightness(1.08) saturate(1.05);
    }
    .brand .q-brand-line {
      margin-top: 0;
    }
    .tagline {
      margin: 0;
      font-size: clamp(1.05rem, 2vw, 1.3rem);
      color: var(--q-muted);
      font-weight: 700;
      max-width: 26rem;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.85rem;
      justify-content: center;
      align-items: center;
      margin-top: 0.75rem;
    }
  `,
})
export class HomePage {
  readonly lang = inject(LanguageService);
}
