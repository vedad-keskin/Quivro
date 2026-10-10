import type { LocalizedString } from '../../../i18n/types';

export interface NewsCard {
  image?: string;
  accent: string;
  title: LocalizedString;
  body: LocalizedString;
}

export interface NewsDrop {
  id: string;
  cards: NewsCard[];
}

/** Newest first. A new announcement is one object at the top, with a new id. */
export const NEWS: NewsDrop[] = [
  {
    id: 'lock-up',
    cards: [
      { image: '/room-icons/lock_up.png', accent: 'var(--q-pink)', title: { en: 'Lock Up is here', bs: 'Lock Up je stigao' }, body: { en: 'Know the answer and want an advantage? Lock yourself and a random opponent out of the question. You stay safe while your opponent loses the chance to answer.', bs: 'Znaš odgovor i želiš prednost? Zaključaj sebe i nasumičnog protivnika iz pitanja. Ti si siguran, dok protivnik gubi mogućnost odgovaranja.' } },
    ],
  },
  {
    id: 'second-chance',
    cards: [
      { image: '/room-icons/second_chance.png', accent: 'var(--q-orange)', title: { en: 'Second Chance is here', bs: 'Second Chance je stigao' }, body: { en: 'Know the answer but not completely sure? Take a shot without risking the question. Pick an answer first. if it is wrong, you get one more chance to choose.', bs: 'Znaš odgovor, ali nisi potpuno siguran? Probaj bez straha da ćeš izgubiti bodove. Odaberi odgovor, ako nije tačan, dobijaš još jednu šansu za izbor.' } },
    ],
  },
  {
    id: 'fifty-fifty',
    cards: [
      { image: '/room-icons/fifty_fifty.png', accent: 'var(--q-cyan)', title: { en: '50/50 is here', bs: '50/50 je stigao' }, body: { en: 'Not sure which answer is right? Narrow down your choices and improve your odds. Two wrong answers disappear, leaving you with two answers to choose from.', bs: 'Nisi siguran koji je odgovor tačan? Suzi izbor i povećaj svoje šanse. Dva pogrešna odgovora nestaju, ostavljajući ti dva odgovora za izbor.' } },
    ],
  },
];

const SEEN_KEY = 'quivro.news.seen';

export function unread<T extends { id: string }>(
  catalog: readonly T[],
  seenIds: readonly string[],
): T[] {
  const seen = new Set(seenIds);
  return catalog.filter((drop) => !seen.has(drop.id));
}

export function readSeen(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]');
    return Array.isArray(raw) ? raw.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

/** Remember these drop ids in this browser. Returns the full seen list. */
export function markSeen(ids: readonly string[]): string[] {
  const next = [...new Set([...readSeen(), ...ids])];
  localStorage.setItem(SEEN_KEY, JSON.stringify(next));
  return next;
}
