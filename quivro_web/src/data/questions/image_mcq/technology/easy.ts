import type { Question } from '../../types';

export const technologyEasyImage: Question[] = [
  {
    id: 'tech-easy-img-001',
    type: 'image_mcq',
    category: 'technology',
    difficulty: 'easy',
    prompt: { en: 'Which input device is shown in this silhouette?', bs: 'Koji ulazni uređaj prikazuje ovaj siluet?' },
    options: [
      { en: 'Computer mouse', bs: 'Računarski miš' },
      { en: 'USB flash drive', bs: 'USB fleš memorija' },
      { en: 'Webcam', bs: 'Web kamera' },
      { en: 'Ethernet switch', bs: 'Ethernet switch' },
    ],
    correctIndex: 0,
    image: 'questions/placeholders/controller.svg',
  },
];
