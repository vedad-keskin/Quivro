import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../core/language.service';
import { SettingsChips } from '../../shared/settings-chips';

const CONTACT = 'nightfall.project.info@gmail.com';

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
        <p>{{ copy().intro }}</p>

        @for (section of copy().sections; track section.heading) {
          <section>
            <h2>{{ section.heading }}</h2>
            @for (paragraph of section.paragraphs; track paragraph) {
              <p>{{ paragraph }}</p>
            }
            @if (section.link) {
              <p><a [routerLink]="section.link.to">{{ section.link.label }}</a></p>
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
export class DeletionPage {
  readonly lang = inject(LanguageService);
  readonly contact = CONTACT;

  copy(): DeletionCopy {
    return this.lang.lang() === 'bs' ? bs : en;
  }
}
