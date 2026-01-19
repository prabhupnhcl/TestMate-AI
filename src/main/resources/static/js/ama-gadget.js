/**
 * AMA (Ask Me Anything) Floating Widget
 * Modern bottom-right chat widget for TestMate AI
 */

/**
 * Initialize AMA Floating Widget
 */
function initAMAGadget() {
    const amaFloatBtn = document.getElementById('amaFloatBtn');
    const amaWidgetContainer = document.getElementById('amaWidgetContainer');
    const amaInput = document.getElementById('amaInput');
    const amaSendBtn = document.getElementById('amaSendBtn');
    const amaMessages = document.getElementById('amaMessages');
    const amaTyping = document.getElementById('amaTyping');
    const quickQuestionBtns = document.querySelectorAll('.quick-question-btn');
    
    if (!amaFloatBtn || !amaWidgetContainer || !amaInput || !amaSendBtn || !amaMessages) {
        console.warn('AMA Widget elements not found');
        return;
    }
    
    console.log('AMA Floating Widget initialized successfully');
    
    let isWidgetOpen = false;
    
    // Toggle widget open/close
    const toggleWidget = () => {
        isWidgetOpen = !isWidgetOpen;
        
        if (isWidgetOpen) {
            amaWidgetContainer.style.display = 'flex';
            amaFloatBtn.querySelector('.ama-btn-icon').style.display = 'none';
            amaFloatBtn.querySelector('.ama-btn-close').style.display = 'block';
            amaInput.focus();
        } else {
            amaWidgetContainer.style.display = 'none';
            amaFloatBtn.querySelector('.ama-btn-icon').style.display = 'block';
            amaFloatBtn.querySelector('.ama-btn-close').style.display = 'none';
        }
    };
    
    // Send message function
    const sendAMAMessage = async () => {
        const question = amaInput.value.trim();
        if (!question) return;
        
        // Add user message
        addAMAMessage(question, 'user');
        amaInput.value = '';
        amaSendBtn.disabled = true;
        
        // Show typing indicator
        if (amaTyping) amaTyping.style.display = 'flex';
        
        try {
            // Call the actual backend API
            const response = await fetch('/testmate/api/testcases/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: question })
            });
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            const data = await response.json();
            const botResponse = data.response || "I apologize, but I couldn't generate a response. Please try again.";
            
            addAMAMessage(botResponse, 'bot');
            
        } catch (error) {
            console.error('Error sending chat message:', error);
            addAMAMessage("I apologize, but I encountered an error processing your question. Please try again.", 'bot');
        } finally {
            if (amaTyping) amaTyping.style.display = 'none';
            amaSendBtn.disabled = false;
        }
    };
    
    // Add message to chat
    const addAMAMessage = (text, sender) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `ama-message ${sender === 'user' ? 'user-message' : 'bot-message'}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = sender === 'user' ? '👤' : '🤖';
        
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        
        const p = document.createElement('p');
        p.textContent = text;
        bubble.appendChild(p);
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(bubble);
        
        amaMessages.appendChild(messageDiv);
        amaMessages.scrollTop = amaMessages.scrollHeight;
    };
    
    // Get AI response (mock implementation - replace with actual API call)
    const getAMAResponse = (question) => {
        const lowerQ = question.toLowerCase();
        
        // Best practices
        if (lowerQ.includes('best practice') || lowerQ.includes('writing test')) {
            return "Here are key best practices for writing test cases: 1) Keep test cases simple and focused on one scenario, 2) Use clear, descriptive titles, 3) Include all necessary preconditions, 4) Write detailed but concise steps, 5) Specify expected results clearly, and 6) Make tests independent and repeatable.";
        } 
        // Edge cases
        else if (lowerQ.includes('edge case') || lowerQ.includes('effective edge')) {
            return "Edge cases are scenarios at the extreme boundaries of input ranges or unusual conditions. To create effective edge cases: 1) Test minimum and maximum values, 2) Test empty/null inputs, 3) Test boundary conditions, 4) Test special characters, and 5) Consider timing issues and race conditions.";
        } 
        // Positive/Negative testing
        else if ((lowerQ.includes('positive') && lowerQ.includes('negative')) || 
                 lowerQ.includes('difference between positive') || 
                 lowerQ.includes('test types')) {
            return "Positive testing validates that the system works correctly with valid inputs, while negative testing checks how the system handles invalid inputs or unexpected conditions. Both are essential: positive tests ensure functionality works, negative tests ensure the system fails gracefully and securely.";
        } 
        // Coverage
        else if (lowerQ.includes('coverage') || lowerQ.includes('improve test coverage')) {
            return "To improve test coverage: 1) Analyze requirements thoroughly to identify all scenarios, 2) Use techniques like equivalence partitioning and boundary value analysis, 3) Include both positive and negative test cases, 4) Test all acceptance criteria, 5) Review code/logic paths, and 6) Use coverage tools to identify gaps.";
        } 
        // JIRA integration
        else if (lowerQ.includes('jira') || lowerQ.includes('integration') || lowerQ.includes('atlassian')) {
            return "TestMate AI integrates directly with JIRA! You can fetch stories using JIRA IDs, and the AI will automatically extract user stories, acceptance criteria, and business rules to generate comprehensive test cases. Just enter your JIRA credentials in the JIRA Integration tab.";
        } 
        // How to use TestMate
        else if ((lowerQ.includes('how') && lowerQ.includes('use')) || 
                 lowerQ.includes('getting started') || 
                 lowerQ.includes('how to')) {
            return "Using TestMate AI is simple: 1) Choose your input method (JIRA Integration, Manual Entry, or Upload Document), 2) Provide the story details, 3) Click 'Generate Test Cases', and 4) Review, edit if needed, and download as CSV or Excel. The AI handles the rest!";
        } 
        // Features
        else if (lowerQ.includes('testmate') || lowerQ.includes('features') || lowerQ.includes('what can')) {
            return "TestMate AI offers: ✨ AI-powered test case generation from JIRA stories, 📄 Document upload support (.doc/.docx), 📊 Coverage analysis and gap detection, 📥 Multiple export formats (CSV, Excel, PDF), 💬 Interactive chat for refinements, and 🎯 Automatic edge case identification!";
        } 
        // Export/Download
        else if (lowerQ.includes('export') || lowerQ.includes('download') || lowerQ.includes('csv') || lowerQ.includes('excel')) {
            return "TestMate AI supports multiple export formats: 📥 CSV (Octane-compatible), 📊 Excel with rich formatting, and 📄 PDF for documentation. Just click the download buttons after generating your test cases. All exports include test case IDs, descriptions, steps, and expected results.";
        }
        // Test case creation
        else if (lowerQ.includes('create test') || lowerQ.includes('generate test') || lowerQ.includes('test case')) {
            return "TestMate AI automatically generates comprehensive test cases from your requirements! Simply provide user stories and acceptance criteria (via JIRA, manual entry, or document upload), and our AI will create detailed test cases with steps, expected results, and coverage analysis.";
        }
        // Quality/QA
        else if (lowerQ.includes('quality') || lowerQ.includes('qa') || lowerQ.includes('testing')) {
            return "Quality assurance is at the heart of TestMate AI! We help you create thorough test cases that cover functional requirements, edge cases, and negative scenarios. Our AI thinks like a senior QA engineer to ensure comprehensive coverage and identify potential gaps.";
        }
        // Default response
        else {
            return "That's a great question! TestMate AI is designed to help you create comprehensive test cases efficiently. Feel free to ask about best practices, testing strategies, JIRA integration, export formats, or how to use specific features. I'm here to help make your testing easier! 🚀";
        }
    };
    
    // Event listeners
    amaFloatBtn.addEventListener('click', toggleWidget);
    amaSendBtn.addEventListener('click', sendAMAMessage);
    
    amaInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendAMAMessage();
        }
    });
    
    // Quick question buttons
    quickQuestionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const question = btn.dataset.question;
            amaInput.value = question;
            sendAMAMessage();
        });
    });
    
    // Close widget when clicking outside
    document.addEventListener('click', (e) => {
        if (isWidgetOpen && 
            !amaWidgetContainer.contains(e.target) && 
            !amaFloatBtn.contains(e.target)) {
            toggleWidget();
        }
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAMAGadget);
} else {
    initAMAGadget();
}
