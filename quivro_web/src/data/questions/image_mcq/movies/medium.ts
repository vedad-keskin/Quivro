import type { Question } from '../../types';

export const moviesMediumImage: Question[] = [
  {
    id: 'movie-med-img-001',
    type: 'image_mcq',
    category: 'movies',
    difficulty: 'medium',
    prompt: { en: 'This icon best represents which entertainment idea?', bs: 'Ova ikona najbolje predstavlja koju zabavnu ideju?' },
    options: [
      { en: 'Awards / trophies (Oscars, Emmys)', bs: 'Nagrade / trofeje (Oscari, Emmyji)' },
      { en: 'Streaming lag', bs: 'Lag pri streamingu' },
      { en: 'Closed captions off', bs: 'Isključene titlove' },
      { en: 'Camera battery empty', bs: 'Praznu bateriju kamere' },
    ],
    correctIndex: 0,
    image: 'questions/placeholders/trophy.svg',
  },
];
