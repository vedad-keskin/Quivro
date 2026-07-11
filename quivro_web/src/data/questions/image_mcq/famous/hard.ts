import type { Question } from '../../types';

export const famousHardImage: Question[] = [
  {
    id: 'fam-hard-img-001',
    type: 'image_mcq',
    category: 'famous',
    difficulty: 'hard',
    prompt: {
      en: 'This tower icon is most associated with…',
      bs: 'Ova ikona tornja najčešće je povezana s…',
    },
    options: [
      { en: 'Iconic landmarks', bs: 'Ikoničnim znamenitostima' },
      { en: 'Cooking shows', bs: 'Kulinarskim emisijama' },
      { en: 'Board games', bs: 'Društvenim igrama' },
      { en: 'Fashion weeks', bs: 'Modnim sedmicama' },
    ],
    correctIndex: 0,
    image: 'questions/placeholders/tower.svg',
  },
];
