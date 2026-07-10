import type { Question } from '../../types';

export const biologyMediumImage: Question[] = [
  {
    id: 'bio-med-img-001',
    type: 'image_mcq',
    category: 'biology',
    difficulty: 'medium',
    prompt: { en: 'Which cell structure is suggested here?', bs: 'Koja ćelijska struktura je prikazana?' },
    options: [
      { en: 'Nucleus', bs: 'Jezgro' },
      { en: 'Cell wall', bs: 'Ćelijski zid' },
      { en: 'Mitochondria', bs: 'Mitohondrije' },
      { en: 'Vacuole', bs: 'Vakuola' },
    ],
    correctIndex: 0,
    image: 'questions/placeholders/cell.svg',
  },
];
