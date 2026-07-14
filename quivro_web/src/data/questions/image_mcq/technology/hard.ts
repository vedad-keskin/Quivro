import type { Question } from '../../types';

export const technologyHardImage: Question[] = [
  {
    id: 'tech-hard-img-001',
    type: 'image_mcq',
    category: 'technology',
    difficulty: 'hard',
    prompt: { en: 'Which achievement-style milestone does this trophy icon typically represent in software products?', bs: 'Koju vrstu prekretnice ova ikona trofeja tipično označava u softverskim proizvodima?' },
    options: [
      { en: 'Unlocking an achievement or badge', bs: 'Otključavanje achievementa ili bedža' },
      { en: 'A network outage alert', bs: 'Upozorenje o prekidu mreže' },
      { en: 'A factory reset confirmation', bs: 'Potvrdu factory reseta' },
      { en: 'A cache-clearing error', bs: 'Grešku pri čišćenju keša' },
    ],
    correctIndex: 0,
    image: 'questions/placeholders/trophy.svg',
  },
];
