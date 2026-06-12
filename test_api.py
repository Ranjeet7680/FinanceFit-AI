import threading
import time
import urllib.request
import urllib.error
import json
from app import app
import uvicorn

PORT = 8001
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
    time.sleep(2.0)  # Wait for uvicorn to boot up

def stop_server():
    global server_thread
    if server_thread:
        server_thread.shutdown()
        server_thread.join()

def make_request(path, method="GET", data=None, headers=None):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, method=method)
    req.add_header("Content-Type", "application/json")
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)
    
    body = None
    if data:
        body = json.dumps(data).encode("utf-8")
        
    try:
        with urllib.request.urlopen(req, data=body) as response:
            res_data = response.read().decode("utf-8")
            return response.status, json.loads(res_data)
    except urllib.error.HTTPError as e:
        res_data = e.read().decode("utf-8")
        try:
            return e.code, json.loads(res_data)
        except Exception:
            return e.code, {"detail": res_data}

# Test functions
def test_login():
    status, data = make_request("/api/auth/login", "POST", {"email": "alex@sterling.com", "password": "admin123"})
    assert status == 200
    assert data["success"] is True
    assert "token" in data
    assert data["user"]["name"] == "Alex Sterling"

    status, data = make_request("/api/auth/login", "POST", {"email": "john@doe.com", "password": "anypassword"})
    assert status == 200
    assert data["success"] is True

def test_filters():
    status, data = make_request("/api/filters")
    assert status == 200
    assert isinstance(data["countries"], list)
    assert isinstance(data["industries"], list)
    assert isinstance(data["ratings"], list)
    assert "Japan" in data["countries"]
    assert "Technology" in data["industries"]

def test_companies():
    status, data = make_request("/api/companies?limit=5")
    assert status == 200
    assert "companies" in data
    assert "total" in data
    assert len(data["companies"]) <= 5
    
    status, data = make_request("/api/companies?q=CORP-000001")
    assert status == 200
    assert len(data["companies"]) > 0
    assert data["companies"][0]["company_id"] == "CORP-000001"

def test_predict():
    payload = {
        "revenue": 150.0,
        "profit_margin": 0.12,
        "debt_ratio": 0.50,
        "cash_flow": 25.0,
        "liquidity_ratio": 2.1,
        "market_volatility_index": 20.0,
        "operational_cost_ratio": 0.65
    }
    status, data = make_request("/api/predict", "POST", payload)
    assert status == 200
    assert "bankruptcy_risk_score" in data
    assert "default_probability" in data
    assert "contributions" in data
    assert data["risk_level"] in ["Low", "Medium", "High"]

def test_portfolio_rebalance():
    payload = {
        "items": [
            {"company_id": "CORP-000001", "amount": 600000},
            {"company_id": "CORP-000101", "amount": 300000}
        ]
    }
    status, data = make_request("/api/portfolio/rebalance", "POST", payload)
    assert status == 200
    assert "portfolio_avg_risk" in data
    assert "portfolio_avg_default_prob" in data
    assert "sector_weights" in data
    assert "projections" in data
    assert len(data["projections"]["years"]) == 5

def test_chat():
    payload = {
        "messages": [
            {"role": "user", "content": "analyze risk exposure on tech stocks"}
        ]
    }
    status, data = make_request("/api/chat", "POST", payload)
    assert status == 200
    assert data["rich_card"]["type"] == "risk_mitigation"

    payload = {
        "messages": [
            {"role": "user", "content": "predict my net worth in 2030"}
        ]
    }
    status, data = make_request("/api/chat", "POST", payload)
    assert status == 200
    assert data["rich_card"]["type"] == "net_worth_projection"

def test_upgrade():
    payload = {"token": "test-token-456"}
    status, data = make_request("/api/user/upgrade", "POST", payload)
    assert status == 200
    assert data["success"] is True
    assert data["user"]["tier"] == "Elite Tier"

def test_referral_signup():
    import time
    referee_email = f"referee_{int(time.time())}@sterling.com"
    payload = {
        "name": "Friend User",
        "email": referee_email,
        "password": "friendpassword123",
        "referral_code": "FINFIT-ALEX-1234"
    }
    status, data = make_request("/api/auth/register", "POST", payload)
    assert status == 200
    assert data["success"] is True
    assert "token" in data
    assert data["user"]["name"] == "Friend User"
    assert data["user"]["tier"] == "Elite Tier"

def test_two_factor_auth_login():
    # 1. Login to get token
    status, auth_data = make_request("/api/auth/login", "POST", {"email": "alex@sterling.com", "password": "admin123"})
    assert status == 200
    token = auth_data["token"]
    
    try:
        # 2. Setup 2FA to get the secret, then verify it to enable it
        status, data = make_request("/api/security/2fa/setup", "POST", {"token": token})
        assert status == 200
        
        status, data = make_request("/api/security/2fa/verify", "POST", {"token": token, "code": "123456"})
        assert status == 200
        
        # 3. Try to log in again. It should prompt for 2FA
        status, data = make_request("/api/auth/login", "POST", {"email": "alex@sterling.com", "password": "admin123"})
        assert status == 200
        assert data.get("two_factor_required") is True
        temp_token = data["temp_token"]
        
        # 4. Try logging in with incorrect 2FA code (e.g. non-numeric or short)
        status, data = make_request("/api/auth/login/verify-2fa", "POST", {
            "email": "alex@sterling.com",
            "temp_token": temp_token,
            "code": "123"
        })
        assert status == 400
        
        # 5. Log in with correct 2FA code
        status, data = make_request("/api/auth/login/verify-2fa", "POST", {
            "email": "alex@sterling.com",
            "temp_token": temp_token,
            "code": "123456"
        })
        assert status == 200
        assert "token" in data
        
        token = data["token"]
    finally:
        # Disable 2FA so alex isn't locked down for other tests
        make_request("/api/security/2fa/disable", "POST", {"token": token})

def test_developer_api_keys():
    # 1. Login with test@sterling.com to get a token
    status, auth_data = make_request("/api/auth/login", "POST", {"email": "test@sterling.com", "password": "test123"})
    assert status == 200
    token = auth_data["token"]
    
    # 2. Generate an API Key with 'predict' scope
    payload = {
        "token": token,
        "name": "Test Predict Key",
        "scopes": ["predict"]
    }
    status, data = make_request("/api/security/tokens/generate", "POST", payload)
    assert status == 200
    api_key = data["token"]
    
    # 3. Call predict with the API Key (valid)
    predict_payload = {
        "revenue": 150.0,
        "profit_margin": 0.12,
        "debt_ratio": 0.50,
        "cash_flow": 25.0,
        "liquidity_ratio": 2.1,
        "market_volatility_index": 20.0,
        "operational_cost_ratio": 0.65
    }
    status, data = make_request("/api/predict", "POST", predict_payload, headers={"X-API-Key": api_key})
    assert status == 200
    assert "bankruptcy_risk_score" in data

    # 4. Call predict with invalid API Key
    status, data = make_request("/api/predict", "POST", predict_payload, headers={"X-API-Key": "invalid_key"})
    assert status == 401
    
    # 5. Call companies (requires 'companies' scope) using our 'predict'-only key
    status, data = make_request("/api/companies", "GET", None, headers={"X-API-Key": api_key})
    assert status == 403


