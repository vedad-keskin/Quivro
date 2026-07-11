import type { Question } from '../../types';

export const famousMediumImage: Question[] = [
  {
    id: 'fam-med-img-001',
    type: 'image_mcq',
    category: 'famous',
    difficulty: 'medium',
    prompt: {
      en: 'This scroll icon is most associated with…',
      bs: 'Ova ikona svitka najčešće je povezana s…',
    },
    options: [
      { en: 'Video games', bs: 'Video igrama' },
      { en: 'Historic documents', bs: 'Historijskim dokumentima' },
      { en: 'Weather maps', bs: 'Vremenskim mapama' },
      { en: 'Sports trophies', bs: 'Sportskim trofejima' },
    ],
    correctIndex: 1,
    image: 'questions/placeholders/scroll.svg',
  },
];
