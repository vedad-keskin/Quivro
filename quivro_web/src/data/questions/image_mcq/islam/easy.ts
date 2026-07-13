import type { Question } from '../../types';

export const islamEasyImage: Question[] = [
  {
    id: 'islam-easy-img-001',
    type: 'image_mcq',
    category: 'islam',
    difficulty: 'easy',
    prompt: {
      en: 'This scroll icon is most associated with…',
      bs: 'Ova ikona svitka najčešće je povezana s…',
    },
    options: [
      { en: 'Revealed scripture', bs: 'Objavljenim svetim pismom' },
      { en: 'Sports trophies', bs: 'Sportskim trofejima' },
      { en: 'Video games', bs: 'Video igrama' },
      { en: 'Weather maps', bs: 'Vremenskim kartama' },
    ],
    correctIndex: 0,
    image: 'questions/placeholders/scroll.svg',
  },
];
