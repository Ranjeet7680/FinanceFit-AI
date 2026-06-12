import os
import sqlite3
import pandas as pd
import numpy as np
import pickle
from sklearn.linear_model import Ridge
from sklearn.preprocessing import StandardScaler

DB_PATH = "financial_health.db"
MODEL_PATH = "ml_models.pkl"
CSV_PATH = "corporate_financial_health_bankruptcy_risk.csv"

import hashlib
import os

def hash_password(password: str, salt: bytes = None) -> tuple[str, str]:
    """Hashes a password using PBKDF2 with SHA-256 and a 16-byte salt."""
    if salt is None:
        salt = os.urandom(16)
    elif isinstance(salt, str):
        salt = bytes.fromhex(salt)
    pwd_bytes = password.encode('utf-8')
    key = hashlib.pbkdf2_hmac('sha256', pwd_bytes, salt, 100000)
    return key.hex(), salt.hex()

def init_db():
    """Initializes the SQLite database and all user security tables."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Create user and security metadata tables
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        email TEXT PRIMARY KEY,
        password_hash TEXT,
        salt TEXT,
        name TEXT,
        tier TEXT,
        referral_code TEXT
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_email TEXT,
        device TEXT,
        ip TEXT,
        location TEXT,
        active INTEGER,
        login_time TEXT,
        FOREIGN KEY(user_email) REFERENCES users(email)
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_email TEXT,
        type TEXT,
        title TEXT,
        message TEXT,
        timestamp TEXT,
        read INTEGER,
        link TEXT,
        FOREIGN KEY(user_email) REFERENCES users(email)
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_2fa (
        user_email TEXT PRIMARY KEY,
        enabled INTEGER,
        secret TEXT,
        backup_codes TEXT,
        FOREIGN KEY(user_email) REFERENCES users(email)
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_api_keys (
        id TEXT PRIMARY KEY,
        user_email TEXT,
        name TEXT,
        key_prefix TEXT,
        scopes TEXT,
        created_at TEXT,
        FOREIGN KEY(user_email) REFERENCES users(email)
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS referrals (
        id TEXT PRIMARY KEY,
        referrer_email TEXT,
        referee_email TEXT,
        code TEXT,
        status TEXT,
        timestamp TEXT,
        FOREIGN KEY(referrer_email) REFERENCES users(email)
    )
    """)

    # Seed default user profiles if table is empty
    cursor.execute("SELECT COUNT(*) FROM users")
    user_count = cursor.fetchone()[0]
    if user_count == 0:
        print("Seeding default secure user records...")
        # Prepopulate alex@sterling.com
        alex_hash, alex_salt = hash_password("admin123")
        cursor.execute(
            "INSERT INTO users (email, password_hash, salt, name, tier, referral_code) VALUES (?, ?, ?, ?, ?, ?)",
            ("alex@sterling.com", alex_hash, alex_salt, "Alex Sterling", "Elite Tier", "FINFIT-ALEX-1234")
        )
        # Prepopulate test@sterling.com
        test_hash, test_salt = hash_password("test123")
        cursor.execute(
            "INSERT INTO users (email, password_hash, salt, name, tier, referral_code) VALUES (?, ?, ?, ?, ?, ?)",
            ("test@sterling.com", test_hash, test_salt, "Test User", "Standard Tier", "FINFIT-TEST-5678")
        )
        
        # Prepopulate default notifications for Alex
        import datetime
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
        cursor.execute(
            "INSERT INTO notifications (id, user_email, type, title, message, timestamp, read, link) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            ("notif-1", "alex@sterling.com", "portfolio", "High Risk Exposure Warning", 
             "Bankruptcy Risk for CORP-000001 (Tech) is evaluated at 28.5. Sector correction risk is active.", 
             now_str, 0, "portfolio")
        )
        cursor.execute(
            "INSERT INTO notifications (id, user_email, type, title, message, timestamp, read, link) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            ("notif-2", "alex@sterling.com", "security", "MFA Setup Recommended", 
             "Secure your account with 2-Factor Authentication (TOTP). Scan code to configure now.", 
             now_str, 0, "settings")
        )
        cursor.execute(
            "INSERT INTO notifications (id, user_email, type, title, message, timestamp, read, link) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            ("notif-3", "alex@sterling.com", "system", "Intelligence Engine Upgraded", 
             "FinanceFit AI has successfully initialized the Gemini 3.5 analytics engine.", 
             now_str, 1, "chat")
        )
        
        # Prepopulate default 2FA config for both
        cursor.execute(
            "INSERT INTO user_2fa (user_email, enabled, secret, backup_codes) VALUES (?, ?, ?, ?)",
            ("alex@sterling.com", 0, "JBSWY3DPEHPK3PXP", "7732-9011,4412-8809,1290-7611,5567-3312")
        )
        cursor.execute(
            "INSERT INTO user_2fa (user_email, enabled, secret, backup_codes) VALUES (?, ?, ?, ?)",
            ("test@sterling.com", 0, "MJSXA3DPEHPK3PXP", "1122-3344,5566-7788,9900-1122,3344-5566")
        )
        
        # Prepopulate session logs
        cursor.execute(
            "INSERT INTO sessions (token, user_email, device, ip, location, active, login_time) VALUES (?, ?, ?, ?, ?, ?, ?)",
            ("elite-token-123", "alex@sterling.com", "Chrome (Windows 11)", "103.241.12.89", "Mumbai, India", 1, now_str)
        )
        cursor.execute(
            "INSERT INTO sessions (token, user_email, device, ip, location, active, login_time) VALUES (?, ?, ?, ?, ?, ?, ?)",
            ("test-token-456", "test@sterling.com", "Edge (Windows 10)", "192.168.1.5", "Local Host", 1, now_str)
        )
        
        # Prepopulate API key
        cursor.execute(
            "INSERT INTO user_api_keys (id, user_email, name, key_prefix, scopes, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            ("key-1", "alex@sterling.com", "Coaching API Production", "ff_live_5c8a...", "predict,chat", now_str)
        )

    # Check if table already exists and has data
    try:
        cursor.execute("SELECT COUNT(*) FROM companies")
        count = cursor.fetchone()[0]
        if count > 0:
            print(f"Database already initialized with {count} records.")
            conn.commit()
            conn.close()
            return
    except sqlite3.OperationalError:
        # Table doesn't exist, will create it below
        pass

    print(f"Initializing database from {CSV_PATH}... This may take a few seconds.")
    
    # Read CSV using pandas
    if not os.path.exists(CSV_PATH):
        conn.commit()
        conn.close()
        raise FileNotFoundError(f"Source CSV file not found at: {CSV_PATH}")
        
    df = pd.read_csv(CSV_PATH)
    
    # Save to SQLite
    df.to_sql("companies", conn, index=False, if_exists="replace")
    
    # Create indexes for fast querying
    print("Creating indexes on database columns...")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_company_id ON companies(company_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_country ON companies(country)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_industry ON companies(industry)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_credit_rating ON companies(credit_rating)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_risk_score ON companies(bankruptcy_risk_score)")
    
    conn.commit()
    
    cursor.execute("SELECT COUNT(*) FROM companies")
    count = cursor.fetchone()[0]
    print(f"Database successfully initialized with {count} records and indexes.")
    conn.close()

def train_models():
    """Trains a Ridge Regression model to predict bankruptcy risk and default probability."""
    if os.path.exists(MODEL_PATH):
        print("Model file already exists. Loading trained models...")
        with open(MODEL_PATH, "rb") as f:
            return pickle.load(f)
            
    print("Training predictive models on financial metrics...")
    if not os.path.exists(CSV_PATH):
        raise FileNotFoundError(f"Source CSV file not found at: {CSV_PATH}")
        
    df = pd.read_csv(CSV_PATH)
    
    # Define features and targets
    features = [
        "revenue", "profit_margin", "debt_ratio", "cash_flow", 
        "liquidity_ratio", "market_volatility_index", "operational_cost_ratio"
    ]
    
    X = df[features]
    y_risk = df["bankruptcy_risk_score"]
    y_prob = df["default_probability"]
    
    # Standardize features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Train Ridge models (extremely fast and robust against collinearity)
    model_risk = Ridge(alpha=1.0)
    model_risk.fit(X_scaled, y_risk)
    
    model_prob = Ridge(alpha=1.0)
    model_prob.fit(X_scaled, y_prob)
    
    # Save the models and scaler
    model_data = {
        "features": features,
        "scaler": scaler,
        "model_risk": model_risk,
        "model_prob": model_prob,
        "feature_importances": {
            "risk_coefs": dict(zip(features, model_risk.coef_)),
            "prob_coefs": dict(zip(features, model_prob.coef_))
        }
    }
    
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model_data, f)
        
    print("Models trained and saved successfully.")
    return model_data

def get_db_connection():
    """Returns a connection to the SQLite database."""
    if os.environ.get("VERCEL"):
        # Open database in read-only mode on Vercel
        conn = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
    else:
        conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Helper functions for querying
def query_companies(search_q=None, country=None, industry=None, rating=None, min_risk=None, max_risk=None, page=1, limit=20):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM companies WHERE 1=1"
    params = []
    
    if search_q:
        query += " AND company_id LIKE ?"
        params.append(f"%{search_q}%")
    if country:
        query += " AND country = ?"
        params.append(country)
    if industry:
        query += " AND industry = ?"
        params.append(industry)
    if rating:
        query += " AND credit_rating = ?"
        params.append(rating)
    if min_risk is not None:
        query += " AND bankruptcy_risk_score >= ?"
        params.append(min_risk)
    if max_risk is not None:
        query += " AND bankruptcy_risk_score <= ?"
        params.append(max_risk)
        
    # We want to group/filter to get latest year for general list or show all.
    # Let's get the latest year available per company for the grid list to avoid duplicates.
    # We can do this with a subquery or by ordering. Let's do a simple count first, then paginate.
    
    count_query = f"SELECT COUNT(*) FROM ({query})"
    cursor.execute(count_query, params)
    total_records = cursor.fetchone()[0]
    
    # Let's paginate the results, sorting by company_id and year DESC
    query += " ORDER BY company_id ASC, year DESC"
    query += " LIMIT ? OFFSET ?"
    params.extend([limit, (page - 1) * limit])
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    
    conn.close()
    return [dict(r) for r in rows], total_records

def get_company_history(company_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM companies WHERE company_id = ? ORDER BY year ASC", (company_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_unique_filter_values():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT DISTINCT country FROM companies ORDER BY country")
    countries = [r[0] for r in cursor.fetchall()]
    
    cursor.execute("SELECT DISTINCT industry FROM companies ORDER BY industry")
    industries = [r[0] for r in cursor.fetchall()]
    
    cursor.execute("SELECT DISTINCT credit_rating FROM companies ORDER BY credit_rating")
    ratings = [r[0] for r in cursor.fetchall()]
    
    conn.close()
    return {
        "countries": countries,
        "industries": industries,
        "ratings": ratings
    }

if __name__ == "__main__":
    init_db()
    train_models()
