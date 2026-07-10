import type { Question } from '../../types';

export const geographyHardImage: Question[] = [
  {
    id: 'geo-hard-img-001',
    type: 'image_mcq',
    category: 'geography',
    difficulty: 'hard',
    prompt: { en: 'Which mountain range does this silhouette suggest?', bs: 'Koji planinski lanac podsjeća na ovu siluetu?' },
    options: [
      { en: 'Alps', bs: 'Alpi' },
      { en: 'Andes', bs: 'Andi' },
      { en: 'Himalayas', bs: 'Himalaji' },
      { en: 'Rockies', bs: 'Stjenovite planine' },
    ],
    correctIndex: 2,
    image: 'questions/placeholders/mountains.svg',
  },
];
