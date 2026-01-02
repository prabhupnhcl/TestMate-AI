// JIRA Integration JavaScript - Per-User Credentials

/**
 * Download CSV for a specific document/story
 */
function downloadDocumentCsv(fileName, docIndex) {
    console.log('downloadDocumentCsv called with:', fileName, 'index:', docIndex);
    
    if (!window.currentResponse || !window.currentResponse.documentResults || !window.currentResponse.documentResults[docIndex]) {
        console.error('No data found for index:', docIndex);
        alert('No test cases available to download');
        return;
    }
    
    const docResult = window.currentResponse.documentResults[docIndex];
    if (!docResult.success || !docResult.testCaseResponse) {
        alert('No test cases available for this document');
        return;
    }
    
    let csvContent;
    
    // Use existing csvContent if available, otherwise generate from testCases
    if (docResult.testCaseResponse.csvContent) {
        csvContent = docResult.testCaseResponse.csvContent;
    } else if (docResult.testCaseResponse.testCases && docResult.testCaseResponse.testCases.length > 0) {
        // Generate CSV from test cases
        csvContent = 'Test Case ID,Test Scenario,Preconditions,Test Steps,Expected Result,Priority,Test Type,JIRA Issue\n';
        
        docResult.testCaseResponse.testCases.forEach((tc, index) => {
            const row = [
                tc.testCaseId || `TC-${String(index + 1).padStart(3, '0')}`,
                escapeCsvField(tc.testCase || tc.testScenario || ''),
                escapeCsvField(tc.precondition || tc.preconditions || ''),
                escapeCsvField(tc.testSteps || ''),
                escapeCsvField(tc.expectedResult || ''),
                escapeCsvField(tc.priority || 'Medium'),
                escapeCsvField(tc.type || tc.testType || 'Functional'),
                escapeCsvField(fileName || '')
            ];
            csvContent += row.join(',') + '\n';
        });
    } else {
        alert('No test cases available for this document');
        return;
    }
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    // Extract base filename without extension
    const baseFileName = fileName.replace(/\.[^/.]+$/, '');
    
    link.href = URL.createObjectURL(blob);
    link.download = `${baseFileName}_test_cases.csv`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    
    console.log('CSV download initiated for:', baseFileName);
}

/**
 * Escape CSV field
 */
function escapeCsvField(field) {
    if (field == null) return '';
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

// Recent stories management
const RECENT_STORIES_KEY = 'testmate_recent_stories';
const MAX_RECENT_STORIES = 10;

function saveToRecentStories(issueKeys) {
    try {
        let recent = JSON.parse(localStorage.getItem(RECENT_STORIES_KEY) || '[]');
        
        // Add new keys to the beginning
        issueKeys.forEach(key => {
            // Remove if already exists
            recent = recent.filter(item => item.key !== key);
            // Add to beginning
            recent.unshift({ key, timestamp: new Date().toISOString() });
        });
        
        // Keep only last MAX_RECENT_STORIES
        recent = recent.slice(0, MAX_RECENT_STORIES);
        
        localStorage.setItem(RECENT_STORIES_KEY, JSON.stringify(recent));
        updateRecentStoriesDropdown();
    } catch (e) {
        console.error('Error saving to recent stories:', e);
    }
}

function updateRecentStoriesDropdown() {
    const dropdown = document.getElementById('recentStoriesDropdown');
    if (!dropdown) return;
    
    try {
        const recent = JSON.parse(localStorage.getItem(RECENT_STORIES_KEY) || '[]');
        
        if (recent.length === 0) {
            dropdown.innerHTML = '<option value="">-- No recent stories --</option>';
            return;
        }
        
        dropdown.innerHTML = '<option value="">-- Select from recent stories --</option>' +
            recent.map(item => `<option value="${item.key}">${item.key}</option>`).join('');
    } catch (e) {
        console.error('Error updating recent stories dropdown:', e);
    }
}

function setupBulkSelectionButtons() {
    const selectAllBtn = document.getElementById('selectAllStories');
    const deselectAllBtn = document.getElementById('deselectAllStories');
    
    if (selectAllBtn) {
        selectAllBtn.onclick = () => {
            document.querySelectorAll('.story-checkbox').forEach(cb => cb.checked = true);
            updateSelectionCount();
        };
    }
    
    if (deselectAllBtn) {
        deselectAllBtn.onclick = () => {
            document.querySelectorAll('.story-checkbox').forEach(cb => cb.checked = false);
            updateSelectionCount();
        };
    }
}

function updateSelectionCount() {
    const countElement = document.getElementById('selectionCount');
    if (!countElement) return;
    
    const total = document.querySelectorAll('.story-checkbox').length;
    const selected = document.querySelectorAll('.story-checkbox:checked').length;
    
    countElement.textContent = `${selected} of ${total} selected`;
    countElement.style.color = selected > 0 ? 'var(--success-color)' : 'var(--text-secondary)';
}

function updateProgressIndicator(current, total, currentStory, successCount, failureCount) {
    const progressIndicator = document.getElementById('batchProgressIndicator');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const progressPercentage = document.getElementById('progressPercentage');
    const currentStoryName = document.getElementById('currentStoryName');
    const successCountEl = document.getElementById('successCount');
    const failureCountEl = document.getElementById('failureCount');
    const remainingCountEl = document.getElementById('remainingCount');
    
    if (!progressIndicator) return;
    
    const percentage = Math.round((current / total) * 100);
    const remaining = total - current;
    
    progressIndicator.style.display = 'block';
    progressBar.style.width = percentage + '%';
    progressText.textContent = `Processing story ${current} of ${total}...`;
    progressPercentage.textContent = percentage + '%';
    currentStoryName.textContent = currentStory || 'Loading...';
    successCountEl.textContent = successCount || 0;
    failureCountEl.textContent = failureCount || 0;
    remainingCountEl.textContent = remaining;
}

function hideProgressIndicator() {
    const progressIndicator = document.getElementById('batchProgressIndicator');
    if (progressIndicator) {
        progressIndicator.style.display = 'none';
    }
}

// Validate JIRA connection on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('JIRA Integration: DOMContentLoaded fired');
    setupJiraEventListeners();
    updateRecentStoriesDropdown();
    
    // Setup recent stories dropdown change handler
    const recentDropdown = document.getElementById('recentStoriesDropdown');
    if (recentDropdown) {
        recentDropdown.addEventListener('change', (e) => {
            if (e.target.value) {
                const issueKeysInput = document.getElementById('jiraIssueKeys');
                if (issueKeysInput) {
                    issueKeysInput.value = e.target.value;
                }
            }
        });
    }
});

function setupJiraEventListeners() {
    console.log('JIRA Integration: Setting up event listeners');
    const testConnectionBtn = document.getElementById('testJiraConnection');
    const fetchStoryDetailsBtn = document.getElementById('fetchJiraStoryDetails');
    const generateFromJiraBtn = document.getElementById('generateFromJira');
    
    console.log('Test Connection Button:', testConnectionBtn);
    console.log('Fetch Story Details Button:', fetchStoryDetailsBtn);
    console.log('Generate From JIRA Button:', generateFromJiraBtn);
    
    if (testConnectionBtn) {
        testConnectionBtn.disabled = false;
        testConnectionBtn.addEventListener('click', handleTestConnection);
        console.log('Test Connection button event listener attached');
    }
    
    if (fetchStoryDetailsBtn) {
        fetchStoryDetailsBtn.disabled = false;
        fetchStoryDetailsBtn.addEventListener('click', handleFetchStoryDetails);
        console.log('Fetch Story Details button event listener attached');
    }
    
    if (generateFromJiraBtn) {
        generateFromJiraBtn.disabled = false;
        generateFromJiraBtn.addEventListener('click', handleGenerateFromSelectedStories);
        console.log('Generate From JIRA button event listener attached');
    }
}

// Get JIRA credentials from form
function getJiraCredentials() {
    const jiraUrl = document.getElementById('jiraUrl').value.trim();
    const username = document.getElementById('jiraUsername').value.trim();
    const apiToken = document.getElementById('jiraApiToken').value.trim();
    
    if (!jiraUrl || !username || !apiToken) {
        throw new Error('Please fill in all JIRA credentials (URL, Username, API Token)');
    }
    
    // Validate and normalize JIRA URL
    let normalizedUrl = jiraUrl;
    
    // Add https:// if no protocol specified
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = 'https://' + normalizedUrl;
    }
    
    // Remove trailing slash
    normalizedUrl = normalizedUrl.replace(/\/$/, '');
    
    // Basic URL validation
    try {
        new URL(normalizedUrl);
    } catch (e) {
        throw new Error('Invalid JIRA URL format. Example: https://resbank.atlassian.net');
    }
    
    return {
        jiraUrl: normalizedUrl,
        username: username,
        apiToken: apiToken
    };
}

// Test JIRA connection
async function handleTestConnection() {
    const testBtn = document.getElementById('testJiraConnection');
    if (!testBtn) {
        console.error('Test connection button not found');
        return;
    }
    
    const btnText = testBtn.querySelector('.btn-text');
    const spinner = testBtn.querySelector('.spinner');
    const statusDiv = document.getElementById('jiraConnectionStatus');
    
    if (!btnText || !spinner || !statusDiv) {
        console.error('Button elements not found:', { btnText, spinner, statusDiv });
        return;
    }
    
    try {
        const credentials = getJiraCredentials();
        
        // Disable button and show loading
        testBtn.disabled = true;
        btnText.style.display = 'none';
        spinner.style.display = 'inline-block';
        
        statusDiv.style.display = 'block';
        statusDiv.innerHTML = `
            <div class="status-checking">
                <span class="spinner-small"></span>
                <span>Testing connection to JIRA...</span>
            </div>
        `;
        
        const response = await fetch('/testmate/api/jira/validate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.connected) {
            statusDiv.innerHTML = `
                <div class="status-success">
                    <span class="status-icon">✅</span>
                    <span>${data.message || 'Successfully connected to JIRA'}</span>
                </div>
            `;
            
            // Show project selection section after successful connection
            const projectSelection = document.getElementById('jiraProjectSelection');
            if (projectSelection) {
                projectSelection.style.display = 'block';
            }
        } else {
            statusDiv.innerHTML = `
                <div class="status-error">
                    <span class="status-icon">❌</span>
                    <span>${data.message || 'Failed to connect to JIRA. Please check your credentials.'}</span>
                </div>
            `;
        }
    } catch (error) {
        console.error('JIRA connection test error:', error);
        if (statusDiv) {
            statusDiv.style.display = 'block';
            statusDiv.innerHTML = `
                <div class="status-error">
                    <span class="status-icon">❌</span>
                    <span>Error: ${error.message}</span>
                </div>
            `;
        }
    } finally {
        // Re-enable button
        if (testBtn) {
            testBtn.disabled = false;
        }
        if (btnText) {
            btnText.style.display = 'inline';
        }
        if (spinner) {
            spinner.style.display = 'none';
        }
    }
}

// Handle single JIRA key fetch
async function handleSingleJiraFetch() {
    const jiraKeyInput = document.getElementById('jiraKey');
    const jiraKey = jiraKeyInput.value.trim().toUpperCase();
    
    // Validate JIRA key format (supports alphanumeric project keys like R2CX-1234)
    const jiraKeyPattern = /^[A-Z0-9]+-\d+$/;
    if (!jiraKeyPattern.test(jiraKey)) {
        showJiraError('Invalid JIRA key format. Expected format: PROJECT-123 or R2CX-1234');
        return;
    }
    
    const fetchBtn = document.getElementById('fetchJiraBtn');
    const btnText = fetchBtn.querySelector('.btn-text');
    const spinner = fetchBtn.querySelector('.spinner');
    
    try {
        const credentials = getJiraCredentials();
        
        // Disable button and show loading
        fetchBtn.disabled = true;
        btnText.style.display = 'none';
        spinner.style.display = 'inline-block';
        
        showJiraLoading(`Fetching story ${jiraKey} from JIRA...`);
        
        const response = await fetch(`/testmate/api/jira/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                credentials: credentials,
                issueKey: jiraKey
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch JIRA story');
        }
        
        const testCaseResponse = await response.json();
        displayJiraResults(testCaseResponse, jiraKey);
        showJiraSuccess(`Successfully generated test cases for ${jiraKey}`);
        
    } catch (error) {
        const credentials = getJiraCredentials(); // Get credentials for error message
        let errorMessage = error.message;
        
        // Provide more helpful error messages for common issues
        if (errorMessage.includes('not found') || errorMessage.includes('404')) {
            errorMessage = `❌ JIRA Issue Not Found\n\n` +
                `The issue '${jiraKey}' could not be found. This could mean:\n\n` +
                `📋 **Check the Issue Key:**\n` +
                `   • Make sure it follows the format PROJECT-123 (e.g., PROJ-456, ABC-789)\n` +
                `   • Verify the project code is correct\n\n` +
                `🔐 **Check Permissions:**\n` +
                `   • You need 'Browse Projects' permission for this issue\n` +
                `   • The issue may be in a restricted project\n\n` +
                `🌐 **Check JIRA URL:**\n` +
                `   • Verify your JIRA URL is correct\n` +
                `   • Make sure you're connected to the right JIRA instance\n\n` +
                `💡 **Tip:** Try accessing the issue directly in JIRA first: ${credentials.jiraUrl}/browse/${jiraKey}`;
        } else if (errorMessage.includes('authentication') || errorMessage.includes('401')) {
            errorMessage = `🔑 **Authentication Failed**\n\n` +
                `Please check your JIRA credentials:\n` +
                `   • Username should be your email address\n` +
                `   • API Token should be generated from JIRA settings\n` +
                `   • Both fields are required and case-sensitive`;
        } else if (errorMessage.includes('Access denied') || errorMessage.includes('403')) {
            errorMessage = `🚫 **Access Denied**\n\n` +
                `You don't have permission to view this issue:\n` +
                `   • Contact your JIRA administrator\n` +
                `   • You may need 'Browse Projects' permission\n` +
                `   • The issue might be in a restricted project`;
        }
        
        showJiraError(errorMessage);
    } finally {
        // Re-enable button
        fetchBtn.disabled = false;
        btnText.style.display = 'inline';
        spinner.style.display = 'none';
    }
}

// Handle batch JIRA keys fetch
async function handleBatchJiraFetch() {
    const jiraBatchKeysInput = document.getElementById('jiraBatchKeys');
    const keysText = jiraBatchKeysInput.value.trim();
    
    if (!keysText) {
        showJiraError('Please enter at least one JIRA key');
        return;
    }
    
    // Parse and validate JIRA keys
    const issueKeys = keysText.split('\n')
        .map(key => key.trim().toUpperCase())
        .filter(key => key.length > 0);
    
    if (issueKeys.length === 0) {
        showJiraError('No valid JIRA keys found');
        return;
    }
    
    if (issueKeys.length > 10) {
        showJiraError('Maximum 10 JIRA keys allowed per batch');
        return;
    }
    
    const jiraKeyPattern = /^[A-Z0-9]+-\d+$/;
    const invalidKeys = issueKeys.filter(key => !jiraKeyPattern.test(key));
    if (invalidKeys.length > 0) {
        showJiraError(`Invalid JIRA key format: ${invalidKeys.join(', ')}. Expected format: PROJECT-123 or R2CX-1234`);
        return;
    }
    
    const fetchBtn = document.getElementById('fetchBatchJiraBtn');
    const btnText = fetchBtn.querySelector('.btn-text');
    const spinner = fetchBtn.querySelector('.spinner');
    
    try {
        const credentials = getJiraCredentials();
        
        // Disable button and show loading
        fetchBtn.disabled = true;
        btnText.style.display = 'none';
        spinner.style.display = 'inline-block';
        
        showJiraLoading(`Fetching ${issueKeys.length} stories from JIRA...`);
        
        const response = await fetch('/testmate/api/jira/generate/batch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                credentials: credentials,
                issueKeys: issueKeys
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch JIRA stories');
        }
        
        const batchResponse = await response.json();
        displayBatchJiraResults(batchResponse);
        
        const successCount = batchResponse.results.filter(r => r.success).length;
        showJiraSuccess(`Successfully generated test cases for ${successCount}/${issueKeys.length} stories`);
        
    } catch (error) {
        showJiraError(`Error: ${error.message}`);
    } finally {
        // Re-enable button
        fetchBtn.disabled = false;
        btnText.style.display = 'inline';
        spinner.style.display = 'none';
    }
}

// Display single JIRA result
function displayJiraResults(testCaseResponse, jiraKey) {
    const outputSection = document.getElementById('outputSection');
    const summary = document.getElementById('summary');
    const testCasesContainer = document.getElementById('testCasesContainer');
    
    // Show output section
    outputSection.style.display = 'block';
    outputSection.scrollIntoView({ behavior: 'smooth' });
    
    // Display JIRA metadata
    const jiraMetadata = `
        <div class="jira-info-box">
            <h4>📋 JIRA Story Details</h4>
            <div class="metadata-grid">
                <div class="metadata-item">
                    <span class="label">Issue Key:</span>
                    <span class="value">${testCaseResponse.jiraIssueKey || jiraKey}</span>
                </div>
                <div class="metadata-item">
                    <span class="label">Project:</span>
                    <span class="value">${testCaseResponse.jiraProject || 'N/A'}</span>
                </div>
                <div class="metadata-item">
                    <span class="label">Summary:</span>
                    <span class="value">${testCaseResponse.jiraSummary || 'N/A'}</span>
                </div>
            </div>
        </div>
    `;
    
    // Display summary
    summary.innerHTML = jiraMetadata + `
        <div class="stats">
            <div class="stat-item">
                <span class="stat-label">Total Test Cases</span>
                <span class="stat-value">${testCaseResponse.testCases.length}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Positive Cases</span>
                <span class="stat-value">${testCaseResponse.testCases.filter(tc => tc.type === 'Positive').length}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Negative Cases</span>
                <span class="stat-value">${testCaseResponse.testCases.filter(tc => tc.type === 'Negative').length}</span>
            </div>
        </div>
    `;
    
    // Display test cases
    displayTestCases(testCaseResponse.testCases);
    
    // Store original request data for coverage validation
    if (window.originalRequestData !== undefined) {
        window.originalRequestData = {
            userStory: testCaseResponse.extractedContent?.userStory || testCaseResponse.jiraSummary || 'N/A',
            acceptanceCriteria: testCaseResponse.extractedContent?.acceptanceCriteria || 'N/A',
            businessRules: testCaseResponse.extractedContent?.businessRules || 'N/A',
            isJiraIntegration: true,
            jiraKey: jiraKey
        };
    }
    
    // Store for CSV download
    window.currentTestCases = testCaseResponse.testCases;
    window.currentJiraKey = jiraKey;
}

// Display batch JIRA results
function displayBatchJiraResults(batchResponse) {
    const outputSection = document.getElementById('outputSection');
    const summary = document.getElementById('summary');
    const testCasesContainer = document.getElementById('testCasesContainer');
    
    // Show output section
    outputSection.style.display = 'block';
    outputSection.scrollIntoView({ behavior: 'smooth' });
    
    // Store batch results for later use
    window.batchJiraResults = batchResponse.results;
    
    const successCount = batchResponse.results.filter(r => r.success).length;
    const totalCount = batchResponse.results.length;
    
    // Calculate total test cases
    let totalTestCases = 0;
    batchResponse.results.forEach(result => {
        if (result.success && result.response && result.response.testCases) {
            totalTestCases += result.response.testCases.length;
        }
    });
    
    // Display batch summary
    summary.innerHTML = `
        <div class="batch-summary">
            <h3>📊 Batch Processing Results</h3>
            <div class="stats">
                <div class="stat-item">
                    <span class="stat-label">Successful Stories</span>
                    <span class="stat-value">${successCount}/${totalCount}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Total Test Cases</span>
                    <span class="stat-value">${totalTestCases}</span>
                </div>
            </div>
        </div>
    `;
    
    // Clear container
    testCasesContainer.innerHTML = '';
    
    // Display each story's test cases separately
    batchResponse.results.forEach((result, index) => {
        const storySection = document.createElement('div');
        storySection.className = 'story-section';
        storySection.style.cssText = 'margin-bottom: 30px; padding: 20px; background: #fff; border: 2px solid #e2e8f0; border-radius: 12px;';
        
        if (result.success && result.response) {
            const response = result.response;
            const jiraKey = response.jiraIssueKey || result.issueKey;
            
            // Story header with download button
            const headerHtml = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e2e8f0;">
                    <div>
                        <h3 style="margin: 0 0 8px 0; color: var(--primary-color);">
                            ✅ ${jiraKey}
                        </h3>
                        <p style="margin: 0; color: var(--text-secondary); font-size: 0.95rem;">
                            ${response.jiraSummary || 'N/A'}
                        </p>
                        <span class="badge" style="display: inline-block; margin-top: 10px; padding: 6px 12px; background: #10b981; color: white; border-radius: 6px; font-size: 0.85rem;">
                            ${response.testCases.length} test cases
                        </span>
                    </div>
                    <button class="btn btn-secondary btn-sm" onclick="downloadStoryCSV(${index})" style="height: fit-content;">
                        📥 Download CSV
                    </button>
                </div>
            `;
            
            storySection.innerHTML = headerHtml;
            
            // Display test cases for this story
            const testCasesDiv = document.createElement('div');
            testCasesDiv.className = 'story-test-cases';
            
            response.testCases.forEach((tc, tcIndex) => {
                // Map JIRA response to app.js format
                const testCase = {
                    testCaseId: tc.testCaseId || `${jiraKey}-TC-${String(tcIndex + 1).padStart(3, '0')}`,
                    priority: tc.priority || 'Medium',
                    testType: tc.type || tc.testType || 'Functional',
                    testScenario: tc.testCase || tc.testScenario || 'N/A',
                    preconditions: tc.precondition || tc.preconditions || 'N/A',
                    testSteps: tc.testSteps || 'N/A',
                    expectedResult: tc.expectedResult || 'N/A'
                };
                
                const card = createTestCaseCard(testCase, tcIndex);
                testCasesDiv.appendChild(card);
            });
            
            storySection.appendChild(testCasesDiv);
            
        } else {
            // Display error for failed story
            storySection.innerHTML = `
                <div style="padding: 20px; background: #fee; border: 2px solid #fcc; border-radius: 8px;">
                    <h4 style="margin: 0 0 10px 0; color: #dc2626;">❌ ${result.issueKey}</h4>
                    <p style="margin: 0; color: var(--text-secondary);">${result.error || 'Failed to fetch story'}</p>
                </div>
            `;
        }
        
        testCasesContainer.appendChild(storySection);
    });
    
    // Store original request data for coverage validation (first successful story)
    const firstSuccess = batchResponse.results.find(r => r.success);
    if (firstSuccess && firstSuccess.response && window.originalRequestData !== undefined) {
        const response = firstSuccess.response;
        window.originalRequestData = {
            userStory: response.extractedContent?.userStory || response.jiraSummary || 'N/A',
            acceptanceCriteria: response.extractedContent?.acceptanceCriteria || 'N/A',
            businessRules: response.extractedContent?.businessRules || 'N/A',
            isJiraIntegration: true,
            jiraKey: response.jiraIssueKey || firstSuccess.issueKey,
            isBatch: true
        };
    }
    
    // Store all test cases for global operations
    let allTestCases = [];
    batchResponse.results.forEach(result => {
        if (result.success && result.response) {
            allTestCases = allTestCases.concat(result.response.testCases.map(tc => ({
                ...tc,
                jiraKey: result.response.jiraIssueKey || result.issueKey
            })));
        }
    });
    window.currentTestCases = allTestCases;
    window.currentJiraKey = 'BATCH';
}

// Display test cases using the same format as document upload
// Show JIRA loading message
function showJiraLoading(message) {
    const jiraResult = document.getElementById('jiraResult');
    jiraResult.style.display = 'block';
    jiraResult.innerHTML = `
        <div class="jira-status-loading">
            <span class="spinner-large"></span>
            <p>${message}</p>
        </div>
    `;
}

// Show JIRA success message
function showJiraSuccess(message) {
    const jiraResult = document.getElementById('jiraResult');
    jiraResult.style.display = 'block';
    jiraResult.innerHTML = `
        <div class="jira-status-success">
            <span class="icon">✅</span>
            <p>${message}</p>
        </div>
    `;}

/**
 * Download CSV for a specific story in batch mode
 */
function downloadStoryCSV(storyIndex) {
    if (!window.batchJiraResults || !window.batchJiraResults[storyIndex]) {
        alert('Story data not found');
        return;
    }
    
    const result = window.batchJiraResults[storyIndex];
    if (!result.success || !result.response || !result.response.testCases) {
        alert('No test cases available for this story');
        return;
    }
    
    const response = result.response;
    const jiraKey = response.jiraIssueKey || result.issueKey;
    const testCases = response.testCases;
    
    // Generate CSV content
    const headers = ['Test Case ID', 'Test Scenario', 'Preconditions', 'Test Steps', 'Expected Result', 'Priority', 'Test Type', 'JIRA Key'];
    let csv = headers.join(',') + '\n';
    
    testCases.forEach((tc, index) => {
        const row = [
            escapeCsvField(tc.testCaseId || `${jiraKey}-TC-${String(index + 1).padStart(3, '0')}`),
            escapeCsvField(tc.testCase || tc.testScenario || ''),
            escapeCsvField(tc.precondition || tc.preconditions || ''),
            escapeCsvField(tc.testSteps || ''),
            escapeCsvField(tc.expectedResult || ''),
            escapeCsvField(tc.priority || 'Medium'),
            escapeCsvField(tc.type || tc.testType || 'Functional'),
            escapeCsvField(jiraKey)
        ];
        csv += row.join(',') + '\n';
    });
    
    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-cases-${jiraKey}-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    showNotification(`CSV downloaded for ${jiraKey}`, 'success');
}

/**
 * Escape CSV field
 */
function escapeCsvField(field) {
    if (field == null) return '';
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

// Show JIRA error message
function showJiraError(message) {
    const jiraResult = document.getElementById('jiraResult');
    jiraResult.style.display = 'block';
    jiraResult.innerHTML = `
        <div class="jira-status-error">
            <span class="icon">❌</span>
            <p>${message}</p>
        </div>
    `;
}

// Show JIRA setup guide
function showJiraSetupGuide() {
    const guide = `
╔══════════════════════════════════════════════════════════════╗
║           JIRA INTEGRATION SETUP GUIDE                        ║
╚══════════════════════════════════════════════════════════════╝

Step 1: Generate JIRA API Token
─────────────────────────────────
1. Go to: https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Name it: "TestMate AI"
4. Copy the token (save it securely)

Step 2: Configure application.properties
─────────────────────────────────────────
Edit: src/main/resources/application.properties

Add the following:
─────────────────
jira.enabled=true
jira.url=https://resbank.atlassian.net
jira.username=your-email@company.com
jira.api.token=YOUR_API_TOKEN_HERE

Step 3: Restart Application
────────────────────────────
1. Stop the Spring Boot application
2. Restart: mvn spring-boot:run
3. Refresh this page

Need help? Contact your admin or check the documentation.
    `;
    
    alert(guide);
}

// Handle fetch stories from JIRA projects
async function handleFetchStories() {
    const projectsInput = document.getElementById('jiraProjects');
    const projectKeys = projectsInput.value.trim();
    
    if (!projectKeys) {
        alert('Please enter at least one project key');
        return;
    }
    
    const fetchBtn = document.getElementById('fetchJiraStories');
    const btnText = fetchBtn.querySelector('.btn-text');
    const spinner = fetchBtn.querySelector('.spinner');
    
    try {
        const credentials = getJiraCredentials();
        
        // Disable button and show loading
        fetchBtn.disabled = true;
        btnText.style.display = 'none';
        spinner.style.display = 'inline-block';
        
        const response = await fetch('/testmate/api/jira/stories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                credentials: credentials,
                projectKeys: projectKeys.split(',').map(k => k.trim())
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch stories');
        }
        
        const stories = await response.json();
        displayStoriesList(stories);
        
        // Show stories list section
        const storiesList = document.getElementById('jiraStoriesList');
        if (storiesList) {
            storiesList.style.display = 'block';
        }
        
    } catch (error) {
        alert('Error fetching stories: ' + error.message);
    } finally {
        fetchBtn.disabled = false;
        btnText.style.display = 'inline';
        spinner.style.display = 'none';
    }
}

// Display stories list with checkboxes
function displayStoriesList(stories) {
    const container = document.getElementById('storiesContainer');
    if (!container) return;
    
    if (!stories || stories.length === 0) {
        container.innerHTML = '<p>No stories found in the selected projects.</p>';
        return;
    }
    
    container.innerHTML = stories.map(story => `
        <div class="story-item">
            <label>
                <input type="checkbox" class="story-checkbox" value="${story.key}" data-summary="${escapeHtml(story.summary)}">
                <strong>${story.key}</strong>: ${escapeHtml(story.summary)}
            </label>
        </div>
    `).join('');
}

// Handle generate test cases from selected stories
async function handleGenerateFromJira() {
    const checkboxes = document.querySelectorAll('.story-checkbox:checked');
    
    if (checkboxes.length === 0) {
        alert('Please select at least one story');
        return;
    }
    
    const selectedStories = Array.from(checkboxes).map(cb => ({
        key: cb.value,
        summary: cb.dataset.summary
    }));
    
    const generateBtn = document.getElementById('generateFromJira');
    const btnText = generateBtn.querySelector('.btn-text');
    const spinner = generateBtn.querySelector('.spinner');
    
    try {
        const credentials = getJiraCredentials();
        
        // Disable button and show loading
        generateBtn.disabled = true;
        btnText.style.display = 'none';
        spinner.style.display = 'inline-block';
        
        // Show loading overlay
        showLoading(true);
        
        const response = await fetch('/testmate/api/jira/generate/batch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                credentials: credentials,
                stories: selectedStories
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to generate test cases');
        }
        
        const result = await response.json();
        
        // Display results using existing function
        if (window.displayMultiDocumentTestCases) {
            displayMultiDocumentTestCases(result);
        } else {
            alert('Test cases generated successfully!');
        }
        
    } catch (error) {
        alert('Error generating test cases: ' + error.message);
    } finally {
        generateBtn.disabled = false;
        btnText.style.display = 'inline';
        spinner.style.display = 'none';
        showLoading(false);
    }
}

// Handle fetch story details
async function handleFetchStoryDetails() {
    const issueKeysInput = document.getElementById('jiraIssueKeys');
    const issueKeys = issueKeysInput.value.trim().split(',').map(k => k.trim()).filter(k => k);
    
    if (issueKeys.length === 0) {
        alert('Please enter at least one JIRA issue key');
        return;
    }
    
    const fetchBtn = document.getElementById('fetchJiraStoryDetails');
    const btnText = fetchBtn.querySelector('.btn-text');
    const spinner = fetchBtn.querySelector('.spinner');
    
    try {
        const credentials = getJiraCredentials();
        
        fetchBtn.disabled = true;
        btnText.style.display = 'none';
        spinner.style.display = 'inline-block';
        
        const stories = [];
        
        for (const issueKey of issueKeys) {
            const response = await fetch('/testmate/api/jira/story', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credentials, issueKey })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to fetch ${issueKey}: ${errorData.message}`);
            }
            
            const story = await response.json();
            stories.push(story);
        }
        
        // Save to recent stories
        saveToRecentStories(issueKeys);
        
        displayStoriesList(stories);
        
        const storiesList = document.getElementById('jiraStoriesList');
        if (storiesList) {
            storiesList.style.display = 'block';
        }
        
    } catch (error) {
        alert('Error fetching stories: ' + error.message);
    } finally {
        fetchBtn.disabled = false;
        btnText.style.display = 'inline';
        spinner.style.display = 'none';
    }
}

// Store all fetched stories globally for filtering
let allFetchedStories = [];

// Display stories list with details and checkboxes
function displayStoriesList(stories) {
    // Store stories globally for filtering
    allFetchedStories = stories || [];
    
    const container = document.getElementById('storiesContainer');
    if (!container) return;
    
    if (!stories || stories.length === 0) {
        container.innerHTML = '<p>No stories found.</p>';
        updateFilteredCount(0);
        return;
    }
    
    // Populate filter dropdowns
    populateFilterDropdowns(stories);
    
    // Render stories
    renderStories(stories);
    
    // Setup search and filter event listeners
    setupSearchAndFilters();
}

function renderStories(stories) {
    const container = document.getElementById('storiesContainer');
    if (!container) return;
    
    container.innerHTML = stories.map(story => `
        <div class="story-item" style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; background: #f9f9f9;">
            <label style="display: flex; gap: 10px; cursor: pointer;">
                <input type="checkbox" class="story-checkbox" value="${story.issueKey}" data-summary="${escapeHtml(story.summary)}" checked style="margin-top: 5px;">
                <div style="flex: 1;">
                    <div style="font-weight: bold; font-size: 1.1em; margin-bottom: 5px; color: #333;">
                        ${story.issueKey}: ${escapeHtml(story.summary)}
                    </div>
                    <div style="color: #666; margin-bottom: 5px; font-size: 0.9em;">
                        <strong>Project:</strong> ${story.project || 'N/A'} | 
                        <strong>Type:</strong> ${story.issueType || 'N/A'} | 
                        <strong>Status:</strong> ${story.status || 'N/A'} | 
                        <strong>Priority:</strong> ${story.priority || 'N/A'}
                    </div>
                    ${story.description ? `<div style="color: #555; font-size: 0.9em; margin-top: 5px; padding: 8px; background: white; border-radius: 3px;"><strong>Description:</strong> ${escapeHtml(story.description.substring(0, 200))}${story.description.length > 200 ? '...' : ''}</div>` : ''}
                </div>
            </label>
        </div>
    `).join('');
    
    // Update selection count
    updateSelectionCount();
    
    // Add event listeners to checkboxes for count updates
    document.querySelectorAll('.story-checkbox').forEach(cb => {
        cb.addEventListener('change', updateSelectionCount);
    });
    
    // Update counts
    updateFilteredCount(stories.length);
    updateSelectionCount();
    
    // Setup bulk selection buttons
    setupBulkSelectionButtons();
}

function populateFilterDropdowns(stories) {
    const statusFilter = document.getElementById('statusFilter');
    const priorityFilter = document.getElementById('priorityFilter');
    
    if (!statusFilter || !priorityFilter) return;
    
    // Get unique statuses and priorities
    const statuses = [...new Set(stories.map(s => s.status).filter(s => s))];
    const priorities = [...new Set(stories.map(s => s.priority).filter(p => p))];
    
    // Populate status filter
    statusFilter.innerHTML = '<option value="">All Status</option>' +
        statuses.map(status => `<option value="${status}">${status}</option>`).join('');
    
    // Populate priority filter
    priorityFilter.innerHTML = '<option value="">All Priority</option>' +
        priorities.map(priority => `<option value="${priority}">${priority}</option>`).join('');
}

function setupSearchAndFilters() {
    const searchInput = document.getElementById('storySearchInput');
    const statusFilter = document.getElementById('statusFilter');
    const priorityFilter = document.getElementById('priorityFilter');
    const sortBy = document.getElementById('sortBy');
    const clearFiltersBtn = document.getElementById('clearFilters');
    
    // Remove existing event listeners by cloning and replacing
    if (searchInput) {
        const newSearchInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newSearchInput, searchInput);
        newSearchInput.addEventListener('input', applyFilters);
    }
    
    if (statusFilter) {
        const newStatusFilter = statusFilter.cloneNode(true);
        statusFilter.parentNode.replaceChild(newStatusFilter, statusFilter);
        newStatusFilter.addEventListener('change', applyFilters);
    }
    
    if (priorityFilter) {
        const newPriorityFilter = priorityFilter.cloneNode(true);
        priorityFilter.parentNode.replaceChild(newPriorityFilter, priorityFilter);
        newPriorityFilter.addEventListener('change', applyFilters);
    }
    
    if (sortBy) {
        const newSortBy = sortBy.cloneNode(true);
        sortBy.parentNode.replaceChild(newSortBy, sortBy);
        newSortBy.addEventListener('change', applyFilters);
    }
    
    if (clearFiltersBtn) {
        clearFiltersBtn.onclick = clearAllFilters;
    }
}

function applyFilters() {
    const searchInput = document.getElementById('storySearchInput');
    const statusFilter = document.getElementById('statusFilter');
    const priorityFilter = document.getElementById('priorityFilter');
    const sortBy = document.getElementById('sortBy');
    
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const statusValue = statusFilter ? statusFilter.value : '';
    const priorityValue = priorityFilter ? priorityFilter.value : '';
    const sortValue = sortBy ? sortBy.value : 'key';
    
    let filteredStories = allFetchedStories.filter(story => {
        // Search filter
        const matchesSearch = !searchTerm || 
            story.issueKey.toLowerCase().includes(searchTerm) ||
            (story.summary && story.summary.toLowerCase().includes(searchTerm)) ||
            (story.description && story.description.toLowerCase().includes(searchTerm));
        
        // Status filter
        const matchesStatus = !statusValue || story.status === statusValue;
        
        // Priority filter
        const matchesPriority = !priorityValue || story.priority === priorityValue;
        
        return matchesSearch && matchesStatus && matchesPriority;
    });
    
    // Sort stories
    filteredStories = sortStories(filteredStories, sortValue);
    
    // Re-render stories
    renderStories(filteredStories);
}

function sortStories(stories, sortBy) {
    const priorityOrder = { 'Highest': 1, 'High': 2, 'Medium': 3, 'Low': 4, 'Lowest': 5 };
    
    return [...stories].sort((a, b) => {
        switch (sortBy) {
            case 'priority':
                const priorityA = priorityOrder[a.priority] || 99;
                const priorityB = priorityOrder[b.priority] || 99;
                return priorityA - priorityB;
            case 'status':
                return (a.status || '').localeCompare(b.status || '');
            case 'summary':
                return (a.summary || '').localeCompare(b.summary || '');
            case 'key':
            default:
                return (a.issueKey || '').localeCompare(b.issueKey || '');
        }
    });
}

function clearAllFilters() {
    const searchInput = document.getElementById('storySearchInput');
    const statusFilter = document.getElementById('statusFilter');
    const priorityFilter = document.getElementById('priorityFilter');
    const sortBy = document.getElementById('sortBy');
    
    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = '';
    if (priorityFilter) priorityFilter.value = '';
    if (sortBy) sortBy.value = 'key';
    
    applyFilters();
}

function updateFilteredCount(count) {
    const filteredCountEl = document.getElementById('filteredCount');
    if (filteredCountEl) {
        filteredCountEl.textContent = `Showing ${count} ${count === 1 ? 'story' : 'stories'}`;
    }
}

// Handle generate test cases from selected stories
async function handleGenerateFromSelectedStories() {
    const checkboxes = document.querySelectorAll('.story-checkbox:checked');
    
    if (checkboxes.length === 0) {
        alert('Please select at least one story');
        return;
    }
    
    const selectedStories = Array.from(checkboxes).map(cb => ({
        key: cb.value,
        summary: cb.dataset.summary
    }));
    
    const generateBtn = document.getElementById('generateFromJira');
    const btnText = generateBtn.querySelector('.btn-text');
    const spinner = generateBtn.querySelector('.spinner');
    
    try {
        const credentials = getJiraCredentials();
        
        generateBtn.disabled = true;
        btnText.style.display = 'none';
        spinner.style.display = 'inline-block';
        showLoading(true);
        
        // Show progress indicator for batch processing
        let successCount = 0;
        let failureCount = 0;
        const total = selectedStories.length;
        
        updateProgressIndicator(0, total, selectedStories[0]?.key || 'Starting...', 0, 0);
        
        const response = await fetch('/testmate/api/jira/generate/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credentials, stories: selectedStories })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to generate test cases');
        }
        
        const result = await response.json();
        console.log('Batch generation result:', result);
        
        // Update final progress
        if (result.results) {
            successCount = result.results.filter(r => r.success).length;
            failureCount = result.results.filter(r => !r.success).length;
            updateProgressIndicator(total, total, 'Completed!', successCount, failureCount);
            
            // Hide progress after 2 seconds
            setTimeout(() => hideProgressIndicator(), 2000);
        }
        
        // Store results globally for CSV download
        window.batchJiraResults = result.results || [];
        
        // Transform JIRA batch results to match displayMultiDocumentTestCases format
        const transformedData = {
            totalDocuments: result.results ? result.results.length : 0,
            message: `Generated test cases from ${result.results ? result.results.length : 0} JIRA ${result.results && result.results.length === 1 ? 'story' : 'stories'}`,
            documentResults: (result.results || []).map(r => ({
                fileName: r.issueKey,
                success: r.success,
                errorMessage: r.error,
                testCaseResponse: r.response
            }))
        };
        
        // Set currentResponse for CSV download functionality
        window.currentResponse = transformedData;
        
        // Store original request data for coverage validation
        // Combine all stories' content for comprehensive coverage analysis
        const successfulResults = result.results ? result.results.filter(r => r.success && r.response) : [];
        if (successfulResults.length > 0) {
            // Combine user stories, AC, and business rules from all JIRA stories
            const combinedUserStory = successfulResults.map(r => {
                const response = r.response;
                const us = response.extractedContent?.userStory || response.jiraSummary || '';
                return us ? `[${r.issueKey}] ${us}` : '';
            }).filter(s => s).join('\n\n');
            
            const combinedAC = successfulResults.map(r => {
                const ac = r.response.extractedContent?.acceptanceCriteria || '';
                console.log(`AC extraction for ${r.issueKey}:`, {
                    hasExtractedContent: !!r.response.extractedContent,
                    acceptanceCriteria: ac,
                    acLength: ac.length
                });
                return ac && ac !== 'N/A' && ac.trim().length > 0 ? `[${r.issueKey}]\n${ac}` : '';
            }).filter(s => s).join('\n\n');
            
            const combinedBR = successfulResults.map(r => {
                const br = r.response.extractedContent?.businessRules || '';
                return br && br !== 'N/A' ? `[${r.issueKey}]\n${br}` : '';
            }).filter(s => s).join('\n\n');
            
            window.originalRequestData = {
                userStory: combinedUserStory || 'N/A',
                acceptanceCriteria: combinedAC || 'No acceptance criteria extracted from JIRA stories. Coverage analysis will be limited.',
                businessRules: combinedBR || 'N/A',
                isJiraIntegration: true,
                jiraKey: successfulResults.length === 1 ? successfulResults[0].issueKey : `${successfulResults.length} stories`,
                isBatch: result.results.length > 1,
                batchCount: result.results.length
            };
            console.log('Stored originalRequestData:', window.originalRequestData);
        }
        
        console.log('Transformed data:', transformedData);
        
        // Ensure outputSection is visible first
        const outputSection = document.getElementById('outputSection');
        const summary = document.getElementById('summary');
        const testCasesContainer = document.getElementById('testCasesContainer');
        
        if (!outputSection || !summary || !testCasesContainer) {
            console.error('Required DOM elements not found!', { outputSection, summary, testCasesContainer });
            alert('Error: Page elements not found. Please refresh the page.');
            return;
        }
        
        // Show output section
        outputSection.style.display = 'block';
        
        // Display summary
        summary.innerHTML = `
            <strong>✅ Successfully processed ${transformedData.totalDocuments} document${transformedData.totalDocuments !== 1 ? 's' : ''}</strong>
            <br>
            <span style="font-size: 0.9rem; color: var(--text-secondary);">${transformedData.message}</span>
        `;
        
        // Clear previous test cases
        testCasesContainer.innerHTML = '';
        
        // Display test cases for each document
        transformedData.documentResults.forEach((docResult, docIndex) => {
            if (docResult.success && docResult.testCaseResponse && docResult.testCaseResponse.testCases) {
                // Create document section
                const docSection = document.createElement('div');
                docSection.className = 'document-section';
                docSection.style.marginBottom = '30px';
                
                // Document header with download button
                const docHeader = document.createElement('div');
                docHeader.className = 'document-header';
                docHeader.style.cssText = 'background: linear-gradient(135deg, var(--primary-color) 0%, #1e40af 100%); color: white; padding: 15px 20px; border-radius: 8px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;';
                
                const testCasesDivId = `jira-testcases-${docIndex}`;
                const toggleBtnId = `jira-toggle-btn-${docIndex}`;
                
                const headerLeft = document.createElement('div');
                headerLeft.innerHTML = `
                    <h3 style="margin: 0; font-size: 1.1rem;">📄 ${docResult.fileName}</h3>
                    <p style="margin: 5px 0 0 0; font-size: 0.85rem; opacity: 0.9;">${docResult.testCaseResponse.totalTestCases || docResult.testCaseResponse.testCases.length} test case${(docResult.testCaseResponse.totalTestCases || docResult.testCaseResponse.testCases.length) !== 1 ? 's' : ''}</p>
                `;
                
                const buttonsContainer = document.createElement('div');
                buttonsContainer.style.cssText = 'display: flex; gap: 10px;';
                
                // Minimize/Expand button
                const toggleBtn = document.createElement('button');
                toggleBtn.id = toggleBtnId;
                toggleBtn.className = 'btn btn-secondary';
                toggleBtn.style.cssText = 'background: rgba(255,255,255,0.2); color: white; border: 1px solid white; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.3s;';
                toggleBtn.innerHTML = '➖ Minimize';
                toggleBtn.title = 'Minimize/Expand test cases';
                toggleBtn.onclick = () => {
                    if (typeof window.toggleDocumentTestCases === 'function') {
                        window.toggleDocumentTestCases(testCasesDivId, toggleBtnId);
                    }
                };
                
                // Download button
                const downloadBtn = document.createElement('button');
                downloadBtn.className = 'btn btn-secondary';
                downloadBtn.style.cssText = 'background: white; color: var(--primary-color); border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600;';
                downloadBtn.textContent = '📥 Download CSV';
                downloadBtn.title = 'Download CSV for this story';
                downloadBtn.onclick = () => {
                    console.log('Download button clicked for', docResult.fileName, 'at index', docIndex);
                    if (typeof downloadDocumentCsv === 'function') {
                        downloadDocumentCsv(docResult.fileName, docIndex);
                    } else if (typeof window.downloadDocumentCsv === 'function') {
                        window.downloadDocumentCsv(docResult.fileName, docIndex);
                    } else {
                        alert('Download function not available. Please refresh the page.');
                    }
                };
                
                buttonsContainer.appendChild(toggleBtn);
                buttonsContainer.appendChild(downloadBtn);
                
                docHeader.appendChild(headerLeft);
                docHeader.appendChild(buttonsContainer);
                docSection.appendChild(docHeader);
                
                // Story Summary - Display JIRA summary
                const storyTitle = docResult.testCaseResponse.jiraSummary || 
                                  (docResult.testCaseResponse.extractedContent && docResult.testCaseResponse.extractedContent.userStory);
                
                if (storyTitle && storyTitle !== 'N/A') {
                    const storySummaryDiv = document.createElement('div');
                    storySummaryDiv.className = 'story-summary';
                    storySummaryDiv.style.cssText = 'background: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 15px 20px; margin-bottom: 15px;';
                    
                    storySummaryDiv.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 1.2rem;">📋</span>
                            <strong style="color: var(--primary-color); font-size: 0.95rem;">Story:</strong>
                            <span style="color: var(--text-primary); font-size: 0.95rem; flex: 1;">${escapeHtml(storyTitle)}</span>
                        </div>
                    `;
                    
                    docSection.appendChild(storySummaryDiv);
                }
                
                // Test cases
                const testCasesDiv = document.createElement('div');
                testCasesDiv.id = testCasesDivId;
                testCasesDiv.className = 'document-test-cases';
                testCasesDiv.style.cssText = 'transition: all 0.3s ease-in-out; overflow: hidden;';
                
                docResult.testCaseResponse.testCases.forEach((tc, index) => {
                    const card = document.createElement('div');
                    card.className = 'test-case-card';
                    card.style.cssText = 'border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 15px; background: white;';
                    card.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                            <h3 style="margin: 0; color: var(--primary-color);">${tc.testCaseId || 'TC-' + String(index + 1).padStart(3, '0')}</h3>
                            <div style="display: flex; gap: 8px;">
                                <span style="padding: 4px 12px; background: #dbeafe; color: #1e40af; border-radius: 4px; font-size: 0.85rem;">${tc.priority || 'Medium'}</span>
                                <span style="padding: 4px 12px; background: #fef3c7; color: #92400e; border-radius: 4px; font-size: 0.85rem;">${tc.type || tc.testType || 'Functional'}</span>
                            </div>
                        </div>
                        <div style="margin-bottom: 12px;">
                            <strong>Test Scenario:</strong>
                            <p style="margin: 5px 0; padding: 10px; background: #f8fafc; border-radius: 4px;">${tc.testCase || tc.testScenario || 'N/A'}</p>
                        </div>
                        <div style="margin-bottom: 12px;">
                            <strong>Preconditions:</strong>
                            <p style="margin: 5px 0; padding: 10px; background: #f8fafc; border-radius: 4px;">${tc.precondition || tc.preconditions || 'N/A'}</p>
                        </div>
                        <div style="margin-bottom: 12px;">
                            <strong>Test Steps:</strong>
                            <p style="margin: 5px 0; padding: 10px; background: #f8fafc; border-radius: 4px; white-space: pre-wrap;">${tc.testSteps || 'N/A'}</p>
                        </div>
                        <div>
                            <strong>Expected Result:</strong>
                            <p style="margin: 5px 0; padding: 10px; background: #f0fdf4; border-radius: 4px;">${tc.expectedResult || 'N/A'}</p>
                        </div>
                    `;
                    testCasesDiv.appendChild(card);
                });
                
                docSection.appendChild(testCasesDiv);
                testCasesContainer.appendChild(docSection);
            } else {
                // Display error
                const errorDiv = document.createElement('div');
                errorDiv.className = 'document-error';
                errorDiv.style.cssText = 'background: #fee; border: 2px solid #fcc; border-radius: 8px; padding: 15px; margin-bottom: 15px;';
                errorDiv.innerHTML = `
                    <h4 style="margin: 0 0 10px 0; color: #dc2626;">❌ ${docResult.fileName}</h4>
                    <p style="margin: 0; color: #6b7280;">${docResult.errorMessage || 'Failed to process document'}</p>
                `;
                testCasesContainer.appendChild(errorDiv);
            }
        });
        
        console.log('Test cases displayed successfully');
        
        // Scroll to output
        outputSection.scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error generating test cases:', error);
        alert('Error generating test cases: ' + error.message);
    } finally {
        generateBtn.disabled = false;
        btnText.style.display = 'inline';
        spinner.style.display = 'none';
        showLoading(false);
    }
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Helper function to show/hide loading overlay
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}
