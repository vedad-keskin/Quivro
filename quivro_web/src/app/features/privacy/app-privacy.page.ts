import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../core/language.service';
import { SettingsChips } from '../../shared/settings-chips';
import { StudioFooter } from '../../shared/studio-footer';

interface PrivacySection {
  heading: string;
  paragraphs: string[];
}

interface PrivacyCopy {
  title: string;
  updated: string;
  sections: PrivacySection[];
}

const en: PrivacyCopy = {
  title: 'Privacy policy',
  updated: 'Last updated 26 September 2026',
  sections: [
    {
      heading: 'Who this covers',
      paragraphs: [
        'Quivro is a trivia party game made by Nightfall Studio. This page describes the Quivro phone app only.',
      ],
    },
    {
      heading: 'What the app does',
      paragraphs: [
        'The app joins a room with a code. You choose a nickname and an avatar. It does not offer sign-in, and it does not sell anything. Players do not create an account.',
      ],
    },
    {
      heading: 'On this phone',
      paragraphs: [
        'The nickname, avatar, language, and light or dark theme stay on the phone. They are not sent to an advertising network.',
      ],
    },
    {
      heading: 'While a game runs',
      paragraphs: [
        'The room code, nickname, answers, and scores are stored so the host screen and the phones stay in sync. That information is for the game. A room is removed within two days.',
      ],
    },
    {
      heading: 'How to delete it',
      paragraphs: [
        'Uninstall the app, or clear its data, to remove the nickname, avatar, language, and theme from the phone. A room is removed within two days.',
      ],
    },
  ],
};

const bs: PrivacyCopy = {
  title: 'Politika privatnosti',
  updated: 'Posljednje ažuriranje 26. septembar 2026.',
  sections: [
    {
      heading: 'Na koga se odnosi',
      paragraphs: [
        'Quivro je kviz igra koju pravi Nightfall Studio. Ova stranica opisuje samo aplikaciju Quivro za telefon.',
      ],
    },
    {
      heading: 'Šta aplikacija radi',
      paragraphs: [
        'Aplikacija ulazi u sobu pomoću koda. Biraš nadimak i avatar. Nema prijave i ništa ne prodaje. Igrači ne otvaraju račun.',
      ],
    },
    {
      heading: 'Na ovom telefonu',
      paragraphs: [
        'Nadimak, avatar, jezik i svijetla ili tamna tema ostaju na telefonu. Ne šalju se oglasnoj mreži.',
      ],
    },
    {
      heading: 'Dok igra traje',
      paragraphs: [
        'Kod sobe, nadimak, odgovori i rezultati se čuvaju da ekran domaćina i telefoni ostanu usklađeni. Ti podaci služe igri. Soba se uklanja u roku od dva dana.',
      ],
    },
    {
      heading: 'Kako se briše',
      paragraphs: [
        'Deinstaliraj aplikaciju ili obriši njene podatke da se nadimak, avatar, jezik i tema uklone s telefona. Soba se uklanja u roku od dva dana.',
      ],
    },
  ],
};

@Component({
  selector: 'app-privacy-app',
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
export class AppPrivacyPage {
  readonly lang = inject(LanguageService);

  copy(): PrivacyCopy {
    return this.lang.lang() === 'bs' ? bs : en;
  }
}
