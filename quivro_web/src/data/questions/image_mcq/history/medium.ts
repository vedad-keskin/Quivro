import type { Question } from '../../types';

export const historyMediumImage: Question[] = [
  {
    id: 'hist-med-img-001',
    type: 'image_mcq',
    category: 'history',
    difficulty: 'medium',
    prompt: { en: 'This crown icon is linked to which idea?', bs: 'Ova ikona krune je povezana sa kojom idejom?' },
    options: [
      { en: 'Monarchy / royalty', bs: 'Monarhija / kraljevstvo' },
      { en: 'Democracy', bs: 'Demokratija' },
      { en: 'Trade unions', bs: 'Sindikati' },
      { en: 'Space travel', bs: 'Svemirska putovanja' },
    ],
    correctIndex: 0,
    image: 'questions/placeholders/crown.svg',
  },
];
