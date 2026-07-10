import type { Question } from '../../types';

export const gamingEasyImage: Question[] = [
  {
    id: 'game-easy-img-001',
    type: 'image_mcq',
    category: 'gaming',
    difficulty: 'easy',
    prompt: { en: 'Which classic controller shape is this?', bs: 'Koji klasični kontroler je ovo?' },
    options: [
      { en: 'Game controller', bs: 'Gejmerski kontroler' },
      { en: 'Keyboard', bs: 'Tastatura' },
      { en: 'Mouse', bs: 'Miš' },
      { en: 'Headset', bs: 'Slušalice' },
    ],
    correctIndex: 0,
    image: 'questions/placeholders/controller.svg',
  },
];
