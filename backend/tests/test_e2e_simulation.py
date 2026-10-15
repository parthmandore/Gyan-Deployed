"""
End-to-End Simulation Script for Gyannn Platform
Section 23: Complete Data Flow Verification
AUTH -> ONBOARDING -> PROFILE -> DASHBOARD -> GAME -> GAME RESULT -> PROGRESS -> XP -> REWARD -> DATABASE -> DASHBOARD REFRESH -> LOGOUT -> LOGIN
"""
import unittest
import os
import uuid
from fastapi.testclient import TestClient

# Ensure test DB is isolated
os.environ["DATABASE_PATH"] = "data/gyannn_e2e_test.db"

from main import app
from database import init_db, get_db_connection

class TestEndToEndPlatformFlow(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        if os.path.exists("data/gyannn_e2e_test.db"):
            os.remove("data/gyannn_e2e_test.db")

    def test_complete_platform_lifecycle(self):
        print("\n=== STARTING SECTION 23 END-TO-END DATA FLOW AUDIT ===")
        # Clean up test user if exists
        conn = get_db_connection()
        conn.execute("DELETE FROM users WHERE username = 'aarav_test'")
        conn.commit()
        conn.close()

        # 1. New Child Signup & Profile Creation
        signup_payload = {
            "username": "aarav_test",
            "pin": "1234",
            "role": "child",
            "name": "Aarav",
            "age": 6,
            "mother_tongue": "mr",
            "learning_language": "mr",
            "app_language": "en"
        }
        resp = self.client.post("/api/auth/signup", json=signup_payload)
        self.assertEqual(resp.status_code, 200, f"Signup failed: {resp.text}")
        data = resp.json()
        token = data["token"]
        user = data["user"]
        child_id = user["id"]
        self.assertIsNotNone(token)
        self.assertEqual(user["username"], "aarav_test")
        self.assertEqual(user["role"], "child")
        self.assertEqual(user["mother_tongue"], "mr")
        self.assertEqual(user["app_language"], "en")
        print("  [PASS] Step 1 & 2: Signup successful, session token issued.")

        headers = {"Authorization": f"Bearer {token}"}

        # 2. Verify Session Validity via Auth API
        resp = self.client.get("/api/auth/session", headers=headers)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["user"]["id"], child_id)
        print("  [PASS] Step 3: Session verified via Authorization header.")

        # 3. Initial Dashboard Fetch
        resp = self.client.get(f"/api/dashboard/{child_id}", headers=headers)
        self.assertEqual(resp.status_code, 200)
        dash = resp.json()
        self.assertEqual(dash["xp"]["total_xp"], 0, "Initial XP must be 0")
        self.assertEqual(dash["xp"]["level"], 1, "Initial Level must be 1")
        self.assertEqual(len(dash["recent_activity"]), 0, "Initial sessions must be empty")
        self.assertIn("continue_learning", dash)
        self.assertIn(dash["continue_learning"]["game_id"], ["alphabet_matching", "letter_tracing", "capital_small_match"])
        print(f"  [PASS] Step 4: Initial Dashboard verified (XP: {dash['xp']['total_xp']}, Level: {dash['xp']['level']}, Recommended Game: {dash['continue_learning']['game_id']}).")

        # 4. Child Plays Game: Alphabet Matching (100% accuracy, 45 seconds, 45 XP)
        game_session_id = f"session_{uuid.uuid4().hex[:12]}"
        game_payload = {
            "session_id": game_session_id,
            "user_id": child_id,
            "game_id": "alphabet_matching",
            "skill": "letters_phonics",
            "accuracy": 100,
            "score": 100,
            "stars_earned": 3,
            "duration_seconds": 45,
            "xp_awarded": 45
        }
        resp = self.client.post("/api/game-session", json=game_payload, headers=headers)
        self.assertEqual(resp.status_code, 200)
        record_res = resp.json()
        self.assertEqual(record_res["xp_awarded"], 45)
        self.assertEqual(record_res["new_total_xp"], 45)
        self.assertEqual(record_res["new_level"], 1)
        self.assertTrue(len(record_res["unlocked_achievements"]) >= 1, "Achievements should be unlocked")
        unlocked_ids = [a["id"] for a in record_res["unlocked_achievements"]]
        self.assertIn("first_game", unlocked_ids)
        self.assertIn("perfect_round", unlocked_ids)
        print(f"  [PASS] Step 5, 6 & 7: Game session submitted. 45 XP awarded. Achievements unlocked: {unlocked_ids}")

        # Idempotency check: Replay session
        replay_resp = self.client.post("/api/game-session", json=game_payload, headers=headers)
        self.assertEqual(replay_resp.status_code, 200)
        self.assertTrue(replay_resp.json()["already_processed"])
        self.assertEqual(replay_resp.json()["xp_awarded"], 0)
        print("  [PASS] Idempotency verified: Duplicate session submission returned 0 XP.")

        # 5. Dashboard Refresh
        resp = self.client.get(f"/api/dashboard/{child_id}", headers=headers)
        self.assertEqual(resp.status_code, 200)
        dash_refreshed = resp.json()
        self.assertEqual(dash_refreshed["xp"]["total_xp"], 45)
        self.assertEqual(dash_refreshed["xp"]["level"], 1)
        self.assertEqual(len(dash_refreshed["recent_activity"]), 1)
        self.assertEqual(dash_refreshed["recent_activity"][0]["game_id"], "alphabet_matching")
        dash_achievements = [a["id"] for a in dash_refreshed["achievements"] if a["unlocked"]]
        self.assertIn("first_game", dash_achievements)
        self.assertIn("perfect_round", dash_achievements)
        print("  [PASS] Step 8: Dashboard refreshed and confirmed accurate state.")

        # 6. Logout Child
        logout_resp = self.client.post("/api/auth/logout", headers=headers)
        self.assertEqual(logout_resp.status_code, 200)
        print("  [PASS] Step 9: Child logged out successfully.")

        # Verify old token is now rejected
        invalid_resp = self.client.get("/api/auth/session", headers=headers)
        self.assertEqual(invalid_resp.status_code, 401)
        print("  [PASS] Old token invalidated on logout (401 Unauthorized confirmed).")

        # 7. Login Child Again with credentials
        login_resp = self.client.post("/api/auth/login", json={"username": "aarav_test", "pin": "1234"})
        self.assertEqual(login_resp.status_code, 200)
        login_data = login_resp.json()
        new_token = login_data["token"]
        self.assertNotEqual(new_token, token)
        print("  [PASS] Step 10: Child logged back in, new session token generated.")

        # 8. Verify Persistence with new token
        new_headers = {"Authorization": f"Bearer {new_token}"}
        resp = self.client.get(f"/api/dashboard/{child_id}", headers=new_headers)
        self.assertEqual(resp.status_code, 200)
        persisted_dash = resp.json()
        self.assertEqual(persisted_dash["xp"]["total_xp"], 45)
        self.assertEqual(persisted_dash["xp"]["level"], 1)
        self.assertEqual(len(persisted_dash["recent_activity"]), 1)
        print("  [PASS] Step 11: All progress and database records persisted across logout/login!")
        print("=== COMPLETED SECTION 23 END-TO-END DATA FLOW AUDIT: 100% PASS ===\n")

if __name__ == "__main__":
    unittest.main()
