// App state variables
let currentDbPage = 1;
const dbPageLimit = 15;
let activeTab = 'chat';
let dashboardAllocationChart = null;
let dashboardRiskTrendChart = null;
let modalHistoricalChart = null;
let portfolioRebalanceChart = null;

// Auth check
function checkAuth() {
    const token = localStorage.getItem('financefit_token');
    const userJson = localStorage.getItem('financefit_user');
    
    // If we're on login page, don't check auth to prevent loops
    if (window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('login')) {
        return;
    }
    
    if (!token || !userJson) {
        window.location.href = '/login';
        return;
    }
    
    const user = JSON.parse(userJson);
    document.getElementById('user-name-label').textContent = user.name;
    document.getElementById('user-tier-label').textContent = user.tier;
    document.getElementById('welcome-message').textContent = `Good morning, ${user.name.split(' ')[0]}.`;
    
    // Toggle Upgrade button visibility depending on current tier
    const upgradeContainer = document.getElementById('upgrade-pro-container');
    if (user.tier === 'Elite Tier' || user.tier === 'Pro Tier') {
        if (upgradeContainer) upgradeContainer.classList.add('hidden');
    } else {
        if (upgradeContainer) upgradeContainer.classList.remove('hidden');
    }
}

// Initializer
window.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initWebGLShader('dashboard-shader-canvas');
    setupNavigation();
    setupChat();
    setupDatabase();
    setupSimulator();
    setupPortfolio();
    setupUpgrade();
    setupVoiceCopilot();
    setupDropzone();
    setupMobileMenu();
    setupNotifications();
    setupSecurityTabs();
    
    // Load initial data for Dashboard and Database
    loadFilters();
    loadDashboardKPIs();
    loadDatabasePage(1);
    loadNotifications();
    loadTalkBackState();
    
    // Setup global company search
    document.getElementById('global-search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = e.target.value;
            if (query) {
                switchTab('database');
                document.getElementById('db-search').value = query;
                loadDatabasePage(1);
            }
        }
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('financefit_token');
        localStorage.removeItem('financefit_user');
        window.location.href = '/login';
    });
});

// View routing
function setupNavigation() {
    const tabs = {
        'dashboard': { btn: 'nav-dashboard', view: 'view-dashboard', title: 'Executive Summary' },
        'chat': { btn: 'nav-chat', view: 'view-view-chat', title: 'AI Financial Coach' },
        'health': { btn: 'nav-health', view: 'view-health', title: 'Financial Health Status' },
        'budget': { btn: 'nav-budget', view: 'view-budget', title: 'Budget Allocation Planner' },
        'investments': { btn: 'nav-investments', view: 'view-investments', title: 'Active Portfolio & Alerts' },
        'database': { btn: 'nav-database', view: 'view-database', title: 'Corporate Explorer' },
        'portfolio': { btn: 'nav-portfolio', view: 'view-portfolio', title: 'Portfolio Optimizer 2.0' },
        'simulator': { btn: 'nav-simulator', view: 'view-simulator', title: 'AI Risk Simulator & Heatmap' },
        'goals': { btn: 'nav-goals', view: 'view-goals', title: 'Smart Goal Tracker' },
        'tax': { btn: 'nav-tax', view: 'view-tax', title: 'Tax Optimization Center' },
        'credit': { btn: 'nav-credit', view: 'view-credit', title: 'Credit Insights & Scores' },
        'insurance': { btn: 'nav-insurance', view: 'view-insurance', title: 'Insurance Adequacy Analyzer' },
        'forecast': { btn: 'nav-forecast', view: 'view-forecast', title: 'Future Forecast (Digital Twin)' },
        'settings': { btn: 'nav-settings', view: 'view-settings', title: 'App Settings' }
    };
    
    Object.keys(tabs).forEach(tabKey => {
        const tab = tabs[tabKey];
        const btnEl = document.getElementById(tab.btn);
        if (btnEl) {
            btnEl.addEventListener('click', () => {
                switchTab(tabKey);
            });
        }
    });
}

function switchTab(tabKey) {
    activeTab = tabKey;
    const tabs = {
        'dashboard': { btn: 'nav-dashboard', view: 'view-dashboard', title: 'Executive Summary' },
        'chat': { btn: 'nav-chat', view: 'view-view-chat', title: 'AI Financial Coach' },
        'health': { btn: 'nav-health', view: 'view-health', title: 'Financial Health Status' },
        'budget': { btn: 'nav-budget', view: 'view-budget', title: 'Budget Allocation Planner' },
        'investments': { btn: 'nav-investments', view: 'view-investments', title: 'Active Portfolio & Alerts' },
        'database': { btn: 'nav-database', view: 'view-database', title: 'Corporate Explorer' },
        'portfolio': { btn: 'nav-portfolio', view: 'view-portfolio', title: 'Portfolio Optimizer 2.0' },
        'simulator': { btn: 'nav-simulator', view: 'view-simulator', title: 'AI Risk Simulator & Heatmap' },
        'goals': { btn: 'nav-goals', view: 'view-goals', title: 'Smart Goal Tracker' },
        'tax': { btn: 'nav-tax', view: 'view-tax', title: 'Tax Optimization Center' },
        'credit': { btn: 'nav-credit', view: 'view-credit', title: 'Credit Insights & Scores' },
        'insurance': { btn: 'nav-insurance', view: 'view-insurance', title: 'Insurance Adequacy Analyzer' },
        'forecast': { btn: 'nav-forecast', view: 'view-forecast', title: 'Future Forecast (Digital Twin)' },
        'settings': { btn: 'nav-settings', view: 'view-settings', title: 'App Settings' }
    };
    const tabTitle = tabs[tabKey]?.title || tabKey;
    speak(tabTitle + " view selected");
    
    Object.keys(tabs).forEach(k => {
        const t = tabs[k];
        const btn = document.getElementById(t.btn);
        const view = document.getElementById(t.view);
        
        if (view) {
            if (k === tabKey) {
                btn.classList.add('bg-secondary-container/20', 'text-secondary-fixed');
                btn.classList.remove('text-on-surface-variant', 'hover:bg-surface-variant/20');
                view.classList.remove('hidden');
                document.getElementById('view-title').textContent = t.title;
            } else {
                btn.classList.remove('bg-secondary-container/20', 'text-secondary-fixed');
                btn.classList.add('text-on-surface-variant', 'hover:bg-surface-variant/20');
                view.classList.add('hidden');
            }
        }
    });
    
    // Special initializations on tab open
    if (tabKey === 'dashboard') {
        renderDashboardCharts();
        animateAllCounters();
    } else if (tabKey === 'simulator') {
        runSimulation(); // load default prediction
    } else if (tabKey === 'forecast') {
        adjustTwin();
        runWhatIf();
    } else if (tabKey === 'budget') {
        adjustBudget();
    } else if (tabKey === 'tax') {
        calculateTax();
    } else if (tabKey === 'settings') {
        const userJson = localStorage.getItem('financefit_user');
        if (userJson) {
            const user = JSON.parse(userJson);
            document.getElementById('settings-tier-lbl').textContent = user.tier;
            document.getElementById('settings-username').value = user.name || '';
            document.getElementById('settings-email').value = user.email || '';
        }
    }
    
    // Scroll view to top
    document.getElementById('content-scroller').scrollTop = 0;
}

// -------------------------
// SECTION 1: AI Chat Coach
// -------------------------
function setupChat() {
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-chat-btn');
    
    const sendMessage = async () => {
        const text = chatInput.value.trim();
        if (!text) return;
        
        chatInput.value = '';
        appendMessage('user', text);
        
        // Show typing indicator
        const typingId = appendTypingIndicator();
        
        try {
            // Get history (simple)
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'user', content: text }
                    ]
                })
            });
            
            const data = await res.json();
            removeTypingIndicator(typingId);
            
            if (res.ok) {
                appendMessage('ai', data.response, data.rich_card);
            } else {
                appendMessage('ai', 'Error resolving AI request. Service anomaly detected.');
            }
        } catch (err) {
            removeTypingIndicator(typingId);
            appendMessage('ai', 'Handshake error with the core intelligence server.');
            console.error(err);
        }
    };
    
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    
    // Suggested prompts
    document.querySelectorAll('.suggested-prompt').forEach(btn => {
        btn.addEventListener('click', () => {
            chatInput.value = btn.textContent;
            sendMessage();
        });
    });

    // Recent coaching shortcuts in sidebar
    document.querySelectorAll('.coaching-shortcut').forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab('chat');
            chatInput.value = btn.getAttribute('data-prompt');
            sendMessage();
        });
    });
}

function appendMessage(role, text, richCard = null) {
    const stream = document.getElementById('chat-stream');
    const msgDiv = document.createElement('div');
    msgDiv.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'} gap-md max-w-4xl mx-auto`;
    
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (role === 'user') {
        msgDiv.innerHTML = `
            <div class="flex flex-col items-end max-w-[80%]">
                <div class="glass px-lg py-md rounded-2xl rounded-tr-none text-on-surface">
                    ${text}
                </div>
                <span class="text-[10px] text-outline mt-1 px-2">${timeString}</span>
            </div>
        `;
    } else {
        // AI message
        let cardHtml = '';
        let cardId = 'card-' + Math.random().toString(36).substr(2, 9);
        
        if (richCard) {
            if (richCard.type === 'risk_mitigation') {
                cardHtml = `
                    <div class="ai-gradient-border p-lg w-full shadow-2xl mt-md">
                        <div class="flex justify-between items-start mb-lg">
                            <div>
                                <div class="flex items-center gap-2 mb-1">
                                    <span class="px-2 py-0.5 bg-secondary/10 text-secondary border border-secondary/20 rounded-full text-[10px] font-bold uppercase tracking-wider">AI Insight</span>
                                    <span class="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider">High Risk</span>
                                </div>
                                <h4 class="font-title-md text-title-md text-on-surface">${richCard.title}</h4>
                            </div>
                            <span class="material-symbols-outlined text-outline">info</span>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-lg items-center">
                            <div class="space-y-md">
                                <div class="flex justify-between border-b border-white/5 pb-2">
                                    <span class="text-sm text-outline">Current Volatility</span>
                                    <span class="text-sm text-on-surface font-bold">${richCard.current_volatility}</span>
                                </div>
                                <div class="flex justify-between border-b border-white/5 pb-2">
                                    <span class="text-sm text-outline">Recommended Trim</span>
                                    <span class="text-sm text-secondary font-bold">${richCard.recommended_trim}</span>
                                </div>
                                <div class="flex justify-between border-b border-white/5 pb-2">
                                    <span class="text-sm text-outline">Projected Stability</span>
                                    <span class="text-sm text-primary font-bold">${richCard.projected_stability}</span>
                                </div>
                            </div>
                            <!-- Mini line chart in canvas -->
                            <div class="h-32 bg-white/5 rounded-xl border border-white/10 relative overflow-hidden group">
                                <canvas id="${cardId}-chart" class="w-full h-full"></canvas>
                                <div class="absolute top-2 right-2 text-[10px] font-mono text-secondary">LIVE MODEL</div>
                            </div>
                        </div>
                        <div class="mt-lg flex gap-md">
                            <button class="chat-action-btn flex-1 py-2 bg-secondary text-on-secondary rounded-lg font-bold text-xs hover:scale-[1.02] transition-transform" onclick="triggerRebalanceSim('${richCard.company_to_trim}')">Execute Rebalance</button>
                            <button class="chat-action-btn flex-1 py-2 glass rounded-lg font-bold text-xs hover:bg-white/10 transition-colors" onclick="switchTab('dashboard')">See Detailed Report</button>
                        </div>
                    </div>
                `;
            } else if (richCard.type === 'net_worth_projection') {
                cardHtml = `
                    <div class="ai-gradient-border p-lg w-full shadow-2xl mt-md">
                        <div class="flex justify-between items-start mb-md">
                            <div>
                                <span class="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-[10px] font-bold uppercase tracking-wider">${richCard.subtitle}</span>
                                <h4 class="font-title-md text-title-md text-on-surface mt-1">${richCard.title}</h4>
                            </div>
                        </div>
                        <div class="h-48 mt-sm">
                            <canvas id="${cardId}-chart"></canvas>
                        </div>
                    </div>
                `;
            } else if (richCard.type === 'company_analysis') {
                const statsList = Object.entries(richCard.stats).map(([k, v]) => `
                    <div class="flex justify-between border-b border-white/5 pb-1 text-xs">
                        <span class="text-outline">${k}</span>
                        <span class="text-on-surface font-semibold">${v}</span>
                    </div>
                `).join('');
                
                cardHtml = `
                    <div class="ai-gradient-border p-lg w-full shadow-2xl mt-md">
                        <div class="flex justify-between items-start mb-lg">
                            <div>
                                <span class="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-[10px] font-bold uppercase tracking-wider">${richCard.subtitle}</span>
                                <h4 class="font-title-md text-title-md text-on-surface mt-1">${richCard.title}</h4>
                            </div>
                            <button class="text-xs py-1 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-secondary" onclick="viewCompanyDetail('${richCard.title.replace('Profile: ', '')}')">
                                Detailed History
                            </button>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-lg">
                            <div class="space-y-sm">
                                ${statsList}
                            </div>
                            <div class="bg-white/5 p-md rounded-xl border border-white/10 flex flex-col justify-center items-center text-center">
                                <span class="text-[10px] text-outline uppercase">Bankruptcy Risk Score</span>
                                <span class="text-3xl font-extrabold text-secondary mt-1">${richCard.bankruptcy_risk_score}</span>
                                <span class="text-xs font-semibold text-outline mt-1">Default Prob: ${richCard.default_probability}</span>
                            </div>
                        </div>
                    </div>
                `;
            } else if (richCard.type === 'savings_plan') {
                const stepRows = richCard.steps.map(s => `
                    <tr class="border-b border-white/5 text-xs text-on-surface">
                        <td class="py-2 pr-2 font-semibold text-secondary">${s.category}</td>
                        <td class="py-2 px-2 text-outline">${s.action}</td>
                        <td class="py-2 pl-2 text-right font-bold text-primary">${s.savings}</td>
                    </tr>
                `).join('');
                cardHtml = `
                    <div class="ai-gradient-border p-lg w-full shadow-2xl mt-md">
                        <h4 class="font-title-md text-title-md text-on-surface border-b border-white/10 pb-2">${richCard.title}</h4>
                        <table class="w-full mt-md text-left">
                            <tbody>
                                ${stepRows}
                            </tbody>
                        </table>
                    </div>
                `;
            }
        }
        
        msgDiv.innerHTML = `
            <div class="w-10 h-10 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center border border-primary/30">
                <span class="material-symbols-outlined text-primary text-sm" style="font-variation-settings: 'FILL' 1;">auto_awesome</span>
            </div>
            <div class="flex flex-col items-start max-w-[90%] md:max-w-[80%] space-y-md w-full">
                <div class="glass-darker px-lg py-md rounded-2xl rounded-tl-none text-on-surface leading-relaxed w-full">
                    ${text}
                    ${cardHtml}
                </div>
                <span class="text-[10px] text-outline px-2">${timeString}</span>
            </div>
        `;
        
        stream.appendChild(msgDiv);
        
        // Render charts inside rich cards dynamically
        if (richCard) {
            setTimeout(() => {
                if (richCard.type === 'risk_mitigation') {
                    const ctx = document.getElementById(`${cardId}-chart`).getContext('2d');
                    new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: ['', '', '', '', '', ''],
                            datasets: [{
                                data: richCard.live_chart_data,
                                borderColor: '#43efae',
                                borderWidth: 2,
                                fill: true,
                                backgroundColor: 'rgba(67, 239, 174, 0.05)',
                                tension: 0.4,
                                pointRadius: 0
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: {
                                x: { display: false },
                                y: { display: false }
                            }
                        }
                    });
                } else if (richCard.type === 'net_worth_projection') {
                    const ctx = document.getElementById(`${cardId}-chart`).getContext('2d');
                    new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: richCard.projection_data.labels,
                            datasets: [
                                {
                                    label: 'Rebalanced Today',
                                    data: richCard.projection_data.rebalanced,
                                    borderColor: '#43efae',
                                    borderWidth: 2,
                                    tension: 0.3
                                },
                                {
                                    label: 'Unbalanced / Waiting',
                                    data: richCard.projection_data.waiting,
                                    borderColor: '#0052ff',
                                    borderWidth: 2,
                                    tension: 0.3
                                }
                            ]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    labels: { color: '#dae2fd', font: { size: 10 } }
                                }
                            },
                            scales: {
                                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8d90a2' } },
                                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8d90a2' } }
                            }
                        }
                    });
                }
            }, 100);
        }
    }
    
    stream.appendChild(msgDiv);
    // Auto scroll chat
    document.getElementById('content-scroller').scrollTop = document.getElementById('content-scroller').scrollHeight;
}

function appendTypingIndicator() {
    const stream = document.getElementById('chat-stream');
    const indicatorId = 'typing-' + Math.random().toString(36).substr(2, 9);
    
    const div = document.createElement('div');
    div.id = indicatorId;
    div.className = "flex justify-start gap-md max-w-4xl mx-auto";
    div.innerHTML = `
        <div class="w-10 h-10 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center border border-primary/30">
            <span class="material-symbols-outlined text-primary text-sm animate-pulse" style="font-variation-settings: 'FILL' 1;">auto_awesome</span>
        </div>
        <div class="flex items-center gap-1 bg-white/5 px-4 py-3 rounded-full">
            <div class="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div class="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div class="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></div>
        </div>
    `;
    stream.appendChild(div);
    document.getElementById('content-scroller').scrollTop = document.getElementById('content-scroller').scrollHeight;
    return indicatorId;
}

function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function triggerRebalanceSim(companyId) {
    switchTab('portfolio');
    setTimeout(() => {
        // Run optimization in optimizer screen
        document.getElementById('optimize-portfolio-btn').click();
    }, 200);
}

// -------------------------
// SECTION 2: Dashboard Summary
// -------------------------
async function loadDashboardKPIs() {
    try {
        const res = await fetch('/api/companies?min_risk=30&limit=5');
        const data = await res.json();
        if (res.ok) {
            const table = document.getElementById('risk-companies-table');
            table.innerHTML = '';
            
            data.companies.forEach(comp => {
                const tr = document.createElement('tr');
                tr.className = 'border-b border-white/5 hover:bg-white/5 transition-colors text-xs text-on-surface';
                tr.innerHTML = `
                    <td class="py-3 px-4 font-bold text-primary">${comp.company_id}</td>
                    <td class="py-3 px-4">${comp.country}</td>
                    <td class="py-3 px-4">${comp.industry}</td>
                    <td class="py-3 px-4">
                        <span class="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">${comp.credit_rating}</span>
                    </td>
                    <td class="py-3 px-4 font-bold text-red-400">${comp.bankruptcy_risk_score}</td>
                    <td class="py-3 px-4 font-mono">${(comp.default_probability * 100).toFixed(2)}%</td>
                    <td class="py-3 px-4">
                        <button class="py-1 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors" onclick="viewCompanyDetail('${comp.company_id}')">Analyze</button>
                    </td>
                `;
                table.appendChild(tr);
            });
        }
    } catch(e) {
        console.error("Error loading dashboard data", e);
    }
}

function renderDashboardCharts() {
    // Allocation Chart
    if (dashboardAllocationChart) dashboardAllocationChart.destroy();
    const allocCtx = document.getElementById('allocation-chart').getContext('2d');
    dashboardAllocationChart = new Chart(allocCtx, {
        type: 'doughnut',
        data: {
            labels: ['Technology', 'Utilities', 'Education', 'Real Estate', 'Real Cash'],
            datasets: [{
                data: [42, 22, 16, 12, 8],
                backgroundColor: ['#0052ff', '#43efae', '#c0c1ff', '#5153de', '#171f33'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#dae2fd', boxWidth: 10, font: { size: 10 } }
                }
            }
        }
    });

    // Risk Trend line chart
    if (dashboardRiskTrendChart) dashboardRiskTrendChart.destroy();
    const trendCtx = document.getElementById('risk-trend-chart').getContext('2d');
    dashboardRiskTrendChart = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: ['2021', '2022', '2023', '2024', '2025', '2026'],
            datasets: [
                {
                    label: 'Tech Corp Average',
                    data: [12.4, 15.6, 18.2, 22.4, 25.1, 28.5],
                    borderColor: '#0052ff',
                    borderWidth: 2,
                    tension: 0.3
                },
                {
                    label: 'Utilities Average',
                    data: [8.5, 9.1, 8.8, 9.4, 8.9, 9.2],
                    borderColor: '#43efae',
                    borderWidth: 2,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: '#dae2fd', font: { size: 10 } }
                }
            },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8d90a2' } },
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8d90a2' } }
            }
        }
    });
}

// -------------------------
// SECTION 3: Database Explorer
// -------------------------
async function loadFilters() {
    try {
        const res = await fetch('/api/filters');
        const data = await res.json();
        if (res.ok) {
            const countrySel = document.getElementById('filter-country');
            const industrySel = document.getElementById('filter-industry');
            const ratingSel = document.getElementById('filter-rating');
            
            data.countries.forEach(c => {
                countrySel.innerHTML += `<option value="${c}">${c}</option>`;
            });
            data.industries.forEach(i => {
                industrySel.innerHTML += `<option value="${i}">${i}</option>`;
            });
            data.ratings.forEach(r => {
                ratingSel.innerHTML += `<option value="${r}">${r}</option>`;
            });
        }
    } catch(e) {
        console.error("Filter loading failure", e);
    }
}

async function loadDatabasePage(page) {
    currentDbPage = page;
    const search = document.getElementById('db-search').value;
    const country = document.getElementById('filter-country').value;
    const industry = document.getElementById('filter-industry').value;
    const rating = document.getElementById('filter-rating').value;
    
    // Construct query parameters
    let url = `/api/companies?page=${page}&limit=${dbPageLimit}`;
    if (search) url += `&q=${encodeURIComponent(search)}`;
    if (country) url += `&country=${encodeURIComponent(country)}`;
    if (industry) url += `&industry=${encodeURIComponent(industry)}`;
    if (rating) url += `&rating=${encodeURIComponent(rating)}`;
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (res.ok) {
            const table = document.getElementById('db-companies-table');
            table.innerHTML = '';
            
            if (data.companies.length === 0) {
                table.innerHTML = `<tr><td colspan="9" class="text-center py-8 text-outline text-xs">No records found matching these criteria.</td></tr>`;
                document.getElementById('db-pagination-summary').textContent = 'Showing 0 records';
                document.getElementById('db-prev-page').disabled = true;
                document.getElementById('db-next-page').disabled = true;
                return;
            }
            
            data.companies.forEach(comp => {
                const tr = document.createElement('tr');
                tr.className = 'border-b border-white/5 hover:bg-white/5 transition-colors text-xs text-on-surface';
                
                // Color mapping for risk levels
                const riskColor = comp.bankruptcy_risk_score > 25 ? 'text-red-400' : comp.bankruptcy_risk_score > 12 ? 'text-yellow-400' : 'text-secondary';
                
                tr.innerHTML = `
                    <td class="py-3 px-4 font-bold text-primary">${comp.company_id}</td>
                    <td class="py-3 px-4">${comp.country}</td>
                    <td class="py-3 px-4">${comp.industry}</td>
                    <td class="py-3 px-4 text-outline font-mono">${comp.year}</td>
                    <td class="py-3 px-4 font-semibold">$${comp.revenue.toFixed(1)}M</td>
                    <td class="py-3 px-4">
                        <span class="px-2 py-0.5 rounded bg-white/5 border border-white/10">${comp.credit_rating}</span>
                    </td>
                    <td class="py-3 px-4 font-bold ${riskColor}">${comp.bankruptcy_risk_score.toFixed(1)}</td>
                    <td class="py-3 px-4 font-mono text-outline">${(comp.default_probability * 100).toFixed(2)}%</td>
                    <td class="py-3 px-4 text-center">
                        <button class="py-1 px-3 bg-white/5 hover:bg-white/15 border border-white/10 rounded transition-colors text-[10px] uppercase font-bold" onclick="viewCompanyDetail('${comp.company_id}')">Analyze</button>
                    </td>
                `;
                table.appendChild(tr);
            });
            
            // Update pagination UI
            const start = (page - 1) * dbPageLimit + 1;
            const end = start + data.companies.length - 1;
            document.getElementById('db-pagination-summary').textContent = `Showing ${start}-${end} of ${data.total} records`;
            document.getElementById('db-current-page').textContent = `Page ${page} of ${data.total_pages}`;
            
            document.getElementById('db-prev-page').disabled = (page === 1);
            document.getElementById('db-next-page').disabled = (page >= data.total_pages);
        }
    } catch(e) {
        console.error("Database query failed", e);
    }
}

function setupDatabase() {
    document.getElementById('apply-filters-btn').addEventListener('click', () => {
        loadDatabasePage(1);
    });
    
    document.getElementById('reset-filters-btn').addEventListener('click', () => {
        document.getElementById('db-search').value = '';
        document.getElementById('filter-country').value = '';
        document.getElementById('filter-industry').value = '';
        document.getElementById('filter-rating').value = '';
        loadDatabasePage(1);
    });
    
    document.getElementById('db-prev-page').addEventListener('click', () => {
        if (currentDbPage > 1) {
            loadDatabasePage(currentDbPage - 1);
        }
    });
    
    document.getElementById('db-next-page').addEventListener('click', () => {
        loadDatabasePage(currentDbPage + 1);
    });

    // Modal close hooks
    document.getElementById('close-modal-btn').addEventListener('click', () => {
        document.getElementById('company-detail-modal').classList.add('hidden');
    });
}

// -------------------------
// SECTION 4: Risk Simulator
// -------------------------
function setupSimulator() {
    const sliders = [
        { id: 'revenue', suffix: 'M', factor: 1, fix: 2 },
        { id: 'margin', suffix: '%', factor: 100, fix: 1 },
        { id: 'debt', suffix: '', factor: 1, fix: 2 },
        { id: 'cash', suffix: 'M', factor: 1, fix: 2 },
        { id: 'liquidity', suffix: '', factor: 1, fix: 2 },
        { id: 'volatility', suffix: '', factor: 1, fix: 2 },
        { id: 'costs', suffix: '', factor: 1, fix: 2 }
    ];
    
    sliders.forEach(s => {
        const slider = document.getElementById(`slider-${s.id}`);
        const valLabel = document.getElementById(`val-${s.id}`);
        
        slider.addEventListener('input', (e) => {
            const numVal = parseFloat(e.target.value);
            valLabel.textContent = `${(numVal * s.factor).toFixed(s.fix)}${s.suffix}`;
            runSimulation(); // Trigger predict API
        });
    });
}

// Global debouncer
let simTimeout = null;
function runSimulation() {
    if (simTimeout) clearTimeout(simTimeout);
    simTimeout = setTimeout(async () => {
        const payload = {
            revenue: parseFloat(document.getElementById('slider-revenue').value),
            profit_margin: parseFloat(document.getElementById('slider-margin').value),
            debt_ratio: parseFloat(document.getElementById('slider-debt').value),
            cash_flow: parseFloat(document.getElementById('slider-cash').value),
            liquidity_ratio: parseFloat(document.getElementById('slider-liquidity').value),
            market_volatility_index: parseFloat(document.getElementById('slider-volatility').value),
            operational_cost_ratio: parseFloat(document.getElementById('slider-costs').value)
        };
        
        try {
            const res = await fetch('/api/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                updateSimulationUI(data);
            }
        } catch(e) {
            console.error("Simulation inference error", e);
        }
    }, 150);
}

function updateSimulationUI(data) {
    const score = data.bankruptcy_risk_score;
    const prob = data.default_probability;
    const level = data.risk_level;
    
    // Update labels
    document.getElementById('gauge-score').textContent = score.toFixed(1);
    document.getElementById('gauge-prob').textContent = `${(prob * 100).toFixed(2)}%`;
    document.getElementById('gauge-level').textContent = level;
    
    // Set circle color and fill progress
    // Circular path length = 2 * PI * r = 2 * 3.14159 * 40 = 251.2
    const circle = document.getElementById('gauge-circle');
    const offset = 251.2 - (score / 100) * 251.2;
    circle.setAttribute('stroke-dashoffset', offset);
    
    // Reset colors
    circle.classList.remove('text-secondary', 'text-yellow-400', 'text-red-400');
    const levelLabel = document.getElementById('gauge-level');
    levelLabel.classList.remove('text-secondary', 'text-yellow-400', 'text-red-400');
    
    if (level === 'High') {
        circle.classList.add('text-red-400');
        levelLabel.classList.add('text-red-400');
    } else if (level === 'Medium') {
        circle.classList.add('text-yellow-400');
        levelLabel.classList.add('text-yellow-400');
    } else {
        circle.classList.add('text-secondary');
        levelLabel.classList.add('text-secondary');
    }
    
    // Render drivers list
    const driversContainer = document.getElementById('driver-bars-container');
    driversContainer.innerHTML = '';
    
    // Normalize and sort contributions
    const contribs = Object.entries(data.contributions).sort((a,b) => Math.abs(b[1]) - Math.abs(a[1]));
    
    contribs.forEach(([feat, val]) => {
        const cleanName = feat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const pct = Math.min(100, Math.max(5, Math.abs(val) * 10)); // simulated weight size
        const barColor = val > 0 ? 'bg-red-400' : 'bg-secondary';
        const sign = val > 0 ? '+' : '-';
        
        const row = document.createElement('div');
        row.className = 'space-y-1';
        row.innerHTML = `
            <div class="flex justify-between text-[11px]">
                <span class="text-outline">${cleanName}</span>
                <span class="${val > 0 ? 'text-red-400' : 'text-secondary'} font-bold">${sign}${Math.abs(val).toFixed(2)}</span>
            </div>
            <div class="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div class="h-full ${barColor}" style="width: ${pct}%"></div>
            </div>
        `;
        driversContainer.appendChild(row);
    });
}

// -------------------------
// SECTION 5: Portfolio Tracker
// -------------------------
function setupPortfolio() {
    // Detect keypress on portfolio inputs
    const inputs = document.querySelectorAll('.portfolio-val');
    inputs.forEach(input => {
        input.addEventListener('change', calculateTotalValue);
    });
    
    document.getElementById('optimize-portfolio-btn').addEventListener('click', optimizePortfolio);
    document.getElementById('execute-rebalance-btn').addEventListener('click', executeRebalance);
}

function calculateTotalValue() {
    let sum = 0;
    document.querySelectorAll('.portfolio-val').forEach(input => {
        sum += parseFloat(input.value) || 0;
    });
    document.getElementById('portfolio-total-label').textContent = `₹${sum.toLocaleString()}`;
    return sum;
}

async function optimizePortfolio() {
    const items = [];
    document.querySelectorAll('.portfolio-val').forEach(input => {
        const company_id = input.getAttribute('data-id');
        const amount = parseFloat(input.value) || 0;
        if (amount > 0) {
            items.push({ company_id, amount });
        }
    });
    
    if (items.length === 0) return;
    
    try {
        const res = await fetch('/api/portfolio/rebalance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items })
        });
        
        const data = await res.json();
        if (res.ok) {
            const container = document.getElementById('portfolio-analysis-container');
            container.classList.remove('opacity-40', 'pointer-events-none');
            
            // Set stats
            document.getElementById('rebal-avg-risk').textContent = data.portfolio_avg_risk;
            document.getElementById('rebal-avg-default').textContent = `${(data.portfolio_avg_default_prob * 100).toFixed(2)}%`;
            
            // Advisory
            const advisory = document.getElementById('rebalance-reason');
            if (data.rebalance_actions.length > 0) {
                const trim = data.rebalance_actions.find(a => a.type === 'trim');
                advisory.innerHTML = `
                    <span class="text-red-400 font-bold block mb-1">Exposure Limit Exceeded</span>
                    We identified a Sector allocation anomaly. Your Technology weighting is over the 30% cap. 
                    We suggest trimming <span class="font-bold text-on-surface">${trim.company_id}</span> by <span class="text-secondary font-bold">₹${trim.recommended_trim_amount.toLocaleString()}</span> and reallocating it to a low-risk stability vector.
                `;
            } else {
                advisory.textContent = "Your asset weighting looks healthy and within balanced criteria bounds.";
            }
            
            // Render 2030 Chart
            renderRebalanceChart(data.projections);
        }
    } catch(e) {
        console.error("Optimization query failed", e);
    }
}

function renderRebalanceChart(projs) {
    if (portfolioRebalanceChart) portfolioRebalanceChart.destroy();
    
    const ctx = document.getElementById('rebalance-chart').getContext('2d');
    portfolioRebalanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: projs.years,
            datasets: [
                {
                    label: 'Rebalanced Portfolio (8.0%)',
                    data: projs.balanced.map(p => p.value),
                    borderColor: '#43efae',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: false
                },
                {
                    label: 'Unbalanced / Waiting (5.5%)',
                    data: projs.unbalanced.map(p => p.value),
                    borderColor: '#0052ff',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#dae2fd', font: { size: 10 } }
                }
            },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8d90a2' } },
                y: { 
                    grid: { color: 'rgba(255,255,255,0.05)' }, 
                    ticks: { 
                        color: '#8d90a2',
                        callback: function(value) { return '₹' + value.toLocaleString(); }
                    } 
                }
            }
        }
    });
}

function executeRebalance() {
    const executeBtn = document.getElementById('execute-rebalance-btn');
    const oldText = executeBtn.textContent;
    
    executeBtn.disabled = true;
    executeBtn.textContent = 'Transacting Ledger...';
    
    setTimeout(() => {
        // Adjust inputs simulating rebalance
        document.querySelectorAll('.portfolio-val').forEach(input => {
            const id = input.getAttribute('data-id');
            if (id === 'CORP-000001') input.value = 350000;
            if (id === 'CORP-000101') input.value = 580000; // utility reallocation
        });
        
        calculateTotalValue();
        optimizePortfolio(); // Recalculate
        
        executeBtn.disabled = false;
        executeBtn.textContent = 'Ledger Executed ✓';
        
        setTimeout(() => {
            executeBtn.textContent = oldText;
        }, 2000);
    }, 1500);
}

// -------------------------
// Company Historical Modal
// -------------------------
async function viewCompanyDetail(companyId) {
    try {
        const res = await fetch(`/api/companies/${companyId}`);
        const history = await res.json();
        if (res.ok) {
            const latest = history[history.length - 1];
            
            // Pop fields
            document.getElementById('modal-company-title').textContent = latest.company_id;
            document.getElementById('modal-company-subtitle').textContent = `${latest.country} | Credit Rating: ${latest.credit_rating}`;
            document.getElementById('modal-industry-tag').textContent = latest.industry;
            document.getElementById('modal-risk-score').textContent = latest.bankruptcy_risk_score.toFixed(1);
            document.getElementById('modal-default-prob').textContent = (latest.default_probability * 100).toFixed(2) + '%';
            
            // Reset color of score
            const scoreLabel = document.getElementById('modal-risk-score');
            scoreLabel.classList.remove('text-secondary', 'text-yellow-400', 'text-red-400');
            if (latest.bankruptcy_risk_score > 25) {
                scoreLabel.classList.add('text-red-400');
            } else if (latest.bankruptcy_risk_score > 12) {
                scoreLabel.classList.add('text-yellow-400');
            } else {
                scoreLabel.classList.add('text-secondary');
            }

            // Stats grid
            const stats = {
                "Revenue": `$${latest.revenue.toFixed(1)}M`,
                "Profit Margin": `${(latest.profit_margin * 100).toFixed(1)}%`,
                "Debt Ratio": latest.debt_ratio.toFixed(2),
                "Cash Flow": `$${latest.cash_flow.toFixed(1)}M`,
                "Liquidity": latest.liquidity_ratio.toFixed(2),
                "Volatility": latest.market_volatility_index.toFixed(1)
            };
            const grid = document.getElementById('modal-stats-grid');
            grid.innerHTML = '';
            Object.entries(stats).forEach(([k,v]) => {
                grid.innerHTML += `
                    <div class="bg-white/5 p-sm rounded border border-white/5 text-center">
                        <span class="text-[9px] text-outline uppercase block">${k}</span>
                        <span class="text-xs font-bold text-on-surface mt-0.5 block">${v}</span>
                    </div>
                `;
            });

            // Show Modal
            document.getElementById('company-detail-modal').classList.remove('hidden');

            // Render modal historical trend
            setTimeout(() => {
                if (modalHistoricalChart) modalHistoricalChart.destroy();
                
                const years = history.map(h => h.year);
                const revenues = history.map(h => h.revenue);
                const debts = history.map(h => h.debt_ratio * 100); // Scale up debt ratio for dual scale visual
                
                const ctx = document.getElementById('modal-historical-chart').getContext('2d');
                modalHistoricalChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: years,
                        datasets: [
                            {
                                label: 'Revenue ($ Millions)',
                                data: revenues,
                                borderColor: '#0052ff',
                                borderWidth: 2,
                                tension: 0.2,
                                yAxisID: 'y'
                            },
                            {
                                label: 'Debt Ratio (%)',
                                data: debts,
                                borderColor: '#ffb4ab',
                                borderWidth: 2,
                                tension: 0.2,
                                yAxisID: 'y1'
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                labels: { color: '#dae2fd', font: { size: 10 } }
                            }
                        },
                        scales: {
                            x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8d90a2' } },
                            y: { 
                                type: 'linear',
                                display: true,
                                position: 'left',
                                grid: { color: 'rgba(255,255,255,0.05)' }, 
                                ticks: { color: '#8d90a2' } 
                            },
                            y1: {
                                type: 'linear',
                                display: true,
                                position: 'right',
                                grid: { drawOnChartArea: false }, // avoid grid overlap
                                ticks: { color: '#8d90a2' }
                            }
                        }
                    }
                });
            }, 150);
        }
    } catch(e) {
        console.error("Historical company profile query failure", e);
    }
}

// -------------------------
// SECTION 6: Upgrade to Pro
// -------------------------
function setupUpgrade() {
    const upgradeBtn = document.getElementById('upgrade-pro-btn');
    const modal = document.getElementById('upgrade-pro-modal');
    const closeBtn = document.getElementById('close-upgrade-modal-btn');
    const confirmBtn = document.getElementById('confirm-upgrade-btn');
    const statusBox = document.getElementById('upgrade-status-box');
    const statusText = document.getElementById('upgrade-status-text');
    const statusIcon = statusBox.querySelector('.material-symbols-outlined');
    
    if (!upgradeBtn) return;
    
    // Open modal
    upgradeBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
        statusBox.classList.add('hidden');
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Upgrade Account Now';
    });
    
    // Close modal
    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });
    
    // Confirm Upgrade Handshake
    confirmBtn.addEventListener('click', async () => {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Initiating Checkout...';
        
        statusBox.classList.remove('hidden');
        statusBox.className = "font-mono text-[10px] p-sm rounded bg-primary-container/10 border border-primary/20 text-primary text-left flex items-start gap-sm animate-pulse mb-4";
        statusIcon.className = "material-symbols-outlined text-sm animate-spin mt-0.5";
        statusIcon.textContent = "sync";
        statusText.textContent = "Connecting to Stripe secure banking gateway...";
        
        setTimeout(() => {
            statusText.textContent = "Stripe Session Established. Verifying billing details...";
            
            setTimeout(async () => {
                statusText.textContent = "Billing details verified. Handshaking cryptographic tokens...";
                
                try {
                    const token = localStorage.getItem('financefit_token');
                    const res = await fetch('/api/user/upgrade', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token })
                    });
                    
                    const data = await res.json();
                    
                    if (res.ok && data.success) {
                        statusBox.className = "font-mono text-[10px] p-sm rounded bg-secondary/15 border border-secondary/35 text-secondary text-left flex items-start gap-sm mb-4";
                        statusIcon.className = "material-symbols-outlined text-sm mt-0.5";
                        statusIcon.textContent = "check_circle";
                        statusText.textContent = "Transaction Successful. Elevating account permissions...";
                        
                        // Update localstorage user details
                        const userJson = localStorage.getItem('financefit_user');
                        if (userJson) {
                            const user = JSON.parse(userJson);
                            user.tier = data.user.tier;
                            localStorage.setItem('financefit_user', JSON.stringify(user));
                        }
                        
                        // Update sidebar tier text and hide container
                        document.getElementById('user-tier-label').textContent = data.user.tier;
                        
                        // Update welcome banner text
                        const userName = document.getElementById('user-name-label').textContent;
                        document.getElementById('welcome-message').textContent = `Good morning, ${userName.split(' ')[0]}.`;
                        
                        setTimeout(() => {
                            statusText.textContent = "Elite Access Granted. System active.";
                            
                            setTimeout(() => {
                                modal.classList.add('hidden');
                                const upgradeContainer = document.getElementById('upgrade-pro-container');
                                if (upgradeContainer) upgradeContainer.classList.add('hidden');
                            }, 1500);
                        }, 1200);
                        
                    } else {
                        statusBox.className = "font-mono text-[10px] p-sm rounded bg-error-container/20 border border-error/20 text-error text-left flex items-start gap-sm mb-4";
                        statusIcon.className = "material-symbols-outlined text-sm mt-0.5";
                        statusIcon.textContent = "error";
                        statusText.textContent = data.detail || "Upgrade failed. Handshake verification rejected.";
                        confirmBtn.disabled = false;
                        confirmBtn.textContent = 'Upgrade Account Now';
                    }
                } catch (err) {
                    statusBox.className = "font-mono text-[10px] p-sm rounded bg-error-container/20 border border-error/20 text-error text-left flex items-start gap-sm mb-4";
                    statusIcon.className = "material-symbols-outlined text-sm mt-0.5";
                    statusIcon.textContent = "error";
                    statusText.textContent = "Billing handshake error. Core server connection offline.";
                    confirmBtn.disabled = false;
                    confirmBtn.textContent = 'Upgrade Account Now';
                }
            }, 1500);
        }, 1200);
    });
}

// ----------------------------------------------------
// Voice Copilot (STT & TTS)
// ----------------------------------------------------
let ttsActive = true;
let handsFreeActive = false;
let recognition = null;
let isVoiceRecording = false;

function setupVoiceCopilot() {
    const voiceOutBtn = document.getElementById('toggle-voice-out-btn');
    const handsFreeBtn = document.getElementById('toggle-hands-free-btn');
    const micBtn = document.getElementById('mic-chat-btn');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-chat-btn');

    if (voiceOutBtn) {
        voiceOutBtn.addEventListener('click', () => {
            ttsActive = !ttsActive;
            if (ttsActive) {
                voiceOutBtn.classList.add('text-secondary');
                voiceOutBtn.classList.remove('text-outline');
                voiceOutBtn.querySelector('span').textContent = 'volume_up';
                voiceOutBtn.querySelector('span').nextElementSibling.textContent = 'TTS Active';
            } else {
                voiceOutBtn.classList.remove('text-secondary');
                voiceOutBtn.classList.add('text-outline');
                voiceOutBtn.querySelector('span').textContent = 'volume_off';
                voiceOutBtn.querySelector('span').nextElementSibling.textContent = 'TTS Muted';
            }
        });
    }

    if (handsFreeBtn) {
        handsFreeBtn.addEventListener('click', () => {
            handsFreeActive = !handsFreeActive;
            if (handsFreeActive) {
                handsFreeBtn.classList.add('text-secondary');
                handsFreeBtn.classList.remove('text-outline');
                handsFreeBtn.querySelector('span').textContent = 'settings_accessibility';
                handsFreeBtn.querySelector('span').nextElementSibling.textContent = 'Hands-Free On';
                speak("Hands free voice assistant activated.");
                
                // Start listening automatically
                if (!isVoiceRecording && recognition) {
                    try { recognition.start(); } catch(e) {}
                }
            } else {
                handsFreeBtn.classList.remove('text-secondary');
                handsFreeBtn.classList.add('text-outline');
                handsFreeBtn.querySelector('span').textContent = 'quick_phrases';
                handsFreeBtn.querySelector('span').nextElementSibling.textContent = 'Hands-Free Off';
                speak("Hands free voice assistant deactivated.");
                if (isVoiceRecording && recognition) {
                    try { recognition.stop(); } catch(e) {}
                }
            }
        });
    }

    // Speech Recognition setup (Speech-to-Text)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-IN';

        recognition.onstart = () => {
            isVoiceRecording = true;
            micBtn.classList.add('text-red-400', 'animate-pulse', 'border', 'border-red-400/20', 'bg-red-400/10');
            
            // Turn on visualizer wave
            const waves = document.getElementById('avatar-waves');
            const avatarIcon = document.getElementById('avatar-icon');
            if (waves) {
                waves.classList.remove('opacity-0');
                waves.classList.add('opacity-100');
            }
            if (avatarIcon) avatarIcon.classList.add('opacity-0');
        };

        recognition.onend = () => {
            isVoiceRecording = false;
            micBtn.classList.remove('text-red-400', 'animate-pulse', 'border', 'border-red-400/20', 'bg-red-400/10');
            
            // Turn off visualizer wave unless speech synthesis is currently active
            if (!window.speechSynthesis.speaking) {
                const waves = document.getElementById('avatar-waves');
                const avatarIcon = document.getElementById('avatar-icon');
                if (waves) {
                    waves.classList.add('opacity-0');
                    waves.classList.remove('opacity-100');
                }
                if (avatarIcon) avatarIcon.classList.remove('opacity-0');
            }
        };

        recognition.onresult = (event) => {
            const resultText = event.results[0][0].transcript;
            chatInput.value = resultText;
            // Send after short delay
            setTimeout(() => {
                sendBtn.click();
            }, 800);
        };

        recognition.onerror = (e) => {
            console.error("Speech Recognition Error", e);
            isVoiceRecording = false;
            micBtn.classList.remove('text-red-400', 'animate-pulse');
            
            // Restart listening in hands-free mode unless AI is speaking
            if (handsFreeActive && !window.speechSynthesis.speaking) {
                setTimeout(() => {
                    if (handsFreeActive && !isVoiceRecording) {
                        try { recognition.start(); } catch(err) {}
                    }
                }, 1000);
            }
        };

        micBtn.addEventListener('click', () => {
            if (isVoiceRecording) {
                recognition.stop();
            } else {
                recognition.start();
            }
        });
    } else {
        micBtn.addEventListener('click', () => {
            alert("Speech recognition API is not supported in this browser. Please try Chrome/Safari.");
        });
    }
}

// Speak AI response out loud (Text-to-Speech)
function speakAI(text) {
    if (!ttsActive) return;
    
    // Stop recording first to avoid speaking while microphone is hot
    if (isVoiceRecording && recognition) {
        try { recognition.stop(); } catch(e) {}
    }
    
    window.speechSynthesis.cancel(); // cancel current speak
    
    // Clean markdown before speaking
    const cleanText = text.replace(/[*#_`]/g, '').replace(/₹/g, 'Rupees ');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    const waves = document.getElementById('avatar-waves');
    const avatarIcon = document.getElementById('avatar-icon');

    utterance.onstart = () => {
        if (waves) {
            waves.classList.remove('opacity-0');
            waves.classList.add('opacity-100');
        }
        if (avatarIcon) avatarIcon.classList.add('opacity-0');
    };

    utterance.onend = () => {
        if (waves) {
            waves.classList.add('opacity-0');
            waves.classList.remove('opacity-100');
        }
        if (avatarIcon) avatarIcon.classList.remove('opacity-0');
        
        // Restart microphone automatically if in hands-free mode
        if (handsFreeActive && recognition) {
            setTimeout(() => {
                if (handsFreeActive && !isVoiceRecording) {
                    try { recognition.start(); } catch(e) {}
                }
            }, 600);
        }
    };

    window.speechSynthesis.speak(utterance);
}

// Intercept chat replies to speak out loud
const originalAppendMessage = appendMessage;
appendMessage = function(role, content, richCard) {
    originalAppendMessage(role, content, richCard);
    if (role === 'ai') {
        speakAI(content);
    }
};

// ----------------------------------------------------
// Dropzone Statement Upload Parser
// ----------------------------------------------------
function setupDropzone() {
    const dropzone = document.getElementById('statement-dropzone');
    const fileInput = document.getElementById('file-statement-input');
    const dropIcon = document.getElementById('dropzone-icon');
    const dropTitle = document.getElementById('dropzone-title');
    const dropDesc = document.getElementById('dropzone-desc');

    if (!dropzone) return;

    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropzone.classList.add('border-secondary', 'bg-secondary/10');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropzone.classList.remove('border-secondary', 'bg-secondary/10');
        }, false);
    });

    dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleStatementFiles(files);
    });

    dropzone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        handleStatementFiles(e.target.files);
    });
}

function handleStatementFiles(files) {
    if (files.length === 0) return;
    const file = files[0];
    
    const dropIcon = document.getElementById('dropzone-icon');
    const dropTitle = document.getElementById('dropzone-title');
    const dropDesc = document.getElementById('dropzone-desc');
    
    dropIcon.textContent = "sync";
    dropIcon.classList.add('animate-spin', 'text-secondary');
    dropTitle.textContent = "Scanning Document ledger...";
    dropDesc.textContent = `Reading transaction headers from ${file.name}...`;

    setTimeout(() => {
        dropTitle.textContent = "Decrypting secure records...";
        setTimeout(() => {
            dropTitle.textContent = "AI Analysis Complete!";
            dropIcon.textContent = "check_circle";
            dropIcon.classList.remove('animate-spin');
            
            // Add message from user to stream
            appendMessage('user', `Uploaded bank statement: ${file.name}`);
            
            setTimeout(() => {
                // Coach Reply
                const auditReply = `Statement audit complete for **${file.name}**. I identified standard leakage and savings vectors:\n\n` +
                                   `1. **Dining Excess**: ₹12,450 spent on dining out, which pushes your Wants allocation 20% over budget limits.\n` +
                                   `2. **Dormant Services**: Identified ₹3,500 in unused API & SaaS subscriptions.\n\n` +
                                   `I have injected appropriate optimized adjustments directly into your **AI Action Center** on the Dashboard.`;
                appendMessage('ai', auditReply);

                // Add to AI Actions list
                const actionList = document.getElementById('ai-action-list');
                if (actionList) {
                    const div = document.createElement('div');
                    div.className = "flex justify-between items-center p-1.5 bg-white/5 rounded border border-white/5 text-[10px]";
                    div.innerHTML = `
                        <span>Deactivate Unused Subscriptions (Save ₹3,500)</span>
                        <button class="px-2 py-0.5 bg-secondary text-on-secondary rounded font-bold" onclick="executeAction('TRIM_SUBS')">Run</button>
                    `;
                    actionList.appendChild(div);
                }

                // Reset dropzone
                setTimeout(() => {
                    dropIcon.textContent = "upload_file";
                    dropIcon.classList.remove('text-secondary');
                    dropTitle.textContent = "Upload Statement or PDF Report";
                    dropDesc.textContent = "Drop your bank statement (SBI, HDFC) or portfolio reports here to run AI transaction audits.";
                }, 2000);
            }, 1000);
        }, 1000);
    }, 1000);
}

// ----------------------------------------------------
// Simulators and Calculators
// ----------------------------------------------------

// 1. Digital Twin Future Projections
function adjustTwin() {
    const slider = document.getElementById('slider-digital-twin');
    if (!slider) return;
    const year = parseInt(slider.value);
    const diff = year - 2026;

    // Compound calculations (8.2% assets, -₹25K debt per year)
    const baseNet = 2540000;
    const baseAsset = 3000000;
    const baseDebt = 460000;

    const projectedAsset = baseAsset * Math.pow(1.082, diff);
    const projectedDebt = Math.max(0, baseDebt - (23000 * diff));
    const projectedNet = projectedAsset - projectedDebt;

    document.getElementById('twin-net-worth').textContent = `₹${Math.round(projectedNet/100000).toFixed(1)} Lakhs`;
    document.getElementById('twin-assets').textContent = `₹${Math.round(projectedAsset/100000).toFixed(1)} Lakhs`;
    document.getElementById('twin-debts').textContent = `₹${Math.round(projectedDebt/100000).toFixed(1)} Lakhs`;
}

// 2. What-If Projections
function runWhatIf() {
    const salary = parseFloat(document.getElementById('whatif-salary').value) || 150000;
    const sip = parseFloat(document.getElementById('whatif-sip').value) || 20000;
    const inflation = parseFloat(document.getElementById('whatif-inflation').value) || 6;
    
    // Projections for 20 years compounding at 12% equity returns minus inflation
    const rate = 0.12 - (inflation / 100);
    const months = 240;
    let corpus = 0;

    for (let i = 0; i < months; i++) {
        corpus = (corpus + sip) * (1 + rate / 12);
    }

    const corpusText = corpus > 10000000 ? `₹${(corpus/10000000).toFixed(2)} Crores` : `₹${(corpus/100000).toFixed(1)} Lakhs`;
    document.getElementById('whatif-result').textContent = `Estimated Real Retirement Corpus (Inflation Adjusted): ${corpusText}`;
}

// 3. Tax Regime Calculator
function calculateTax() {
    const gross = parseFloat(document.getElementById('tax-gross').value) || 1500000;
    const deductions = parseFloat(document.getElementById('tax-80c').value) || 150000;

    // Standard deductions
    const stdOld = 50000;
    const stdNew = 75000;

    // 1. Old Regime
    const taxableOld = Math.max(0, gross - deductions - stdOld);
    let taxOld = 0;
    if (taxableOld > 1000000) {
        taxOld = 112500 + (taxableOld - 1000000) * 0.3;
    } else if (taxableOld > 500000) {
        taxOld = 12500 + (taxableOld - 500000) * 0.2;
    } else if (taxableOld > 250000) {
        taxOld = (taxableOld - 250000) * 0.05;
    }

    // 2. New Regime Slabs
    const taxableNew = Math.max(0, gross - stdNew);
    let taxNew = 0;
    if (taxableNew > 1500000) {
        taxNew = 150000 + (taxableNew - 1500000) * 0.3;
    } else if (taxableNew > 1200000) {
        taxNew = 90000 + (taxableNew - 1200000) * 0.2;
    } else if (taxableNew > 900000) {
        taxNew = 45000 + (taxableNew - 900000) * 0.15;
    } else if (taxableNew > 600000) {
        taxNew = 15000 + (taxableNew - 600000) * 0.1;
    } else if (taxableNew > 300000) {
        taxNew = (taxableNew - 300000) * 0.05;
    }

    document.getElementById('tax-old-lbl').textContent = `₹${Math.round(taxOld).toLocaleString()}`;
    document.getElementById('tax-new-lbl').textContent = `₹${Math.round(taxNew).toLocaleString()}`;
}

// 4. Budget Slider balancer
function adjustBudget() {
    const needs = parseInt(document.getElementById('slider-budget-needs').value);
    const wants = parseInt(document.getElementById('slider-budget-wants').value);
    const savings = parseInt(document.getElementById('slider-budget-savings').value);

    // Rupee updates on monthly total income buffer (₹2,20,000)
    const income = 220000;
    const needsCash = income * needs / 100;
    const wantsCash = income * wants / 100;
    const savingsCash = income * savings / 100;

    document.getElementById('budget-val-needs').textContent = `${needs}% (₹${needsCash.toLocaleString()})`;
    document.getElementById('budget-val-wants').textContent = `${wants}% (₹${wantsCash.toLocaleString()})`;
    document.getElementById('budget-val-savings').textContent = `${savings}% (₹${savingsCash.toLocaleString()})`;

    // Check Budget Health Score
    const circle = document.getElementById('budget-health-circle');
    const lbl = document.getElementById('budget-health-lbl');
    
    if (circle) {
        // dashoffset length = 2 * PI * 38 = 238.7
        const totalAlloc = needs + wants + savings;
        const targetOffset = 238.7 - (totalAlloc / 100) * 238.7;
        circle.setAttribute('stroke-dashoffset', targetOffset);
        
        circle.classList.remove('text-secondary', 'text-yellow-400', 'text-red-400');
        if (totalAlloc !== 100) {
            circle.classList.add('text-red-400');
            lbl.textContent = "Skewed";
        } else if (savings >= 20) {
            circle.classList.add('text-secondary');
            lbl.textContent = "Excellent";
        } else if (savings >= 12) {
            circle.classList.add('text-yellow-400');
            lbl.textContent = "Balanced";
        } else {
            circle.classList.add('text-red-400');
            lbl.textContent = "Risk";
        }
    }
}

// ----------------------------------------------------
// AI Action Execution & Confetti
// ----------------------------------------------------
function executeAction(type) {
    if (type === 'SIP_BOOST') {
        const netWorthVal = document.getElementById('kpi-net-worth');
        if (netWorthVal) {
            netWorthVal.textContent = "27,40,000";
            animateCounter(netWorthVal);
        }
        alert("Action Dispatched: Monthly SIP increased by ₹2,000. Digital Wealth forecast adjusted!");
        triggerConfettiDashboard();
    } else if (type === 'REBALANCE') {
        // Rebalance asset weights
        if (dashboardAllocationChart) {
            dashboardAllocationChart.data.datasets[0].data = [30, 28, 16, 12, 14]; // rebalanced allocations
            dashboardAllocationChart.update();
        }
        alert("Action Dispatched: Rebalance ledger ledger transaction completed. Tech holdings trimmed.");
        triggerConfettiDashboard();
    } else if (type === 'TRIM_SUBS') {
        alert("Action Dispatched: Deactivated dormant subscriptions. ₹3,500 allocated to emergency fund.");
        triggerConfettiDashboard();
    }
}

function triggerConfettiDashboard() {
    // Check if window.location has triggerConfetti (we can create a temporary canvas or call parent)
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '120';
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    let particles = [];
    const colors = ['#43efae', '#0052ff', '#c0c1ff', '#5153de', '#ffb4ab'];
    
    for (let i = 0; i < 120; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            size: Math.random() * 6 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            speedY: Math.random() * 5 + 3,
            speedX: Math.random() * 4 - 2,
            rotation: Math.random() * 360,
            rotationSpeed: Math.random() * 4 - 2
        });
    }
    
    let animationFrame;
    function drawConfetti() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let active = false;
        
        particles.forEach(p => {
            p.y += p.speedY;
            p.x += p.speedX;
            p.rotation += p.rotationSpeed;
            
            if (p.y < canvas.height) {
                active = true;
            }
            
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation * Math.PI / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
            ctx.restore();
        });
        
        if (active) {
            animationFrame = requestAnimationFrame(drawConfetti);
        } else {
            canvas.remove();
            cancelAnimationFrame(animationFrame);
        }
    }
    drawConfetti();
}

// ----------------------------------------------------
// Count-Up Numbers Animation
// ----------------------------------------------------
function animateCounter(el) {
    const rawText = el.textContent;
    const cleanNum = parseFloat(rawText.replace(/,/g, ''));
    if (isNaN(cleanNum)) return;

    let start = 0;
    const duration = 1000;
    const startTime = performance.now();

    function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = start + progress * (cleanNum - start);
        
        // Format with commas
        if (rawText.includes('.')) {
            el.textContent = current.toFixed(1);
        } else {
            el.textContent = Math.floor(current).toLocaleString();
        }

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            el.textContent = rawText; // restore original exact value
        }
    }
    requestAnimationFrame(update);
}

function animateAllCounters() {
    document.querySelectorAll('.count-up').forEach(el => {
        animateCounter(el);
    });
}

// ----------------------------------------------------
// settings and Tier resetting
// ----------------------------------------------------
function resetTier() {
    const userJson = localStorage.getItem('financefit_user');
    if (userJson) {
        const user = JSON.parse(userJson);
        user.tier = "Standard Tier";
        localStorage.setItem('financefit_user', JSON.stringify(user));
        
        document.getElementById('settings-tier-lbl').textContent = user.tier;
        document.getElementById('user-tier-label').textContent = user.tier;
        
        const upgradeContainer = document.getElementById('upgrade-pro-container');
        if (upgradeContainer) upgradeContainer.classList.remove('hidden');
        
        alert("Tier reset to Standard. You can now re-test the Pro upgrade flow.");
    }
}

function saveProfileSettings() {
    const nameInput = document.getElementById('settings-username').value.trim();
    const emailInput = document.getElementById('settings-email').value.trim();
    
    if (!nameInput || !emailInput) {
        alert("Please fill in all profile fields.");
        return;
    }
    
    const userJson = localStorage.getItem('financefit_user');
    if (userJson) {
        const user = JSON.parse(userJson);
        user.name = nameInput;
        user.email = emailInput;
        localStorage.setItem('financefit_user', JSON.stringify(user));
        
        // Update user presentation layers dynamically
        document.getElementById('user-name-label').textContent = user.name;
        
        const welcomeEl = document.getElementById('welcome-message');
        if (welcomeEl) {
            welcomeEl.textContent = `Good morning, ${user.name.split(' ')[0]}.`;
        }
        
        alert("Profile settings saved successfully!");
    }
}

// Responsive Mobile Navigation Sidebar
function setupMobileMenu() {
    const sidebar = document.getElementById('sidebar-menu');
    const overlay = document.getElementById('mobile-sidebar-overlay');
    const toggleBtn = document.getElementById('mobile-menu-toggle-btn');
    const closeBtn = document.getElementById('mobile-menu-close-btn');
    
    if (!sidebar || !overlay || !toggleBtn) return;
    
    function openMenu() {
        sidebar.classList.remove('-translate-x-full');
        sidebar.classList.add('translate-x-0');
        overlay.classList.remove('hidden', 'pointer-events-none', 'opacity-0');
        overlay.classList.add('opacity-100');
    }
    
    function closeMenu() {
        sidebar.classList.remove('translate-x-0');
        sidebar.classList.add('-translate-x-full');
        overlay.classList.remove('opacity-100');
        overlay.classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => {
            if (sidebar.classList.contains('-translate-x-full')) {
                overlay.classList.add('hidden');
            }
        }, 300);
    }
    
    toggleBtn.addEventListener('click', openMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    overlay.addEventListener('click', closeMenu);
    
    // Auto-close sidebar on mobile menu selection
    const navButtons = sidebar.querySelectorAll('nav button, nav a');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (window.innerWidth < 768) {
                closeMenu();
            }
        });
    });
}

// ----------------------------------------------------
// Notifications logic (dynamic fetching & alerts dropdown)
// ----------------------------------------------------
function setupNotifications() {
    const btn = document.getElementById('notification-btn');
    const dropdown = document.getElementById('notification-dropdown');
    
    if (!btn || !dropdown) return;
    
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('hidden');
        if (!dropdown.classList.contains('hidden')) {
            dropdown.classList.add('animate-fade-in');
            loadNotifications();
        }
    });
    
    document.addEventListener('click', (e) => {
        if (!dropdown.classList.contains('hidden') && !dropdown.contains(e.target) && e.target !== btn) {
            dropdown.classList.add('hidden');
        }
    });
}

async function loadNotifications() {
    const token = localStorage.getItem('financefit_token');
    if (!token) return;
    
    try {
        const res = await fetch(`/api/notifications?token=${token}`);
        const data = await res.json();
        
        if (res.ok && data.success) {
            const listEl = document.getElementById('notification-list');
            const badgeEl = document.getElementById('notif-badge');
            listEl.innerHTML = '';
            
            let unreadCount = 0;
            
            if (data.notifications.length === 0) {
                listEl.innerHTML = `<div class="text-center py-6 text-outline text-[11px]">No notifications.</div>`;
                badgeEl.classList.add('hidden');
                return;
            }
            
            data.notifications.forEach(n => {
                if (!n.read) unreadCount++;
                
                const item = document.createElement('div');
                item.className = `p-3 rounded-xl border transition-all text-xs flex flex-col gap-1 cursor-pointer ${n.read ? 'bg-white/5 border-white/5 opacity-70' : 'bg-secondary-container/10 border-secondary/20 shadow-lg shadow-secondary/5'}`;
                item.onclick = (e) => {
                    e.stopPropagation();
                    markNotificationRead(n.id);
                    if (n.link) switchTab(n.link);
                    document.getElementById('notification-dropdown').classList.add('hidden');
                };
                
                let icon = 'notifications';
                let iconColor = 'text-primary';
                if (n.type === 'security') { icon = 'shield'; iconColor = 'text-yellow-400'; }
                if (n.type === 'portfolio') { icon = 'trending_up'; iconColor = 'text-red-400'; }
                
                item.innerHTML = `
                    <div class="flex justify-between items-start gap-2">
                        <span class="material-symbols-outlined text-[16px] ${iconColor} mt-0.5">${icon}</span>
                        <div class="flex-1">
                            <div class="font-bold text-on-surface flex items-center justify-between">
                                <span>${n.title}</span>
                                ${!n.read ? '<span class="w-1.5 h-1.5 bg-secondary rounded-full"></span>' : ''}
                            </div>
                            <p class="text-[10px] text-outline mt-0.5 leading-normal">${n.message}</p>
                            <span class="text-[8px] text-outline block mt-1">${n.timestamp}</span>
                        </div>
                        <button class="text-outline hover:text-red-400 ml-1 p-0.5" onclick="event.stopPropagation(); dismissNotification('${n.id}')">
                            <span class="material-symbols-outlined text-[12px]">close</span>
                        </button>
                    </div>
                `;
                listEl.appendChild(item);
            });
            
            if (unreadCount > 0) {
                badgeEl.classList.remove('hidden');
            } else {
                badgeEl.classList.add('hidden');
            }
        }
    } catch (err) {
        console.error("Failed to load notifications", err);
    }
}

async function markNotificationRead(id) {
    const token = localStorage.getItem('financefit_token');
    try {
        await fetch('/api/notifications/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, id })
        });
        loadNotifications();
    } catch(e) {
        console.error(e);
    }
}

async function markAllNotificationsRead() {
    const token = localStorage.getItem('financefit_token');
    try {
        await fetch('/api/notifications/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, all: true })
        });
        loadNotifications();
    } catch(e) {
        console.error(e);
    }
}

async function dismissNotification(id) {
    const token = localStorage.getItem('financefit_token');
    try {
        await fetch('/api/notifications/dismiss', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, id })
        });
        loadNotifications();
    } catch(e) {
        console.error(e);
    }
}

async function triggerDemoNotif() {
    const token = localStorage.getItem('financefit_token');
    const prompts = [
        {
            type: "security",
            title: "Simulated Login Alert",
            message: "New active authentication log detected from a Safari device in Munich, Germany.",
            link: "settings"
        },
        {
            type: "portfolio",
            title: "Portfolio Correction Risk",
            message: "Volatile adjustments in Technology indices. Run portfolio optimizer simulation.",
            link: "portfolio"
        },
        {
            type: "system",
            title: "System Performance Audit",
            message: "Micro-nodes verified. Handshake integrity evaluated at 100% operational.",
            link: "dashboard"
        }
    ];
    const item = prompts[Math.floor(Math.random() * prompts.length)];
    try {
        const res = await fetch('/api/notifications/trigger-demo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token,
                type: item.type,
                title: item.title,
                message: item.message,
                link: item.link
            })
        });
        if (res.ok) {
            loadNotifications();
            // Pulse effect animation on notifications button
            const btn = document.getElementById('notification-btn');
            btn.classList.add('animate-ping');
            setTimeout(() => btn.classList.remove('animate-ping'), 600);
        }
    } catch(e) {
        console.error(e);
    }
}

// ----------------------------------------------------
// Settings Multi-Tab Navigation
// ----------------------------------------------------
function setupSecurityTabs() {
    const tabs = document.querySelectorAll('.settings-tab-btn');
    const panels = document.querySelectorAll('.settings-panel');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-tab');
            
            // Toggle active classes on buttons
            tabs.forEach(t => {
                t.classList.remove('bg-secondary-container/20', 'text-secondary-fixed');
                t.classList.add('text-on-surface-variant', 'hover:bg-white/5');
            });
            tab.classList.add('bg-secondary-container/20', 'text-secondary-fixed');
            tab.classList.remove('text-on-surface-variant', 'hover:bg-white/5');
            
            // Toggle active panels
            panels.forEach(p => {
                if (p.id === target) {
                    p.classList.remove('hidden');
                } else {
                    p.classList.add('hidden');
                }
            });
            
            // Hook load data depending on tab
            if (target === 'settings-security') {
                load2FAState();
                loadSessions();
            } else if (target === 'settings-api') {
                loadTokens();
            } else if (target === 'settings-privacy') {
                loadEncryptionStateLabel();
            }
        });
    });
}

// ----------------------------------------------------
// 2-Factor Authentication (TOTP)
// ----------------------------------------------------
async function load2FAState() {
    const token = localStorage.getItem('financefit_token');
    if (!token) return;
    
    try {
        const res = await fetch('/api/security/2fa/setup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });
        const data = await res.json();
        
        if (res.ok && data.success) {
            document.getElementById('2fa-secret').textContent = data.secret;
            // Draw beautiful QR Canvas
            drawQR('2fa-qr-canvas');
        }
    } catch (e) {
        console.error(e);
    }
}

async function toggle2FAState() {
    const toggle = document.getElementById('2fa-toggle');
    const setupBox = document.getElementById('2fa-setup-box');
    const backupBox = document.getElementById('2fa-backup-box');
    const statusLbl = document.getElementById('2fa-status-lbl');
    const token = localStorage.getItem('financefit_token');
    
    if (toggle.checked) {
        // Show setup container
        setupBox.classList.remove('hidden');
        backupBox.classList.add('hidden');
    } else {
        // Disable 2FA
        try {
            const res = await fetch('/api/security/2fa/disable', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });
            if (res.ok) {
                setupBox.classList.add('hidden');
                backupBox.classList.add('hidden');
                statusLbl.textContent = "TOTP Multi-factor is inactive";
                statusLbl.parentElement.className = "flex items-center gap-1 text-[10px] text-secondary font-mono mt-3 border-t border-white/5 pt-3";
                alert("Two-Factor authentication successfully disabled.");
                loadNotifications();
            }
        } catch(e) {
            console.error(e);
        }
    }
}

async function submitVerify2FA() {
    const code = document.getElementById('2fa-code-input').value.trim();
    const token = localStorage.getItem('financefit_token');
    const statusLbl = document.getElementById('2fa-status-lbl');
    
    if (!code) {
        alert("Please enter verification code.");
        return;
    }
    
    try {
        const res = await fetch('/api/security/2fa/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, code })
        });
        const data = await res.json();
        
        if (res.ok && data.success) {
            document.getElementById('2fa-setup-box').classList.add('hidden');
            document.getElementById('2fa-backup-box').classList.remove('hidden');
            statusLbl.textContent = "TOTP Multi-factor is active";
            statusLbl.parentElement.className = "flex items-center gap-1 text-[10px] text-secondary font-bold font-mono mt-3 border-t border-white/5 pt-3";
            
            // Trigger premium confetti success!
            triggerConfettiEffect();
            loadNotifications();
        } else {
            alert(data.detail || "Invalid code. Please try 123456.");
        }
    } catch(err) {
        alert("Verification failed. Server offline.");
    }
}

// Stylized QR code builder on canvas
function drawQR(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#0b1326'; // Dark blue finder patterns
    const size = canvas.width;
    const moduleSize = size / 21;
    
    const finders = [
        {x: 0, y: 0},
        {x: 14 * moduleSize, y: 0},
        {x: 0, y: 14 * moduleSize}
    ];
    
    finders.forEach(f => {
        ctx.fillRect(f.x, f.y, 7 * moduleSize, 7 * moduleSize);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(f.x + moduleSize, f.y + moduleSize, 5 * moduleSize, 5 * moduleSize);
        ctx.fillStyle = '#0b1326';
        ctx.fillRect(f.x + 2 * moduleSize, f.y + 2 * moduleSize, 3 * moduleSize, 3 * moduleSize);
    });
    
    ctx.fillStyle = '#0b1326';
    for (let r = 0; r < 21; r++) {
        for (let c = 0; c < 21; c++) {
            if ((r < 8 && c < 8) || (r < 8 && c > 12) || (r > 12 && c < 8)) continue;
            if (Math.random() > 0.4) {
                ctx.fillRect(c * moduleSize, r * moduleSize, moduleSize, moduleSize);
            }
        }
    }
}

// Confetti micro-interaction
function triggerConfettiEffect() {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.inset = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '999';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    const colors = ['#43efae', '#0052ff', '#c0c1ff', '#56febc'];
    const particles = [];
    
    for (let i = 0; i < 60; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            speedY: Math.random() * 4 + 2,
            speedX: Math.random() * 2 - 1,
            size: Math.random() * 6 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * 360,
            rotationSpeed: Math.random() * 4 - 2
        });
    }
    
    let frame;
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let active = false;
        particles.forEach(p => {
            p.y += p.speedY;
            p.x += p.speedX;
            p.rotation += p.rotationSpeed;
            if (p.y < canvas.height) active = true;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation * Math.PI / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
            ctx.restore();
        });
        if (active) {
            frame = requestAnimationFrame(draw);
        } else {
            canvas.remove();
            cancelAnimationFrame(frame);
        }
    }
    draw();
}

// ----------------------------------------------------
// Session Log Tracker
// ----------------------------------------------------
async function loadSessions() {
    const token = localStorage.getItem('financefit_token');
    if (!token) return;
    
    try {
        const res = await fetch(`/api/security/sessions?token=${token}`);
        const data = await res.json();
        
        if (res.ok && data.success) {
            const list = document.getElementById('session-log-list');
            list.innerHTML = '';
            
            data.sessions.forEach(s => {
                const el = document.createElement('div');
                el.className = "flex justify-between items-center bg-white/5 border border-white/5 rounded-xl p-md text-xs mt-2";
                
                el.innerHTML = `
                    <div class="flex items-start gap-md text-left">
                        <span class="material-symbols-outlined text-[20px] text-primary mt-1">${s.device.includes('iPhone') || s.device.includes('Mobile') ? 'smartphone' : 'laptop_mac'}</span>
                        <div>
                            <div class="font-bold text-on-surface flex items-center gap-2">
                                <span>${s.device}</span>
                                ${s.active ? '<span class="px-1.5 py-0.5 bg-secondary/15 text-secondary border border-secondary/35 rounded-full text-[8px] uppercase tracking-wider font-bold">Active now</span>' : ''}
                            </div>
                            <span class="text-[10px] text-outline block mt-0.5">${s.ip} • ${s.location}</span>
                            <span class="text-[9px] text-outline/70 block mt-1">Logged: ${s.login_time}</span>
                        </div>
                    </div>
                    ${!s.active ? `<button class="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 text-red-400 text-[10px] font-bold rounded-lg transition-all" onclick="revokeSession('${s.id}')">Revoke</button>` : ''}
                `;
                list.appendChild(el);
            });
        }
    } catch(err) {
        console.error(err);
    }
}

async function revokeSession(sessionId) {
    const token = localStorage.getItem('financefit_token');
    try {
        const res = await fetch('/api/security/sessions/revoke', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, session_id: sessionId })
        });
        if (res.ok) {
            loadSessions();
        }
    } catch(e) {
        console.error(e);
    }
}

// ----------------------------------------------------
// Developer Access Keys Management
// ----------------------------------------------------
async function loadTokens() {
    const token = localStorage.getItem('financefit_token');
    if (!token) return;
    
    try {
        const res = await fetch(`/api/security/tokens?token=${token}`);
        const data = await res.json();
        
        if (res.ok && data.success) {
            const body = document.getElementById('api-keys-table-body');
            body.innerHTML = '';
            
            if (data.tokens.length === 0) {
                body.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-outline text-xs">No active keys generated.</td></tr>`;
                return;
            }
            
            data.tokens.forEach(t => {
                const tr = document.createElement('tr');
                tr.className = "border-b border-white/5 text-xs text-on-surface hover:bg-white/5 transition-colors";
                
                const scopesBadges = t.scopes.map(s => `<span class="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded font-mono text-[9px] text-secondary mr-1">${s}</span>`).join('');
                
                tr.innerHTML = `
                    <td class="py-3 font-semibold text-left">${t.name}</td>
                    <td class="py-3 font-mono text-outline text-left">${t.key_prefix}</td>
                    <td class="py-3 text-left">${scopesBadges}</td>
                    <td class="py-3 text-outline font-mono text-left">${t.created_at}</td>
                    <td class="py-3 text-right">
                        <button class="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 text-red-400 text-[10px] font-bold rounded-lg transition-all" onclick="revokeToken('${t.id}')">Revoke</button>
                    </td>
                `;
                body.appendChild(tr);
            });
        }
    } catch(err) {
        console.error(err);
    }
}

function openKeyGenerator() {
    document.getElementById('key-gen-box').classList.remove('hidden');
    document.getElementById('key-display-box').classList.add('hidden');
    document.getElementById('api-key-name').value = '';
}

function closeKeyGenerator() {
    document.getElementById('key-gen-box').classList.add('hidden');
}

async function submitGenerateKey() {
    const name = document.getElementById('api-key-name').value.trim();
    const token = localStorage.getItem('financefit_token');
    
    if (!name) {
        alert("Please specify key name.");
        return;
    }
    
    const scopes = [];
    document.querySelectorAll('#key-gen-box input[type="checkbox"]:checked').forEach(c => {
        scopes.push(c.value);
    });
    
    try {
        const res = await fetch('/api/security/tokens/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, name, scopes })
        });
        const data = await res.json();
        
        if (res.ok && data.success) {
            document.getElementById('key-gen-box').classList.add('hidden');
            document.getElementById('key-display-box').classList.remove('hidden');
            document.getElementById('api-token-secret').textContent = data.token;
            
            loadTokens();
            loadNotifications();
        }
    } catch(e) {
        console.error(e);
    }
}

async function revokeToken(keyId) {
    const token = localStorage.getItem('financefit_token');
    try {
        const res = await fetch('/api/security/tokens/revoke', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, key_id: keyId })
        });
        if (res.ok) {
            loadTokens();
        }
    } catch(e) {
        console.error(e);
    }
}

// Helper utility: Copy text to clipboard
function copyText(elementId) {
    const text = document.getElementById(elementId).textContent || document.getElementById(elementId).value;
    navigator.clipboard.writeText(text).then(() => {
        alert("Copied to clipboard!");
    }).catch(err => {
        console.error("Copy failed", err);
    });
}

// ----------------------------------------------------
// Data & Privacy Toggles and Simulation
// ----------------------------------------------------
function loadEncryptionStateLabel() {
    const toggle = document.getElementById('encryption-toggle');
    const label = document.getElementById('encryption-status-lbl');
    const isEncrypted = localStorage.getItem('financefit_enc') === 'true';
    toggle.checked = isEncrypted;
    
    if (isEncrypted) {
        label.textContent = "Database is encrypted (AES-256 Active)";
        label.parentElement.className = "flex items-center gap-1 text-[10px] text-secondary font-bold font-mono mt-3 border-t border-white/5 pt-3";
    } else {
        label.textContent = "Database is unencrypted";
        label.parentElement.className = "flex items-center gap-1 text-[10px] text-secondary font-mono mt-3 border-t border-white/5 pt-3";
    }
}

function toggleEncryptionState() {
    const toggle = document.getElementById('encryption-toggle');
    const radar = document.getElementById('encryption-radar');
    const label = document.getElementById('encryption-status-lbl');
    
    if (toggle.checked) {
        radar.classList.remove('hidden');
        radar.classList.add('flex');
        
        setTimeout(() => {
            radar.classList.add('hidden');
            radar.classList.remove('flex');
            localStorage.setItem('financefit_enc', 'true');
            
            label.textContent = "Database is encrypted (AES-256 Active)";
            label.parentElement.className = "flex items-center gap-1 text-[10px] text-secondary font-bold font-mono mt-3 border-t border-white/5 pt-3";
            alert("Local storage data encrypted and signed successfully.");
        }, 3000);
    } else {
        localStorage.setItem('financefit_enc', 'false');
        label.textContent = "Database is unencrypted";
        label.parentElement.className = "flex items-center gap-1 text-[10px] text-secondary font-mono mt-3 border-t border-white/5 pt-3";
        alert("Local database decrypted.");
    }
}

async function exportDataArchive() {
    const token = localStorage.getItem('financefit_token');
    try {
        const res = await fetch('/api/security/data/export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });
        const data = await res.json();
        
        if (res.ok && data.success) {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data.export_data, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", "financefit_security_export.json");
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
        }
    } catch(err) {
        alert("Failed to export profile archive.");
    }
}

function purgeAccountData() {
    if (confirm("Are you absolutely sure you want to delete your profile data? This will clear all locally-cached active databases and log you out. This action is irreversible.")) {
        localStorage.clear();
        alert("All local data purged. Redirecting...");
        window.location.href = '/login';
    }
}

// ----------------------------------------------------
// TalkBack Accessibility Screen Reader System
// ----------------------------------------------------
let talkbackEnabled = false;

function toggleTalkBackState() {
    const toggle = document.getElementById('talkback-toggle');
    const label = document.getElementById('talkback-status-lbl');
    if (!toggle) return;
    
    talkbackEnabled = toggle.checked;
    localStorage.setItem('financefit_talkback', talkbackEnabled ? 'true' : 'false');
    
    if (talkbackEnabled) {
        label.textContent = "Voice assistance is active";
        label.parentElement.className = "flex items-center gap-1 text-[10px] text-secondary font-bold font-mono mt-3 border-t border-white/5 pt-3";
        speak("Talkback screen reader feedback system enabled.");
    } else {
        label.textContent = "Voice assistance is inactive";
        label.parentElement.className = "flex items-center gap-1 text-[10px] text-secondary font-mono mt-3 border-t border-white/5 pt-3";
        speak("Talkback screen reader feedback system disabled.");
    }
}

function loadTalkBackState() {
    const toggle = document.getElementById('talkback-toggle');
    const label = document.getElementById('talkback-status-lbl');
    if (!toggle) return;
    
    talkbackEnabled = localStorage.getItem('financefit_talkback') === 'true';
    toggle.checked = talkbackEnabled;
    
    if (talkbackEnabled) {
        label.textContent = "Voice assistance is active";
        label.parentElement.className = "flex items-center gap-1 text-[10px] text-secondary font-bold font-mono mt-3 border-t border-white/5 pt-3";
    } else {
        label.textContent = "Voice assistance is inactive";
        label.parentElement.className = "flex items-center gap-1 text-[10px] text-secondary font-mono mt-3 border-t border-white/5 pt-3";
    }
}

function speak(text) {
    if (!talkbackEnabled) return;
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    }
}

// Global click event listener for Speech Synthesis feedback
document.addEventListener('click', (e) => {
    if (!talkbackEnabled) return;
    
    // Find closest interactive element
    const element = e.target.closest('button, input, select, textarea, [onclick]');
    if (element) {
        let text = "";
        if (element.tagName === 'BUTTON') {
            text = element.innerText.trim() || element.getAttribute('title') || element.getAttribute('aria-label') || "button";
        } else if (element.tagName === 'INPUT') {
            text = "input field " + (element.getAttribute('placeholder') || element.id || "");
        } else if (element.tagName === 'SELECT') {
            text = "dropdown selection " + (element.options[element.selectedIndex]?.text || "");
        } else {
            text = element.innerText.trim() || "clickable item";
        }
        
        // Clean out icons characters from speech
        text = text.replace(/[^\x20-\x7E]+/g, '').trim(); // Remove non-ASCII characters
        if (text) {
            speak("Activated: " + text);
        }
    }
});
