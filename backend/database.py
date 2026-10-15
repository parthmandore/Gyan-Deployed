"""
Purpose: SQLite Database initialization and connection manager for Gyannn Child Learning Platform.
Module: Backend Database
File: backend/database.py
"""

import os
import sqlite3
from typing import Optional

DB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
DB_PATH = os.path.join(DB_DIR, "gyannn.db")

os.makedirs(DB_DIR, exist_ok=True)


def get_db_connection() -> sqlite3.Connection:
    """Returns a thread-safe sqlite3 connection with dict-like row access."""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db():
    """Initializes all database tables and indexes for the Gyannn platform."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Base Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        pin_hash TEXT,
        salt TEXT,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        mother_tongue TEXT NOT NULL DEFAULT 'en',
        learning_language TEXT NOT NULL DEFAULT 'en',
        app_language TEXT NOT NULL DEFAULT 'en',
        avatar TEXT NOT NULL DEFAULT '🦁',
        role TEXT NOT NULL DEFAULT 'child',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Check for missing columns if table already existed previously
    cursor.execute("PRAGMA table_info(users)")
    cols = {row["name"] for row in cursor.fetchall()}
    if "username" not in cols:
        cursor.execute("ALTER TABLE users ADD COLUMN username TEXT")
    if "pin_hash" not in cols:
        cursor.execute("ALTER TABLE users ADD COLUMN pin_hash TEXT")
    if "salt" not in cols:
        cursor.execute("ALTER TABLE users ADD COLUMN salt TEXT")
    if "role" not in cols:
        cursor.execute("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'child'")

    # Create index on username now that column is guaranteed
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);")

    # 2. Other Platform Tables
    cursor.executescript("""
    -- 2. Auth Sessions
    CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);

    -- 3. User XP and Level progression
    CREATE TABLE IF NOT EXISTS user_xp (
        user_id TEXT PRIMARY KEY,
        total_xp INTEGER NOT NULL DEFAULT 0,
        level INTEGER NOT NULL DEFAULT 1,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 4. Game Sessions (Strictly Idempotent by session_id)
    CREATE TABLE IF NOT EXISTS game_sessions (
        session_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        game_id TEXT NOT NULL,
        skill TEXT NOT NULL,
        score INTEGER NOT NULL DEFAULT 0,
        accuracy INTEGER NOT NULL DEFAULT 0,
        stars_earned INTEGER NOT NULL DEFAULT 1,
        duration_seconds INTEGER NOT NULL DEFAULT 0,
        xp_awarded INTEGER NOT NULL DEFAULT 0,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_game_sessions_user ON game_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_game_sessions_skill ON game_sessions(skill);

    -- 5. Skill Progress Aggregates
    CREATE TABLE IF NOT EXISTS skill_progress (
        user_id TEXT NOT NULL,
        skill TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        correct INTEGER NOT NULL DEFAULT 0,
        accuracy INTEGER NOT NULL DEFAULT 0,
        mastery TEXT NOT NULL DEFAULT 'Explorer',
        last_played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, skill),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 6. Achievements / Badges
    CREATE TABLE IF NOT EXISTS achievements (
        user_id TEXT NOT NULL,
        achievement_id TEXT NOT NULL,
        unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, achievement_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 7. Daily Goals
    CREATE TABLE IF NOT EXISTS daily_goals (
        user_id TEXT NOT NULL,
        goal_date TEXT NOT NULL,
        target_activities INTEGER NOT NULL DEFAULT 3,
        completed_activities INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, goal_date),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 8. Parent-Child Relationships
    CREATE TABLE IF NOT EXISTS parent_children (
        parent_id TEXT NOT NULL,
        child_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (parent_id, child_id),
        FOREIGN KEY (child_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 9. Teacher-Student Relationships
    CREATE TABLE IF NOT EXISTS teacher_students (
        teacher_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        classroom_name TEXT NOT NULL DEFAULT 'Classroom A',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (teacher_id, student_id),
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    conn.commit()
    conn.close()


# Ensure tables are initialized when module is loaded
init_db()
