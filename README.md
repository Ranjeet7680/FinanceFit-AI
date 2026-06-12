# FinanceFit AI 🚀 (Hackathon Edition)

An institutional-grade, AI-driven financial wealth management and risk audit platform designed to feel like a **Bloomberg Terminal + Zerodha + CRED + ChatGPT Financial Advisor** hybrid.

FinanceFit AI features real-time corporate credit risk modeling, dynamic portfolio rebalancing simulations, active voice and document analysis copilots, and financial digital twins forecasting wealth outcomes up to 20 years.

---

## 🌟 Core Features

### 1. 🏠 Executive Dashboard Widget Grid
Redesigned with a 3-row responsive dashboard layout displaying:
- **Top Row**: Net Worth (animated counters), Cash Flow splits, AI Financial Health score, Emergency Fund coverage, and Credit Utilization.
- **Middle Row**: Real-time asset allocation donut charts, Future Wealth digital twin forecasts, and SMART goal progress bars.
- **Bottom Row**: AI Action Center (one-click operations execution), financial news tickers, upcoming ledger bills, and portfolio risk alert logs.

### 2. 🤖 AI Coach (Voice + Chat Copilot)
- **Speech-to-Text Input**: Click the microphone to capture and transcribe voice commands directly into the AI coach input.
- **Text-to-Speech Output**: Read AI coach insights out loud automatically with synced, animating holographic wave indicators on the coach's avatar.
- **Drag-and-Drop statement parser**: Sandbox to upload transaction logs or bank statements (SBI, HDFC). Parses files locally to identify subscription leaks and dining excesses, feeding insights directly to the AI Action Center.

### 3. 📊 AI Financial Health Score (USP)
Calculates a comprehensive credit score between **0–1000** compiled from Savings, Debt, Investment, Emergency Fund, Spending Discipline, and Creditworthiness sub-scores. Includes:
- **Financial Stress Meter**: Calculates stress based on credit card debt load and savings margins.
- **Peer Standings Leaderboard**: Anonymously rates scores against peers with gamified rankings (Bronze, Silver, Gold, Platinum, Diamond badges).

### 4. 🔮 Future Forecast & Digital Twin
- **Financial Digital Twin**: Slider-driven future timeline (2026, 2031, ..., 2046) predicting Net Worth, Assets, and Debts values.
- **What-If Wealth Simulator**: Real-time compounding curves calculating retirement corpus values based on Salary, monthly SIP, expected inflation, and tax slabs.

### 5. 💰 Budget, Tax & Credit Planners
- **Budget Planner**: Balances Wants, Needs, and Savings using the 50/30/20 budget framework.
- **Tax Center**: Slab-based Regime Calculator comparing tax liabilities under Old vs New rules and NPS deduction optimization.
- **Credit & Loan Eligibility**: Predicts credit scores and details Home Loan, Car Loan, and Personal Loan caps.

### 6. 🏦 Portfolio Optimizer 2.0 & Risk simulator
- Calculates Sharpe Ratio, Alpha, and Beta metrics for virtual allocations.
- **Risk Heatmap**: Grid mapping Investments, Debt, Expenses, and Cash Flow into Green (Low), Yellow (Moderate), and Red (High) risk.
- **AI Action Center integration**: Click "Rebalance Tech" to instantly adjust virtual stock weights (trimming tech from 42% to 30%) and trigger a colorful confetti burst.

### 7. 🔐 Security & Database Hardening
- **SQLite3 Persistence**: Replaced mock in-memory stores with a multi-table SQLite schema containing `users`, `sessions`, `notifications`, `user_2fa`, `user_api_keys`, and `referrals` tables.
- **PBKDF2 Hashing**: User credentials are encrypted with unique hex-salts via SHA-256 (100,000 iterations).
- **Single-Session active lock**: Automatically invalidates concurrent older sessions upon a fresh login request.

### 8. ♿ Modern Accessibility Suite
- **High Contrast Override**: Dynamically injects high-contrast body & component styles to make elements border-solid and readable.
- **Root Text Scaling**: Adjusts root rem base layout font-sizing dynamically from 90% up to 130%.
- **Reduced Motion Toggle**: Disables heavy CPU WebGL canvas particle shaders and backgrounds.
- **TTS Speech Control**: Connected voice assistance settings to custom Vocalized Speech Speed sliders.

### 9. ✉️ Friend Referrals
- Custom user referral code displays with one-click clipboard copying.
- Dynamic email dispatch API logging referee emails, generating notification alarms, and displaying live invitation trackers.

### 10. 📝 Dedicated Policies & Iframe Embeds
- **Privacy Policy (`/privacy`) & Terms of Service (`/terms`)**: Dedicated dark-themed static pages mapping compliance, cookies, billing terms, and API scopes.
- **Demo Video Embed**: Centers the LinkedIn update walkthrough iframe inside a sleek landing showcase block.

### 11. 👥 Development Team ("Bharatiya Veer")
- Showcases team logo and cropped member avatars for:
  - Manjunath L Patat
  - SAI ASHIRBAD BEHERA
  - Gaurav Vijaykumar Gaikwad
  - Ranjeet Kumar (Leader)
- Featured on both welcome page landing blocks and application settings profiles.

---

## 🛠️ Technology Stack
- **Backend API**: Python, FastAPI, Uvicorn.
- **Machine Learning**: Scikit-Learn (Ridge regression models predicting bankruptcy risk scores and credit ratings on 288k corporate records).
- **Database**: SQLite3.
- **Frontend UI**: Vanilla HTML5, Javascript (ES6), CSS3, TailwindCSS, Chart.js.
- **WebGL Backgrounds**: Dynamic flowing shader background and aurora gradients.

---

## ⚡ Setup & Execution

### 1. Installation
Ensure Python 3.10+ is installed. Install the required dependencies:
```bash
pip install fastapi uvicorn pydantic pandas numpy scikit-learn
```

### 2. Initialize Database & Models
The server automatically initializes the SQLite database from the CSV dataset and trains the predictive ML models on startup. You can also run it manually:
```bash
python db.py
```

### 3. Run Development Server
Start the Uvicorn application thread:
```bash
python app.py
```
Or run directly through Uvicorn:
```bash
uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```

The application will be served at `http://127.0.0.1:8000/`.

---

## 🧪 Verification & Tests
Verify backend api endpoints and model training integrity:
```bash
python run_tests.py
```
All backend unit tests should report `[PASSED]`.

To run supplementary database logging and API validations for referrals and accessibility preferences:
```bash
python test_referrals_and_accessibility.py
```
All supplementary tests should output `[PASSED]`.
