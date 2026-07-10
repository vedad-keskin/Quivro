import type { Question } from '../../types';

export const moviesEasyImage: Question[] = [
  {
    id: 'movie-easy-img-001',
    type: 'image_mcq',
    category: 'movies',
    difficulty: 'easy',
    prompt: { en: 'This kind of symbol is most often linked to…', bs: 'Ovakav simbol se najčešće povezuje sa…' },
    options: [
      { en: 'Film awards / royalty on screen', bs: 'Filmskim nagradama / kraljevstvom na ekranu' },
      { en: 'Sports timeouts', bs: 'Sportskim tajmautima' },
      { en: 'Cooking shows only', bs: 'Samo kulinarskim emisijama' },
      { en: 'Weather forecasts', bs: 'Vremenskom prognozom' },
    ],
    correctIndex: 0,
    image: 'questions/placeholders/crown.svg',
  },
];
