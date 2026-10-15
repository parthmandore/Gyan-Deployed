"""
Unit & Integration tests for Gyannn Backend SQLite Persistence, Auth, Learning Engine,
Data Isolation, Server-Side Validation, and Parent/Teacher Authorization.
"""

import sys
import os
import unittest
import secrets
from datetime import datetime, timedelta, timezone

# Ensure backend package in path
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT_DIR = os.path.dirname(BACKEND_DIR)
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from fastapi import HTTPException
from backend.database import get_db_connection, init_db
from backend.api.learning_api import (
    create_or_update_profile,
    get_profile,
    record_game_session,
    get_child_dashboard,
    get_user_skills,
    get_user_achievements,
    get_parent_report,
    get_teacher_overview,
    calculate_level_info,
    compute_mastery,
    ProfileRequest,
    GameSessionRequest,
)
from backend.api.auth_api import (
    signup,
    login,
    logout,
    check_session,
    get_user_from_token,
    link_parent_child,
    get_parent_children,
    link_teacher_student,
    get_teacher_students,
    SignupRequest,
    LoginRequest,
    LogoutRequest,
    LinkParentChildRequest,
    LinkTeacherStudentRequest,
)

# Unique run prefix to guarantee repeatability across test invocations
RUN_ID = secrets.token_hex(4)


class TestLearningPlatformBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()

    def test_01_level_progression_formula(self):
        l0 = calculate_level_info(0)
        self.assertEqual(l0["level"], 1)
        self.assertEqual(l0["xp_in_level"], 0)
        self.assertEqual(l0["current_level_cost"], 100)

        l99 = calculate_level_info(99)
        self.assertEqual(l99["level"], 1)
        self.assertEqual(l99["xp_in_level"], 99)

        l100 = calculate_level_info(100)
        self.assertEqual(l100["level"], 2)
        self.assertEqual(l100["xp_in_level"], 0)
        self.assertEqual(l100["current_level_cost"], 150)

        l250 = calculate_level_info(250)
        self.assertEqual(l250["level"], 3)
        self.assertEqual(l250["xp_in_level"], 0)

    def test_02_mastery_computation(self):
        self.assertEqual(compute_mastery(50, 1), "Explorer")
        self.assertEqual(compute_mastery(70, 2), "Apprentice")
        self.assertEqual(compute_mastery(80, 3), "Master")
        self.assertEqual(compute_mastery(95, 5), "Champion")

    def test_03_auth_flow(self):
        username = f"child_a_{RUN_ID}"
        # 1. Signup Child A
        signup_a = signup(SignupRequest(
            username=username,
            pin="1234",
            name="Child A",
            age=5,
            mother_tongue="en",
            learning_language="hi",
            avatar="🦁"
        ))
        self.assertTrue(signup_a["success"])
        token_a = signup_a["token"]
        user_a_id = signup_a["user"]["id"]

        # 2. Duplicate Account detection
        with self.assertRaises(HTTPException) as ctx:
            signup(SignupRequest(
                username=username,
                pin="1234",
                name="Duplicate Child",
                age=5,
            ))
        self.assertEqual(ctx.exception.status_code, 409)

        # 3. Invalid credentials
        with self.assertRaises(HTTPException) as ctx:
            login(LoginRequest(username=username, pin="9999"))
        self.assertEqual(ctx.exception.status_code, 401)

        # 4. Valid Login
        login_res = login(LoginRequest(username=username, pin="1234"))
        self.assertTrue(login_res["success"])
        self.assertEqual(login_res["user"]["username"], username)
        active_token = login_res["token"]

        # 5. Session validation
        session_res = check_session(f"Bearer {active_token}")
        self.assertTrue(session_res["success"])
        self.assertEqual(session_res["user"]["id"], user_a_id)

        # 6. Logout
        logout_res = logout(LogoutRequest(token=active_token))
        self.assertTrue(logout_res["success"])

        # 7. Check invalid session after logout
        with self.assertRaises(HTTPException) as ctx:
            check_session(f"Bearer {active_token}")
        self.assertEqual(ctx.exception.status_code, 401)

    def test_04_user_data_isolation(self):
        # Create Child A
        user_a = signup(SignupRequest(
            username=f"iso_a_{RUN_ID}",
            pin="1234",
            name="Aarav",
            age=6,
            mother_tongue="en",
            learning_language="mr",
            avatar="🦁"
        ))
        token_a = user_a["token"]
        id_a = user_a["user"]["id"]

        # Create Child B
        user_b = signup(SignupRequest(
            username=f"iso_b_{RUN_ID}",
            pin="1234",
            name="Ananya",
            age=6,
            mother_tongue="mr",
            learning_language="en",
            avatar="🦉"
        ))
        token_b = user_b["token"]
        id_b = user_b["user"]["id"]

        # Child A plays a game and earns XP
        record_game_session(GameSessionRequest(
            session_id=f"session_iso_a_{RUN_ID}",
            user_id=id_a,
            game_id="alphabet_matching",
            score=50,
            accuracy=100,
            xp_awarded=45
        ), authorization=f"Bearer {token_a}")

        # Child A views own dashboard -> sees their progress
        dash_a = get_child_dashboard(id_a, authorization=f"Bearer {token_a}")
        self.assertEqual(dash_a["child"]["name"], "Aarav")
        self.assertEqual(dash_a["xp"]["total_xp"], 45)

        # Child B views own dashboard -> sees ZERO of Child A's progress
        dash_b = get_child_dashboard(id_b, authorization=f"Bearer {token_b}")
        self.assertEqual(dash_b["child"]["name"], "Ananya")
        self.assertEqual(dash_b["xp"]["total_xp"], 0)  # Exactly 0 XP!
        self.assertEqual(len(dash_b["recent_activity"]), 0)  # Exactly 0 activities!

        # Child B attempts to access Child A's dashboard -> MUST BE FORBIDDEN (403)
        with self.assertRaises(HTTPException) as ctx:
            get_child_dashboard(id_a, authorization=f"Bearer {token_b}")
        self.assertEqual(ctx.exception.status_code, 403)

        # Child A attempts to access Child B's dashboard -> MUST BE FORBIDDEN (403)
        with self.assertRaises(HTTPException) as ctx:
            get_child_dashboard(id_b, authorization=f"Bearer {token_a}")
        self.assertEqual(ctx.exception.status_code, 403)

    def test_05_session_idempotency_and_server_xp_validation(self):
        user_c = signup(SignupRequest(
            username=f"idem_{RUN_ID}",
            pin="1234",
            name="Rohan",
            age=5
        ))
        token_c = user_c["token"]
        id_c = user_c["user"]["id"]

        # First submission with huge XP attempt (server-side validation clamps to 150)
        sess_id = f"idempotent_sess_{RUN_ID}"
        req = GameSessionRequest(
            session_id=sess_id,
            user_id=id_c,
            game_id="missing_letters",
            score=40,
            accuracy=90,
            stars_earned=3,
            duration_seconds=30,
            xp_awarded=999999,  # Malicious attempt
        )
        res1 = record_game_session(req, authorization=f"Bearer {token_c}")
        self.assertFalse(res1["already_processed"])
        self.assertEqual(res1["xp_awarded"], 150)  # Clamped by server!
        self.assertEqual(res1["new_total_xp"], 150)

        # Duplicate submission with SAME session_id
        res2 = record_game_session(req, authorization=f"Bearer {token_c}")
        self.assertTrue(res2["already_processed"])
        self.assertEqual(res2["xp_awarded"], 0)  # 0 XP awarded on replay!
        self.assertEqual(res2["new_total_xp"], 150)  # Total unchanged!

    def test_06_parent_and_teacher_authorization(self):
        # 1. Create Child, Parent, Teacher
        child = signup(SignupRequest(username=f"kid_{RUN_ID}", pin="1234", name="Kiddo", age=6))["user"]
        parent = signup(SignupRequest(username=f"mom_{RUN_ID}", pin="1234", name="Mom", age=35, role="parent"))
        teacher = signup(SignupRequest(username=f"prof_{RUN_ID}", pin="1234", name="Teacher Smith", age=40, role="teacher"))

        p_token = parent["token"]
        p_id = parent["user"]["id"]
        t_token = teacher["token"]
        t_id = teacher["user"]["id"]
        c_id = child["id"]

        # Link parent -> child
        link_parent_child(LinkParentChildRequest(parent_id=p_id, child_id=c_id), current_user=parent["user"])

        # Parent queries linked child report -> allowed!
        p_children = get_parent_children(p_id, current_user=parent["user"])
        self.assertTrue(p_children["success"])
        self.assertEqual(len(p_children["children"]), 1)
        self.assertEqual(p_children["children"][0]["name"], "Kiddo")

        # Parent accesses child report directly
        rep = get_parent_report(c_id, authorization=f"Bearer {p_token}")
        self.assertTrue(rep["success"])
        self.assertEqual(rep["child_name"], "Kiddo")

        # Link teacher -> student
        link_teacher_student(LinkTeacherStudentRequest(teacher_id=t_id, student_id=c_id), current_user=teacher["user"])
        t_students = get_teacher_students(t_id, current_user=teacher["user"])
        self.assertTrue(t_students["success"])
        self.assertEqual(len(t_students["students"]), 1)
        self.assertEqual(t_students["students"][0]["name"], "Kiddo")


if __name__ == "__main__":
    unittest.main()
