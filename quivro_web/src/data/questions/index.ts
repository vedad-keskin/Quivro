import { biologyEasy } from './biology/easy';
import { biologyHard } from './biology/hard';
import { biologyMedium } from './biology/medium';
import { gamingEasy } from './gaming/easy';
import { gamingHard } from './gaming/hard';
import { gamingMedium } from './gaming/medium';
import { geographyEasy } from './geography/easy';
import { geographyHard } from './geography/hard';
import { geographyMedium } from './geography/medium';
import { historyEasy } from './history/easy';
import { historyHard } from './history/hard';
import { historyMedium } from './history/medium';
import type { CategoryId, Difficulty, Question } from './types';
import { CATEGORIES, DIFFICULTIES } from './types';

const BANK: Record<CategoryId, Record<Difficulty, Question[]>> = {
  geography: { easy: geographyEasy, medium: geographyMedium, hard: geographyHard },
  biology: { easy: biologyEasy, medium: biologyMedium, hard: biologyHard },
  gaming: { easy: gamingEasy, medium: gamingMedium, hard: gamingHard },
  history: { easy: historyEasy, medium: historyMedium, hard: historyHard },
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

export { BANK, CATEGORIES, DIFFICULTIES };
