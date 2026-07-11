import type { Question } from '../../types';

export const famousEasyImage: Question[] = [
  {
    id: 'fam-easy-img-001',
    type: 'image_mcq',
    category: 'famous',
    difficulty: 'easy',
    prompt: {
      en: 'This crown icon is most associated with…',
      bs: 'Ova ikona krune najčešće je povezana s…',
    },
    options: [
      { en: 'Royalty', bs: 'Kraljevskom titulom' },
      { en: 'Chefs', bs: 'Kuharima' },
      { en: 'Athletes', bs: 'Sportistima' },
      { en: 'Scientists', bs: 'Naučnicima' },
    ],
    correctIndex: 0,
    image: 'questions/placeholders/crown.svg',
  },
];
