/**
 * Interactive Help & Tutorial System for TestMate AI
 * Comprehensive guide for all features with interactive walkthroughs
 */

// Tutorial state
let tutorialActive = false;
let currentTutorialStep = 0;
let tutorialOverlay = null;

// Help content for all features
const HELP_CONTENT = {
    gettingStarted: {
        title: "🚀 Getting Started with TestMate AI",
        icon: "🎯",
        steps: [
            {
                title: "Welcome to TestMate AI!",
                description: "Your AI-powered QA test case generator. Let me show you how to create professional test cases in minutes.",
                action: "Next"
            },
            {
                title: "Generate Your First Test Case",
                description: "Fill in the form with your user story, acceptance criteria, and business rules. The AI will generate comprehensive test cases.",
                target: "#jiraForm",
                action: "Show Me"
            },
            {
                title: "Or Upload Documents",
                description: "Have requirements in Word/PDF? Just drag and drop them here. TestMate AI will extract and generate test cases automatically!",
                target: ".upload-section",
                action: "Got It"
            },
            {
                title: "View & Download Results",
                description: "Generated test cases appear below with all details. Download as CSV or push directly to JIRA!",
                target: "#outputSection",
                action: "Finish Tutorial"
            }
        ]
    },
    features: {
        formInput: {
            title: "📝 Form-Based Test Case Generation",
            description: "Create test cases by filling in a simple form",
            steps: [
                "Enter your <strong>User Story</strong> (e.g., 'As a user, I want to login...')",
                "Add <strong>Acceptance Criteria</strong> (Given-When-Then format works best)",
                "Include <strong>Business Rules</strong> if applicable",
                "Click <strong>Generate Test Cases</strong>",
                "AI will create comprehensive test scenarios in seconds!"
            ],
            tips: [
                "💡 Use the AI Suggestions that appear while typing",
                "💡 Be specific in your acceptance criteria for better results",
                "💡 Include edge cases in your business rules"
            ]
        },
        fileUpload: {
            title: "📁 Document Upload",
            description: "Generate test cases from your existing documents",
            steps: [
                "Click the <strong>upload box</strong> or drag & drop files",
                "Supports: Word (.docx), PDF (.pdf), Text (.txt)",
                "Upload multiple files at once (max 10MB per file)",
                "AI extracts requirements and generates test cases",
                "Review and download results"
            ],
            tips: [
                "💡 Ensure documents have clear requirements",
                "💡 Use headers to separate different features",
                "💡 Include acceptance criteria in your docs"
            ]
        },
        jiraIntegration: {
            title: "🔗 JIRA Integration",
            description: "Push test cases directly to JIRA",
            steps: [
                "Enter your <strong>JIRA URL</strong> (e.g., https://yourcompany.atlassian.net)",
                "Provide your <strong>Email</strong> and <strong>API Token</strong>",
                "Generate test cases using form or file upload",
                "Click <strong>Push to JIRA</strong> button",
                "Test cases automatically created in your JIRA project!"
            ],
            tips: [
                "💡 Get API token from JIRA: Profile → Security → API Tokens",
                "💡 Configure JIRA settings once - they're saved for next time",
                "💡 Check JIRA project permissions before pushing"
            ]
        },
        darkMode: {
            title: "🌙 Dark Mode",
            description: "Toggle between light and dark themes",
            steps: [
                "Click the <strong>sun/moon icon</strong> in the top-right header",
                "Theme switches instantly",
                "Your preference is saved automatically",
                "Works across all features and panels"
            ],
            tips: [
                "💡 Dark mode reduces eye strain",
                "💡 Perfect for late-night testing sessions"
            ]
        },
        notifications: {
            title: "🔔 Notification Center",
            description: "Track all your activities and alerts",
            steps: [
                "Click the <strong>bell icon</strong> in the header",
                "View all notifications (success, errors, warnings)",
                "Click any notification to see details",
                "Use <strong>Clear All</strong> to remove old notifications",
                "Toast notifications appear automatically for actions"
            ],
            tips: [
                "💡 Badge shows unread count",
                "💡 Notifications persist across sessions",
                "💡 Click outside panel to close"
            ]
        },
        aiSuggestions: {
            title: "✨ AI Suggestions",
            description: "Get real-time suggestions while typing",
            steps: [
                "Start typing in any form field",
                "AI suggestions appear after a brief pause",
                "Click any suggestion to insert it",
                "Suggestions are context-aware based on keywords",
                "Templates help you follow best practices"
            ],
            tips: [
                "💡 Works in User Story, Acceptance Criteria, and Business Rules",
                "💡 Type 'login', 'api', or 'payment' for specific suggestions",
                "💡 Empty fields show template suggestions"
            ]
        },
        testDataGenerator: {
            title: "🔧 Test Data Generator",
            description: "Generate realistic test data instantly",
            steps: [
                "Click the <strong>pink 🔧 button</strong> in bottom-right corner",
                "Select a category: User Data, API Data, or Security Tests",
                "Choose data type: Valid, Invalid, or Boundary",
                "Click <strong>Generate Data</strong>",
                "Click <strong>Copy to Clipboard</strong> to use the data",
                "Click <strong>Try Demo</strong> to see it in action!"
            ],
            tips: [
                "💡 Valid data for positive test cases",
                "💡 Invalid data for error handling tests",
                "💡 Security tests include XSS and SQL injection payloads"
            ]
        },
        regressionSelector: {
            title: "🔄 Regression Test Selector",
            description: "Identify which tests to run after code changes",
            steps: [
                "Click the <strong>graph icon 📈</strong> in the header",
                "Check the code areas you modified",
                "Review recommended regression tests",
                "Click <strong>Analyze Impact</strong> for summary",
                "Use <strong>Select All</strong> to mark all tests",
                "Click <strong>Try Demo</strong> to see it in action!"
            ],
            tips: [
                "💡 Check all affected areas for thorough testing",
                "💡 High-risk areas (payment, auth) need more testing",
                "💡 Database changes can affect multiple features"
            ]
        },
        riskAssessment: {
            title: "⚠️ Risk Assessment",
            description: "Automatic risk detection in test cases",
            steps: [
                "Generate test cases as normal",
                "AI automatically scans for risk keywords",
                "High-risk items get red badges (⚠️ HIGH Risk)",
                "Medium-risk items get orange badges",
                "Hover over badges to see detected risk factors",
                "Prioritize testing for high-risk areas"
            ],
            tips: [
                "💡 High-risk: payment, security, authentication, encryption",
                "💡 Medium-risk: API, database, validation, integration",
                "💡 Use risk badges to prioritize your testing effort"
            ]
        },
        analyticsReports: {
            title: "📊 Analytics Dashboard",
            description: "Track your testing productivity and metrics",
            steps: [
                "Dashboard loads automatically on page load",
                "View total test cases generated",
                "See success rate and coverage metrics",
                "Check recent activity feed",
                "Monitor JIRA integration status"
            ],
            tips: [
                "💡 Charts update in real-time",
                "💡 Use metrics to measure team productivity"
            ]
        },
        chatWidget: {
            title: "💬 Ask Me Anything (AMA)",
            description: "Get instant help through the chat widget",
            steps: [
                "Click the <strong>chat icon</strong> in bottom-right",
                "Ask questions about testing or the app",
                "Get instant AI-powered responses",
                "Use for quick tips and guidance",
                "Click outside to close"
            ],
            tips: [
                "💡 Try asking 'What is boundary testing?'",
                "💡 Ask about specific testing concepts",
                "💡 Get help with test case writing"
            ]
        },
        factsWidget: {
            title: "💡 Testing Facts",
            description: "Learn testing best practices",
            steps: [
                "Facts widget shows automatically",
                "New fact every 15 seconds",
                "Drag the widget anywhere on screen",
                "Click <strong>Next</strong> for new fact",
                "Minimize with the <strong>—</strong> button"
            ],
            tips: [
                "💡 25+ testing facts and best practices",
                "💡 Learn while you work!"
            ]
        }
    },
    shortcuts: [
        { key: "Ctrl + Enter", action: "Generate Test Cases (from form)" },
        { key: "Ctrl + K", action: "Open Chat Widget" },
        { key: "Ctrl + H", action: "Open Help Center" },
        { key: "Escape", action: "Close open panels" }
    ],
    faqs: [
        {
            q: "How do I get started?",
            a: "Either fill in the form with your user story and click 'Generate', or upload a document with requirements. The AI will create test cases automatically!"
        },
        {
            q: "What file formats are supported?",
            a: "Word documents (.docx), PDFs (.pdf), and text files (.txt). Maximum 10MB per file, up to 5 files at once."
        },
        {
            q: "How do I connect to JIRA?",
            a: "Enter your JIRA URL, email, and API token in the JIRA Integration section. Get your API token from JIRA: Profile → Security → API Tokens."
        },
        {
            q: "Can I edit generated test cases?",
            a: "Yes! Click the edit icon on any test case card to modify it before downloading or pushing to JIRA."
        },
        {
            q: "What is the Test Data Generator?",
            a: "Click the pink 🔧 button to generate realistic test data (valid, invalid, boundary) for user profiles, APIs, or security testing."
        },
        {
            q: "How does risk assessment work?",
            a: "The AI automatically scans test cases for high-risk keywords (payment, security, auth) and adds warning badges. Prioritize these tests!"
        },
        {
            q: "What's the Regression Test Selector?",
            a: "Click the 📈 icon to select code areas you changed. It recommends which tests to run based on your changes."
        },
        {
            q: "How do I use AI Suggestions?",
            a: "Just start typing in any form field. AI suggestions appear automatically. Click to insert templates and examples."
        }
    ]
};

/**
 * Initialize Help System
 */
function initHelpSystem() {
    console.log('=== Initializing Interactive Help System ===');
    
    // Button already exists in HTML, just add event listener
    const existingHelpBtn = document.getElementById('helpToggle');
    if (existingHelpBtn) {
        existingHelpBtn.onclick = toggleHelpCenter;
    }
    
    // Create help center panel
    createHelpCenter();
    
    // Create tutorial overlay
    createTutorialOverlay();
    
    // Check if first time user
    checkFirstTimeUser();
    
    // Add keyboard shortcuts
    addKeyboardShortcuts();
    
    console.log('=== Help System Ready ===');
}

/**
 * Create help center panel
 */
function createHelpCenter() {
    const panel = document.createElement('div');
    panel.className = 'help-center-panel';
    panel.id = 'helpCenter';
    panel.style.display = 'none';
    
    panel.innerHTML = `
        <div class="help-center-header">
            <h2>📚 TestMate AI - Help Center</h2>
            <button class="close-help-center" onclick="closeHelpCenter()">&times;</button>
        </div>
        <div class="help-center-content">
            <div class="help-search">
                <input type="text" id="helpSearch" placeholder="🔍 Search help topics..." />
            </div>
            
            <div class="help-quick-start">
                <button class="quick-start-btn" onclick="startGettingStartedTutorial()">
                    🚀 New User? Start Interactive Tutorial
                </button>
            </div>
            
            <div class="help-tabs">
                <button class="help-tab active" data-tab="features" onclick="switchHelpTab('features')">
                    ✨ Features Guide
                </button>
                <button class="help-tab" data-tab="shortcuts" onclick="switchHelpTab('shortcuts')">
                    ⌨️ Shortcuts
                </button>
                <button class="help-tab" data-tab="faqs" onclick="switchHelpTab('faqs')">
                    ❓ FAQs
                </button>
                <button class="help-tab" data-tab="video" onclick="switchHelpTab('video')">
                    🎥 Video Tours
                </button>
            </div>
            
            <div class="help-tab-content" id="helpTabContent">
                ${generateFeaturesContent()}
            </div>
        </div>
    `;
    
    document.body.appendChild(panel);
    
    // Add search listener
    const searchInput = panel.querySelector('#helpSearch');
    if (searchInput) {
        searchInput.addEventListener('input', filterHelpContent);
    }
}

/**
 * Generate features content
 */
function generateFeaturesContent() {
    let html = '<div class="features-grid">';
    
    Object.keys(HELP_CONTENT.features).forEach(key => {
        const feature = HELP_CONTENT.features[key];
        html += `
            <div class="feature-card" data-feature="${key}">
                <div class="feature-header">
                    <h3>${feature.title}</h3>
                </div>
                <p class="feature-description">${feature.description}</p>
                <div class="feature-steps">
                    <h4>📋 How to use:</h4>
                    <ol>
                        ${feature.steps.map(step => `<li>${step}</li>`).join('')}
                    </ol>
                </div>
                ${feature.tips ? `
                    <div class="feature-tips">
                        <h4>💡 Pro Tips:</h4>
                        <ul>
                            ${feature.tips.map(tip => `<li>${tip}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                <button class="try-feature-btn" onclick="startFeatureTutorial('${key}')">
                    Try Interactive Demo
                </button>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

/**
 * Generate shortcuts content
 */
function generateShortcutsContent() {
    let html = '<div class="shortcuts-list">';
    html += '<h3>⌨️ Keyboard Shortcuts</h3>';
    html += '<table class="shortcuts-table">';
    
    HELP_CONTENT.shortcuts.forEach(shortcut => {
        html += `
            <tr>
                <td><kbd>${shortcut.key}</kbd></td>
                <td>${shortcut.action}</td>
            </tr>
        `;
    });
    
    html += '</table></div>';
    return html;
}

/**
 * Generate FAQs content
 */
function generateFAQsContent() {
    let html = '<div class="faqs-list">';
    html += '<h3>❓ Frequently Asked Questions</h3>';
    
    HELP_CONTENT.faqs.forEach((faq, index) => {
        html += `
            <div class="faq-item">
                <div class="faq-question" onclick="toggleFAQ(${index})">
                    <span>${faq.q}</span>
                    <span class="faq-toggle">▼</span>
                </div>
                <div class="faq-answer" id="faq-${index}" style="display: none;">
                    ${faq.a}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

/**
 * Generate video tours content
 */
function generateVideoToursContent() {
    return `
        <div class="video-tours">
            <h3>🎥 Interactive Feature Tours</h3>
            <p class="video-intro">Click any tour below to see step-by-step demonstrations:</p>
            
            <div class="tour-grid">
                <div class="tour-card" onclick="startFeatureTutorial('formInput')">
                    <div class="tour-icon">📝</div>
                    <h4>Form-Based Generation</h4>
                    <p>Learn to create test cases using the form</p>
                    <button class="tour-btn">▶ Start Tour</button>
                </div>
                
                <div class="tour-card" onclick="startFeatureTutorial('fileUpload')">
                    <div class="tour-icon">📁</div>
                    <h4>Document Upload</h4>
                    <p>Upload Word/PDF files for test generation</p>
                    <button class="tour-btn">▶ Start Tour</button>
                </div>
                
                <div class="tour-card" onclick="startFeatureTutorial('testDataGenerator')">
                    <div class="tour-icon">🔧</div>
                    <h4>Test Data Generator</h4>
                    <p>Generate realistic test data instantly</p>
                    <button class="tour-btn">▶ Start Tour</button>
                </div>
                
                <div class="tour-card" onclick="startFeatureTutorial('regressionSelector')">
                    <div class="tour-icon">🔄</div>
                    <h4>Regression Testing</h4>
                    <p>Select tests based on code changes</p>
                    <button class="tour-btn">▶ Start Tour</button>
                </div>
                
                <div class="tour-card" onclick="startFeatureTutorial('jiraIntegration')">
                    <div class="tour-icon">🔗</div>
                    <h4>JIRA Integration</h4>
                    <p>Push test cases to JIRA automatically</p>
                    <button class="tour-btn">▶ Start Tour</button>
                </div>
                
                <div class="tour-card" onclick="startFeatureTutorial('aiSuggestions')">
                    <div class="tour-icon">✨</div>
                    <h4>AI Suggestions</h4>
                    <p>Get real-time writing assistance</p>
                    <button class="tour-btn">▶ Start Tour</button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Create tutorial overlay
 */
function createTutorialOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'tutorial-overlay';
    overlay.id = 'tutorialOverlay';
    overlay.style.display = 'none';
    
    overlay.innerHTML = `
        <div class="tutorial-spotlight"></div>
        <div class="tutorial-tooltip">
            <div class="tutorial-header">
                <span class="tutorial-step-indicator"></span>
                <button class="tutorial-close" onclick="closeTutorial()">&times;</button>
            </div>
            <div class="tutorial-content">
                <h3 class="tutorial-title"></h3>
                <p class="tutorial-description"></p>
            </div>
            <div class="tutorial-footer">
                <button class="tutorial-prev" onclick="previousTutorialStep()">← Previous</button>
                <button class="tutorial-next" onclick="nextTutorialStep()">Next →</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    tutorialOverlay = overlay;
}

/**
 * Toggle help center
 */
function toggleHelpCenter() {
    const panel = document.getElementById('helpCenter');
    if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
}

/**
 * Close help center
 */
function closeHelpCenter() {
    const panel = document.getElementById('helpCenter');
    if (panel) {
        panel.style.display = 'none';
    }
}

/**
 * Switch help tab
 */
function switchHelpTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.help-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`.help-tab[data-tab="${tabName}"]`).classList.add('active');
    
    // Update content
    const content = document.getElementById('helpTabContent');
    if (!content) return;
    
    switch(tabName) {
        case 'features':
            content.innerHTML = generateFeaturesContent();
            break;
        case 'shortcuts':
            content.innerHTML = generateShortcutsContent();
            break;
        case 'faqs':
            content.innerHTML = generateFAQsContent();
            break;
        case 'video':
            content.innerHTML = generateVideoToursContent();
            break;
    }
}

/**
 * Filter help content
 */
function filterHelpContent() {
    const searchTerm = document.getElementById('helpSearch').value.toLowerCase();
    const featureCards = document.querySelectorAll('.feature-card');
    
    featureCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(searchTerm) ? 'block' : 'none';
    });
}

/**
 * Toggle FAQ
 */
function toggleFAQ(index) {
    const answer = document.getElementById(`faq-${index}`);
    if (answer) {
        answer.style.display = answer.style.display === 'none' ? 'block' : 'none';
    }
}

/**
 * Start getting started tutorial
 */
function startGettingStartedTutorial() {
    closeHelpCenter();
    const tutorial = HELP_CONTENT.gettingStarted;
    runTutorial(tutorial.steps);
    
    if (typeof showToast === 'function') {
        showToast('Tutorial Started', 'Follow the highlighted steps to learn TestMate AI', 'info', 3000);
    }
}

/**
 * Start feature-specific tutorial
 */
function startFeatureTutorial(featureName) {
    closeHelpCenter();
    
    // Feature-specific tutorials
    const tutorials = {
        testDataGenerator: () => {
            if (typeof openTestDataGenerator === 'function') {
                openTestDataGenerator();
                if (typeof runTestDataDemo === 'function') {
                    setTimeout(runTestDataDemo, 500);
                }
            }
        },
        regressionSelector: () => {
            if (typeof openRegressionSelector === 'function') {
                openRegressionSelector();
                if (typeof runRegressionDemo === 'function') {
                    setTimeout(runRegressionDemo, 500);
                }
            }
        },
        formInput: () => {
            document.getElementById('userStory')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (typeof showToast === 'function') {
                showToast('Form Tutorial', 'Fill in these fields and click Generate Test Cases', 'info', 4000);
            }
        },
        fileUpload: () => {
            document.querySelector('.upload-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (typeof showToast === 'function') {
                showToast('File Upload Tutorial', 'Drag & drop your Word/PDF files here', 'info', 4000);
            }
        },
        jiraIntegration: () => {
            document.getElementById('jiraUrl')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (typeof showToast === 'function') {
                showToast('JIRA Tutorial', 'Enter your JIRA credentials to push test cases', 'info', 4000);
            }
        },
        aiSuggestions: () => {
            const userStory = document.getElementById('userStory');
            if (userStory) {
                userStory.focus();
                if (typeof showToast === 'function') {
                    showToast('AI Suggestions', 'Start typing to see AI-powered suggestions appear!', 'info', 4000);
                }
            }
        }
    };
    
    if (tutorials[featureName]) {
        tutorials[featureName]();
    }
}

/**
 * Run interactive tutorial
 */
function runTutorial(steps) {
    currentTutorialStep = 0;
    tutorialActive = true;
    showTutorialStep(steps, 0);
}

/**
 * Show tutorial step
 */
function showTutorialStep(steps, stepIndex) {
    if (!tutorialOverlay || stepIndex >= steps.length) {
        closeTutorial();
        return;
    }
    
    const step = steps[stepIndex];
    tutorialOverlay.style.display = 'flex';
    
    // Update content
    tutorialOverlay.querySelector('.tutorial-step-indicator').textContent = `Step ${stepIndex + 1} of ${steps.length}`;
    tutorialOverlay.querySelector('.tutorial-title').textContent = step.title;
    tutorialOverlay.querySelector('.tutorial-description').textContent = step.description;
    
    // Update buttons
    const prevBtn = tutorialOverlay.querySelector('.tutorial-prev');
    const nextBtn = tutorialOverlay.querySelector('.tutorial-next');
    
    prevBtn.style.display = stepIndex === 0 ? 'none' : 'inline-block';
    nextBtn.textContent = stepIndex === steps.length - 1 ? 'Finish' : (step.action || 'Next →');
    
    // Highlight target element
    if (step.target) {
        const target = document.querySelector(step.target);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            highlightElement(target);
        }
    }
}

/**
 * Highlight element
 */
function highlightElement(element) {
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
        el.classList.remove('tutorial-highlight');
    });
    element.classList.add('tutorial-highlight');
}

/**
 * Next tutorial step
 */
function nextTutorialStep() {
    const steps = HELP_CONTENT.gettingStarted.steps;
    currentTutorialStep++;
    
    if (currentTutorialStep >= steps.length) {
        closeTutorial();
        if (typeof showToast === 'function') {
            showToast('Tutorial Complete!', 'You\'re ready to use TestMate AI!', 'success', 3000);
        }
        // Mark as not first time user
        localStorage.setItem('testmate_tutorial_completed', 'true');
    } else {
        showTutorialStep(steps, currentTutorialStep);
    }
}

/**
 * Previous tutorial step
 */
function previousTutorialStep() {
    if (currentTutorialStep > 0) {
        currentTutorialStep--;
        showTutorialStep(HELP_CONTENT.gettingStarted.steps, currentTutorialStep);
    }
}

/**
 * Close tutorial
 */
function closeTutorial() {
    if (tutorialOverlay) {
        tutorialOverlay.style.display = 'none';
    }
    tutorialActive = false;
    currentTutorialStep = 0;
    
    // Remove highlights
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
        el.classList.remove('tutorial-highlight');
    });
}

/**
 * Check if first time user
 */
function checkFirstTimeUser() {
    const completed = localStorage.getItem('testmate_tutorial_completed');
    
    if (!completed) {
        // Show welcome message after 2 seconds
        setTimeout(() => {
            if (typeof showToast === 'function') {
                showToast(
                    '👋 Welcome to TestMate AI!',
                    'Click the ❓ help icon for interactive tutorials',
                    'info',
                    6000
                );
            }
        }, 2000);
    }
}

/**
 * Add keyboard shortcuts
 */
function addKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl+H - Help Center
        if (e.ctrlKey && e.key === 'h') {
            e.preventDefault();
            toggleHelpCenter();
        }
        
        // Escape - Close panels
        if (e.key === 'Escape') {
            closeHelpCenter();
            closeTutorial();
        }
    });
}

// Expose functions globally
window.toggleHelpCenter = toggleHelpCenter;
window.closeHelpCenter = closeHelpCenter;
window.switchHelpTab = switchHelpTab;
window.toggleFAQ = toggleFAQ;
window.startGettingStartedTutorial = startGettingStartedTutorial;
window.startFeatureTutorial = startFeatureTutorial;
window.nextTutorialStep = nextTutorialStep;
window.previousTutorialStep = previousTutorialStep;
window.closeTutorial = closeTutorial;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHelpSystem);
} else {
    initHelpSystem();
}
