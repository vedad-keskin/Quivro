import type { Question } from '../../types';

export const biologyHardImage: Question[] = [
  {
    id: 'bio-hard-img-001',
    type: 'image_mcq',
    category: 'biology',
    difficulty: 'hard',
    prompt: { en: 'Which organ system does this icon represent?', bs: 'Koji organski sistem predstavlja ova ikona?' },
    options: [
      { en: 'Nervous system', bs: 'Nervni sistem' },
      { en: 'Digestive system', bs: 'Digestivni sistem' },
      { en: 'Skeletal system', bs: 'Skeletni sistem' },
      { en: 'Respiratory system', bs: 'Respiratorni sistem' },
    ],
    correctIndex: 0,
    image: 'questions/placeholders/brain.svg',
  },
];
