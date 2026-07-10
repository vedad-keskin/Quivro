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
        <div class="brand">
          <h1>Quivro</h1>
          <div class="q-brand-line"></div>
        </div>
        <img class="logo" src="/logo/quivro.png" alt="" />
        <p class="tagline">{{ lang.t().tagline }}</p>

        <div class="actions">
          <a routerLink="/create" class="q-btn q-btn-outline">{{ lang.t().createRound }}</a>
          <a routerLink="/admin/questions" class="q-btn q-btn-outline admin">{{
            lang.t().addQuestions
          }}</a>
        </div>
      </section>
    </div>
  `,
  styles: `
    .home {
      display: grid;
      align-content: start;
      gap: 1rem;
    }
    header {
      display: flex;
      justify-content: flex-end;
    }
    .hero {
      min-height: calc(100dvh - 5rem);
      display: grid;
      place-content: center;
      justify-items: center;
      text-align: center;
      gap: 1.1rem;
    }
    .brand h1 {
      margin: 0;
      font-size: clamp(2.6rem, 6vw, 3.6rem);
      font-weight: 900;
    }
    .brand {
      display: grid;
      justify-items: center;
      gap: 0.15rem;
    }
    .logo {
      width: min(280px, 55vw);
      margin-top: 0.5rem;
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
      margin-top: 0.75rem;
    }
    .admin {
      border-color: var(--q-lime);
    }
  `,
})
export class HomePage {
  readonly lang = inject(LanguageService);
}
