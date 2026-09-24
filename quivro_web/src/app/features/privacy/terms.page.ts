import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../core/language.service';
import { SettingsChips } from '../../shared/settings-chips';

const CONTACT = 'nightfall.project.info@gmail.com';

interface Section {
  heading: string;
  paragraphs: string[];
}

interface Copy {
  title: string;
  updated: string;
  sections: Section[];
}

const en: Copy = {
  title: 'Terms',
  updated: 'Last updated 24 September 2026',
  sections: [
    {
      heading: 'The game',
      paragraphs: [
        'Quivro is a party quiz made by Nightfall Studio. A host starts a round on this website. Players join with a code on their phones.',
      ],
    },
    {
      heading: 'Playing for free',
      paragraphs: [
        'Free play needs no account. Players do not create an account. They join with a nickname they choose.',
      ],
    },
    {
      heading: 'Quivro Pro',
      paragraphs: [
        'Quivro Pro is a one-time purchase tied to the Google account you sign in with. Sign-in is optional until you buy. Our payment provider takes the payment. Quivro never receives your card number.',
      ],
    },
    {
      heading: 'Who runs it',
      paragraphs: [
        'Nightfall Studio runs this service. Questions about these terms go to ' + CONTACT + '.',
      ],
    },
  ],
};

const bs: Copy = {
  title: 'Uslovi',
  updated: 'Posljednje ažuriranje 24. septembar 2026.',
  sections: [
    {
      heading: 'Igra',
      paragraphs: [
        'Quivro je kviz za ekipu koji pravi Nightfall Studio. Domaćin pokreće rundu na ovoj stranici. Igrači ulaze kodom na telefonu.',
      ],
    },
    {
      heading: 'Besplatna igra',
      paragraphs: [
        'Besplatna igra ne traži račun. Igrači ne otvaraju račun. Ulaze nadimkom koji sami upišu.',
      ],
    },
    {
      heading: 'Quivro Pro',
      paragraphs: [
        'Quivro Pro je jednokratna kupovina vezana za Google račun s kojim se prijaviš. Prijava nije obavezna dok ne kupiš. Naš pružalac plaćanja prima uplatu. Quivro nikad ne dobija broj kartice.',
      ],
    },
    {
      heading: 'Ko ovo vodi',
      paragraphs: [
        'Nightfall Studio vodi ovu uslugu. Pitanja o ovim uslovima šalji na ' + CONTACT + '.',
      ],
    },
  ],
};

@Component({
  selector: 'app-terms',
  imports: [RouterLink, SettingsChips],
  template: `
    <div class="q-page">
      <header class="top">
        <a routerLink="/" class="q-btn q-btn-ghost">← {{ lang.t().home }}</a>
        <app-settings-chips />
      </header>

      <article>
        <h1>{{ copy().title }}</h1>
        <p class="updated">{{ copy().updated }}</p>

        @for (section of copy().sections; track section.heading) {
          <section>
            <h2>{{ section.heading }}</h2>
            @for (paragraph of section.paragraphs; track paragraph) {
              <p>{{ paragraph }}</p>
            }
          </section>
        }

        <p class="contact">
          Nightfall Studio<br />
          <a [href]="'mailto:' + contact">{{ contact }}</a>
        </p>
      </article>
    </div>
  `,
  styles: `
    .top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    article {
      max-width: 40rem;
      margin: 0 auto 2rem;
    }
    h1 {
      margin: 0;
      font-size: clamp(1.8rem, 4vw, 2.4rem);
    }
    h2 {
      margin: 1.6rem 0 0.4rem;
      font-size: 1.15rem;
    }
    p {
      margin: 0.45rem 0 0;
      line-height: 1.55;
      color: var(--q-muted);
    }
    .updated {
      margin-top: 0.35rem;
    }
    .contact {
      margin-top: 2rem;
      color: var(--q-navy);
      font-weight: 700;
    }
    article a {
      color: var(--q-navy);
      font-weight: 700;
      text-decoration: underline;
      text-underline-offset: 3px;
    }
  `,
})
export class TermsPage {
  readonly lang = inject(LanguageService);
  readonly contact = CONTACT;

  copy(): Copy {
    return this.lang.lang() === 'bs' ? bs : en;
  }
}
