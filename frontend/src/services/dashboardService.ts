/**
 * Purpose: Dashboard Service layer providing child dashboard data, missions,
 *          personalized recommendation, skills, and achievements.
 *          Implements offline-first fallback synthesis from local stores.
 * Module: Services
 * Folder: frontend/src/services
 */
import { useProgressStore, GameSessionRecord } from '../state/useProgressStore';
import { useChildProfileStore } from '../state/childProfileStore';
import { GAME_REGISTRY } from '../config/gameRegistry';

export interface LevelInfo {
  level: number;
  title: string;
  total_xp: number;
  xp_in_level: number;
  xp_to_next_level: number;
  current_level_cost: number;
  progress_percent: number;
  progress_ratio: number;
  streak_days?: number;
}

export interface DailyGoalInfo {
  target: number;
  completed: number;
  is_met: boolean;
}

export interface TodayMission {
  id: number;
  title: string;
  icon: string;
  status: 'completed' | 'current' | 'upcoming';
  game_id: string;
}

export interface ContinueLearningInfo {
  game_id: string;
  title: string;
  icon: string;
  skill_title: string;
  skill_mastery: string;
  route: string;
  routeParams?: Record<string, any>;
}

export interface SkillSummary {
  skill_id: string;
  title: string;
  icon: string;
  attempts: number;
  accuracy: number;
  mastery: string;
}

export interface AchievementItem {
  id: string;
  title: string;
  icon: string;
  description: string;
  unlocked: boolean;
  unlocked_at?: string;
}

export interface RecentActivityItem {
  game_id: string;
  title: string;
  icon: string;
  skill: string;
  accuracy: number;
  stars: number;
  xp_awarded: number;
  completed_at: string;
}

export interface DashboardPayload {
  child: {
    id: string;
    name: string;
    age: number;
    mother_tongue: string;
    learning_language: string;
    app_language: string;
    avatar: string;
  };
  xp: LevelInfo;
  daily_goal: DailyGoalInfo;
  today_journey: TodayMission[];
  continue_learning: ContinueLearningInfo;
  skills: SkillSummary[];
  achievements: AchievementItem[];
  recent_activity: RecentActivityItem[];
}

const FALLBACK_ACHIEVEMENTS: AchievementItem[] = [
  { id: 'first_game', title: 'First Adventure', icon: '🌟', description: 'Played your very first learning game!', unlocked: false },
  { id: 'perfect_round', title: 'Super Star', icon: '🎯', description: 'Completed a round with 100% accuracy!', unlocked: false },
  { id: 'quick_learner', title: 'Lightning Mind', icon: '🧠', description: 'Completed a game swiftly with great accuracy!', unlocked: false },
  { id: 'letter_master', title: 'Letter Wizard', icon: '🔤', description: 'Practiced 3 letter and phonics activities!', unlocked: false },
  { id: 'vocabulary_explorer', title: 'Word Champion', icon: '📚', description: 'Expanded your vocabulary across 3 sessions!', unlocked: false },
  { id: 'visual_explorer', title: 'Curious Explorer', icon: '🧭', description: 'Explored and completed diverse learning quests!', unlocked: false },
  { id: 'math_wizard', title: 'Number Star', icon: '⚡', description: 'Solved 3 math and counting quests!', unlocked: false },
  { id: 'shape_color_prodigy', title: 'Color & Shape Master', icon: '🎨', description: 'Mastered 3 color and shape activities!', unlocked: false },
  { id: 'learning_streak', title: 'Streak Champion', icon: '🔥', description: 'Came back and learned across multiple days!', unlocked: false },
  { id: 'skill_champion', title: 'True Champion', icon: '🏆', description: 'Reached Champion mastery in any learning skill!', unlocked: false },
];

const SKILL_TITLES: Record<string, { title: string; icon: string }> = {
  letters_phonics: { title: 'Letters & Phonics', icon: '🔤' },
  reading_words: { title: 'Reading & Words', icon: '📖' },
  vocabulary: { title: 'Vocabulary', icon: '📚' },
  mathematics: { title: 'Mathematics', icon: '🔢' },
  grammar_syntax: { title: 'Grammar & Syntax', icon: '✍️' },
  reasoning_logic: { title: 'Reasoning & Logic', icon: '🧩' },
  shapes_colours: { title: 'Shapes & Colours', icon: '🎨' },
};

/**
 * Synthesizes a full Dashboard payload locally when offline.
 */
export const synthesizeLocalDashboard = (): DashboardPayload => {
  const profile = useChildProfileStore.getState();
  const progress = useProgressStore.getState();

  const history = progress.history || [];
  const completedTodayCount = history.filter((h) => {
    const d = new Date(h.timestamp);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;

  // Calculate consecutive day streak from local session history
  const uniqueDates = Array.from(
    new Set(history.map((h) => new Date(h.timestamp).toISOString().split('T')[0]))
  ).sort().reverse();

  let streakDays = 0;
  if (uniqueDates.length > 0) {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const anchor = uniqueDates[0] === todayStr ? todayStr : uniqueDates[0] === yesterday ? yesterday : null;
    if (anchor) {
      const checkDate = new Date(anchor);
      while (true) {
        const checkStr = checkDate.toISOString().split('T')[0];
        if (uniqueDates.includes(checkStr)) {
          streakDays++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }
  }

  const levelInfo: LevelInfo = {
    level: progress.currentLevel,
    title:
      progress.currentLevel === 1
        ? 'Curious Explorer'
        : progress.currentLevel === 2
        ? 'Rising Star'
        : progress.currentLevel === 3
        ? 'Knowledge Seeker'
        : progress.currentLevel === 4
        ? 'Adventure Guide'
        : 'Grand Champion',
    total_xp: progress.totalXp,
    xp_in_level: progress.xpInCurrentLevel,
    xp_to_next_level: progress.xpToNextLevel,
    current_level_cost: progress.currentLevelCost,
    progress_percent: progress.progressPercent,
    progress_ratio: progress.progressRatio,
    streak_days: streakDays > 0 ? streakDays : (history.length > 0 ? 1 : 0),
  };

  // Determine today missions
  const todayMissions: TodayMission[] = [
    {
      id: 1,
      title: 'Letters & Phonics Fun',
      icon: '🔤',
      status: completedTodayCount >= 1 ? 'completed' : 'current',
      game_id: profile.age === 5 ? 'alphabet_matching' : 'missing_letter_words',
    },
    {
      id: 2,
      title: 'Words & Numbers Discovery',
      icon: '🔢',
      status: completedTodayCount >= 2 ? 'completed' : completedTodayCount === 1 ? 'current' : 'upcoming',
      game_id: profile.age === 5 ? 'number_counting' : 'addition',
    },
    {
      id: 3,
      title: 'Speech & Logic Quest',
      icon: '🗣️',
      status: completedTodayCount >= 3 ? 'completed' : completedTodayCount === 2 ? 'current' : 'upcoming',
      game_id: profile.age === 5 ? 'speech_letters' : 'speech_animals',
    },
  ];

  // Synthesize 8 skills
  const skillsList: SkillSummary[] = Object.keys(SKILL_TITLES).map((skillKey) => {
    const meta = SKILL_TITLES[skillKey];
    const sessions = history.filter((h) => (h.category || '').toLowerCase().includes(skillKey.split('_')[0]));
    const attempts = sessions.length;
    const avgAcc = attempts > 0 ? Math.round(sessions.reduce((acc, s) => acc + s.accuracy, 0) / attempts) : 0;
    const mastery = attempts >= 5 && avgAcc >= 85 ? 'Champion' : attempts >= 3 ? 'Master' : attempts >= 1 ? 'Apprentice' : 'Explorer';

    return {
      skill_id: skillKey,
      title: meta.title,
      icon: meta.icon,
      attempts,
      accuracy: avgAcc,
      mastery,
    };
  });

  // Pick dynamic recommendation matching child age and learning needs
  const age = profile.age || 5;
  const available = GAME_REGISTRY.filter((g) => g.ageGroups.includes(age as any));
  
  // Recommend a game not yet played or one with lower accuracy
  const playedGameIds = new Set(history.map((h) => h.gameId));
  const unplayed = available.filter((g) => !playedGameIds.has(g.id));
  const recGame = unplayed.length > 0 ? unplayed[0] : (available[0] || GAME_REGISTRY[0]);

  const GAME_HUMAN_TITLES: Record<string, { title: string; skill: string }> = {
    alphabet_matching: { title: 'Alphabet Matching', skill: 'Letters & Phonics' },
    capital_small_match: { title: 'Capital & Small Match', skill: 'Letters & Phonics' },
    vowel_matra_match: { title: 'Vowel & Matra Match', skill: 'Reading & Words' },
    speech_letters: { title: 'Letter Sounds Speech', skill: 'Speech & Pronunciation' },
    missing_letters: { title: 'Missing Letters', skill: 'Reading & Words' },
    missing_numbers: { title: 'Missing Numbers', skill: 'Mathematics' },
    number_counting: { title: 'Number Counting', skill: 'Mathematics' },
    put_in_order: { title: 'Put In Order', skill: 'Reasoning & Logic' },
    colour_challenge: { title: 'Colour Challenge', skill: 'Shapes & Colours' },
    shape_challenge: { title: 'Shape Challenge', skill: 'Shapes & Colours' },
    letter_tracing: { title: 'Letter Tracing', skill: 'Letters & Phonics' },
    speech_animals: { title: 'Animal Speech Quest', skill: 'Speech & Pronunciation' },
    speech_fruits_vegetables: { title: 'Fruit & Veg Speech', skill: 'Speech & Pronunciation' },
    speech_everyday_nature: { title: 'Nature Speech Quest', skill: 'Speech & Pronunciation' },
    language_pair_match: { title: 'Language Match', skill: 'Vocabulary' },
    guess_the_shape: { title: 'Guess The Shape', skill: 'Shapes & Colours' },
    missing_letter_words: { title: 'Missing Letter Words', skill: 'Reading & Words' },
    find_the_correct_word: { title: 'Find Correct Word', skill: 'Vocabulary' },
    addition: { title: 'Addition Fun', skill: 'Mathematics' },
    subtraction: { title: 'Subtraction Quest', skill: 'Mathematics' },
    pattern_match: { title: 'Pattern Match', skill: 'Reasoning & Logic' },
    bigger_smaller: { title: 'Bigger & Smaller', skill: 'Reasoning & Logic' },
    what_comes_next: { title: 'What Comes Next?', skill: 'Reasoning & Logic' },
    noun_or_verb: { title: 'Noun or Verb', skill: 'Grammar & Syntax' },
    singular_or_plural: { title: 'Singular or Plural', skill: 'Grammar & Syntax' },
    complete_the_sentence: { title: 'Complete Sentence', skill: 'Grammar & Syntax' },
    bigger_addition: { title: 'Bigger Addition', skill: 'Mathematics' },
    multiplication: { title: 'Multiplication Star', skill: 'Mathematics' },
    division: { title: 'Division Quest', skill: 'Mathematics' },
    number_pattern: { title: 'Number Patterns', skill: 'Mathematics' },
    odd_one_out: { title: 'Odd One Out', skill: 'Reasoning & Logic' },
    odd_word_out: { title: 'Odd Word Out', skill: 'Reasoning & Logic' },
    logical_sequence: { title: 'Logical Sequence', skill: 'Reasoning & Logic' },
    visual_reasoning: { title: 'Visual Reasoning', skill: 'Reasoning & Logic' },
    articles_determiners: { title: 'Articles & Determiners', skill: 'Grammar & Syntax' },
    pronouns: { title: 'Pronoun Practice', skill: 'Grammar & Syntax' },
    prepositions: { title: 'Prepositions Quest', skill: 'Grammar & Syntax' },
    basic_tenses: { title: 'Basic Tenses', skill: 'Grammar & Syntax' },
    sentence_correction: { title: 'Sentence Correction', skill: 'Grammar & Syntax' },
  };

  const recMeta = GAME_HUMAN_TITLES[recGame.id] || {
    title: recGame.id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    skill: 'Adventure Quest',
  };

  const continueLearning: ContinueLearningInfo = {
    game_id: recGame.id,
    title: recMeta.title,
    icon: recGame.iconAsset || '🎮',
    skill_title: recMeta.skill,
    skill_mastery: 'Explorer',
    route: recGame.navigatorRoute,
    routeParams: recGame.routeParams,
  };

  // Recent activity
  const recentActivity: RecentActivityItem[] = history.slice(-5).reverse().map((h) => ({
    game_id: h.gameId,
    title: h.gameId.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    icon: '🎮',
    skill: h.category || 'Letters & Phonics',
    accuracy: h.accuracy,
    stars: h.starsEarned,
    xp_awarded: h.xpEarned,
    completed_at: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }));

  return {
    child: {
      id: profile.childId,
      name: profile.name,
      age: profile.age,
      mother_tongue: profile.motherTongue,
      learning_language: profile.learningLanguage,
      app_language: profile.appLanguage,
      avatar: profile.avatar,
    },
    xp: levelInfo,
    daily_goal: {
      target: 3,
      completed: completedTodayCount,
      is_met: completedTodayCount >= 3,
    },
    today_journey: todayMissions,
    continue_learning: continueLearning,
    skills: skillsList,
    achievements: FALLBACK_ACHIEVEMENTS.map((a) => {
      let isUnlocked = false;
      if (a.id === 'first_game' && history.length >= 1) isUnlocked = true;
      if (a.id === 'perfect_round' && history.some((h) => h.accuracy >= 100)) isUnlocked = true;
      if (a.id === 'quick_learner' && progress.totalXp >= 50) isUnlocked = true;
      if (a.id === 'letter_master' && history.filter((h) => (h.gameId || '').includes('alphabet') || (h.gameId || '').includes('letter')).length >= 3) isUnlocked = true;
      if (a.id === 'vocabulary_explorer' && history.filter((h) => (h.category || '').includes('vocab') || (h.gameId || '').includes('word')).length >= 3) isUnlocked = true;
      if (a.id === 'visual_explorer' && history.length >= 2) isUnlocked = true;
      if (a.id === 'math_wizard' && history.filter((h) => (h.category || '').includes('math') || (h.gameId || '').includes('number') || (h.gameId || '').includes('addition')).length >= 3) isUnlocked = true;
      if (a.id === 'shape_color_prodigy' && history.filter((h) => (h.category || '').includes('shape') || (h.gameId || '').includes('colour') || (h.gameId || '').includes('shape')).length >= 3) isUnlocked = true;
      if (a.id === 'learning_streak' && streakDays >= 2) isUnlocked = true;
      if (a.id === 'skill_champion' && skillsList.some((s) => s.mastery === 'Champion')) isUnlocked = true;
      return { ...a, unlocked: isUnlocked };
    }),
    recent_activity: recentActivity,
  };
};

export const dashboardService = {
  fetchDashboard: async (_userId: string): Promise<DashboardPayload> => {
    // Zero-network instant local dashboard synthesized from local database & progress store
    return synthesizeLocalDashboard();
  },

  submitSessionToBackend: async (_session: {
    sessionId: string;
    userId: string;
    gameId: string;
    category?: string;
    score: number;
    accuracy: number;
    starsEarned: number;
    durationSeconds: number;
    xpAwarded: number;
  }) => {
    // Standalone deployment mode: sessions are stored locally in AsyncStorage
    return { success: true, offline: true };
  },
};
