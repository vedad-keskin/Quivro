import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../core/language.service';
import { SettingsChips } from '../../shared/settings-chips';
import { StudioFooter } from '../../shared/studio-footer';

const CONTACT = 'contact@quivro.org';

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
  imports: [RouterLink, SettingsChips, StudioFooter],
  template: `
    <div class="q-page q-show">
      <header class="doc-top">
        <a routerLink="/" class="back">← {{ lang.t().home }}</a>
        <app-settings-chips />
      </header>

      <article class="doc">
        <div class="stage spotlight doc-title">
          <h1 class="show-title">{{ copy().title }}</h1>
          <p class="updated">{{ copy().updated }}</p>
        </div>

        @for (section of copy().sections; track section.heading) {
          <section class="stage doc-section">
            <span class="step">{{ $index + 1 }}</span>
            <h2>{{ section.heading }}</h2>
            @for (paragraph of section.paragraphs; track paragraph) {
              <p>{{ paragraph }}</p>
            }
          </section>
        }
      </article>
      <app-studio-footer />
    </div>
  `,
})
export class TermsPage {
  readonly lang = inject(LanguageService);

  copy(): Copy {
    return this.lang.lang() === 'bs' ? bs : en;
  }
}
