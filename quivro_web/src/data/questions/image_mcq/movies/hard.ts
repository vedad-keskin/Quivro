import type { Question } from '../../types';

export const moviesHardImage: Question[] = [
  {
    id: 'movie-hard-img-001',
    type: 'image_mcq',
    category: 'movies',
    difficulty: 'hard',
    prompt: { en: 'In film & TV production, this kind of document is closest to a…', bs: 'U filmskoj i TV produkciji, ovakav dokument je najbliži…' },
    options: [
      { en: 'Script / screenplay', bs: 'Scenariju' },
      { en: 'Box-office chart', bs: 'Box-office tabeli' },
      { en: 'Trailer runtime', bs: 'Trajanju trailera' },
      { en: 'Seat map', bs: 'Mapi sjedišta' },
    ],
    correctIndex: 0,
    image: 'questions/placeholders/scroll.svg',
  },
];
