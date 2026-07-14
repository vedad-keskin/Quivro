import type { Question } from '../../types';

export const technologyMediumImage: Question[] = [
  {
    id: 'tech-med-img-001',
    type: 'image_mcq',
    category: 'technology',
    difficulty: 'medium',
    prompt: { en: 'Which technology concept does this heart-style icon best suggest?', bs: 'Koji tehnološki koncept ova ikona u obliku srca najbolje sugerira?' },
    options: [
      { en: 'Favorite or liked item', bs: 'Omiljena ili lajkovana stavka' },
      { en: 'Firewall rule', bs: 'Firewall pravilo' },
      { en: 'Disk formatting', bs: 'Formatiranje diska' },
      { en: 'Battery draining', bs: 'Pražnjenje baterije' },
    ],
    correctIndex: 0,
    image: 'questions/placeholders/pixel-heart.svg',
  },
];
