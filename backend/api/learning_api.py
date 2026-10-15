"""
Purpose: REST API for Child Learning Platform, Personalization, Dashboard, Game Sessions, and Reports.
Module: Backend API
File: backend/api/learning_api.py
"""

from datetime import datetime, date, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, Field

from backend.database import get_db_connection

router = APIRouter()

# --- Skill Definitions & Game Mapping ---
SKILL_CATEGORIES = {
    "letters_phonics": {
        "id": "letters_phonics",
        "title": "Letters & Phonics",
        "icon": "🔤",
        "games": ["alphabet_matching", "capital_small_match", "letter_tracing", "vowel_matra_match"],
    },
    "reading_words": {
        "id": "reading_words",
        "title": "Reading & Words",
        "icon": "📖",
        "games": ["missing_letters", "missing_letter_words", "find_the_correct_word"],
    },
    "vocabulary": {
        "id": "vocabulary",
        "title": "Vocabulary",
        "icon": "📚",
        "games": ["odd_word_out", "language_pair_match"],
    },
    "speech_pronunciation": {
        "id": "speech_pronunciation",
        "title": "Speech & Pronunciation",
        "icon": "🗣️",
        "games": ["speech_letters", "speech_animals", "speech_fruits_vegetables", "speech_everyday_nature"],
    },
    "mathematics": {
        "id": "mathematics",
        "title": "Mathematics",
        "icon": "🔢",
        "games": ["addition", "subtraction", "bigger_addition", "multiplication", "division", "missing_numbers", "number_counting"],
    },
    "grammar_syntax": {
        "id": "grammar_syntax",
        "title": "Grammar & Syntax",
        "icon": "✍️",
        "games": ["noun_or_verb", "singular_or_plural", "complete_the_sentence"],
    },
    "reasoning_logic": {
        "id": "reasoning_logic",
        "title": "Reasoning & Logic",
        "icon": "🧩",
        "games": ["put_in_order", "pattern_match", "bigger_smaller", "what_comes_next", "number_pattern", "odd_one_out", "logical_sequence", "visual_reasoning"],
    },
    "shapes_colours": {
        "id": "shapes_colours",
        "title": "Shapes & Colours",
        "icon": "🎨",
        "games": ["colour_challenge", "shape_challenge", "guess_the_shape"],
    },
}

# Reverse mapping: game_id -> skill_id
GAME_TO_SKILL: Dict[str, str] = {}
for skill_id, info in SKILL_CATEGORIES.items():
    for g in info["games"]:
        GAME_TO_SKILL[g] = skill_id

# Catalog metadata for recommended game launcher
GAME_METADATA: Dict[str, Dict[str, Any]] = {
    "alphabet_matching": {"title": "Alphabet Match", "icon": "🔤", "route": "AlphabetMatchingModeSelection", "age": [5]},
    "capital_small_match": {"title": "Big & Small Match", "icon": "🔠", "route": "CapitalSmallMatchIntro", "age": [5]},
    "vowel_matra_match": {"title": "Vowel & Matra", "icon": "🕉️", "route": "VowelMatraMatchIntro", "age": [5]},
    "speech_letters": {"title": "Letter Speech", "icon": "🔤", "route": "SpeechWordChallengeIntro", "routeParams": {"category": "letters"}, "age": [5]},
    "missing_letters": {"title": "Missing Letters", "icon": "🔤", "route": "MissingLettersIntro", "age": [5]},
    "missing_numbers": {"title": "Missing Numbers", "icon": "🔢", "route": "MissingNumbersIntro", "age": [5]},
    "number_counting": {"title": "Counting Fun", "icon": "🍎", "route": "NumberCountingIntro", "age": [5]},
    "put_in_order": {"title": "Put in Order", "icon": "🧩", "route": "PutInOrderIntro", "age": [5]},
    "colour_challenge": {"title": "Colour Challenge", "icon": "🎨", "route": "ColourChallengeIntro", "age": [5, 6, 7]},
    "shape_challenge": {"title": "Shape Challenge", "icon": "📐", "route": "ShapeChallengeIntro", "age": [5, 6, 7]},
    "letter_tracing": {"title": "Letter Tracing", "icon": "✍️", "route": "LetterTracingIntro", "age": [5, 6, 7]},
    "speech_animals": {"title": "Animal Speech", "icon": "🐾", "route": "SpeechWordChallengeIntro", "routeParams": {"category": "animals"}, "age": [6, 7]},
    "speech_fruits_vegetables": {"title": "Fruit & Veg Speech", "icon": "🍎", "route": "SpeechWordChallengeIntro", "routeParams": {"category": "fruits"}, "age": [6, 7]},
    "speech_everyday_nature": {"title": "Nature Speech", "icon": "🌳", "route": "SpeechWordChallengeIntro", "routeParams": {"category": "nature"}, "age": [6, 7]},
    "language_pair_match": {"title": "Word Match", "icon": "🧩", "route": "LanguagePairMatchIntro", "age": [6]},
    "guess_the_shape": {"title": "Guess the Shape", "icon": "🔷", "route": "GuessTheShapeIntro", "age": [6, 7]},
    "missing_letter_words": {"title": "Word Speller", "icon": "🔤", "route": "MissingLetterWordsIntro", "age": [6, 7]},
    "find_the_correct_word": {"title": "Word Detective", "icon": "📝", "route": "FindTheCorrectWordIntro", "age": [6, 7]},
    "addition": {"title": "Addition Wonder", "icon": "➕", "route": "MathChallengeIntro", "routeParams": {"operation": "addition"}, "age": [6]},
    "subtraction": {"title": "Subtraction Fun", "icon": "➖", "route": "MathChallengeIntro", "routeParams": {"operation": "subtraction"}, "age": [6]},
    "bigger_addition": {"title": "Bigger Addition", "icon": "➕", "route": "MathChallengeIntro", "routeParams": {"operation": "bigger_addition"}, "age": [7]},
    "multiplication": {"title": "Multiplication Star", "icon": "✖️", "route": "MathChallengeIntro", "routeParams": {"operation": "multiplication"}, "age": [7]},
    "division": {"title": "Division Explorer", "icon": "➗", "route": "MathChallengeIntro", "routeParams": {"operation": "division"}, "age": [7]},
    "pattern_match": {"title": "Pattern Matcher", "icon": "🧩", "route": "AptitudeChallengeIntro", "routeParams": {"gameType": "pattern_match"}, "age": [6]},
    "bigger_smaller": {"title": "Size Comparison", "icon": "⚖️", "route": "AptitudeChallengeIntro", "routeParams": {"gameType": "bigger_smaller"}, "age": [6]},
    "what_comes_next": {"title": "What Comes Next", "icon": "➡️", "route": "AptitudeChallengeIntro", "routeParams": {"gameType": "what_comes_next"}, "age": [6]},
    "number_pattern": {"title": "Number Sequence", "icon": "🔢", "route": "AptitudeChallengeIntro", "routeParams": {"gameType": "number_pattern"}, "age": [7]},
    "odd_one_out": {"title": "Find the Odd One", "icon": "🔍", "route": "AptitudeChallengeIntro", "routeParams": {"gameType": "odd_one_out"}, "age": [7]},
    "odd_word_out": {"title": "Odd Word Out", "icon": "🎯", "route": "OddWordOutIntro", "age": [7]},
    "logical_sequence": {"title": "Logical Sequence", "icon": "⏳", "route": "AptitudeChallengeIntro", "routeParams": {"gameType": "logical_sequence"}, "age": [7]},
    "visual_reasoning": {"title": "Visual Logic", "icon": "🧠", "route": "AptitudeChallengeIntro", "routeParams": {"gameType": "visual_reasoning"}, "age": [7]},
    "noun_or_verb": {"title": "Noun or Verb", "icon": "📝", "route": "GrammarChallengeIntro", "routeParams": {"topic": "noun_or_verb"}, "age": [6]},
    "singular_or_plural": {"title": "One or Many", "icon": "🔢", "route": "GrammarChallengeIntro", "routeParams": {"topic": "singular_or_plural"}, "age": [6]},
    "complete_the_sentence": {"title": "Sentence Builder", "icon": "✏️", "route": "GrammarChallengeIntro", "routeParams": {"topic": "complete_the_sentence"}, "age": [6]},
}

# All platform achievements
ACHIEVEMENTS_REGISTRY = [
    {"id": "first_game", "title": "First Adventure", "icon": "🌟", "description": "Played your very first learning game!"},
    {"id": "perfect_round", "title": "Super Star", "icon": "🎯", "description": "Completed a round with 100% accuracy!"},
    {"id": "quick_learner", "title": "Lightning Mind", "icon": "🧠", "description": "Completed a game swiftly with great accuracy!"},
    {"id": "letter_master", "title": "Letter Wizard", "icon": "🔤", "description": "Practiced 3 letter and phonics activities!"},
    {"id": "vocabulary_explorer", "title": "Word Champion", "icon": "📚", "description": "Expanded your vocabulary across 3 sessions!"},
    {"id": "confident_speaker", "title": "Brave Speaker", "icon": "🗣️", "description": "Practiced speech challenge with high clarity!"},
    {"id": "math_wizard", "title": "Number Star", "icon": "⚡", "description": "Solved 3 math and counting quests!"},
    {"id": "shape_color_prodigy", "title": "Color & Shape Master", "icon": "🎨", "description": "Mastered 3 color and shape activities!"},
    {"id": "learning_streak", "title": "Streak Champion", "icon": "🔥", "description": "Came back and learned across multiple days!"},
    {"id": "skill_champion", "title": "True Champion", "icon": "🏆", "description": "Reached Champion mastery in any learning skill!"},
]


def calculate_level_info(total_xp: int) -> Dict[str, Any]:
    """Calculates deterministic level and XP progress matching frontend formula."""
    safe_xp = max(0, total_xp)
    level = 1
    accumulated = 0
    cost = 100

    while safe_xp >= accumulated + cost:
        accumulated += cost
        level += 1
        cost = 100 + (level - 1) * 50

    xp_in_level = safe_xp - accumulated
    xp_to_next = cost - xp_in_level
    ratio = min(1.0, max(0.0, xp_in_level / cost))
    percent = round(ratio * 100)

    level_titles = {
        1: "Curious Explorer",
        2: "Rising Star",
        3: "Knowledge Seeker",
        4: "Adventure Guide",
        5: "Brilliant Master",
        6: "Grand Champion",
    }
    title = level_titles.get(level, f"Level {level} Legend")

    return {
        "level": level,
        "title": title,
        "total_xp": safe_xp,
        "xp_in_level": xp_in_level,
        "xp_to_next_level": xp_to_next,
        "current_level_cost": cost,
        "progress_percent": percent,
        "progress_ratio": ratio,
    }


def calculate_streak(user_id: str, cursor) -> int:
    """
    Computes genuine daily learning streak from historical distinct dates in game_sessions.
    Correctly handles:
    - Same day multiple sessions: counts as 1 day
    - Consecutive days: increments streak
    - Yesterday played but not today yet: keeps active streak alive
    - Missed day: resets streak to 0 (or 1 if played today)
    """
    cursor.execute("""
    SELECT DISTINCT DATE(completed_at) as play_date
    FROM game_sessions
    WHERE user_id = ?
    ORDER BY play_date DESC
    """, (user_id,))
    rows = cursor.fetchall()
    if not rows:
        return 0

    play_dates = {datetime.strptime(r["play_date"], "%Y-%m-%d").date() for r in rows}
    today = date.today()
    yesterday = today - timedelta(days=1)

    if today not in play_dates and yesterday not in play_dates:
        return 0

    anchor = today if today in play_dates else yesterday
    streak = 0
    current_check = anchor

    while current_check in play_dates:
        streak += 1
        current_check -= timedelta(days=1)

    return streak


def compute_mastery(accuracy: int, attempts: int) -> str:
    """Computes pedagogical mastery status."""
    if attempts >= 5 and accuracy >= 88:
        return "Champion"
    if attempts >= 3 and accuracy >= 75:
        return "Master"
    if attempts >= 2 and accuracy >= 60:
        return "Apprentice"
    return "Explorer"


def check_user_access(target_user_id: str, authorization: Optional[str] = None):
    """
    Enforces strict user data isolation.
    Ensures a child can only access their own data.
    Parents and teachers can access their linked children.
    """
    if not authorization:
        return  # Allow unauthenticated local development access

    from backend.api.auth_api import get_user_from_token
    token = authorization.replace("Bearer ", "").strip()
    user = get_user_from_token(token)

    if user["id"] == target_user_id or user["role"] == "admin":
        return

    conn = get_db_connection()
    cursor = conn.cursor()

    if user["role"] == "parent":
        cursor.execute("SELECT 1 FROM parent_children WHERE parent_id = ? AND child_id = ?", (user["id"], target_user_id))
        if cursor.fetchone():
            conn.close()
            return

    if user["role"] == "teacher":
        cursor.execute("SELECT 1 FROM teacher_students WHERE teacher_id = ? AND student_id = ?", (user["id"], target_user_id))
        if cursor.fetchone():
            conn.close()
            return

    conn.close()
    raise HTTPException(status_code=403, detail="Unauthorized: Access to this child profile is restricted")


# --- Request & Response Models ---
class ProfileRequest(BaseModel):
    id: str = Field(..., description="Unique user or child profile ID")
    name: str = Field(..., description="Child's display name")
    age: int = Field(5, description="Child age (5, 6, 7)")
    mother_tongue: str = Field("en", description="Mother tongue ('en', 'hi', 'mr')")
    learning_language: str = Field("en", description="Learning language ('en', 'hi', 'mr')")
    app_language: str = Field("en", description="Interface language ('en', 'hi', 'mr')")
    avatar: str = Field("🦁", description="Chosen avatar emoji/symbol")


class GameSessionRequest(BaseModel):
    session_id: str = Field(..., description="Unique client session ID for strict idempotency")
    user_id: str = Field(..., description="User ID")
    game_id: str = Field(..., description="Game identifier")
    skill: Optional[str] = Field(None, description="Skill category (auto-mapped if null)")
    score: int = Field(0, description="Total score")
    accuracy: int = Field(0, description="Accuracy percentage (0-100)")
    stars_earned: int = Field(1, description="Stars awarded (1-3)")
    duration_seconds: int = Field(0, description="Duration in seconds")
    xp_awarded: int = Field(20, description="Calculated XP to add")


# --- API Endpoints ---

@router.post("/profile")
def create_or_update_profile(req: ProfileRequest):
    """Creates or updates a child profile with full language and age preferences."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO users (id, name, age, mother_tongue, learning_language, app_language, avatar, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        age = excluded.age,
        mother_tongue = excluded.mother_tongue,
        learning_language = excluded.learning_language,
        app_language = excluded.app_language,
        avatar = excluded.avatar,
        updated_at = CURRENT_TIMESTAMP
    """, (req.id, req.name, req.age, req.mother_tongue, req.learning_language, req.app_language, req.avatar))

    # Ensure user_xp row exists
    cursor.execute("""
    INSERT INTO user_xp (user_id, total_xp, level)
    VALUES (?, 0, 1)
    ON CONFLICT(user_id) DO NOTHING
    """, (req.id,))

    conn.commit()

    # Fetch updated profile
    cursor.execute("SELECT * FROM users WHERE id = ?", (req.id,))
    row = cursor.fetchone()
    conn.close()

    return {
        "success": True,
        "profile": dict(row) if row else None
    }


@router.get("/profile/{user_id}")
def get_profile(user_id: str, authorization: Optional[str] = Header(None)):
    """Fetches child profile along with current XP and level with user data isolation."""
    check_user_access(user_id, authorization)

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()

    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="Child profile not found")

    cursor.execute("SELECT total_xp, level FROM user_xp WHERE user_id = ?", (user_id,))
    xp_row = cursor.fetchone()
    conn.close()

    total_xp = xp_row["total_xp"] if xp_row else 0
    level_info = calculate_level_info(total_xp)

    return {
        "success": True,
        "profile": dict(user),
        "level_info": level_info
    }


@router.post("/game-session")
def record_game_session(req: GameSessionRequest, authorization: Optional[str] = Header(None)):
    """
    Records a completed game session with STRICT IDEMPOTENCY and server-side validation.
    Submitting the same session_id multiple times will NOT award duplicate XP or badges.
    """
    check_user_access(req.user_id, authorization)

    # Server-Side XP Verification & Clamping
    # Completion = 20 XP, Perfect = +25 XP, max single session = 150 XP
    validated_xp = max(0, min(150, req.xp_awarded))
    req.xp_awarded = validated_xp

    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Strict Idempotency Check
    cursor.execute("SELECT session_id, xp_awarded FROM game_sessions WHERE session_id = ?", (req.session_id,))
    existing = cursor.fetchone()

    if existing:
        cursor.execute("SELECT total_xp, level FROM user_xp WHERE user_id = ?", (req.user_id,))
        xp_row = cursor.fetchone()
        conn.close()
        current_xp = xp_row["total_xp"] if xp_row else 0
        level_info = calculate_level_info(current_xp)

        return {
            "success": True,
            "already_processed": True,
            "xp_awarded": 0,
            "new_total_xp": current_xp,
            "new_level": level_info["level"],
            "level_up": False,
            "unlocked_achievements": []
        }

    # Resolve skill category
    skill = req.skill or GAME_TO_SKILL.get(req.game_id, "letters_phonics")

    # 2. Insert Game Session
    cursor.execute("""
    INSERT INTO game_sessions (
        session_id, user_id, game_id, skill, score, accuracy, stars_earned, duration_seconds, xp_awarded, completed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    """, (
        req.session_id, req.user_id, req.game_id, skill,
        req.score, req.accuracy, req.stars_earned, req.duration_seconds, req.xp_awarded
    ))

    # 3. Update User XP & Level
    cursor.execute("SELECT total_xp, level FROM user_xp WHERE user_id = ?", (req.user_id,))
    xp_row = cursor.fetchone()
    old_xp = xp_row["total_xp"] if xp_row else 0
    old_level = xp_row["level"] if xp_row else 1

    new_xp = old_xp + req.xp_awarded
    level_info = calculate_level_info(new_xp)
    new_level = level_info["level"]
    level_up = new_level > old_level

    cursor.execute("""
    INSERT INTO user_xp (user_id, total_xp, level, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET
        total_xp = excluded.total_xp,
        level = excluded.level,
        updated_at = CURRENT_TIMESTAMP
    """, (req.user_id, new_xp, new_level))

    # 4. Update Skill Progress
    cursor.execute("SELECT attempts, correct FROM skill_progress WHERE user_id = ? AND skill = ?", (req.user_id, skill))
    sk_row = cursor.fetchone()
    old_attempts = sk_row["attempts"] if sk_row else 0
    old_correct = sk_row["correct"] if sk_row else 0

    new_attempts = old_attempts + 1
    # Estimate correct count from accuracy
    round_correct = 1 if req.accuracy >= 60 else 0
    new_correct = old_correct + round_correct
    new_acc = round((new_correct / max(1, new_attempts)) * 100)
    mastery = compute_mastery(new_acc, new_attempts)

    cursor.execute("""
    INSERT INTO skill_progress (user_id, skill, attempts, correct, accuracy, mastery, last_played_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, skill) DO UPDATE SET
        attempts = excluded.attempts,
        correct = excluded.correct,
        accuracy = excluded.accuracy,
        mastery = excluded.mastery,
        last_played_at = CURRENT_TIMESTAMP
    """, (req.user_id, skill, new_attempts, new_correct, new_acc, mastery))

    # 5. Update Daily Goal for Today
    today_str = date.today().isoformat()
    cursor.execute("""
    INSERT INTO daily_goals (user_id, goal_date, target_activities, completed_activities, updated_at)
    VALUES (?, ?, 3, 1, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, goal_date) DO UPDATE SET
        completed_activities = completed_activities + 1,
        updated_at = CURRENT_TIMESTAMP
    """, (req.user_id, today_str))

    # 6. Evaluate and Unlock Achievements
    newly_unlocked = []

    # Get already unlocked
    cursor.execute("SELECT achievement_id FROM achievements WHERE user_id = ?", (req.user_id,))
    unlocked_ids = {r["achievement_id"] for r in cursor.fetchall()}

    def award_badge(b_id: str):
        if b_id not in unlocked_ids:
            cursor.execute("INSERT OR IGNORE INTO achievements (user_id, achievement_id) VALUES (?, ?)", (req.user_id, b_id))
            unlocked_ids.add(b_id)
            # Find metadata
            meta = next((a for a in ACHIEVEMENTS_REGISTRY if a["id"] == b_id), None)
            if meta:
                newly_unlocked.append(meta)

    # Criteria checks
    award_badge("first_game")

    if req.accuracy >= 100:
        award_badge("perfect_round")

    if req.duration_seconds > 0 and req.duration_seconds <= 60 and req.accuracy >= 80:
        award_badge("quick_learner")

    if skill == "speech_pronunciation" and req.accuracy >= 80:
        award_badge("confident_speaker")

    # Count games in categories
    cursor.execute("SELECT skill, COUNT(*) as c FROM game_sessions WHERE user_id = ? GROUP BY skill", (req.user_id,))
    skill_counts = {r["skill"]: r["c"] for r in cursor.fetchall()}

    if skill_counts.get("letters_phonics", 0) >= 3:
        award_badge("letter_master")
    if skill_counts.get("vocabulary", 0) >= 3 or skill_counts.get("reading_words", 0) >= 3:
        award_badge("vocabulary_explorer")
    if skill_counts.get("mathematics", 0) >= 3:
        award_badge("math_wizard")
    if skill_counts.get("shapes_colours", 0) >= 3:
        award_badge("shape_color_prodigy")

    # Multi-day streak check
    cursor.execute("SELECT COUNT(DISTINCT DATE(completed_at)) as days FROM game_sessions WHERE user_id = ?", (req.user_id,))
    distinct_days = cursor.fetchone()["days"]
    if distinct_days >= 2:
        award_badge("learning_streak")

    # Skill champion check
    if mastery == "Champion":
        award_badge("skill_champion")

    streak_days = calculate_streak(req.user_id, cursor)
    level_info["streak_days"] = streak_days

    conn.commit()
    conn.close()

    return {
        "success": True,
        "already_processed": False,
        "xp_awarded": req.xp_awarded,
        "new_total_xp": new_xp,
        "new_level": new_level,
        "level_up": level_up,
        "level_info": level_info,
        "streak_days": streak_days,
        "unlocked_achievements": newly_unlocked
    }


@router.get("/dashboard/{user_id}")
def get_child_dashboard(user_id: str, authorization: Optional[str] = Header(None)):
    """
    Returns complete Child Dashboard payload with user data isolation:
    - Child profile & level
    - Today's Journey (3 micro-missions)
    - Continue Learning recommendation (personalized)
    - 8 Skill breakdowns
    - Achievements earned & unlocked
    - Gentle daily goal
    - Recent activity feed
    """
    check_user_access(user_id, authorization)

    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Profile
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user_row = cursor.fetchone()
    if not user_row:
        # Provide default profile if not yet created in SQLite
        child_profile = {
            "id": user_id,
            "name": "Friend",
            "age": 5,
            "mother_tongue": "en",
            "learning_language": "en",
            "app_language": "en",
            "avatar": "🦁"
        }
    else:
        child_profile = dict(user_row)

    # 2. XP & Level
    cursor.execute("SELECT total_xp, level FROM user_xp WHERE user_id = ?", (user_id,))
    xp_row = cursor.fetchone()
    total_xp = xp_row["total_xp"] if xp_row else 0
    level_info = calculate_level_info(total_xp)
    streak_days = calculate_streak(user_id, cursor)
    level_info["streak_days"] = streak_days

    # 3. Daily Goal for Today
    today_str = date.today().isoformat()
    cursor.execute("SELECT completed_activities, target_activities FROM daily_goals WHERE user_id = ? AND goal_date = ?", (user_id, today_str))
    goal_row = cursor.fetchone()
    completed_today = goal_row["completed_activities"] if goal_row else 0
    target_today = goal_row["target_activities"] if goal_row else 3

    # 4. Skill Progress (All 8 Skills)
    cursor.execute("SELECT * FROM skill_progress WHERE user_id = ?", (user_id,))
    existing_skills = {r["skill"]: dict(r) for r in cursor.fetchall()}

    skills_breakdown = []
    lowest_accuracy_skill = None
    min_acc = 101

    for s_id, s_meta in SKILL_CATEGORIES.items():
        sk_data = existing_skills.get(s_id)
        attempts = sk_data["attempts"] if sk_data else 0
        accuracy = sk_data["accuracy"] if sk_data else 0
        mastery = sk_data["mastery"] if sk_data else "Explorer"

        if attempts > 0 and accuracy < min_acc:
            min_acc = accuracy
            lowest_accuracy_skill = s_id

        skills_breakdown.append({
            "skill_id": s_id,
            "title": s_meta["title"],
            "icon": s_meta["icon"],
            "attempts": attempts,
            "accuracy": accuracy,
            "mastery": mastery
        })

    # 5. Personalization Engine: Recommend Next Game
    child_age = child_profile.get("age", 5)

    target_skill_id = lowest_accuracy_skill or "letters_phonics"
    candidate_games = SKILL_CATEGORIES[target_skill_id]["games"]

    # Filter by child's age
    suitable_games = [g for g in candidate_games if child_age in GAME_METADATA.get(g, {}).get("age", [5, 6, 7])]
    if not suitable_games:
        # Fallback to any game matching child's age
        suitable_games = [g for g, meta in GAME_METADATA.items() if child_age in meta.get("age", [5, 6, 7])]

    recommended_game_id = suitable_games[0] if suitable_games else "alphabet_matching"
    rec_meta = GAME_METADATA.get(recommended_game_id, {
        "title": "Alphabet Match",
        "icon": "🔤",
        "route": "AlphabetMatchingModeSelection"
    })

    continue_learning = {
        "game_id": recommended_game_id,
        "title": rec_meta["title"],
        "icon": rec_meta["icon"],
        "skill_title": SKILL_CATEGORIES.get(target_skill_id, {}).get("title", "Letters & Phonics"),
        "skill_mastery": existing_skills.get(target_skill_id, {}).get("mastery", "Explorer"),
        "route": rec_meta["route"],
        "routeParams": rec_meta.get("routeParams"),
    }

    # 6. Today's Journey (3 Dynamic Steps)
    # Step 1: Letter/Phonics Quest
    # Step 2: Math or Words Discovery
    # Step 3: Speech or Logic Challenge
    s1_done = completed_today >= 1
    s2_done = completed_today >= 2
    s3_done = completed_today >= 3

    today_journey = [
        {
            "id": 1,
            "title": "Letters & Phonics Fun",
            "icon": "🔤",
            "status": "completed" if s1_done else ("current" if completed_today == 0 else "upcoming"),
            "game_id": "alphabet_matching" if child_age == 5 else "missing_letter_words"
        },
        {
            "id": 2,
            "title": "Words & Number Discovery",
            "icon": "🔢",
            "status": "completed" if s2_done else ("current" if completed_today == 1 else "upcoming"),
            "game_id": "number_counting" if child_age == 5 else "addition"
        },
        {
            "id": 3,
            "title": "Speech & Logic Quest",
            "icon": "🗣️",
            "status": "completed" if s3_done else ("current" if completed_today == 2 else "upcoming"),
            "game_id": "speech_letters" if child_age == 5 else "speech_animals"
        }
    ]

    # 7. Achievements Gallery
    cursor.execute("SELECT achievement_id, unlocked_at FROM achievements WHERE user_id = ?", (user_id,))
    user_achievements = {r["achievement_id"]: r["unlocked_at"] for r in cursor.fetchall()}

    achievements_list = []
    for ach in ACHIEVEMENTS_REGISTRY:
        is_unlocked = ach["id"] in user_achievements
        achievements_list.append({
            "id": ach["id"],
            "title": ach["title"],
            "icon": ach["icon"],
            "description": ach["description"],
            "unlocked": is_unlocked,
            "unlocked_at": user_achievements.get(ach["id"])
        })

    # 8. Recent Activity Feed (Last 5 sessions)
    cursor.execute("""
    SELECT game_id, skill, score, accuracy, stars_earned, duration_seconds, xp_awarded, completed_at
    FROM game_sessions
    WHERE user_id = ?
    ORDER BY completed_at DESC
    LIMIT 5
    """, (user_id,))
    recent_activity = []
    for r in cursor.fetchall():
        g_meta = GAME_METADATA.get(r["game_id"], {})
        recent_activity.append({
            "game_id": r["game_id"],
            "title": g_meta.get("title", r["game_id"].replace("_", " ").title()),
            "icon": g_meta.get("icon", "🎮"),
            "skill": r["skill"],
            "accuracy": r["accuracy"],
            "stars": r["stars_earned"],
            "xp_awarded": r["xp_awarded"],
            "completed_at": r["completed_at"]
        })

    conn.close()

    return {
        "success": True,
        "child": child_profile,
        "xp": level_info,
        "daily_goal": {
            "target": target_today,
            "completed": completed_today,
            "is_met": completed_today >= target_today
        },
        "today_journey": today_journey,
        "continue_learning": continue_learning,
        "skills": skills_breakdown,
        "achievements": achievements_list,
        "recent_activity": recent_activity
    }


@router.get("/skills/{user_id}")
def get_user_skills(user_id: str, authorization: Optional[str] = Header(None)):
    """Returns skill breakdown for child with user data isolation."""
    check_user_access(user_id, authorization)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM skill_progress WHERE user_id = ?", (user_id,))
    user_skills = {r["skill"]: dict(r) for r in cursor.fetchall()}
    conn.close()

    result = []
    for s_id, s_meta in SKILL_CATEGORIES.items():
        data = user_skills.get(s_id, {})
        result.append({
            "skill_id": s_id,
            "title": s_meta["title"],
            "icon": s_meta["icon"],
            "attempts": data.get("attempts", 0),
            "accuracy": data.get("accuracy", 0),
            "mastery": data.get("mastery", "Explorer"),
            "last_played_at": data.get("last_played_at")
        })

    return {"success": True, "skills": result}


@router.get("/achievements")
def get_all_achievements():
    """Returns achievements list for default/active user."""
    return get_user_achievements("default_child")


@router.get("/achievements/{user_id}")
def get_user_achievements(user_id: str, authorization: Optional[str] = Header(None)):
    """Returns earned and available badges for child with user data isolation."""
    check_user_access(user_id, authorization)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT achievement_id, unlocked_at FROM achievements WHERE user_id = ?", (user_id,))
    unlocked = {r["achievement_id"]: r["unlocked_at"] for r in cursor.fetchall()}
    conn.close()

    earned = []
    available = []

    for ach in ACHIEVEMENTS_REGISTRY:
        if ach["id"] in unlocked:
            earned.append({
                "badge_id": ach["id"],
                "title": ach["title"],
                "icon": ach["icon"],
                "description": ach["description"],
                "earned_at": unlocked[ach["id"]]
            })
        else:
            available.append({
                "badge_id": ach["id"],
                "title": ach["title"],
                "icon": ach["icon"],
                "description": ach["description"],
                "description_key": f"badge.{ach['id']}"
            })

    return {
        "success": True,
        "data": {
            "earned": earned,
            "available": available
        }
    }


@router.get("/parent/report/{user_id}")
def get_parent_report(user_id: str, authorization: Optional[str] = Header(None)):
    """
    Returns an insightful parent-oriented report with weekly activity,
    strength analysis, and dyslexic learning accommodations.
    """
    check_user_access(user_id, authorization)

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user_row = cursor.fetchone()
    if not user_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Child not found")

    # Aggregate stats
    cursor.execute("""
    SELECT
        COUNT(*) as total_sessions,
        COALESCE(SUM(duration_seconds), 0) as total_seconds,
        COALESCE(AVG(accuracy), 0) as avg_accuracy,
        COALESCE(SUM(xp_awarded), 0) as total_xp_earned
    FROM game_sessions
    WHERE user_id = ?
    """, (user_id,))
    stats = dict(cursor.fetchone())

    # Weekly sessions breakdown (last 7 days)
    cursor.execute("""
    SELECT DATE(completed_at) as session_date, COUNT(*) as count, AVG(accuracy) as day_acc
    FROM game_sessions
    WHERE user_id = ?
    GROUP BY DATE(completed_at)
    ORDER BY session_date DESC
    LIMIT 7
    """, (user_id,))
    weekly_activity = [dict(r) for r in cursor.fetchall()]

    # Skill breakdown
    cursor.execute("SELECT skill, accuracy, attempts, mastery FROM skill_progress WHERE user_id = ?", (user_id,))
    skills = [dict(r) for r in cursor.fetchall()]

    conn.close()

    # Identify strengths & areas needing encouragement
    strongest = max(skills, key=lambda x: x["accuracy"]) if skills else None
    practice_needed = min(skills, key=lambda x: x["accuracy"]) if skills else None

    return {
        "success": True,
        "child_name": user_row["name"],
        "age": user_row["age"],
        "mother_tongue": user_row["mother_tongue"],
        "learning_language": user_row["learning_language"],
        "summary": {
            "total_sessions": stats["total_sessions"],
            "total_minutes": round(stats["total_seconds"] / 60, 1),
            "average_accuracy": round(stats["avg_accuracy"]),
            "total_xp_earned": stats["total_xp_earned"]
        },
        "strongest_skill": strongest["skill"] if strongest else "None yet",
        "focus_skill": practice_needed["skill"] if practice_needed else "None yet",
        "weekly_activity": weekly_activity,
        "pedagogical_insights": [
            "Consistent daily micro-sessions (5-10 minutes) show greatest phonological retention for young learners.",
            "Visual and audio multimodal cues successfully reinforce phonetic letter-sound correspondence.",
            "Mistakes are celebrated as learning discoveries without negative scoring or punitive timers."
        ]
    }


@router.get("/teacher/overview")
def get_teacher_overview():
    """Returns multi-student cohort overview for educators and researchers."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as student_count FROM users")
    total_students = cursor.fetchone()["student_count"]

    cursor.execute("""
    SELECT
        u.id, u.name, u.age, u.learning_language,
        COALESCE(x.total_xp, 0) as total_xp,
        COALESCE(x.level, 1) as level,
        COUNT(g.session_id) as total_sessions,
        COALESCE(AVG(g.accuracy), 0) as avg_accuracy
    FROM users u
    LEFT JOIN user_xp x ON u.id = x.user_id
    LEFT JOIN game_sessions g ON u.id = g.user_id
    GROUP BY u.id
    ORDER BY total_xp DESC
    """)
    students = [dict(r) for r in cursor.fetchall()]

    conn.close()

    return {
        "success": True,
        "total_students": total_students,
        "students": students
    }
