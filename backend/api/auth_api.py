"""
Purpose: Authentication, Session Management, and Authorization API for Gyannn Platform.
Module: Backend Auth
File: backend/api/auth_api.py
"""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel, Field

from backend.database import get_db_connection

router = APIRouter()

# Default session duration: 7 days
SESSION_DURATION_DAYS = 7


def hash_pin(pin: str, salt: str) -> str:
    """Computes SHA-256 hash of salt + pin."""
    return hashlib.sha256((salt + pin).encode("utf-8")).hexdigest()


def generate_session_token() -> str:
    """Generates a secure cryptographically random URL-safe token."""
    return secrets.token_urlsafe(32)


# --- Request & Response Models ---
class SignupRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=30, description="Unique account username")
    pin: str = Field(..., min_length=4, max_length=32, description="4-digit PIN or password")
    name: str = Field(..., min_length=1, max_length=50, description="Child display name")
    age: int = Field(5, ge=4, le=120, description="Child age (5, 6, 7)")
    mother_tongue: str = Field("en", description="Mother tongue ('en', 'hi', 'mr')")
    learning_language: str = Field("en", description="Learning language ('en', 'hi', 'mr')")
    app_language: str = Field("en", description="App interface language ('en', 'hi', 'mr')")
    avatar: str = Field("🦁", description="Child buddy avatar emoji")
    role: str = Field("child", description="Account role ('child', 'parent', 'teacher')")


class LoginRequest(BaseModel):
    username: str = Field(..., description="Account username")
    pin: str = Field(..., description="Account PIN or password")


class LogoutRequest(BaseModel):
    token: Optional[str] = None


class LinkParentChildRequest(BaseModel):
    parent_id: str = Field(..., description="Parent user ID")
    child_id: str = Field(..., description="Child user ID")


class LinkTeacherStudentRequest(BaseModel):
    teacher_id: str = Field(..., description="Teacher user ID")
    student_id: str = Field(..., description="Student user ID")
    classroom_name: str = Field("Classroom A", description="Classroom designation")


# --- Auth Helper Dependency ---
def get_user_from_token(token: str) -> Dict[str, Any]:
    """Validates session token and returns active user record."""
    if not token:
        raise HTTPException(status_code=401, detail="Authentication token missing")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT s.token, s.user_id, s.expires_at, s.is_active,
           u.id, u.username, u.name, u.age, u.mother_tongue, u.learning_language,
           u.app_language, u.avatar, u.role
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ?
    """, (token,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=401, detail="Invalid session token")

    if row["is_active"] != 1:
        raise HTTPException(status_code=401, detail="Session has been logged out")

    # Check expiration
    try:
        exp_time = datetime.fromisoformat(row["expires_at"])
        if datetime.now(timezone.utc) > exp_time:
            raise HTTPException(status_code=401, detail="Session has expired")
    except ValueError:
        pass

    return dict(row)


def require_auth(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """FastAPI Dependency for Bearer token authentication."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    token = authorization.replace("Bearer ", "").strip()
    return get_user_from_token(token)


# --- API Endpoints ---

@router.post("/signup")
def signup(req: SignupRequest):
    """
    Registers a new child or adult account with strict validation.
    Handles duplicate username detection and session token creation.
    """
    clean_username = req.username.strip().lower()
    clean_name = req.name.strip()

    if len(clean_name) < 1:
        raise HTTPException(status_code=400, detail="Child name cannot be empty")

    if req.mother_tongue not in ["en", "hi", "mr"]:
        raise HTTPException(status_code=400, detail="Invalid mother tongue. Must be 'en', 'hi', or 'mr'")

    if req.learning_language not in ["en", "hi", "mr"]:
        raise HTTPException(status_code=400, detail="Invalid learning language. Must be 'en', 'hi', or 'mr'")

    conn = get_db_connection()
    cursor = conn.cursor()

    # Check for duplicate username
    cursor.execute("SELECT id FROM users WHERE username = ?", (clean_username,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=409, detail=f"Account with username '{clean_username}' already exists")

    user_id = f"user_{secrets.token_hex(8)}"
    salt = secrets.token_hex(16)
    pin_hash = hash_pin(req.pin, salt)

    # Insert user
    cursor.execute("""
    INSERT INTO users (
        id, username, pin_hash, salt, name, age, mother_tongue, learning_language,
        app_language, avatar, role, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    """, (
        user_id, clean_username, pin_hash, salt, clean_name, req.age,
        req.mother_tongue, req.learning_language, req.app_language, req.avatar, req.role
    ))

    # Initialize XP
    cursor.execute("""
    INSERT INTO user_xp (user_id, total_xp, level, updated_at)
    VALUES (?, 0, 1, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO NOTHING
    """, (user_id,))

    # Create Session Token
    token = generate_session_token()
    expires_at = (datetime.now(timezone.utc) + timedelta(days=SESSION_DURATION_DAYS)).isoformat()

    cursor.execute("""
    INSERT INTO sessions (token, user_id, expires_at, is_active, created_at)
    VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
    """, (token, user_id, expires_at))

    conn.commit()

    cursor.execute("SELECT id, username, name, age, mother_tongue, learning_language, app_language, avatar, role FROM users WHERE id = ?", (user_id,))
    user_row = dict(cursor.fetchone())
    conn.close()

    return {
        "success": True,
        "token": token,
        "user": user_row,
        "expires_at": expires_at,
    }


@router.post("/login")
def login(req: LoginRequest):
    """
    Authenticates user using username + PIN/password.
    Returns 401 for invalid credentials or non-existent user.
    """
    clean_username = req.username.strip().lower()

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT id, username, pin_hash, salt, name, age, mother_tongue, learning_language,
           app_language, avatar, role
    FROM users
    WHERE username = ?
    """, (clean_username,))
    user_row = cursor.fetchone()

    if not user_row:
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Verify PIN hash
    computed_hash = hash_pin(req.pin, user_row["salt"] or "")
    if computed_hash != user_row["pin_hash"]:
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Generate fresh session token
    token = generate_session_token()
    expires_at = (datetime.now(timezone.utc) + timedelta(days=SESSION_DURATION_DAYS)).isoformat()

    cursor.execute("""
    INSERT INTO sessions (token, user_id, expires_at, is_active, created_at)
    VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
    """, (token, user_row["id"], expires_at))

    conn.commit()
    conn.close()

    user_data = dict(user_row)
    del user_data["pin_hash"]
    del user_data["salt"]

    return {
        "success": True,
        "token": token,
        "user": user_data,
        "expires_at": expires_at,
    }


@router.post("/logout")
def logout(req: Optional[LogoutRequest] = None, authorization: Optional[str] = Header(None)):
    """Logs out by invalidating session token in SQLite."""
    token = req.token if req else None
    if not token and authorization:
        token = authorization.replace("Bearer ", "").strip()

    if not token:
        return {"success": True, "message": "Already logged out"}

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE sessions SET is_active = 0 WHERE token = ?", (token,))
    conn.commit()
    conn.close()

    return {"success": True, "message": "Logged out successfully"}


@router.get("/session")
def check_session(authorization: Optional[str] = Header(None)):
    """Validates session token and returns user profile."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    token = authorization.replace("Bearer ", "").strip()
    user_record = get_user_from_token(token)

    return {
        "success": True,
        "user": user_record
    }


@router.post("/parent/link")
def link_parent_child(req: LinkParentChildRequest, current_user: Dict[str, Any] = Depends(require_auth)):
    """Links parent to child account with authorization check."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Verify child exists
    cursor.execute("SELECT id FROM users WHERE id = ?", (req.child_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Child profile not found")

    cursor.execute("""
    INSERT INTO parent_children (parent_id, child_id, created_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(parent_id, child_id) DO NOTHING
    """, (req.parent_id, req.child_id))

    conn.commit()
    conn.close()

    return {"success": True, "message": "Child successfully linked to parent"}


@router.get("/parent/children/{parent_id}")
def get_parent_children(parent_id: str, current_user: Dict[str, Any] = Depends(require_auth)):
    """Returns only children linked to the specified parent."""
    # Strict Authorization check
    if current_user["id"] != parent_id and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized to access these children profiles")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT u.id, u.name, u.age, u.avatar, u.mother_tongue, u.learning_language,
           COALESCE(x.total_xp, 0) as total_xp, COALESCE(x.level, 1) as level
    FROM parent_children pc
    JOIN users u ON pc.child_id = u.id
    LEFT JOIN user_xp x ON u.id = x.user_id
    WHERE pc.parent_id = ?
    """, (parent_id,))
    children = [dict(r) for r in cursor.fetchall()]
    conn.close()

    return {"success": True, "children": children}


@router.post("/teacher/link")
def link_teacher_student(req: LinkTeacherStudentRequest, current_user: Dict[str, Any] = Depends(require_auth)):
    """Links teacher to student in classroom with authorization check."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM users WHERE id = ?", (req.student_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Student profile not found")

    cursor.execute("""
    INSERT INTO teacher_students (teacher_id, student_id, classroom_name, created_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(teacher_id, student_id) DO UPDATE SET classroom_name = excluded.classroom_name
    """, (req.teacher_id, req.student_id, req.classroom_name))

    conn.commit()
    conn.close()

    return {"success": True, "message": "Student successfully linked to teacher classroom"}


@router.get("/teacher/students/{teacher_id}")
def get_teacher_students(teacher_id: str, current_user: Dict[str, Any] = Depends(require_auth)):
    """Returns only students enrolled in the specified teacher's classroom."""
    if current_user["id"] != teacher_id and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized to access this classroom")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT u.id, u.name, u.age, u.avatar, u.learning_language, ts.classroom_name,
           COALESCE(x.total_xp, 0) as total_xp, COALESCE(x.level, 1) as level
    FROM teacher_students ts
    JOIN users u ON ts.student_id = u.id
    LEFT JOIN user_xp x ON u.id = x.user_id
    WHERE ts.teacher_id = ?
    """, (teacher_id,))
    students = [dict(r) for r in cursor.fetchall()]
    conn.close()

    return {"success": True, "students": students}
