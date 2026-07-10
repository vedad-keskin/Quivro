import type { Question } from '../../types';

export const geographyMediumImage: Question[] = [
  {
    id: 'geo-med-img-001',
    type: 'image_mcq',
    category: 'geography',
    difficulty: 'medium',
    prompt: { en: 'Which city is famous for this skyline shape?', bs: 'Koji grad je poznat po ovom obliku horizonta?' },
    options: [
      { en: 'Dubai', bs: 'Dubai' },
      { en: 'New York', bs: 'New York' },
      { en: 'Tokyo', bs: 'Tokio' },
      { en: 'Sydney', bs: 'Sidnej' },
    ],
    correctIndex: 0,
    image: 'questions/placeholders/skyline.svg',
  },
];
