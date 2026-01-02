/**
 * AI Enhancements for TestMate AI
 * - Real-time suggestions while typing
 * - Smart auto-complete
 * - Test data generator
 * - Risk assessment
 * - Regression test selector
 */

// AI Suggestion patterns and templates
const AI_PATTERNS = {
    userStoryStarters: [
        "As a user, I want to",
        "As an administrator, I want to",
        "As a customer, I want to",
        "As a system, I need to",
        "As a developer, I want to"
    ],
    userStoryTemplates: [
        "As a {role}, I want to {action} so that {benefit}",
        "As a {role}, I need to {action} in order to {benefit}",
        "As a {role}, I should be able to {action} to {benefit}"
    ],
    acceptanceCriteria: {
        login: [
            "Given user has valid credentials, When they login, Then they should be redirected to dashboard",
            "Given user has invalid credentials, When they login, Then they should see an error message",
            "Given user account is locked, When they attempt login, Then they should see locked account message"
        ],
        api: [
            "Given valid request parameters, When API is called, Then it should return 200 status",
            "Given invalid authentication, When API is called, Then it should return 401 status",
            "Given malformed request, When API is called, Then it should return 400 status"
        ],
        search: [
            "Given search term entered, When user clicks search, Then results should display within 2 seconds",
            "Given no results found, When search executes, Then user should see 'No results found' message",
            "Given empty search term, When user clicks search, Then validation error should display"
        ],
        payment: [
            "Given valid payment details, When user submits payment, Then transaction should be processed",
            "Given insufficient funds, When payment is attempted, Then user should see error message",
            "Given payment timeout, When transaction exceeds 30s, Then user should see timeout message"
        ]
    },
    businessRules: [
        "User must be authenticated to access this feature",
        "All inputs must be validated before processing",
        "System must log all transactions for audit purposes",
        "Data must be encrypted in transit and at rest",
        "Response time must not exceed 3 seconds",
        "System must handle concurrent users gracefully"
    ]
};

// Test data templates
const TEST_DATA_TEMPLATES = {
    user: {
        valid: {
            username: ["john.doe", "jane.smith", "admin.user", "test.user123", "sarah.connor", "mike.ross", "emma.watson"],
            email: ["john@example.com", "jane.smith@company.com", "admin@test.org", "sarah.connor@skynet.com", "mike.ross@pearson.com"],
            password: ["Test@1234", "SecureP@ss!", "Admin#2024", "MyP@ssw0rd", "Str0ng!Pass", "C0mpl3x#Pwd"],
            phone: ["+1-555-0123", "+44-20-1234-5678", "+91-98765-43210", "+1-800-123-4567", "+27-11-123-4567"],
            name: ["John Doe", "Jane Smith", "Alice Johnson", "Bob Williams", "Sarah Connor", "Mike Ross", "Emma Watson"],
            address: ["123 Main St, New York, NY 10001", "456 Oak Ave, London, UK", "789 Park Rd, Mumbai, India"],
            age: [18, 25, 35, 45, 60, 21, 30],
            city: ["New York", "London", "Mumbai", "Tokyo", "Sydney", "Cape Town", "Dubai"],
            country: ["USA", "UK", "India", "Japan", "Australia", "South Africa", "UAE"],
            zipCode: ["10001", "SW1A 1AA", "400001", "100-0001", "2000", "8001", "12345"]
        },
        invalid: {
            username: ["", "a", "user@invalid", "user with spaces", "verylongusernamethatexceedslimitandkeepsgoing", "123", "!@#$%"],
            email: ["invalid", "user@", "@example.com", "user@.com", "user..test@example.com", "plaintext", "missing@domain"],
            password: ["123", "password", "12345678", "nospecialchar", "weak", "abc", ""],
            phone: ["123", "abc-def-ghij", "+1234567890123456789", "000-000-0000", "1234567890123456789"],
            age: [-1, 0, 200, "abc", "twenty"],
            zipCode: ["", "123", "ABCDEFGHIJ", "!@#$%", "999999999"]
        },
        boundary: {
            username: ["a", "ab", "abc", "x".repeat(50), "x".repeat(255)],
            email: ["a@b.c", "x".repeat(50) + "@domain.com"],
            password: ["Pass@1", "Pass@123", "x".repeat(100) + "@1"],
            phone: ["+1", "+123456789012345"],
            age: [0, 1, 18, 65, 120, 150],
            name: ["A", "AB", "x".repeat(100)],
            address: ["", "123 St", "x".repeat(500)]
        }
    },
    api: {
        valid: {
            id: [1, 100, 999, 5000],
            status: ["active", "pending", "completed", "approved"],
            amount: [10.50, 100.00, 999.99, 5000.75],
            date: ["2025-01-01", "2025-12-31", "2024-06-15"]
        },
        boundary: {
            id: [0, 1, 9999, 10000, -1],
            amount: [0, 0.01, 999999.99, 1000000],
            string: ["", "a", "x".repeat(255), "x".repeat(256)]
        }
    },
    security: {
        xss: ["<script>alert('XSS')</script>", "javascript:alert(1)", "<img src=x onerror=alert(1)>"],
        sql: ["' OR '1'='1", "'; DROP TABLE users--", "1' UNION SELECT NULL--"],
        special: ["!@#$%^&*()", "   spaces   ", "\n\r\t", "🚀💻🎯"]
    }
};

// Risk assessment keywords
const RISK_KEYWORDS = {
    high: ['payment', 'security', 'authentication', 'authorization', 'encryption', 'password', 'credit card', 'personal data', 'financial'],
    medium: ['api', 'integration', 'database', 'transaction', 'validation', 'session', 'upload', 'download'],
    low: ['display', 'ui', 'format', 'label', 'color', 'layout', 'tooltip']
};

let suggestionTimeout = null;
let activeSuggestionField = null;

/**
 * Initialize AI Enhancements
 */
function initAIEnhancements() {
    console.log('=== Initializing AI Enhancements ===');
    
    // Add AI suggestion listeners
    initAISuggestions();
    
    // Add test data generator
    initTestDataGenerator();
    
    // Add risk assessment
    initRiskAssessment();
    
    // Add regression test selector
    initRegressionSelector();
    
    console.log('=== AI Enhancements Initialized ===');
}

/**
 * Initialize AI Suggestions for form fields
 */
function initAISuggestions() {
    const userStoryField = document.getElementById('userStory');
    const acceptanceCriteriaField = document.getElementById('acceptanceCriteria');
    const businessRulesField = document.getElementById('businessRules');
    
    if (userStoryField) {
        addAISuggestionToField(userStoryField, 'userStory');
    }
    if (acceptanceCriteriaField) {
        addAISuggestionToField(acceptanceCriteriaField, 'acceptanceCriteria');
    }
    if (businessRulesField) {
        addAISuggestionToField(businessRulesField, 'businessRules');
    }
}

/**
 * Add AI suggestions to a specific field
 */
function addAISuggestionToField(field, fieldType) {
    // Create suggestion container
    const container = document.createElement('div');
    container.className = 'ai-suggestion-container';
    container.id = `${fieldType}-suggestions`;
    container.style.display = 'none';
    
    // Insert after the field
    field.parentNode.insertBefore(container, field.nextSibling);
    
    // Add input listener
    field.addEventListener('input', (e) => {
        clearTimeout(suggestionTimeout);
        suggestionTimeout = setTimeout(() => {
            showAISuggestions(field, fieldType, container);
        }, 300); // Debounce for 300ms
    });
    
    // Add focus listener for initial suggestions
    field.addEventListener('focus', (e) => {
        if (field.value.trim().length === 0) {
            showInitialSuggestions(field, fieldType, container);
        }
    });
    
    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!field.contains(e.target) && !container.contains(e.target)) {
            container.style.display = 'none';
        }
    });
}

/**
 * Show initial suggestions when field is empty
 */
function showInitialSuggestions(field, fieldType, container) {
    let suggestions = [];
    
    if (fieldType === 'userStory') {
        suggestions = AI_PATTERNS.userStoryStarters.map(starter => ({
            text: starter + '...',
            type: 'template'
        }));
    } else if (fieldType === 'businessRules') {
        suggestions = AI_PATTERNS.businessRules.slice(0, 5).map(rule => ({
            text: rule,
            type: 'rule'
        }));
    }
    
    if (suggestions.length > 0) {
        displaySuggestions(container, suggestions, field);
    }
}

/**
 * Show AI suggestions based on input
 */
function showAISuggestions(field, fieldType, container) {
    const value = field.value.toLowerCase();
    
    if (value.length < 2) {
        container.style.display = 'none';
        return;
    }
    
    let suggestions = [];
    
    if (fieldType === 'userStory') {
        suggestions = generateUserStorySuggestions(value);
    } else if (fieldType === 'acceptanceCriteria') {
        suggestions = generateAcceptanceCriteriaSuggestions(value);
    } else if (fieldType === 'businessRules') {
        suggestions = generateBusinessRuleSuggestions(value);
    }
    
    if (suggestions.length > 0) {
        displaySuggestions(container, suggestions, field);
    } else {
        container.style.display = 'none';
    }
}

/**
 * Generate user story suggestions
 */
function generateUserStorySuggestions(value) {
    const suggestions = [];
    
    // Check for partial matches in templates
    AI_PATTERNS.userStoryStarters.forEach(starter => {
        if (starter.toLowerCase().includes(value) || value.includes(starter.toLowerCase().substring(0, 10))) {
            suggestions.push({
                text: starter + ' [action] so that [benefit]',
                type: 'template',
                icon: '💡'
            });
        }
    });
    
    return suggestions.slice(0, 5);
}

/**
 * Generate acceptance criteria suggestions
 */
function generateAcceptanceCriteriaSuggestions(value) {
    const suggestions = [];
    
    // Detect context from keywords
    Object.keys(AI_PATTERNS.acceptanceCriteria).forEach(context => {
        if (value.includes(context)) {
            AI_PATTERNS.acceptanceCriteria[context].forEach(criteria => {
                suggestions.push({
                    text: criteria,
                    type: 'criteria',
                    icon: '✓',
                    context: context
                });
            });
        }
    });
    
    // If no context detected, show generic Given-When-Then template
    if (suggestions.length === 0 && (value.includes('given') || value.includes('when') || value.includes('then'))) {
        suggestions.push({
            text: 'Given [precondition], When [action], Then [expected result]',
            type: 'template',
            icon: '📝'
        });
    }
    
    return suggestions.slice(0, 5);
}

/**
 * Generate business rule suggestions
 */
function generateBusinessRuleSuggestions(value) {
    const suggestions = [];
    
    AI_PATTERNS.businessRules.forEach(rule => {
        if (rule.toLowerCase().includes(value)) {
            suggestions.push({
                text: rule,
                type: 'rule',
                icon: '📋'
            });
        }
    });
    
    return suggestions.slice(0, 5);
}

/**
 * Display suggestions in container
 */
function displaySuggestions(container, suggestions, field) {
    container.innerHTML = '<div class="ai-suggestion-header">💡 AI Suggestions</div>';
    
    suggestions.forEach(suggestion => {
        const item = document.createElement('div');
        item.className = 'ai-suggestion-item';
        item.innerHTML = `
            <span class="suggestion-icon">${suggestion.icon || '💡'}</span>
            <span class="suggestion-text">${suggestion.text}</span>
            ${suggestion.context ? `<span class="suggestion-badge">${suggestion.context}</span>` : ''}
        `;
        
        item.addEventListener('click', () => {
            insertSuggestion(field, suggestion.text);
            container.style.display = 'none';
            
            if (typeof showToast === 'function') {
                showToast('AI Suggestion Applied', 'Suggestion inserted successfully', 'success', 2000);
            }
        });
        
        container.appendChild(item);
    });
    
    container.style.display = 'block';
}

/**
 * Insert suggestion into field
 */
function insertSuggestion(field, text) {
    const currentValue = field.value;
    
    if (currentValue.trim() === '') {
        field.value = text;
    } else {
        field.value = currentValue + '\n' + text;
    }
    
    field.focus();
    // Trigger input event for any listeners
    field.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * Initialize Test Data Generator
 */
function initTestDataGenerator() {
    // Create test data generator button
    const container = document.querySelector('.container');
    if (!container) return;
    
    const generatorPanel = document.createElement('div');
    generatorPanel.className = 'test-data-generator-panel';
    generatorPanel.id = 'testDataGenerator';
    generatorPanel.style.display = 'none';
    
    generatorPanel.innerHTML = `
        <div class="test-data-header">
            <h3>🔧 Test Data Generator</h3>
            <button class="help-btn" onclick="showTestDataHelp()" title="How to use">❓</button>
            <button class="close-test-data" onclick="closeTestDataGenerator()">&times;</button>
        </div>
        <div class="test-data-content">
            <div class="help-banner" id="testDataHelpBanner" style="display: block;">
                <div class="help-icon">💡</div>
                <div class="help-text">
                    <strong>Quick Guide:</strong> Select a data category → Choose data type → Click Generate → Copy to use!
                    <button class="try-demo-btn" onclick="runTestDataDemo()">Try Demo</button>
                </div>
                <button class="close-help" onclick="closeTestDataHelp()">&times;</button>
            </div>
            <div class="data-category-tabs">
                <button class="data-tab active" data-category="user" title="Generate user profile data like usernames, emails, passwords">
                    👤 User Data
                </button>
                <button class="data-tab" data-category="api" title="Generate API test data like IDs, status codes, amounts">
                    🔌 API Data
                </button>
                <button class="data-tab" data-category="security" title="Generate security test payloads for XSS, SQL injection">
                    🔒 Security Tests
                </button>
            </div>
            <div class="data-type-selector">
                <label title="Generate valid, correct format data for positive testing">
                    <input type="radio" name="dataType" value="valid" checked>
                    ✅ Valid Data
                </label>
                <label title="Generate invalid, malformed data for negative testing">
                    <input type="radio" name="dataType" value="invalid">
                    ❌ Invalid Data
                </label>
                <label title="Generate boundary values (min/max) for edge case testing">
                    <input type="radio" name="dataType" value="boundary">
                    ⚖️ Boundary Data
                </label>
            </div>
            <div class="generated-data-container" id="generatedDataContainer">
                <div class="data-placeholder-wrapper">
                    <div class="placeholder-icon">🎯</div>
                    <p class="data-placeholder">Select a category and type, then click <strong>Generate Data</strong></p>
                    <div class="example-box">
                        <div class="example-title">💡 Example Use Cases:</div>
                        <ul>
                            <li><strong>User Data + Valid:</strong> Test successful user registration</li>
                            <li><strong>User Data + Invalid:</strong> Test email validation errors</li>
                            <li><strong>API Data + Boundary:</strong> Test min/max ID values</li>
                            <li><strong>Security Tests:</strong> Test XSS and SQL injection protection</li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="data-actions">
                <button class="btn-generate-data" onclick="generateTestData()" title="Generate test data based on selections">
                    🎲 Generate Data
                </button>
                <button class="btn-copy-data" onclick="copyTestData()" title="Copy generated data to clipboard">
                    📋 Copy to Clipboard
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(generatorPanel);
    
    // Add tab switching
    const tabs = generatorPanel.querySelectorAll('.data-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });
    
    // Add floating action button
    const fab = document.createElement('button');
    fab.className = 'test-data-fab';
    fab.innerHTML = '🔧';
    fab.title = 'Test Data Generator';
    fab.onclick = openTestDataGenerator;
    document.body.appendChild(fab);
}

/**
 * Open test data generator
 */
function openTestDataGenerator() {
    const panel = document.getElementById('testDataGenerator');
    if (panel) {
        panel.style.display = 'block';
    }
}

/**
 * Close test data generator
 */
function closeTestDataGenerator() {
    const panel = document.getElementById('testDataGenerator');
    if (panel) {
        panel.style.display = 'none';
    }
}

/**
 * Generate test data
 */
function generateTestData() {
    const activeTab = document.querySelector('.data-tab.active');
    const category = activeTab ? activeTab.dataset.category : 'user';
    const dataType = document.querySelector('input[name="dataType"]:checked').value;
    const container = document.getElementById('generatedDataContainer');
    
    let data = {};
    
    if (category === 'user') {
        data = TEST_DATA_TEMPLATES.user[dataType] || TEST_DATA_TEMPLATES.user.valid;
    } else if (category === 'api') {
        data = TEST_DATA_TEMPLATES.api[dataType] || TEST_DATA_TEMPLATES.api.valid;
    } else if (category === 'security') {
        data = TEST_DATA_TEMPLATES.security;
    }
    
    // Format data for display
    let html = '<div class="generated-data">';
    Object.keys(data).forEach(key => {
        html += `<div class="data-group">`;
        html += `<div class="data-key">${key}:</div>`;
        html += `<div class="data-values">`;
        
        if (Array.isArray(data[key])) {
            data[key].forEach(value => {
                html += `<div class="data-value">${escapeHtml(String(value))}</div>`;
            });
        }
        
        html += `</div></div>`;
    });
    html += '</div>';
    
    container.innerHTML = html;
    
    if (typeof showToast === 'function') {
        showToast('Test Data Generated', `Generated ${dataType} ${category} data`, 'success', 2000);
    }
}

/**
 * Copy test data to clipboard
 */
function copyTestData() {
    const container = document.getElementById('generatedDataContainer');
    const text = container.innerText;
    
    navigator.clipboard.writeText(text).then(() => {
        if (typeof showToast === 'function') {
            showToast('Copied!', 'Test data copied to clipboard', 'success', 2000);
        }
    });
}

/**
 * Initialize Risk Assessment
 */
function initRiskAssessment() {
    // This will be called after test cases are generated
    // Add observer to detect when test cases are added
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(node => {
                    if (node.classList && node.classList.contains('test-case-card')) {
                        assessTestCaseRisk(node);
                    }
                });
            }
        });
    });
    
    const testCasesContainer = document.getElementById('testCasesContainer');
    if (testCasesContainer) {
        observer.observe(testCasesContainer, { childList: true });
    }
}

/**
 * Assess risk for a test case
 */
function assessTestCaseRisk(testCaseCard) {
    const text = testCaseCard.innerText.toLowerCase();
    let riskLevel = 'low';
    let riskFactors = [];
    
    // Check for high-risk keywords
    RISK_KEYWORDS.high.forEach(keyword => {
        if (text.includes(keyword)) {
            riskLevel = 'high';
            riskFactors.push(keyword);
        }
    });
    
    // Check for medium-risk keywords if not already high
    if (riskLevel !== 'high') {
        RISK_KEYWORDS.medium.forEach(keyword => {
            if (text.includes(keyword)) {
                riskLevel = 'medium';
                riskFactors.push(keyword);
            }
        });
    }
    
    // Add risk badge
    if (riskLevel !== 'low') {
        const header = testCaseCard.querySelector('.test-case-header');
        if (header && !header.querySelector('.risk-badge')) {
            const badges = header.querySelector('.test-case-badges');
            if (badges) {
                const riskBadge = document.createElement('span');
                riskBadge.className = `badge risk-badge risk-${riskLevel}`;
                riskBadge.innerHTML = `⚠️ ${riskLevel.toUpperCase()} Risk`;
                riskBadge.title = `Risk factors: ${riskFactors.join(', ')}`;
                badges.appendChild(riskBadge);
            }
        }
    }
}

/**
 * Initialize Regression Test Selector
 */
function initRegressionSelector() {
    // Add regression selector button to header
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) return;
    
    const regressionBtn = document.createElement('button');
    regressionBtn.className = 'header-btn';
    regressionBtn.id = 'regressionBtn';
    regressionBtn.title = 'Regression Test Selector';
    regressionBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
    `;
    regressionBtn.onclick = openRegressionSelector;
    
    headerActions.appendChild(regressionBtn);
    
    // Create regression selector panel
    const panel = document.createElement('div');
    panel.className = 'regression-selector-panel';
    panel.id = 'regressionSelector';
    panel.style.display = 'none';
    
    panel.innerHTML = `
        <div class="regression-header">
            <h3>🔄 Regression Test Selector</h3>
            <button class="help-btn" onclick="showRegressionHelp()" title="How to use">❓</button>
            <button class="close-regression" onclick="closeRegressionSelector()">&times;</button>
        </div>
        <div class="regression-content">
            <div class="help-banner" id="regressionHelpBanner" style="display: block;">
                <div class="help-icon">💡</div>
                <div class="help-text">
                    <strong>Quick Guide:</strong> Check areas with code changes → Review recommended tests → Analyze impact → Run tests!
                    <button class="try-demo-btn" onclick="runRegressionDemo()">Try Demo</button>
                </div>
                <button class="close-help" onclick="closeRegressionHelp()">&times;</button>
            </div>
            <div class="workflow-steps">
                <div class="step">1️⃣ Select Changed Areas</div>
                <div class="step">2️⃣ Review Tests</div>
                <div class="step">3️⃣ Analyze Impact</div>
            </div>
            <div class="change-detection">
                <h4>📝 Step 1: Select Changed Code Areas</h4>
                <p class="helper-text">Check the modules where code changes were made:</p>
                <div class="change-area">
                    <label title="Login, logout, session management, password reset">
                        <input type="checkbox" value="authentication"> 🔐 Authentication Module
                    </label>
                    <label title="Payment processing, refunds, transactions">
                        <input type="checkbox" value="payment"> 💳 Payment Processing
                    </label>
                    <label title="REST APIs, GraphQL, webhooks">
                        <input type="checkbox" value="api"> 🔌 API Endpoints
                    </label>
                    <label title="UI components, layouts, styling">
                        <input type="checkbox" value="ui"> 🎨 User Interface
                    </label>
                    <label title="Schema changes, migrations, indexes">
                        <input type="checkbox" value="database"> 🗄️ Database Schema
                    </label>
                </div>
            </div>
            <div class="recommended-tests">
                <h4>✅ Step 2: Recommended Regression Tests</h4>
                <p class="helper-text">Based on your selections, these tests should be run:</p>
                <div id="recommendedTestsList" class="recommended-list">
                    <div class="placeholder-wrapper">
                        <div class="placeholder-icon">👆</div>
                        <p class="placeholder">Select changed areas above to see test recommendations</p>
                        <div class="example-note">
                            <strong>💡 Tip:</strong> Check multiple areas if your changes span across modules
                        </div>
                    </div>
                </div>
            </div>
            <div class="regression-actions">
                <button class="btn-analyze" onclick="analyzeRegressionImpact()" title="Calculate total tests and coverage">
                    📊 Analyze Impact
                </button>
                <button class="btn-select-all" onclick="selectAllRecommended()" title="Toggle all recommended tests">
                    ☑️ Select All Tests
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(panel);
    
    // Add change detection listeners
    const checkboxes = panel.querySelectorAll('.change-area input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', updateRecommendedTests);
    });
}

/**
 * Open regression selector
 */
function openRegressionSelector() {
    const panel = document.getElementById('regressionSelector');
    if (panel) {
        panel.style.display = 'block';
    }
}

/**
 * Close regression selector
 */
function closeRegressionSelector() {
    const panel = document.getElementById('regressionSelector');
    if (panel) {
        panel.style.display = 'none';
    }
}

/**
 * Update recommended tests based on selected changes
 */
function updateRecommendedTests() {
    const selected = Array.from(document.querySelectorAll('.change-area input:checked'))
        .map(cb => cb.value);
    
    const recommendations = {
        authentication: ['Login flow tests', 'Session management tests', 'Password reset tests', 'OAuth integration tests'],
        payment: ['Payment processing tests', 'Refund flow tests', 'Payment gateway integration', 'Transaction history tests'],
        api: ['API endpoint tests', 'Authentication tests', 'Rate limiting tests', 'Error handling tests'],
        ui: ['UI component tests', 'Navigation tests', 'Responsive design tests', 'Accessibility tests'],
        database: ['Data migration tests', 'Query performance tests', 'Data integrity tests', 'Backup/restore tests']
    };
    
    const container = document.getElementById('recommendedTestsList');
    
    if (selected.length === 0) {
        container.innerHTML = '<p class="placeholder">Select changed areas to see recommendations</p>';
        return;
    }
    
    let html = '';
    selected.forEach(area => {
        if (recommendations[area]) {
            recommendations[area].forEach(test => {
                html += `
                    <div class="recommended-item">
                        <input type="checkbox" class="recommended-test" value="${test}">
                        <span>${test}</span>
                        <span class="area-badge">${area}</span>
                    </div>
                `;
            });
        }
    });
    
    container.innerHTML = html;
}

/**
 * Analyze regression impact
 */
function analyzeRegressionImpact() {
    const selected = Array.from(document.querySelectorAll('.change-area input:checked'));
    const count = selected.length;
    
    if (count === 0) {
        if (typeof showToast === 'function') {
            showToast('No Changes Selected', 'Please select at least one changed area', 'warning');
        }
        return;
    }
    
    const recommendedCount = document.querySelectorAll('.recommended-test').length;
    
    if (typeof showToast === 'function') {
        showToast(
            'Impact Analysis Complete',
            `${count} area${count > 1 ? 's' : ''} affected. ${recommendedCount} tests recommended.`,
            'info'
        );
    }
}

/**
 * Select all recommended tests
 */
function selectAllRecommended() {
    const checkboxes = document.querySelectorAll('.recommended-test');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(cb => {
        cb.checked = !allChecked;
    });
    
    if (typeof showToast === 'function') {
        showToast(
            allChecked ? 'Deselected All' : 'Selected All',
            `${checkboxes.length} tests ${allChecked ? 'deselected' : 'selected'}`,
            'success',
            2000
        );
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Show help for Test Data Generator
 */
function showTestDataHelp() {
    const helpBanner = document.getElementById('testDataHelpBanner');
    if (helpBanner) {
        helpBanner.style.display = 'flex';
    }
    
    if (typeof showToast === 'function') {
        showToast(
            'Test Data Generator Help',
            'Follow the 4-step guide: Category → Type → Generate → Copy',
            'info',
            3000
        );
    }
}

/**
 * Close help banner for Test Data Generator
 */
function closeTestDataHelp() {
    const helpBanner = document.getElementById('testDataHelpBanner');
    if (helpBanner) {
        helpBanner.style.display = 'none';
    }
}

/**
 * Run demo for Test Data Generator
 */
function runTestDataDemo() {
    if (typeof showToast === 'function') {
        showToast('Demo Started', 'Watch the automatic demonstration...', 'info', 2000);
    }
    
    // Step 1: Select Security tab
    setTimeout(() => {
        const securityTab = document.querySelector('.data-tab[data-category="security"]');
        if (securityTab) {
            securityTab.click();
            if (typeof showToast === 'function') {
                showToast('Step 1', 'Selected Security Tests category', 'success', 2000);
            }
        }
    }, 1000);
    
    // Step 2: Generate data
    setTimeout(() => {
        generateTestData();
        if (typeof showToast === 'function') {
            showToast('Step 2', 'Generated security test data', 'success', 2000);
        }
    }, 3000);
    
    // Step 3: Show copy instruction
    setTimeout(() => {
        if (typeof showToast === 'function') {
            showToast('Step 3', 'Now click "Copy to Clipboard" to use this data!', 'info', 3000);
        }
    }, 5000);
}

/**
 * Show help for Regression Selector
 */
function showRegressionHelp() {
    const helpBanner = document.getElementById('regressionHelpBanner');
    if (helpBanner) {
        helpBanner.style.display = 'flex';
    }
    
    if (typeof showToast === 'function') {
        showToast(
            'Regression Selector Help',
            'Select changed areas to get targeted test recommendations',
            'info',
            3000
        );
    }
}

/**
 * Close help banner for Regression Selector
 */
function closeRegressionHelp() {
    const helpBanner = document.getElementById('regressionHelpBanner');
    if (helpBanner) {
        helpBanner.style.display = 'none';
    }
}

/**
 * Run demo for Regression Selector
 */
function runRegressionDemo() {
    if (typeof showToast === 'function') {
        showToast('Demo Started', 'Watch the automatic demonstration...', 'info', 2000);
    }
    
    // Step 1: Select Authentication
    setTimeout(() => {
        const authCheckbox = document.querySelector('.change-area input[value="authentication"]');
        if (authCheckbox) {
            authCheckbox.checked = true;
            authCheckbox.dispatchEvent(new Event('change'));
            if (typeof showToast === 'function') {
                showToast('Step 1', 'Selected Authentication Module', 'success', 2000);
            }
        }
    }, 1000);
    
    // Step 2: Select API
    setTimeout(() => {
        const apiCheckbox = document.querySelector('.change-area input[value="api"]');
        if (apiCheckbox) {
            apiCheckbox.checked = true;
            apiCheckbox.dispatchEvent(new Event('change'));
            if (typeof showToast === 'function') {
                showToast('Step 2', 'Selected API Endpoints', 'success', 2000);
            }
        }
    }, 3000);
    
    // Step 3: Analyze impact
    setTimeout(() => {
        analyzeRegressionImpact();
        if (typeof showToast === 'function') {
            showToast('Step 3', 'Impact analysis complete! Review the recommended tests.', 'info', 3000);
        }
    }, 5000);
}

// Expose functions globally
window.openTestDataGenerator = openTestDataGenerator;
window.closeTestDataGenerator = closeTestDataGenerator;
window.generateTestData = generateTestData;
window.copyTestData = copyTestData;
window.showTestDataHelp = showTestDataHelp;
window.closeTestDataHelp = closeTestDataHelp;
window.runTestDataDemo = runTestDataDemo;
window.openRegressionSelector = openRegressionSelector;
window.closeRegressionSelector = closeRegressionSelector;
window.analyzeRegressionImpact = analyzeRegressionImpact;
window.selectAllRecommended = selectAllRecommended;
window.showRegressionHelp = showRegressionHelp;
window.closeRegressionHelp = closeRegressionHelp;
window.runRegressionDemo = runRegressionDemo;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAIEnhancements);
} else {
    initAIEnhancements();
}
