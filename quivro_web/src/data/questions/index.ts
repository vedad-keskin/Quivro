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
import { biologyEasyImage } from './image_mcq/biology/easy';
import { biologyHardImage } from './image_mcq/biology/hard';
import { biologyMediumImage } from './image_mcq/biology/medium';
import { technologyEasyImage } from './image_mcq/technology/easy';
import { technologyHardImage } from './image_mcq/technology/hard';
import { technologyMediumImage } from './image_mcq/technology/medium';
import { geographyEasyImage } from './image_mcq/geography/easy';
import { geographyHardImage } from './image_mcq/geography/hard';
import { geographyMediumImage } from './image_mcq/geography/medium';
import { historyEasyImage } from './image_mcq/history/easy';
import { historyHardImage } from './image_mcq/history/hard';
import { historyMediumImage } from './image_mcq/history/medium';
import { sportsEasyImage } from './image_mcq/sports/easy';
import { sportsHardImage } from './image_mcq/sports/hard';
import { sportsMediumImage } from './image_mcq/sports/medium';
import { moviesEasyImage } from './image_mcq/movies/easy';
import { moviesHardImage } from './image_mcq/movies/hard';
import { moviesMediumImage } from './image_mcq/movies/medium';
import { famousEasyImage } from './image_mcq/famous/easy';
import { famousHardImage } from './image_mcq/famous/hard';
import { famousMediumImage } from './image_mcq/famous/medium';
import { islamEasyImage } from './image_mcq/islam/easy';
import { islamHardImage } from './image_mcq/islam/hard';
import { islamMediumImage } from './image_mcq/islam/medium';
import type { CategoryId, Difficulty, Question } from './types';
import { CATEGORIES, DIFFICULTIES } from './types';

const MCQ_BANK: Record<CategoryId, Record<Difficulty, Question[]>> = {
  geography: { easy: geographyEasy, medium: geographyMedium, hard: geographyHard },
  biology: { easy: biologyEasy, medium: biologyMedium, hard: biologyHard },
  technology: { easy: technologyEasy, medium: technologyMedium, hard: technologyHard },
  history: { easy: historyEasy, medium: historyMedium, hard: historyHard },
  sports: { easy: sportsEasy, medium: sportsMedium, hard: sportsHard },
  movies: { easy: moviesEasy, medium: moviesMedium, hard: moviesHard },
  famous: { easy: famousEasy, medium: famousMedium, hard: famousHard },
  islam: { easy: islamEasy, medium: islamMedium, hard: islamHard },
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
  technology: {
    easy: technologyEasyImage,
    medium: technologyMediumImage,
    hard: technologyHardImage,
  },
  history: {
    easy: historyEasyImage,
    medium: historyMediumImage,
    hard: historyHardImage,
  },
  sports: {
    easy: sportsEasyImage,
    medium: sportsMediumImage,
    hard: sportsHardImage,
  },
  movies: {
    easy: moviesEasyImage,
    medium: moviesMediumImage,
    hard: moviesHardImage,
  },
  famous: {
    easy: famousEasyImage,
    medium: famousMediumImage,
    hard: famousHardImage,
  },
  islam: {
    easy: islamEasyImage,
    medium: islamMediumImage,
    hard: islamHardImage,
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
  technology: {
    easy: [...MCQ_BANK.technology.easy, ...IMAGE_MCQ_BANK.technology.easy],
    medium: [...MCQ_BANK.technology.medium, ...IMAGE_MCQ_BANK.technology.medium],
    hard: [...MCQ_BANK.technology.hard, ...IMAGE_MCQ_BANK.technology.hard],
  },
  history: {
    easy: [...MCQ_BANK.history.easy, ...IMAGE_MCQ_BANK.history.easy],
    medium: [...MCQ_BANK.history.medium, ...IMAGE_MCQ_BANK.history.medium],
    hard: [...MCQ_BANK.history.hard, ...IMAGE_MCQ_BANK.history.hard],
  },
  sports: {
    easy: [...MCQ_BANK.sports.easy, ...IMAGE_MCQ_BANK.sports.easy],
    medium: [...MCQ_BANK.sports.medium, ...IMAGE_MCQ_BANK.sports.medium],
    hard: [...MCQ_BANK.sports.hard, ...IMAGE_MCQ_BANK.sports.hard],
  },
  movies: {
    easy: [...MCQ_BANK.movies.easy, ...IMAGE_MCQ_BANK.movies.easy],
    medium: [...MCQ_BANK.movies.medium, ...IMAGE_MCQ_BANK.movies.medium],
    hard: [...MCQ_BANK.movies.hard, ...IMAGE_MCQ_BANK.movies.hard],
  },
  famous: {
    easy: [...MCQ_BANK.famous.easy, ...IMAGE_MCQ_BANK.famous.easy],
    medium: [...MCQ_BANK.famous.medium, ...IMAGE_MCQ_BANK.famous.medium],
    hard: [...MCQ_BANK.famous.hard, ...IMAGE_MCQ_BANK.famous.hard],
  },
  islam: {
    easy: [...MCQ_BANK.islam.easy, ...IMAGE_MCQ_BANK.islam.easy],
    medium: [...MCQ_BANK.islam.medium, ...IMAGE_MCQ_BANK.islam.medium],
    hard: [...MCQ_BANK.islam.hard, ...IMAGE_MCQ_BANK.islam.hard],
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
