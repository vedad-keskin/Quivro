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
  updated: 'Last updated 23 September 2026',
  sections: [
    {
      heading: 'Who this covers',
      paragraphs: [
        'Quivro is a trivia party game made by Nightfall Studio. This page describes the information the website at quivro.vercel.app handles, and why.',
      ],
    },
    {
      heading: 'Google account',
      paragraphs: [
        'Sign-in is optional until you buy Quivro Pro. When you choose Sign in with Google, Google shares your name, email address, and profile photo. Quivro uses them to recognize your account and to attach a purchase to it.',
        'Firebase Authentication, a Google service, stores that account and keeps you signed in on this browser.',
      ],
    },
    {
      heading: 'Purchases',
      paragraphs: [
        'Quivro Pro is a one-time purchase processed by Lemon Squeezy. Lemon Squeezy collects the payment details. Quivro never receives your card number.',
        'After a paid order we store your account id, email, order number, price, purchase date, and whether Pro is active. A refund turns Pro off. We keep that record so the purchase stays on your account.',
      ],
    },
    {
      heading: 'Games',
      paragraphs: [
        'A host creates a room. Players join with a code and a nickname they choose. While the game runs we store the room code, nicknames, answers, and scores in Firebase Realtime Database so the host screen and the phones stay in sync.',
        'That information is for the game. Players do not create an account. A room is deleted within two days.',
      ],
    },
    {
      heading: 'This browser',
      paragraphs: [
        'The site remembers a few choices on your device: language, light or dark theme, your last room code, round settings, and whether this browser already knows your account has Pro. Those stay in local storage. They are not sent to an advertising network.',
      ],
    },
    {
      heading: 'The phone app',
      paragraphs: [
        'The Quivro app only joins a room. It does not offer sign-in, and it does not sell anything.',
      ],
    },
    {
      heading: 'Other companies',
      paragraphs: [
        'Google handles sign-in and stores accounts, purchases, and live games through Firebase. Lemon Squeezy handles checkout and refunds. Vercel hosts this website. We do not sell your information.',
      ],
    },
    {
      heading: 'How long we keep it',
      paragraphs: [
        'The purchase record stays so Pro remains unlocked and so a refund can be applied. Game rooms are deleted within two days. You can sign out from the account menu. To ask us to delete your account and purchase record, email ' +
          CONTACT +
          '.',
      ],
    },
  ],
};

const bs: PrivacyCopy = {
  title: 'Politika privatnosti',
  updated: 'Posljednje ažuriranje 23. septembar 2026.',
  sections: [
    {
      heading: 'Na koga se odnosi',
      paragraphs: [
        'Quivro je kviz igra koju pravi Nightfall Studio. Ova stranica opisuje koje podatke stranica quivro.vercel.app obrađuje i zašto.',
      ],
    },
    {
      heading: 'Google račun',
      paragraphs: [
        'Prijava nije obavezna dok ne kupiš Quivro Pro. Kad odabereš prijavu putem Googlea, Google dijeli tvoje ime, email adresu i profilnu sliku. Quivro ih koristi da prepozna tvoj račun i da kupovinu veže za njega.',
        'Firebase Authentication, Googleova usluga, čuva taj račun i drži te prijavljenim u ovom pregledniku.',
      ],
    },
    {
      heading: 'Kupovine',
      paragraphs: [
        'Quivro Pro je jednokratna kupovina koju obrađuje Lemon Squeezy. Lemon Squeezy prima podatke o plaćanju. Quivro nikad ne dobija broj kartice.',
        'Nakon plaćene narudžbe čuvamo id računa, email, broj narudžbe, cijenu, datum kupovine i da li je Pro aktivan. Povrat novca gasi Pro. Taj zapis ostaje da kupovina ostane na tvom računu.',
      ],
    },
    {
      heading: 'Igre',
      paragraphs: [
        'Domaćin pravi sobu. Igrači ulaze kodom i nadimkom koji sami upišu. Dok igra traje čuvamo kod sobe, nadimke, odgovore i rezultate u Firebase Realtime Database da ekran domaćina i telefoni ostanu usklađeni.',
        'Ti podaci služe igri. Igrači ne otvaraju račun. Soba se briše u roku od dva dana.',
      ],
    },
    {
      heading: 'Ovaj preglednik',
      paragraphs: [
        'Stranica pamti nekoliko izbora na tvom uređaju: jezik, svijetlu ili tamnu temu, kod zadnje sobe, postavke runde i da li ovaj preglednik već zna da tvoj račun ima Pro. To ostaje u lokalnoj pohrani. Ne šalje se oglasnoj mreži.',
      ],
    },
    {
      heading: 'Aplikacija za telefon',
      paragraphs: [
        'Aplikacija Quivro samo ulazi u sobu. Nema prijave i ništa ne prodaje.',
      ],
    },
    {
      heading: 'Druge firme',
      paragraphs: [
        'Google obavlja prijavu i preko Firebasea čuva račune, kupovine i igre uživo. Lemon Squeezy obavlja naplatu i povrate. Vercel smješta ovu stranicu. Tvoje podatke ne prodajemo.',
      ],
    },
    {
      heading: 'Koliko dugo ih čuvamo',
      paragraphs: [
        'Zapis o kupovini ostaje da Pro ostane otključan i da se povrat može primijeniti. Sobe se brišu u roku od dva dana. Odjavu možeš napraviti iz menija računa. Za brisanje računa i zapisa o kupovini piši na ' +
          CONTACT +
          '.',
      ],
    },
  ],
};

@Component({
  selector: 'app-privacy',
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
    .contact a {
      color: inherit;
      text-decoration: underline;
      text-underline-offset: 3px;
    }
  `,
})
export class PrivacyPage {
  readonly lang = inject(LanguageService);
  readonly contact = CONTACT;

  copy(): PrivacyCopy {
    return this.lang.lang() === 'bs' ? bs : en;
  }
}
