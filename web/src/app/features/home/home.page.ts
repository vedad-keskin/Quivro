import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../core/language.service';
import { LangToggle } from '../../shared/lang-toggle';

@Component({
  selector: 'app-home',
  imports: [RouterLink, LangToggle],
  template: `
    <div class="q-page home">
      <header>
        <app-lang-toggle />
      </header>

      <section class="hero">
        <img class="logo" src="/logo/quivro.png" alt="Quivro" />
        <p class="tagline">{{ lang.t().tagline }}</p>

        <div class="actions">
          <a routerLink="/create" class="q-btn q-btn-primary">{{ lang.t().createRound }}</a>
          <a routerLink="/admin/questions" class="q-btn q-btn-secondary">{{ lang.t().addQuestions }}</a>
          <a routerLink="/test" class="q-btn q-btn-secondary">{{ lang.t().testMode }}</a>
        </div>
      </section>
    </div>
  `,
  styles: `
    .home {
      display: grid;
      align-content: start;
      gap: 2rem;
    }
    header {
      display: flex;
      justify-content: flex-end;
    }
    .hero {
      min-height: calc(100dvh - 6rem);
      display: grid;
      place-content: center;
      justify-items: center;
      text-align: center;
      gap: 1.25rem;
      animation: rise 0.6s ease;
    }
    .logo {
      width: min(520px, 88vw);
      filter: drop-shadow(0 18px 40px rgba(47, 124, 246, 0.25));
    }
    .tagline {
      margin: 0;
      font-size: clamp(1.1rem, 2.4vw, 1.45rem);
      color: var(--q-muted);
      font-weight: 700;
      max-width: 28rem;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      justify-content: center;
      margin-top: 0.75rem;
    }
    @keyframes rise {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
  `,
})
export class HomePage {
  readonly lang = inject(LanguageService);
}
