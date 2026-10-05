import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../core/language.service';
import { SettingsChips } from '../../shared/settings-chips';
import { StudioFooter } from '../../shared/studio-footer';

const CONTACT = 'contact@quivro.org';

interface DeletionSection {
  heading: string;
  paragraphs: string[];
  link?: { to: string; label: string };
}

interface DeletionCopy {
  title: string;
  updated: string;
  intro: string;
  sections: DeletionSection[];
}

const en: DeletionCopy = {
  title: 'Data deletion',
  updated: 'Last updated 24 September 2026',
  intro: 'You can remove Quivro data yourself.',
  sections: [
    {
      heading: 'Game room',
      paragraphs: [
        'Nicknames, answers, and scores from a round stay so the host screen and the phones stay in sync. A room is removed within two days. Players do not create an account.',
      ],
    },
    {
      heading: 'This browser',
      paragraphs: [
        'Sign out from the account menu. Language, theme, your last room code, and round settings go away when you clear this site’s data in the browser.',
      ],
    },
    {
      heading: 'Account and purchase',
      paragraphs: [
        'To delete your account and the purchase record we hold, email ' +
          CONTACT +
          '. We never receive your card number. The payment provider may keep its own receipt.',
      ],
      link: { to: '/privacy', label: 'Privacy policy' },
    },
  ],
};

const bs: DeletionCopy = {
  title: 'Brisanje podataka',
  updated: 'Posljednje ažuriranje 24. septembar 2026.',
  intro: 'Quivro podatke možeš ukloniti sam.',
  sections: [
    {
      heading: 'Soba',
      paragraphs: [
        'Nadimci, odgovori i rezultati iz runde ostaju da ekran domaćina i telefoni ostanu usklađeni. Soba se uklanja u roku od dva dana. Igrači ne otvaraju račun.',
      ],
    },
    {
      heading: 'Ovaj preglednik',
      paragraphs: [
        'Odjavi se iz menija računa. Jezik, tema, kod zadnje sobe i postavke runde nestaju kad u pregledniku obrišeš podatke ove stranice.',
      ],
    },
    {
      heading: 'Račun i kupovina',
      paragraphs: [
        'Za brisanje računa i zapisa o kupovini koji mi čuvamo piši na ' +
          CONTACT +
          '. Broj kartice nikad ne dobijamo. Pružalac plaćanja može zadržati svoju potvrdu.',
      ],
      link: { to: '/privacy', label: 'Politika privatnosti' },
    },
  ],
};

@Component({
  selector: 'app-deletion',
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
          <p>{{ copy().intro }}</p>
          <p class="updated">{{ copy().updated }}</p>
        </div>

        @for (section of copy().sections; track section.heading) {
          <section class="stage doc-section">
            <span class="step">{{ $index + 1 }}</span>
            <h2>{{ section.heading }}</h2>
            @for (paragraph of section.paragraphs; track paragraph) {
              <p>{{ paragraph }}</p>
            }
            @if (section.link) {
              <a class="key-btn" [routerLink]="section.link.to">{{ section.link.label }} →</a>
            }
          </section>
        }
      </article>
      <app-studio-footer />
    </div>
  `,
})
export class DeletionPage {
  readonly lang = inject(LanguageService);

  copy(): DeletionCopy {
    return this.lang.lang() === 'bs' ? bs : en;
  }
}
