import { biologyEasy } from './mcq/biology/easy';
import { biologyHard } from './mcq/biology/hard';
import { biologyMedium } from './mcq/biology/medium';
import { gamingEasy } from './mcq/gaming/easy';
import { gamingHard } from './mcq/gaming/hard';
import { gamingMedium } from './mcq/gaming/medium';
import { geographyEasy } from './mcq/geography/easy';
import { geographyHard } from './mcq/geography/hard';
import { geographyMedium } from './mcq/geography/medium';
import { historyEasy } from './mcq/history/easy';
import { historyHard } from './mcq/history/hard';
import { historyMedium } from './mcq/history/medium';
import { biologyEasyImage } from './image_mcq/biology/easy';
import { biologyHardImage } from './image_mcq/biology/hard';
import { biologyMediumImage } from './image_mcq/biology/medium';
import { gamingEasyImage } from './image_mcq/gaming/easy';
import { gamingHardImage } from './image_mcq/gaming/hard';
import { gamingMediumImage } from './image_mcq/gaming/medium';
import { geographyEasyImage } from './image_mcq/geography/easy';
import { geographyHardImage } from './image_mcq/geography/hard';
import { geographyMediumImage } from './image_mcq/geography/medium';
import { historyEasyImage } from './image_mcq/history/easy';
import { historyHardImage } from './image_mcq/history/hard';
import { historyMediumImage } from './image_mcq/history/medium';
import type { CategoryId, Difficulty, Question } from './types';
import { CATEGORIES, DIFFICULTIES } from './types';

const MCQ_BANK: Record<CategoryId, Record<Difficulty, Question[]>> = {
  geography: { easy: geographyEasy, medium: geographyMedium, hard: geographyHard },
  biology: { easy: biologyEasy, medium: biologyMedium, hard: biologyHard },
  gaming: { easy: gamingEasy, medium: gamingMedium, hard: gamingHard },
  history: { easy: historyEasy, medium: historyMedium, hard: historyHard },
};

const IMAGE_MCQ_BANK: Record<CategoryId, Record<Difficulty, Question[]>> = {
  geography: {
    easy: geographyEasyImage,
    medium: geographyMediumImage,
    hard: geographyHardImage,
  },
  biology: {
    easy: biologyEasyImage,
    medium: biologyMediumImage,
    hard: biologyHardImage,
  },
  gaming: {
    easy: gamingEasyImage,
    medium: gamingMediumImage,
    hard: gamingHardImage,
  },
  history: {
    easy: historyEasyImage,
    medium: historyMediumImage,
    hard: historyHardImage,
  },
};

const BANK: Record<CategoryId, Record<Difficulty, Question[]>> = {
  geography: {
    easy: [...MCQ_BANK.geography.easy, ...IMAGE_MCQ_BANK.geography.easy],
    medium: [...MCQ_BANK.geography.medium, ...IMAGE_MCQ_BANK.geography.medium],
    hard: [...MCQ_BANK.geography.hard, ...IMAGE_MCQ_BANK.geography.hard],
  },
  biology: {
    easy: [...MCQ_BANK.biology.easy, ...IMAGE_MCQ_BANK.biology.easy],
    medium: [...MCQ_BANK.biology.medium, ...IMAGE_MCQ_BANK.biology.medium],
    hard: [...MCQ_BANK.biology.hard, ...IMAGE_MCQ_BANK.biology.hard],
  },
  gaming: {
    easy: [...MCQ_BANK.gaming.easy, ...IMAGE_MCQ_BANK.gaming.easy],
    medium: [...MCQ_BANK.gaming.medium, ...IMAGE_MCQ_BANK.gaming.medium],
    hard: [...MCQ_BANK.gaming.hard, ...IMAGE_MCQ_BANK.gaming.hard],
  },
  history: {
    easy: [...MCQ_BANK.history.easy, ...IMAGE_MCQ_BANK.history.easy],
    medium: [...MCQ_BANK.history.medium, ...IMAGE_MCQ_BANK.history.medium],
    hard: [...MCQ_BANK.history.hard, ...IMAGE_MCQ_BANK.history.hard],
  },
};

export function getSeedQuestions(): Question[] {
  return CATEGORIES.flatMap((category) =>
    DIFFICULTIES.flatMap((difficulty) => BANK[category][difficulty]),
  );
}

export function getQuestionsFor(
  category: CategoryId,
  difficulty: Difficulty,
): Question[] {
  return [...BANK[category][difficulty]];
}

export { BANK, CATEGORIES, DIFFICULTIES, IMAGE_MCQ_BANK, MCQ_BANK };
