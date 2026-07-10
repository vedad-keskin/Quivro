import type { Question } from '../../types';

export const historyEasyImage: Question[] = [
  {
    id: 'hist-easy-img-001',
    type: 'image_mcq',
    category: 'history',
    difficulty: 'easy',
    prompt: { en: 'Which ancient structure does this suggest?', bs: 'Koju drevnu građevinu ovo podsjeća?' },
    options: [
      { en: 'Pyramid', bs: 'Piramida' },
      { en: 'Castle', bs: 'Dvorac' },
      { en: 'Bridge', bs: 'Most' },
      { en: 'Lighthouse', bs: 'Svjetionik' },
    ],
    correctIndex: 0,
    image: 'questions/placeholders/pyramid.svg',
  },
];
