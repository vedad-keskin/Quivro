import type { Question } from '../../types';

export const geographyEasyImage: Question[] = [
  {
    id: 'geo-easy-img-001',
    type: 'image_mcq',
    category: 'geography',
    difficulty: 'easy',
    prompt: { en: 'Which landmark is this?', bs: 'Koji je ovo spomenik?' },
    options: [
      { en: 'Eiffel Tower', bs: 'Ajfelov toranj' },
      { en: 'Big Ben', bs: 'Big Ben' },
      { en: 'Statue of Liberty', bs: 'Kip slobode' },
      { en: 'Colosseum', bs: 'Koloseum' },
    ],
    correctIndex: 0,
    image: 'questions/placeholders/tower.svg',
  },
];
