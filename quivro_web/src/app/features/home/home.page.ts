import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { UiStrings } from '../../../i18n/en';
import { LanguageService } from '../../core/language.service';
import { SettingsChips } from '../../shared/settings-chips';
import { StudioFooter } from '../../shared/studio-footer';

@Component({
  selector: 'app-home',
  imports: [RouterLink, SettingsChips, StudioFooter],
  template: `
    <div class="q-page q-show home">
      <header>
        <app-settings-chips />
      </header>

      <section class="hero">
        <div class="stage spotlight">
          <span class="spark s1" aria-hidden="true"></span>
          <span class="spark s2" aria-hidden="true"></span>
          <span class="spark s3" aria-hidden="true"></span>
          <img class="logo wordmark" src="/logo/logo.png" alt="Quivro" />
          <p class="tagline">{{ lang.t().tagline }}</p>
        </div>

        <a routerLink="/create" class="go start">
          {{ lang.t().createRound }}
          <span class="go-arrow" aria-hidden="true">▶</span>
        </a>

        <section class="how">
          <h2>{{ lang.t().howItWorks }}</h2>
          <ol class="steps">
            @for (s of steps; track s.title; let i = $index) {
              <li class="stage step-card" [style.--accent]="s.accent">
                <span class="step" aria-hidden="true">{{ i + 1 }}</span>
                <strong>{{ lang.t()[s.title] }}</strong>
                <span>{{ lang.t()[s.body] }}</span>
              </li>
            }
          </ol>
        </section>
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
      gap: 1rem;
    }
    header {
      display: flex;
      justify-content: flex-end;
    }
    .hero {
      width: 100%;
      max-width: 820px;
      margin: 0 auto;
      display: grid;
      align-content: center;
      justify-items: center;
      gap: 2.4rem;
      text-align: center;
    }
    .spotlight {
      width: min(560px, 100%);
      display: grid;
      justify-items: center;
      padding: 3rem 1.5rem 3.6rem;
    }
    .logo {
      width: min(400px, 78vw);
    }
    .tagline {
      position: absolute;
      left: 50%;
      bottom: -1.3rem;
      margin: 0;
      padding: 0.55rem 1.1rem;
      width: max-content;
      max-width: 90%;
      border: 3px solid var(--ink);
      border-radius: 12px;
      background: var(--bulb);
      color: #1a1530;
      box-shadow: var(--hit);
      font-size: clamp(0.95rem, 2vw, 1.15rem);
      font-weight: 900;
      transform: translateX(-50%) rotate(-2deg);
    }
    .start {
      max-width: 420px;
      margin-top: 0.6rem;
    }
    .how {
      width: 100%;
      display: grid;
      gap: 1.6rem;
    }
    .how h2 {
      margin: 0;
      font-family: var(--display);
      font-weight: 400;
      font-size: 1.35rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--q-navy);
    }
    .steps {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 1.6rem;
    }
    .step-card {
      display: grid;
      gap: 0.3rem;
      align-content: start;
      padding-top: 1.4rem;
      text-align: left;
      background: color-mix(in srgb, var(--accent) 16%, var(--q-card));
      box-shadow: var(--hit);
      transform: rotate(-1deg);
    }
    .step-card:nth-child(even) {
      transform: rotate(1deg);
    }
    .step-card .step {
      background: var(--accent);
    }
    .step-card strong {
      font-family: var(--display);
      font-weight: 400;
      font-size: 1.15rem;
      color: var(--q-navy);
    }
    .step-card span:not(.step) {
      font-size: 0.85rem;
      font-weight: 700;
      line-height: 1.35;
      color: var(--q-muted);
    }
    @media (max-width: 720px) {
      .steps {
        grid-template-columns: 1fr;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .step-card,
      .step-card:nth-child(even) {
        transform: none;
      }
    }
  `,
})
export class HomePage {
  readonly lang = inject(LanguageService);
  readonly steps: { title: keyof UiStrings; body: keyof UiStrings; accent: string }[] = [
    { title: 'stepHostTitle', body: 'stepHostBody', accent: 'var(--q-cyan)' },
    { title: 'stepJoinTitle', body: 'stepJoinBody', accent: 'var(--q-orange)' },
    { title: 'stepPlayTitle', body: 'stepPlayBody', accent: 'var(--q-pink)' },
  ];
}
