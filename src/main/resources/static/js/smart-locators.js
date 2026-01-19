/**
 * Smart Locators Module
 * Handles AI-powered element locator suggestions
 */

// Initialize Smart Locators functionality
function initSmartLocators() {
    const locatorForm = document.getElementById('locatorForm');
    const suggestLocatorsBtn = document.getElementById('suggestLocatorsBtn');
    const clearLocatorBtn = document.getElementById('clearLocatorBtn');
    const locatorSuggestionsResults = document.getElementById('locatorSuggestionsResults');
    
    if (!locatorForm || !suggestLocatorsBtn) {
        console.warn('Locator form elements not found');
        return;
    }
    
    // Handle form submission
    locatorForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleLocatorSuggestion();
    });
    
    // Clear form
    if (clearLocatorBtn) {
        clearLocatorBtn.addEventListener('click', () => {
            locatorForm.reset();
            if (locatorSuggestionsResults) {
                locatorSuggestionsResults.style.display = 'none';
            }
        });
    }
}

// Handle locator suggestion request
async function handleLocatorSuggestion() {
    const suggestLocatorsBtn = document.getElementById('suggestLocatorsBtn');
    const btnText = suggestLocatorsBtn.querySelector('.btn-text');
    const spinner = suggestLocatorsBtn.querySelector('.spinner');
    const locatorSuggestionsResults = document.getElementById('locatorSuggestionsResults');
    
    // Collect form data
    const request = {
        elementName: document.getElementById('elementName').value,
        elementType: document.getElementById('elementType').value,
        elementText: document.getElementById('elementText').value || '',
        elementId: document.getElementById('elementId').value || '',
        elementClass: document.getElementById('elementClass').value || '',
        parentElement: document.getElementById('parentElement').value || '',
        context: document.getElementById('elementContext').value || ''
    };
    
    // Show loading state
    suggestLocatorsBtn.disabled = true;
    btnText.style.display = 'none';
    spinner.style.display = 'inline-block';
    
    try {
        const response = await fetch('/testmate/api/testcases/locators/suggest', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(request)
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        displayLocatorSuggestions(data);
        
        // Show results section
        if (locatorSuggestionsResults) {
            locatorSuggestionsResults.style.display = 'block';
            // Scroll to results
            locatorSuggestionsResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        
    } catch (error) {
        console.error('Error getting locator suggestions:', error);
        showNotification('Failed to generate locator suggestions. Please try again.', 'error');
    } finally {
        // Reset button state
        suggestLocatorsBtn.disabled = false;
        btnText.style.display = 'inline';
        spinner.style.display = 'none';
    }
}

// Display locator suggestions
function displayLocatorSuggestions(data) {
    const bestPracticeBox = document.getElementById('bestPracticeBox');
    const locatorSuggestionsList = document.getElementById('locatorSuggestionsList');
    
    if (!bestPracticeBox || !locatorSuggestionsList) return;
    
    // Display best practice
    if (data.bestPractice) {
        bestPracticeBox.innerHTML = `
            <h4>💡 Best Practice</h4>
            <p>${escapeHtml(data.bestPractice)}</p>
        `;
    }
    
    // Display suggestions
    if (data.suggestions && data.suggestions.length > 0) {
        locatorSuggestionsList.innerHTML = data.suggestions.map((suggestion, index) => 
            createLocatorCard(suggestion, index)
        ).join('');
        
        // Add copy button event listeners
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                let code;
                if (e.target.classList.contains('copy-code-btn') || e.target.classList.contains('copy-wait-btn')) {
                    code = e.target.getAttribute('data-code');
                } else {
                    code = e.target.closest('.locator-code').querySelector('code').textContent;
                }
                copyToClipboard(code, e.target);
            });
        });
    } else {
        locatorSuggestionsList.innerHTML = '<p>No suggestions available.</p>';
    }
}

// Create locator card HTML
function createLocatorCard(suggestion, index) {
    const priorityClass = `priority-${suggestion.priority.toLowerCase()}`;
    const strategyIcons = {
        'ID': '🆔',
        'CSS Selector': '🎨',
        'XPath': '🔗',
        'Name': '📝',
        'Class': '📚',
        'Link Text': '🔗',
        'Partial Link Text': '🔗',
        'Tag Name': '🏷️'
    };
    const icon = strategyIcons[suggestion.type] || '🎯';
    const score = suggestion.reliabilityScore || 0;
    const scoreClass = score >= 9 ? 'score-high' : score >= 6 ? 'score-medium' : 'score-low';
    
    return `
        <div class="locator-card">
            <div class="locator-card-header">
                <div class="locator-strategy">
                    <span class="locator-strategy-icon">${icon}</span>
                    <h4>${escapeHtml(suggestion.type)}</h4>
                </div>
                <div class="header-badges">
                    <span class="priority-badge ${priorityClass}">${escapeHtml(suggestion.priority)}</span>
                    ${score > 0 ? `<span class="reliability-score ${scoreClass}">Score: ${score}/10</span>` : ''}
                </div>
            </div>
            
            <div class="locator-code">
                <code>${escapeHtml(suggestion.locator)}</code>
                <button class="copy-btn" title="Copy to clipboard">📋 Copy</button>
            </div>
            
            <p class="locator-reason">
                <strong>Why use this?</strong><br>
                ${escapeHtml(suggestion.description)}
            </p>
            
            ${suggestion.seleniumJavaCode ? `
                <div class="locator-example">
                    <h5>💻 Selenium Java Code:</h5>
                    <code>${escapeHtml(suggestion.seleniumJavaCode)}</code>
                    <button class="copy-btn copy-code-btn" data-code="${escapeHtml(suggestion.seleniumJavaCode).replace(/"/g, '&quot;')}" title="Copy code">📋 Copy Code</button>
                </div>
            ` : suggestion.seleniumCode ? `
                <div class="locator-example">
                    <h5>💻 Example Usage:</h5>
                    <code>${escapeHtml(suggestion.seleniumCode)}</code>
                </div>
            ` : ''}
            
            ${suggestion.seleniumWaitCode ? `
                <div class="locator-example wait-code">
                    <h5>⏱️ Explicit Wait Strategy:</h5>
                    <code>${escapeHtml(suggestion.seleniumWaitCode)}</code>
                    <button class="copy-btn copy-wait-btn" data-code="${escapeHtml(suggestion.seleniumWaitCode).replace(/"/g, '&quot;')}" title="Copy wait code">📋 Copy Wait</button>
                </div>
            ` : ''}
        </div>
    `;
}

// Copy to clipboard function
function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.textContent;
        button.textContent = '✓ Copied!';
        button.classList.add('copied');
        
        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        showNotification('Failed to copy to clipboard', 'error');
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSmartLocators);
} else {
    initSmartLocators();
}
