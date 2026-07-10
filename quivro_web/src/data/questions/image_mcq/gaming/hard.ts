import type { Question } from '../../types';

export const gamingHardImage: Question[] = [
  {
    id: 'game-hard-img-001',
    type: 'image_mcq',
    category: 'gaming',
    difficulty: 'hard',
    prompt: { en: 'This icon best represents which gaming concept?', bs: 'Ova ikona najbolje predstavlja koji gejmerski koncept?' },
    options: [
      { en: 'Achievement / trophy', bs: 'Achievement / trofej' },
      { en: 'Lag', bs: 'Lag' },
      { en: 'Chat mute', bs: 'Mute chata' },
      { en: 'Server crash', bs: 'Pad servera' },
    ],
    correctIndex: 0,
    image: 'questions/placeholders/trophy.svg',
  },
];
