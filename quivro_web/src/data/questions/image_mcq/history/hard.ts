import type { Question } from '../../types';

export const historyHardImage: Question[] = [
  {
    id: 'hist-hard-img-001',
    type: 'image_mcq',
    category: 'history',
    difficulty: 'hard',
    prompt: { en: 'This scroll icon best fits which historical theme?', bs: 'Ova ikona svitka najbolje odgovara kojoj historijskoj temi?' },
    options: [
      { en: 'Laws / documents', bs: 'Zakoni / dokumenti' },
      { en: 'Naval battles', bs: 'Pomorske bitke' },
      { en: 'Agriculture', bs: 'Poljoprivreda' },
      { en: 'Fashion', bs: 'Moda' },
    ],
    correctIndex: 0,
    image: 'questions/placeholders/scroll.svg',
  },
];
