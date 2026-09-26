import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../core/language.service';
import { SettingsChips } from '../../shared/settings-chips';

const CONTACT = 'nightfall.project.info@gmail.com';

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
export class AppPrivacyPage {
  readonly lang = inject(LanguageService);
  readonly contact = CONTACT;

  copy(): PrivacyCopy {
    return this.lang.lang() === 'bs' ? bs : en;
  }
}
