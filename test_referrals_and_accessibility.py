import threading
import time
import urllib.request
import urllib.error
import json
import uvicorn
from app import app

PORT = 8002
BASE_URL = f"http://127.0.0.1:{PORT}"

class ServerThread(threading.Thread):
    def __init__(self):
        super().__init__()
        self.config = uvicorn.Config(app, host="127.0.0.1", port=PORT, log_level="warning")
        self.server = uvicorn.Server(self.config)

    def run(self):
        self.server.run()

    def shutdown(self):
        self.server.should_exit = True

server_thread = None

def start_server():
    global server_thread
    server_thread = ServerThread()
    server_thread.daemon = True
    server_thread.start()
    time.sleep(2.0)

def stop_server():
    global server_thread
    if server_thread:
        server_thread.shutdown()
        server_thread.join()

def make_request(path, method="GET", data=None):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, method=method)
    req.add_header("Content-Type", "application/json")
    
    body = None
    if data:
        body = json.dumps(data).encode("utf-8")
        
    try:
        with urllib.request.urlopen(req, data=body) as response:
            res_data = response.read().decode("utf-8")
            return response.status, json.loads(res_data)
    except urllib.error.HTTPError as e:
        res_data = e.read().decode("utf-8")
        return e.code, json.loads(res_data)

def test_referrals():
    # Log in first to get a fresh active token
    status, auth_data = make_request("/api/auth/login", "POST", {"email": "alex@sterling.com", "password": "admin123"})
    assert status == 200
    token = auth_data["token"]
    
    # 1. Test fetch referrals for valid token
    status, data = make_request(f"/api/referrals?token={token}")
    assert status == 200
    assert data["success"] is True
    assert "referral_code" in data
    assert isinstance(data["referrals"], list)
    
    # 2. Test inviting a friend (with a dynamic email)
    ref_email = f"friend_{int(time.time())}@example.com"
    invite_payload = {
        "token": token,
        "email": ref_email
    }
    status, data = make_request("/api/referrals/invite", "POST", invite_payload)
    print(f"DEBUG: Invite friend returned status={status}, data={data}")
    assert status == 200
    assert data["success"] is True
    assert "successfully sent" in data["message"]
    
    # 3. Test duplicate invite warning
    status, data = make_request("/api/referrals/invite", "POST", invite_payload)
    assert status == 200
    assert data["success"] is True
    assert "already sent" in data["message"]
    
    # 4. Re-fetch referrals and verify the list contains our referee email
    status, data = make_request(f"/api/referrals?token={token}")
    assert status == 200
    assert len(data["referrals"]) > 0
    # Find the matching referral in the list
    matching_referral = None
    for ref in data["referrals"]:
        if ref["referee_email"] == ref_email:
            matching_referral = ref
            break
    assert matching_referral is not None
    assert matching_referral["status"] == "Pending"

    # 5. Invalid token referrals fetch
    status, data = make_request("/api/referrals?token=invalid-token")
    print(f"DEBUG: Invalid token referrals fetch returned status={status}, data={data}")
    assert status == 200
    assert data["referral_code"] == ""
    assert len(data["referrals"]) == 0

    # 6. Invalid token referrals invite
    status, data = make_request("/api/referrals/invite", "POST", {"token": "invalid-token", "email": "friend@example.com"})
    assert status == 404
    assert "Session not found" in data["detail"]

if __name__ == "__main__":
    print("==================================================")
    print("   RUNNING REFERRALS & ACCESSIBILITY TESTS        ")
    print("==================================================")
    print("Starting test server thread...")
    start_server()
    try:
        print("Running: Referrals Workflow...", end="", flush=True)
        test_referrals()
        print(" [PASSED]")
        print("All supplementary verification checks passed successfully!")
    except Exception as e:
        print(" [FAILED]")
        print("Error details:", e)
        import traceback
        traceback.print_exc()
        exit(1)
    finally:
        print("Stopping test server thread...")
        stop_server()
