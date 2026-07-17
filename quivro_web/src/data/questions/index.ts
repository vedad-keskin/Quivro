import { biologyEasy } from './mcq/biology/easy';
import { biologyHard } from './mcq/biology/hard';
import { biologyMedium } from './mcq/biology/medium';
import { technologyEasy } from './mcq/technology/easy';
import { technologyHard } from './mcq/technology/hard';
import { technologyMedium } from './mcq/technology/medium';
import { geographyEasy } from './mcq/geography/easy';
import { geographyHard } from './mcq/geography/hard';
import { geographyMedium } from './mcq/geography/medium';
import { historyEasy } from './mcq/history/easy';
import { historyHard } from './mcq/history/hard';
import { historyMedium } from './mcq/history/medium';
import { sportsEasy } from './mcq/sports/easy';
import { sportsHard } from './mcq/sports/hard';
import { sportsMedium } from './mcq/sports/medium';
import { moviesEasy } from './mcq/movies/easy';
import { moviesHard } from './mcq/movies/hard';
import { moviesMedium } from './mcq/movies/medium';
import { famousEasy } from './mcq/famous/easy';
import { famousHard } from './mcq/famous/hard';
import { famousMedium } from './mcq/famous/medium';
import { islamEasy } from './mcq/islam/easy';
import { islamHard } from './mcq/islam/hard';
import { islamMedium } from './mcq/islam/medium';
import { imageQuestions } from './image_mcq/questions';
import type { CategoryId, Difficulty, Question } from './types';
import { CATEGORIES, DIFFICULTIES } from './types';

type ContentCategoryId = Exclude<CategoryId, 'images'>;

const MCQ_BANK: Record<ContentCategoryId, Record<Difficulty, Question[]>> = {
  geography: { easy: geographyEasy, medium: geographyMedium, hard: geographyHard },
  biology: { easy: biologyEasy, medium: biologyMedium, hard: biologyHard },
  technology: { easy: technologyEasy, medium: technologyMedium, hard: technologyHard },
  history: { easy: historyEasy, medium: historyMedium, hard: historyHard },
  sports: { easy: sportsEasy, medium: sportsMedium, hard: sportsHard },
  movies: { easy: moviesEasy, medium: moviesMedium, hard: moviesHard },
  famous: { easy: famousEasy, medium: famousMedium, hard: famousHard },
  islam: { easy: islamEasy, medium: islamMedium, hard: islamHard },
};

/** Text MCQ bank only (image questions live in the flat pool). */
const BANK: Record<ContentCategoryId, Record<Difficulty, Question[]>> = MCQ_BANK;

export function getImageQuestions(): Question[] {
  return [...imageQuestions];
}

export function getSeedQuestions(): Question[] {
  return [
    ...CATEGORIES.flatMap((category) =>
      DIFFICULTIES.flatMap((difficulty) => BANK[category as ContentCategoryId][difficulty]),
    ),
    ...imageQuestions,
  ];
}

export function getQuestionsFor(
  category: CategoryId,
  difficulty: Difficulty,
): Question[] {
  if (category === 'images') {
    return imageQuestions.filter((q) => q.difficulty === difficulty);
  }
  return [...BANK[category][difficulty]];
}

export { BANK, CATEGORIES, DIFFICULTIES, MCQ_BANK, imageQuestions };
