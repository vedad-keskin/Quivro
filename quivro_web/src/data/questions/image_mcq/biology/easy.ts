import type { Question } from '../../types';

export const biologyEasyImage: Question[] = [
  {
    id: 'bio-easy-img-001',
    type: 'image_mcq',
    category: 'biology',
    difficulty: 'easy',
    prompt: { en: 'Which animal is this silhouette?', bs: 'Koja je ovo životinja?' },
    options: [
      { en: 'Cat', bs: 'Mačka' },
      { en: 'Dog', bs: 'Pas' },
      { en: 'Bird', bs: 'Ptica' },
      { en: 'Fish', bs: 'Riba' },
    ],
    correctIndex: 2,
    image: 'questions/placeholders/bird.svg',
  },
];
