import type { Question } from '../../types';

export const gamingMediumImage: Question[] = [
  {
    id: 'game-med-img-001',
    type: 'image_mcq',
    category: 'gaming',
    difficulty: 'medium',
    prompt: { en: 'This pixel heart is iconic in which genre?', bs: 'Ovo piksel srce je ikonično u kojem žanru?' },
    options: [
      { en: 'Racing', bs: 'Trke' },
      { en: 'Platformers / retro', bs: 'Platformeri / retro' },
      { en: 'Sports', bs: 'Sport' },
      { en: 'Puzzle', bs: 'Slagalice' },
    ],
    correctIndex: 1,
    image: 'questions/placeholders/pixel-heart.svg',
  },
];
