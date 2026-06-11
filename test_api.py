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
