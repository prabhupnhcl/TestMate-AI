// API Base URL - adjust based on your deployment
const API_BASE_URL = '/testmate/api/testcases';

// Global DOM element references
let jiraForm, generateBtn, clearBtn, outputSection, testCasesContainer;
let summary, downloadCsvBtn, copyBtn, loadingOverlay, validationMessage;
let uploadBox, fileInput, fileInfo, filesList, fileCount, totalSize;
let clearAllFilesBtn, uploadGenerateBtn;
let chatInput, sendChatBtn, chatMessages, chatToggleBtn, chatCloseBtn;
let chatWidgetContainer, chatIcon, closeIcon;
let tabButtons;

// State variables
let selectedFiles = [];
let currentResponse = null;
let originalRequestData = null;
let isChatOpen = false;

/**
 * Update date and time display
 */
function updateDateTime() {
    const now = new Date();
    const dateElement = document.querySelector('#dateTime .date');
    const timeElement = document.querySelector('#dateTime .time');
    
    if (dateElement && timeElement) {
        // Format date: Wednesday, December 31, 2025
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.textContent = now.toLocaleDateString('en-US', dateOptions);
        
        // Format time: 02:30:45 PM
        const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
        timeElement.textContent = now.toLocaleTimeString('en-US', timeOptions);
    }
}

/**
 * Initialize date/time display and start interval
 */
function initDateTime() {
    updateDateTime();
    // Update every second
    setInterval(updateDateTime, 1000);
}

/**
 * Toggle chat widget - Defined globally for immediate access
 */
function toggleChat() {
    console.log('toggleChat() called - Current state:', chatWidgetContainer ? chatWidgetContainer.style.display : 'container not found');
    if (!chatWidgetContainer || !chatIcon || !closeIcon) {
        console.error('Chat elements not found:', {chatWidgetContainer, chatIcon, closeIcon});
        return;
    }
    
    isChatOpen = !isChatOpen;
    
    if (isChatOpen) {
        chatWidgetContainer.style.display = 'flex';
        chatIcon.style.display = 'none';
        closeIcon.style.display = 'inline';
        if (chatInput) chatInput.focus();
        console.log('Chat opened');
    } else {
        chatWidgetContainer.style.display = 'none';
        chatIcon.style.display = 'inline';
        closeIcon.style.display = 'none';
        console.log('Chat closed');
    }
}

/**
 * Close chat widget - Defined globally for immediate access
 */
function closeChat() {
    console.log('closeChat() called');
    if (!chatWidgetContainer || !chatIcon || !closeIcon) return;
    isChatOpen = false;
    chatWidgetContainer.style.display = 'none';
    chatIcon.style.display = 'inline';
    closeIcon.style.display = 'none';
}

// Expose functions globally immediately
window.toggleChat = toggleChat;
window.closeChat = closeChat;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== TESTMATE APP.JS v3.2 LOADED - ANALYTICS DASHBOARD ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Cache buster URL param: v=20251224-v32');
    console.log('Features: Manual fact controls, analytics dashboard, productivity metrics');
    
    // Initialize date and time display
    initDateTime();
    
    // Initialize all DOM element references
    jiraForm = document.getElementById('jiraForm');
    generateBtn = document.getElementById('generateBtn');
    clearBtn = document.getElementById('clearBtn');
    outputSection = document.getElementById('outputSection');
    testCasesContainer = document.getElementById('testCasesContainer');
    summary = document.getElementById('summary');
    downloadCsvBtn = document.getElementById('downloadCsvBtn');
    copyBtn = document.getElementById('copyBtn');
    loadingOverlay = document.getElementById('loadingOverlay');
    validationMessage = document.getElementById('validationMessage');
    
    // Upload elements
    uploadBox = document.getElementById('uploadBox');
    fileInput = document.getElementById('fileInput');
    fileInfo = document.getElementById('fileInfo');
    filesList = document.getElementById('filesList');
    fileCount = document.getElementById('fileCount');
    totalSize = document.getElementById('totalSize');
    clearAllFilesBtn = document.getElementById('clearAllFilesBtn');
    uploadGenerateBtn = document.getElementById('uploadGenerateBtn');
    
    // Chat elements
    chatInput = document.getElementById('chatInput');
    sendChatBtn = document.getElementById('sendChatBtn');
    chatMessages = document.getElementById('chatMessages');
    chatToggleBtn = document.getElementById('chatToggleBtn');
    chatCloseBtn = document.getElementById('chatCloseBtn');
    chatWidgetContainer = document.getElementById('chatWidgetContainer');
    chatIcon = document.querySelector('.chat-btn-icon .chat-icon');
    closeIcon = document.querySelector('.chat-btn-icon .close-icon');
    
    // Initialize chat state - ensure it starts closed
    if (chatWidgetContainer) {
        chatWidgetContainer.style.display = 'none';
        isChatOpen = false;
    }
    if (chatIcon) chatIcon.style.display = 'inline';
    if (closeIcon) closeIcon.style.display = 'none';
    
    // Tab elements
    tabButtons = document.querySelectorAll('.tab-button');
    
    // Event Listeners (with null checks) - Set up after DOM is loaded
    if (jiraForm) jiraForm.addEventListener('submit', handleFormSubmit);
    if (clearBtn) clearBtn.addEventListener('click', handleClearForm);
    if (downloadCsvBtn) downloadCsvBtn.addEventListener('click', handleDownloadCsv);
    if (copyBtn) copyBtn.addEventListener('click', handleCopyToClipboard);
    
    // Export buttons
    const downloadExcelBtn = document.getElementById('downloadExcelBtn');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    if (downloadExcelBtn) downloadExcelBtn.addEventListener('click', downloadExcel);
    if (downloadPdfBtn) downloadPdfBtn.addEventListener('click', downloadPdf);
    
    // Chat listeners
    if (sendChatBtn) sendChatBtn.addEventListener('click', handleSendMessage);
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });
    }
    if (chatToggleBtn) {
        console.log('Chat toggle button found, attaching click listener');
        chatToggleBtn.addEventListener('click', function(e) {
            console.log('Chat button clicked via addEventListener');
            e.preventDefault();
            e.stopPropagation();
            toggleChat();
        });
        // Add diagnostic check
        setTimeout(() => {
            const style = window.getComputedStyle(chatToggleBtn);
            console.log('Chat button diagnostics:', {
                zIndex: style.zIndex,
                pointerEvents: style.pointerEvents,
                position: style.position,
                display: style.display,
                visibility: style.visibility,
                opacity: style.opacity
            });
        }, 1000);
    } else {
        console.error('Chat toggle button NOT found!');
    }
    if (chatCloseBtn) {
        chatCloseBtn.addEventListener('click', closeChat);
    } else {
        console.error('Chat close button NOT found!');
    }
    
    // File upload listeners
    if (fileInput) fileInput.addEventListener('change', handleFileSelect);
    if (clearAllFilesBtn) clearAllFilesBtn.addEventListener('click', handleClearAllFiles);
    if (uploadGenerateBtn) uploadGenerateBtn.addEventListener('click', handleUploadAndGenerate);
    
    // Browse button listener
    const browseBtn = document.getElementById('browseBtn');
    if (browseBtn) {
        browseBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent uploadBox handler from also triggering
            if (fileInput) fileInput.click();
        });
    }
    
    // Drag and drop
    if (uploadBox) {
        uploadBox.addEventListener('dragover', handleDragOver);
        uploadBox.addEventListener('dragleave', handleDragLeave);
        uploadBox.addEventListener('drop', handleDrop);
        uploadBox.addEventListener('click', (e) => {
            // Only trigger file input if clicking on the upload box itself, not the button
            if (e.target.id === 'browseBtn' || e.target.closest('#browseBtn')) {
                return; // Let the button handler handle it
            }
            if (e.target === uploadBox || e.target.closest('.upload-icon') || e.target.closest('h3') || e.target.closest('p')) {
                if (fileInput) fileInput.click();
            }
        });
    }
    
    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            switchTab(tabName);
        });
    });
    
    // Test button clickability after a short delay
    setTimeout(() => {
        const btn = document.getElementById('chatToggleBtn');
        if (btn) {
            console.log('Chat button test:', {
                exists: true,
                offsetParent: btn.offsetParent,
                computedStyle: window.getComputedStyle(btn).pointerEvents,
                zIndex: window.getComputedStyle(btn).zIndex,
                position: window.getComputedStyle(btn).position,
                bounds: btn.getBoundingClientRect()
            });
        } else {
            console.error('Chat button not found in DOM!');
        }
    }, 1000);
});

// ===== ANALYTICS DASHBOARD FUNCTIONALITY =====
// (Restored dashboard and analytics/fact sidebar logic is present below)

// Load dashboard data from backend
async function loadDashboardData() {
    const loadingElement = document.getElementById('dashboardLoading');
    const metricsGrid = document.getElementById('metricsGrid');
    const chartsSection = document.getElementById('chartsSection');
    
    try {
        // Show loading state
        if (loadingElement) loadingElement.style.display = 'block';
        if (metricsGrid) metricsGrid.style.display = 'none';
        if (chartsSection) chartsSection.style.display = 'none';
        
        console.log('Loading dashboard data...');
        
        const response = await fetch('/testmate/api/analytics/dashboard');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Dashboard data loaded:', data);
        
        // Hide loading and show content
        if (loadingElement) loadingElement.style.display = 'none';
        if (metricsGrid) metricsGrid.style.display = 'grid';
        if (chartsSection) chartsSection.style.display = 'block';
        
        // Update metrics cards
        updateMetricsCards(data);
        
        // Update charts
        updateDashboardCharts(data);
        
        // Update activity feed
        updateActivityFeed(data.recentActivities);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        
        // Show error toast
        if (typeof showToast === 'function') {
            showToast('Dashboard Error', 'Unable to load dashboard data', 'error');
        }
        
        // Hide loading and show error
        if (loadingElement) {
            loadingElement.innerHTML = `
                <div class="error-message">
                    <h3>Unable to Load Dashboard</h3>
                    <p>Please try refreshing or check your connection.</p>
                    <button onclick="loadDashboardData()" class="refresh-btn">
                        <span class="refresh-icon">🔄</span> Try Again
                    </button>
                </div>
            `;
        }
    }
}

// Update metrics cards with data
function updateMetricsCards(data) {
    // Total Stories
    const totalStories = document.getElementById('totalStories');
    const storiesChange = document.getElementById('storiesChange');
    if (totalStories) totalStories.textContent = data.totalStoriesProcessed || 0;
    if (storiesChange) storiesChange.textContent = '+12% vs last week';
    
    // Total Test Cases
    const totalTestCases = document.getElementById('totalTestCases');
    const testCasesChange = document.getElementById('testCasesChange');
    if (totalTestCases) totalTestCases.textContent = data.totalTestCasesGenerated || 0;
    if (testCasesChange) testCasesChange.textContent = `${data.avgTestCasesPerStory?.toFixed(1) || 0} avg per story`;
    
    // Cost Saved
    const costSaved = document.getElementById('costSaved');
    const timeSaved = document.getElementById('timeSaved');
    if (costSaved) costSaved.textContent = `$${Math.round(data.costSavedUSD || 0).toLocaleString()}`;
    if (timeSaved) timeSaved.textContent = `${Math.round(data.timeSavedHours || 0)} hours saved`;
    
    // Productivity Gain
    const productivityGain = document.getElementById('productivityGain');
    const avgProcessingTime = document.getElementById('avgProcessingTime');
    if (productivityGain) productivityGain.textContent = `${Math.round(data.productivityGainPercent || 0)}%`;
    if (avgProcessingTime) avgProcessingTime.textContent = `${data.avgProcessingTimeSeconds || 45}s avg time`;
}

// Update dashboard charts
function updateDashboardCharts(data) {
    // Update comparison bars
    updateComparisonChart(data);
    
    // Update distribution chart
    updateDistributionChart(data);
    
    // Update daily chart (simple implementation)
    updateDailyChart(data);
}

// Update AI vs Manual comparison
function updateComparisonChart(data) {
    const aiEfficiency = document.getElementById('aiEfficiency');
    const manualEfficiency = document.getElementById('manualEfficiency');
    const aiValue = document.getElementById('aiValue');
    const manualValue = document.getElementById('manualValue');
    
    const aiCases = data.totalTestCasesGenerated || 0;
    const manualCases = data.manualTestCaseEstimate || 0;
    
    if (aiEfficiency && manualEfficiency) {
        // Calculate percentages (AI is more efficient, so it gets less width)
        const total = aiCases + manualCases;
        if (total > 0) {
            const aiPercent = Math.min((aiCases / total) * 100, 100);
            const manualPercent = Math.min((manualCases / total) * 100, 100);
            
            setTimeout(() => {
                aiEfficiency.style.width = aiPercent + '%';
                manualEfficiency.style.width = manualPercent + '%';
            }, 500);
        }
    }
    
    if (aiValue) aiValue.textContent = `${aiCases} test cases`;
    if (manualValue) manualValue.textContent = `${manualCases} estimated manual`;
}

// Update test case distribution
function updateDistributionChart(data) {
    const positiveTests = document.getElementById('positiveTests');
    const negativeTests = document.getElementById('negativeTests');
    const criticalTests = document.getElementById('criticalTests');
    
    if (positiveTests) positiveTests.textContent = data.positiveTestCases || 0;
    if (negativeTests) negativeTests.textContent = data.negativeTestCases || 0;
    if (criticalTests) criticalTests.textContent = data.criticalTestCases || 0;
}

// Update activity feed with enhanced design
function updateActivityFeed(activities) {
    const activityFeed = document.getElementById('activityFeed');
    if (!activityFeed || !activities) return;
    
    if (activities.length === 0) {
        activityFeed.innerHTML = `
            <div class="activity-item">
                <div class="activity-icon">💤</div>
                <div class="activity-content">
                    <div class="activity-title">No Recent Activities</div>
                    <div class="activity-subtitle">Start generating test cases to see activity here</div>
                </div>
                <div class="activity-time">-</div>
            </div>
        `;
        return;
    }
    
    const activityHtml = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">${activity.icon || '📋'}</div>
            <div class="activity-content">
                <div class="activity-title">${activity.activity || 'Activity'}</div>
                <div class="activity-subtitle">${activity.details || 'No details available'}</div>
            </div>
            <div class="activity-time">${activity.timestamp || 'Just now'}</div>
        </div>
    `).join('');
    
    activityFeed.innerHTML = activityHtml;
}

// Simple daily chart using text bars (could be replaced with Chart.js)
function updateDailyChart(data) {
    const canvas = document.getElementById('dailyChart');
    if (!canvas || !data.dailyTestCaseCount) return;
    
    // Simple implementation - could be enhanced with Chart.js
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(10, 10, 100, 20);
    ctx.fillStyle = '#1f2937';
    ctx.font = '14px Arial';
    ctx.fillText('Daily trends chart (placeholder)', 10, 50);
}

// Setup dashboard event listeners
function setupDashboardListeners() {
    const refreshBtn = document.getElementById('refreshDashboard');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            console.log('Refreshing dashboard data...');
            loadDashboardData();
        });
    }
}

/**
 * Switch between tabs
 */
function switchTab(tabName) {
    tabButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });
    
    // Get all tab contents
    const jiraTab = document.getElementById('jiraTab');
    const manualTab = document.getElementById('manualTab');
    const uploadTab = document.getElementById('uploadTab');
    const locatorsTab = document.getElementById('locatorsTab');
    const notesTab = document.getElementById('notesTab');
    
    // Remove active from all tabs
    if (jiraTab) jiraTab.classList.remove('active');
    if (manualTab) manualTab.classList.remove('active');
    if (uploadTab) uploadTab.classList.remove('active');
    if (locatorsTab) locatorsTab.classList.remove('active');
    if (notesTab) notesTab.classList.remove('active');
    
    // Add active to selected tab
    if (tabName === 'jira' && jiraTab) {
        jiraTab.classList.add('active');
    } else if (tabName === 'manual' && manualTab) {
        manualTab.classList.add('active');
    } else if (tabName === 'upload' && uploadTab) {
        uploadTab.classList.add('active');
    } else if (tabName === 'locators' && locatorsTab) {
        locatorsTab.classList.add('active');
    } else if (tabName === 'notes' && notesTab) {
        notesTab.classList.add('active');
    }
    
    hideOutput();
}

/**
 * Handle file selection
 */
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) {
        displayFilesList();
        return;
    }
    // Check if adding these files would exceed the limit
    if (selectedFiles.length + files.length > 10) {
        alert('You can upload a maximum of 10 files');
        e.target.value = '';
        displayFilesList();
        return;
    }
    // Validate each file
    const validFiles = [];
    for (const file of files) {
        if (validateFile(file)) {
            validFiles.push(file);
        }
    }
    if (validFiles.length > 0) {
        selectedFiles.push(...validFiles);
    }
    displayFilesList();
    // Reset file input to allow selecting the same file again
    e.target.value = '';
}

/**
 * Handle drag over
 */
function handleDragOver(e) {
    e.preventDefault();
    uploadBox.classList.add('drag-over');
}

/**
 * Handle drag leave
 */
function handleDragLeave(e) {
    e.preventDefault();
    uploadBox.classList.remove('drag-over');
}

/**
 * Handle file drop
 */
function handleDrop(e) {
    e.preventDefault();
    uploadBox.classList.remove('drag-over');
    
    const files = Array.from(e.dataTransfer.files);
    
    if (files.length === 0) return;
    
    // Check if adding these files would exceed the limit
    if (selectedFiles.length + files.length > 10) {
        alert('You can upload a maximum of 10 files');
        return;
    }
    
    // Validate each file
    const validFiles = [];
    for (const file of files) {
        if (validateFile(file)) {
            validFiles.push(file);
        }
    }
    
    if (validFiles.length > 0) {
        selectedFiles.push(...validFiles);
        displayFilesList();
    }
}

/**
 * Validate file
 */
function validateFile(file) {
    const validExtensions = ['.doc', '.docx'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
        alert('Please upload a .doc or .docx file');
        return false;
    }
    
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
        alert('File size must be less than 10MB');
        return false;
    }
    
    return true;
}

/**
 * Display files list
 */
function displayFilesList() {
    if (selectedFiles.length === 0) {
        if (uploadBox) uploadBox.style.display = 'block';
        if (fileInfo) fileInfo.style.display = 'none';
        if (uploadGenerateBtn) {
            uploadGenerateBtn.disabled = true;
        }
        return;
    }
    
    if (uploadBox) uploadBox.style.display = 'none';
    if (fileInfo) fileInfo.style.display = 'block';
    
    // Update file count
    if (fileCount) fileCount.textContent = selectedFiles.length;
    
    // Calculate total size
    const total = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    if (totalSize) totalSize.textContent = formatFileSize(total);
    
    // Clear and populate files list
    if (!filesList) return;
    
    filesList.innerHTML = '';
    selectedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div class="file-item-info">
                <span class="file-item-icon">📄</span>
                <div class="file-item-details">
                    <div class="file-item-name">${escapeHtml(file.name)}</div>
                    <div class="file-item-size">${formatFileSize(file.size)}</div>
                </div>
            </div>
            <button type="button" class="file-item-remove" data-index="${index}" title="Remove file">✕</button>
        `;
        
        // Add remove listener
        const removeBtn = fileItem.querySelector('.file-item-remove');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => handleRemoveFile(index));
        }
        
        filesList.appendChild(fileItem);
    });
    
    // Enable the upload button
    if (uploadGenerateBtn) {
        uploadGenerateBtn.disabled = false;
    }
}

/**
 * Handle remove single file
 */
function handleRemoveFile(index) {
    selectedFiles.splice(index, 1);
    displayFilesList();
}

/**
 * Handle clear all files
 */
function handleClearAllFiles() {
    selectedFiles = [];
    fileInput.value = '';
    displayFilesList();
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
 * Handle upload and generate
 */
async function handleUploadAndGenerate() {
    if (selectedFiles.length === 0) {
        alert('Please select at least one file');
        return;
    }
    
    try {
        showLoading(true);
        hideOutput();
        
        const formData = new FormData();
        
        // Append all files
        selectedFiles.forEach((file, index) => {
            formData.append('files', file);
        });
        
        const response = await fetch(`${API_BASE_URL}/generate/upload`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        currentResponse = data;
        
        if (data.success && data.documentResults) {
            // Aggregate all test cases from all successful documents
            const allTestCases = [];
            data.documentResults.forEach(doc => {
                if (doc.success && doc.testCaseResponse && Array.isArray(doc.testCaseResponse.testCases)) {
                    allTestCases.push(...doc.testCaseResponse.testCases);
                }
            });
            // Assign aggregated test cases for coverage validation
            data.testCases = allTestCases;
            currentResponse.testCases = allTestCases;
            window.currentTestCases = allTestCases;

            // Store original request data for coverage validation (first document)
            const firstDoc = data.documentResults.find(doc => doc.success && doc.testCaseResponse);
            if (firstDoc && firstDoc.testCaseResponse.extractedContent) {
                originalRequestData = {
                    userStory: firstDoc.testCaseResponse.extractedContent.userStory || 'N/A',
                    acceptanceCriteria: firstDoc.testCaseResponse.extractedContent.acceptanceCriteria || 'N/A',
                    businessRules: firstDoc.testCaseResponse.extractedContent.businessRules || 'N/A',
                    isDocumentUpload: true,
                    documentName: firstDoc.fileName
                };
            }

            displayMultiDocumentTestCases(data);
        } else {
            displayValidationMessage(data.message);
        }
        
    } catch (error) {
        console.error('Error generating test cases from documents:', error);
        
        // Show error toast
        if (typeof showToast === 'function') {
            showToast('Generation Failed', `Error: ${error.message}`, 'error');
        }
        
        alert(`Error processing documents: ${error.message}. Please check the console for details.`);
    } finally {
        showLoading(false);
    }
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get formatted current date and time
 */
function getCurrentDateTime() {
    const now = new Date();
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    return now.toLocaleString('en-US', options);
}

/**
 * Handle form submission
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = {
        userStory: document.getElementById('userStory').value.trim(),
        acceptanceCriteria: document.getElementById('acceptanceCriteria').value.trim(),
        businessRules: document.getElementById('businessRules').value.trim(),
        assumptions: document.getElementById('assumptions').value.trim(),
        constraints: document.getElementById('constraints').value.trim(),
        additionalNotes: document.getElementById('additionalNotes').value.trim()
    };
    
    if (!formData.userStory) {
        alert('Please enter a User Story');
        return;
    }
    
    // Store original request data for coverage analysis
    originalRequestData = formData;
    
    await generateTestCases(formData);
}

/**
 * Generate test cases via API - v2.1 Cache Buster
 */
async function generateTestCases(formData) {
    console.log('=== GENERATE TEST CASES FUNCTION CALLED (v2.1) ===');
    
    try {
        showLoading(true);
        hideOutput();
        
        console.log('=== REQUEST DATA ===');
        console.log('Sending request with data:', JSON.stringify(formData, null, 2));
        console.log('API URL:', `${API_BASE_URL}/generate`);
        
        const response = await fetch(`${API_BASE_URL}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        console.log('=== RESPONSE STATUS ===');
        console.log('Response status:', response.status);
        console.log('Response OK:', response.ok);
        console.log('Response headers:', response.headers);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log('=== RESPONSE DATA RECEIVED ===');
        console.log('Full response data:', JSON.stringify(data, null, 2));
        console.log('Response data.success:', data.success);
        console.log('Response data.testCases type:', typeof data.testCases);
        console.log('Response data.testCases is Array?', Array.isArray(data.testCases));
        console.log('Response data.testCases length:', data.testCases ? data.testCases.length : 'N/A');
        
        currentResponse = data;
        
        if (data.success) {
            console.log('=== SUCCESS - Calling displayTestCases ===');
            displayTestCases(data);
        } else {
            console.log('=== FAILURE - Request failed ===');
            console.log('Error message:', data.message);
            displayValidationMessage(data.message);
        }
        
    } catch (error) {
        console.error('=== EXCEPTION IN GENERATE TEST CASES ===');
        console.error('Error:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        alert(`Error generating test cases: ${error.message}. Please check the console for details.`);
    } finally {
        console.log('=== FINALLY - Hiding loading ===');
        showLoading(false);
    }
}

/**
 * Display test cases from multiple documents
 */
function displayMultiDocumentTestCases(data) {
    console.log('displayMultiDocumentTestCases called with:', data);
    
    // Store data globally for filtering and export
    currentDocumentResults = data.documentResults || [];
    allTestCases = [];
    
    // Collect all test cases
    currentDocumentResults.forEach(docResult => {
        if (docResult.success && docResult.testCaseResponse && docResult.testCaseResponse.testCases) {
            docResult.testCaseResponse.testCases.forEach(tc => {
                allTestCases.push({
                    ...tc,
                    documentName: docResult.fileName,
                    documentIndex: currentDocumentResults.indexOf(docResult)
                });
            });
        }
    });
    
    // Show output section
    if (outputSection) outputSection.style.display = 'block';
    if (validationMessage) validationMessage.style.display = 'none';
    
    // Display summary
    if (!summary || !testCasesContainer) {
        console.error('Missing DOM elements - summary:', summary, 'testCasesContainer:', testCasesContainer);
        return;
    }
    
    summary.innerHTML = `
        <strong>✅ Successfully processed ${data.totalDocuments} document${data.totalDocuments !== 1 ? 's' : ''}</strong>
        <br>
        <span style="font-size: 0.9rem; color: var(--text-secondary);">${data.message}</span>
    `;
    
    // Setup search and filter functionality
    setupTestCaseFilters();
    
    // Initial render
    renderFilteredTestCases(currentDocumentResults);
    
    console.log('displayMultiDocumentTestCases completed');
    
    // Scroll to output
    if (outputSection) outputSection.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Render filtered test cases
 */
function renderFilteredTestCases(documentResults) {
    // Clear previous test cases
    testCasesContainer.innerHTML = '';
    
    console.log('Processing', documentResults?.length, 'document results');
    
    // Display test cases for each document
    documentResults.forEach((docResult, docIndex) => {
        console.log('Processing document', docIndex, ':', docResult);
        
        if (docResult.success && docResult.testCaseResponse) {
            // Create document section
            const docSection = document.createElement('div');
            docSection.className = 'document-section';
            docSection.style.marginBottom = '30px';
            
            // Document header
            const docHeader = document.createElement('div');
            docHeader.className = 'document-header';
            docHeader.style.cssText = 'background: linear-gradient(135deg, var(--primary-color) 0%, #1e40af 100%); color: white; padding: 15px 20px; border-radius: 8px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;';
            
            const docHeaderId = `doc-header-${docIndex}`;
            const testCasesDivId = `doc-testcases-${docIndex}`;
            const toggleBtnId = `toggle-btn-${docIndex}`;
            
            docHeader.innerHTML = `
                <div>
                    <h3 style="margin: 0; font-size: 1.1rem;">📄 ${escapeHtml(docResult.fileName)}</h3>
                    <p style="margin: 5px 0 0 0; font-size: 0.85rem; opacity: 0.9;">${docResult.testCaseResponse.totalTestCases} test case${docResult.testCaseResponse.totalTestCases !== 1 ? 's' : ''}</p>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button 
                        id="${toggleBtnId}"
                        class="btn btn-secondary" 
                        onclick="toggleDocumentTestCases('${testCasesDivId}', '${toggleBtnId}')"
                        style="background: rgba(255,255,255,0.2); color: white; border: 1px solid white; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.3s;"
                        title="Minimize/Expand test cases">
                        ➖ Minimize
                    </button>
                    <button 
                        class="btn btn-secondary" 
                        onclick="downloadDocumentCsv('${escapeHtml(docResult.fileName)}', ${docIndex})"
                        style="background: white; color: var(--primary-color); border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600;"
                        title="Download CSV for this story">
                        📥 Download CSV
                    </button>
                </div>
            `;
            docSection.appendChild(docHeader);
            
            // Story Summary Section - Display JIRA summary or user story title
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
            
            // Test cases for this document
            const testCasesDiv = document.createElement('div');
            testCasesDiv.id = testCasesDivId;
            testCasesDiv.className = 'document-test-cases';
            testCasesDiv.style.cssText = 'transition: all 0.3s ease-in-out; overflow: hidden;';
            docResult.testCaseResponse.testCases.forEach((testCase, index) => {
                const card = createTestCaseCard(testCase, index);
                testCasesDiv.appendChild(card);
            });
            docSection.appendChild(testCasesDiv);
            
            testCasesContainer.appendChild(docSection);
        } else {
            // Display error for this document
            const errorDiv = document.createElement('div');
            errorDiv.className = 'document-error';
            errorDiv.style.cssText = 'background: #fee; border: 2px solid #fcc; border-radius: 8px; padding: 15px; margin-bottom: 15px;';
            errorDiv.innerHTML = `
                <h4 style="margin: 0 0 10px 0; color: var(--danger-color);">❌ ${escapeHtml(docResult.fileName)}</h4>
                <p style="margin: 0; color: var(--text-secondary);">${escapeHtml(docResult.errorMessage || 'Failed to process document')}</p>
            `;
            testCasesContainer.appendChild(errorDiv);
        }
    });
}

// Make function globally accessible
window.displayMultiDocumentTestCases = displayMultiDocumentTestCases;

/**
 * Setup test case search and filter functionality
 */
function setupTestCaseFilters() {
    const searchInput = document.getElementById('testCaseSearchInput');
    const coverageFilter = document.getElementById('coverageFilter');
    const typeFilter = document.getElementById('typeFilter');
    const sortBy = document.getElementById('testCaseSortBy');
    const clearFiltersBtn = document.getElementById('clearTestCaseFilters');
    
    // Remove existing event listeners
    if (searchInput) {
        const newSearchInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newSearchInput, searchInput);
        newSearchInput.addEventListener('input', applyTestCaseFilters);
    }
    
    if (coverageFilter) {
        const newCoverageFilter = coverageFilter.cloneNode(true);
        coverageFilter.parentNode.replaceChild(newCoverageFilter, coverageFilter);
        newCoverageFilter.addEventListener('change', applyTestCaseFilters);
    }
    
    if (typeFilter) {
        const newTypeFilter = typeFilter.cloneNode(true);
        typeFilter.parentNode.replaceChild(newTypeFilter, typeFilter);
        newTypeFilter.addEventListener('change', applyTestCaseFilters);
    }
    
    if (sortBy) {
        const newSortBy = sortBy.cloneNode(true);
        sortBy.parentNode.replaceChild(newSortBy, sortBy);
        newSortBy.addEventListener('change', applyTestCaseFilters);
    }
    
    if (clearFiltersBtn) {
        clearFiltersBtn.onclick = clearTestCaseFilters;
    }
}

/**
 * Apply test case filters
 */
function applyTestCaseFilters() {
    const searchInput = document.getElementById('testCaseSearchInput');
    const coverageFilter = document.getElementById('coverageFilter');
    const typeFilter = document.getElementById('typeFilter');
    const sortBy = document.getElementById('testCaseSortBy');
    
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const coverageValue = coverageFilter ? coverageFilter.value : '';
    const typeValue = typeFilter ? typeFilter.value : '';
    const sortValue = sortBy ? sortBy.value : 'default';
    
    // Filter test cases
    let filteredTestCases = allTestCases.filter(tc => {
        // Search filter
        const matchesSearch = !searchTerm ||
            (tc.scenario && tc.scenario.toLowerCase().includes(searchTerm)) ||
            (tc.description && tc.description.toLowerCase().includes(searchTerm)) ||
            (tc.steps && tc.steps.some(s => s.toLowerCase().includes(searchTerm)));
        
        // Coverage filter
        const matchesCoverage = !coverageValue ||
            (coverageValue === 'covered' && tc.covered) ||
            (coverageValue === 'not-covered' && !tc.covered);
        
        // Type filter (based on scenario name keywords)
        let matchesType = !typeValue;
        if (typeValue && tc.scenario) {
            const scenarioLower = tc.scenario.toLowerCase();
            if (typeValue === 'positive') matchesType = !scenarioLower.includes('invalid') && !scenarioLower.includes('error') && !scenarioLower.includes('negative');
            else if (typeValue === 'negative') matchesType = scenarioLower.includes('invalid') || scenarioLower.includes('error') || scenarioLower.includes('negative');
            else if (typeValue === 'edge') matchesType = scenarioLower.includes('edge') || scenarioLower.includes('boundary') || scenarioLower.includes('limit');
        }
        
        return matchesSearch && matchesCoverage && matchesType;
    });
    
    // Sort test cases
    if (sortValue !== 'default') {
        filteredTestCases = sortTestCases(filteredTestCases, sortValue);
    }
    
    // Group by document
    const filteredDocResults = currentDocumentResults.map(docResult => {
        if (!docResult.success || !docResult.testCaseResponse) return docResult;
        
        const filteredForDoc = filteredTestCases.filter(tc => tc.documentName === docResult.fileName);
        return {
            ...docResult,
            testCaseResponse: {
                ...docResult.testCaseResponse,
                testCases: filteredForDoc,
                totalTestCases: filteredForDoc.length
            }
        };
    });
    
    // Re-render
    renderFilteredTestCases(filteredDocResults);
    
    // Update count
    const filteredCount = document.getElementById('testCaseFilteredCount');
    if (filteredCount) {
        filteredCount.textContent = `Showing ${filteredTestCases.length} test case${filteredTestCases.length !== 1 ? 's' : ''}`;
    }
}

/**
 * Sort test cases
 */
function sortTestCases(testCases, sortBy) {
    return [...testCases].sort((a, b) => {
        switch (sortBy) {
            case 'scenario':
                return (a.scenario || '').localeCompare(b.scenario || '');
            case 'coverage':
                return (b.covered ? 1 : 0) - (a.covered ? 1 : 0);
            case 'type':
                const getType = (tc) => {
                    const s = (tc.scenario || '').toLowerCase();
                    if (s.includes('invalid') || s.includes('error')) return 'negative';
                    if (s.includes('edge') || s.includes('boundary')) return 'edge';
                    return 'positive';
                };
                return getType(a).localeCompare(getType(b));
            default:
                return 0;
        }
    });
}

/**
 * Clear test case filters
 */
function clearTestCaseFilters() {
    const searchInput = document.getElementById('testCaseSearchInput');
    const coverageFilter = document.getElementById('coverageFilter');
    const typeFilter = document.getElementById('typeFilter');
    const sortBy = document.getElementById('testCaseSortBy');
    
    if (searchInput) searchInput.value = '';
    if (coverageFilter) coverageFilter.value = '';
    if (typeFilter) typeFilter.value = '';
    if (sortBy) sortBy.value = 'default';
    
    applyTestCaseFilters();
}

/**
 * Download test cases as Excel
 */
function downloadExcel() {
    if (!allTestCases || allTestCases.length === 0) {
        alert('No test cases available to download');
        return;
    }
    
    // Create Excel-compatible HTML table
    let excelContent = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    excelContent += '<head><meta charset="utf-8"><style>table {border-collapse: collapse;} th, td {border: 1px solid black; padding: 8px; text-align: left;}</style></head>';
    excelContent += '<body><table>';
    
    // Header
    excelContent += '<tr><th>Document</th><th>Test Case ID</th><th>Scenario</th><th>Description</th><th>Steps</th><th>Expected Result</th><th>Coverage Status</th></tr>';
    
    // Rows
    allTestCases.forEach((tc, index) => {
        const steps = Array.isArray(tc.steps) ? tc.steps.join(' | ') : tc.steps;
        excelContent += `<tr>
            <td>${escapeHtml(tc.documentName || 'N/A')}</td>
            <td>TC${(index + 1).toString().padStart(3, '0')}</td>
            <td>${escapeHtml(tc.scenario || 'N/A')}</td>
            <td>${escapeHtml(tc.description || 'N/A')}</td>
            <td>${escapeHtml(steps || 'N/A')}</td>
            <td>${escapeHtml(tc.expectedResult || 'N/A')}</td>
            <td>${tc.covered ? 'Covered' : 'Not Covered'}</td>
        </tr>`;
    });
    
    excelContent += '</table></body></html>';
    
    // Create blob and download
    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-cases-${new Date().toISOString().split('T')[0]}.xls`;
    a.click();
    window.URL.revokeObjectURL(url);
}

/**
 * Download test cases as PDF (simplified HTML version)
 */
function downloadPdf() {
    if (!allTestCases || allTestCases.length === 0) {
        alert('No test cases available to download');
        return;
    }
    
    // Create printable HTML
    let pdfContent = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Test Cases Report</title>';
    pdfContent += '<style>body{font-family:Arial,sans-serif;margin:20px;}h1{color:#2563eb;}table{width:100%;border-collapse:collapse;margin-top:20px;}th,td{border:1px solid #ddd;padding:8px;text-align:left;}th{background:#2563eb;color:white;}.covered{color:green;font-weight:bold;}.not-covered{color:red;font-weight:bold;}</style>';
    pdfContent += '</head><body>';
    pdfContent += '<h1>Test Cases Report</h1>';
    pdfContent += `<p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>`;
    pdfContent += `<p><strong>Total Test Cases:</strong> ${allTestCases.length}</p>`;
    pdfContent += '<table><tr><th>ID</th><th>Document</th><th>Scenario</th><th>Description</th><th>Steps</th><th>Expected Result</th><th>Coverage</th></tr>';
    
    allTestCases.forEach((tc, index) => {
        const steps = Array.isArray(tc.steps) ? tc.steps.map((s, i) => `${i + 1}. ${s}`).join('<br>') : tc.steps;
        const coverageClass = tc.covered ? 'covered' : 'not-covered';
        const coverageText = tc.covered ? '✓ Covered' : '✗ Not Covered';
        
        pdfContent += `<tr>
            <td>TC${(index + 1).toString().padStart(3, '0')}</td>
            <td>${escapeHtml(tc.documentName || 'N/A')}</td>
            <td>${escapeHtml(tc.scenario || 'N/A')}</td>
            <td>${escapeHtml(tc.description || 'N/A')}</td>
            <td>${steps || 'N/A'}</td>
            <td>${escapeHtml(tc.expectedResult || 'N/A')}</td>
            <td class="${coverageClass}">${coverageText}</td>
        </tr>`;
    });
    
    pdfContent += '</table></body></html>';
    
    // Open in new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(pdfContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Trigger print dialog
    setTimeout(() => {
        printWindow.print();
    }, 250);
}

// Make function globally accessible
window.displayMultiDocumentTestCases = displayMultiDocumentTestCases;

/**
 * Download CSV for a specific document
 */
function downloadDocumentCsv(fileName, docIndex) {
    console.log('downloadDocumentCsv called with:', fileName, docIndex);
    
    if (!currentResponse || !currentResponse.documentResults || !currentResponse.documentResults[docIndex]) {
        console.error('No data found for index:', docIndex, 'currentResponse:', currentResponse);
        alert('No test cases available to download');
        return;
    }
    
    const docResult = currentResponse.documentResults[docIndex];
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
        csvContent = generateCsvFromTestCases(docResult.testCaseResponse.testCases, fileName);
    } else {
        alert('No test cases available for this document');
        return;
    }
    
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
 * Generate CSV content from test cases array
 */
function generateCsvFromTestCases(testCases, fileName) {
    let csv = 'Test Case ID,Test Scenario,To Validate,Preconditions,Test Steps,Expected Result,Priority,Test Type,JIRA Issue\n';
    
    testCases.forEach((tc, index) => {
        const row = [
            tc.testCaseId || `TC-${String(index + 1).padStart(3, '0')}`,
            escapeCsvField(tc.testCase || tc.testScenario || ''),
            escapeCsvField(tc.toValidate || 'To validate the functionality'),
            escapeCsvField(tc.precondition || tc.preconditions || ''),
            escapeCsvField(tc.testSteps || ''),
            escapeCsvField(tc.expectedResult || ''),
            escapeCsvField(tc.priority || 'Medium'),
            escapeCsvField(tc.type || tc.testType || 'Functional'),
            escapeCsvField(fileName || '')
        ];
        csv += row.join(',') + '\n';
    });
    
    return csv;
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

// Make function globally accessible
window.downloadDocumentCsv = downloadDocumentCsv;

/**
 * Toggle document test cases visibility (minimize/expand)
 */
function toggleDocumentTestCases(testCasesDivId, toggleBtnId) {
    const testCasesDiv = document.getElementById(testCasesDivId);
    const toggleBtn = document.getElementById(toggleBtnId);
    
    if (!testCasesDiv || !toggleBtn) {
        console.error('Toggle elements not found:', { testCasesDivId, toggleBtnId });
        return;
    }
    
    if (testCasesDiv.style.display === 'none') {
        // Expand
        testCasesDiv.style.display = 'block';
        toggleBtn.innerHTML = '➖ Minimize';
        toggleBtn.style.background = 'rgba(255,255,255,0.2)';
        toggleBtn.title = 'Minimize test cases';
    } else {
        // Minimize
        testCasesDiv.style.display = 'none';
        toggleBtn.innerHTML = '➕ Expand';
        toggleBtn.style.background = 'rgba(255,255,255,0.3)';
        toggleBtn.title = 'Expand test cases';
    }
}

// Make function globally accessible
window.toggleDocumentTestCases = toggleDocumentTestCases;

/**
 * Display generated test cases - FORCE CACHE BUST v2.2
 */
function displayTestCases(data) {
    console.log('=== DISPLAY TEST CASES v2.2 LOADED ===');
    
    // Show output section
    if (outputSection) outputSection.style.display = 'block';
    if (validationMessage) validationMessage.style.display = 'none';
    
    // Display summary
    if (!summary || !testCasesContainer) {
        console.error('=== ERROR: Summary or testCasesContainer is null ===');
        alert('UI elements not found. Please refresh the page.');
        return;
    }
    
    // Debug: Log the complete data structure to identify the issue
    console.log('=== COMPLETE DATA STRUCTURE v2.2 ===');
    console.log('Full data object:', JSON.stringify(data, null, 2));
    console.log('data.success:', data.success);
    console.log('data.testCases type:', typeof data.testCases);
    console.log('data.testCases value:', data.testCases);
    console.log('data.totalTestCases:', data.totalTestCases);
    console.log('data.message:', data.message);
    console.log('================================');
    
    // AGGRESSIVE FIX: Handle all possible response formats
    let testCases = null;
    
    // Case 1: Normal case - testCases is already an array
    if (Array.isArray(data.testCases)) {
        testCases = data.testCases;
        console.log('Case 1: testCases is array with length:', testCases.length);
    }
    // Case 2: testCases might be a string (JSON)
    else if (typeof data.testCases === 'string') {
        console.log('Case 2: testCases is string, attempting to parse JSON');
        try {
            testCases = JSON.parse(data.testCases);
            if (!Array.isArray(testCases)) {
                console.error('Parsed JSON is not an array:', testCases);
                testCases = null;
            }
        } catch (e) {
            console.error('Failed to parse testCases string as JSON:', e);
            testCases = null;
        }
    }
    // Case 3: testCases might be nested in the response
    else if (data.testCaseResponse && data.testCaseResponse.testCases) {
        console.log('Case 3: testCases found in nested testCaseResponse');
        if (Array.isArray(data.testCaseResponse.testCases)) {
            testCases = data.testCaseResponse.testCases;
        }
    }
    // Case 4: testCases might be in a different property
    else if (data.result && Array.isArray(data.result)) {
        console.log('Case 4: testCases found in result property');
        testCases = data.result;
    }
    
    // Final validation
    if (!testCases || !Array.isArray(testCases)) {
        console.error('=== CRITICAL ERROR: Unable to find valid testCases array ===');
        console.error('All attempts to find testCases failed');
        console.error('data object keys:', Object.keys(data));
        alert('Unable to process test cases. Backend response format may have changed. Check console for details.');
        return;
    }
    
    console.log('=== SUCCESS: Found valid testCases array with length:', testCases.length, '===');
    
    summary.innerHTML = `
        <strong>✅ Successfully generated ${testCases.length} test case${testCases.length !== 1 ? 's' : ''}</strong>
        <br>
        <span style="font-size: 0.9rem; color: var(--text-secondary);">${data.message || 'Generated successfully'}</span>
    `;
    
    // Show success toast notification
    if (typeof showToast === 'function') {
        showToast(
            'Test Cases Generated',
            `Successfully created ${testCases.length} test case${testCases.length !== 1 ? 's' : ''}`,
            'success'
        );
    }
    
    // Clear previous test cases
    testCasesContainer.innerHTML = '';
    
    if (testCases.length === 0) {
        console.warn('=== WARNING: testCases array is empty ===');
        displayValidationMessage('No test cases were generated. Please provide more detailed requirements and try again.');
        return;
    }
    
    console.log(`=== Processing ${testCases.length} test cases ===`);
    
    // Display each test case with error handling
    try {
        testCases.forEach((testCase, index) => {
            console.log(`Processing test case ${index + 1}:`, testCase);
            const card = createTestCaseCard(testCase, index);
            testCasesContainer.appendChild(card);
        });
        console.log('=== All test cases displayed successfully ===');
    } catch (error) {
        console.error('=== ERROR in forEach loop ===');
        console.error('Error:', error);
        console.error('Stack:', error.stack);
        alert('Error displaying test cases: ' + error.message);
        return;
    }
    
    // Scroll to output
    if (outputSection) outputSection.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Display validation message
 */
function displayValidationMessage(message) {
    if (outputSection) outputSection.style.display = 'block';
    if (!validationMessage) return;
    
    validationMessage.style.display = 'block';
    validationMessage.innerHTML = `
        <strong>⚠️ Clarification Required</strong><br><br>
        ${escapeHtml(message)}
    `;
    testCasesContainer.innerHTML = '';
    summary.innerHTML = '';
    
    outputSection.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Create test case card element
 */
function createTestCaseCard(testCase, index) {
    const card = document.createElement('div');
    card.className = 'test-case-card';
    card.style.animationDelay = `${index * 0.05}s`;
    
    const priority = testCase.priority || 'Medium';
    const priorityClass = `badge-priority-${priority.toLowerCase()}`;
    
    card.innerHTML = `
        <div class="test-case-header">
            <div class="test-case-id">${escapeHtml(testCase.testCaseId)}</div>
            <div class="test-case-badges">
                <span class="badge ${priorityClass}">${escapeHtml(priority)}</span>
                <span class="badge badge-type">${escapeHtml(testCase.testType || 'Functional')}</span>
            </div>
        </div>
        <div class="test-case-timestamp">
            <small style="color: #64748b; font-size: 0.85rem;">🕐 Generated: ${getCurrentDateTime()}</small>
        </div>
        
        <div class="test-case-section">
            <div class="test-case-label">Test Scenario</div>
            <div class="test-case-content">${escapeHtml(testCase.testScenario)}</div>
        </div>
        
        <div class="test-case-section" style="background: #f0f9ff; border-left: 3px solid #3b82f6; padding: 12px; margin: 10px 0; border-radius: 6px;">
            <div class="test-case-label" style="color: #1e40af; font-weight: 600;">🎯 To Validate</div>
            <div class="test-case-content" style="color: #1e3a8a; font-style: italic;">${escapeHtml(testCase.toValidate || 'To validate the functionality')}</div>
        </div>
        
        <div class="test-case-section">
            <div class="test-case-label">Preconditions</div>
            <div class="test-case-content">${escapeHtml(testCase.preconditions)}</div>
        </div>
        
        <div class="test-case-section">
            <div class="test-case-label">Test Steps</div>
            <div class="test-case-content">${escapeHtml(testCase.testSteps)}</div>
        </div>
        
        <div class="test-case-section">
            <div class="test-case-label">Expected Result</div>
            <div class="test-case-content">${escapeHtml(testCase.expectedResult)}</div>
        </div>
    `;
    
    return card;
}

/**
 * Handle download CSV
 */
async function handleDownloadCsv() {
    console.log('handleDownloadCsv called');
    console.log('window.currentResponse:', window.currentResponse);
    console.log('window.currentTestCases:', window.currentTestCases);
    
    // Check for CSV content from either document upload or JIRA integration
    let csvContent = null;
    let fileName = `test-cases-${Date.now()}.csv`;
    
    // Try window.currentResponse first (for JIRA batch and document upload)
    if (window.currentResponse && window.currentResponse.csvContent) {
        // Document upload or manual entry
        csvContent = window.currentResponse.csvContent;
    } 
    // Try multi-document format
    else if (window.currentResponse && window.currentResponse.documentResults && window.currentResponse.documentResults.length > 0) {
        console.log('Using multi-document format for CSV download');
        // Collect all test cases from all documents
        let allTestCases = [];
        window.currentResponse.documentResults.forEach(doc => {
            if (doc.success && doc.testCaseResponse && doc.testCaseResponse.testCases) {
                allTestCases = allTestCases.concat(doc.testCaseResponse.testCases);
            }
        });
        if (allTestCases.length > 0) {
            csvContent = generateCsvFromTestCases(allTestCases);
            fileName = `test-cases-batch-${Date.now()}.csv`;
        }
    }
    // Try currentResponse without window prefix (fallback for old code)
    else if (currentResponse && currentResponse.csvContent) {
        csvContent = currentResponse.csvContent;
    } 
    // Try window.currentTestCases
    else if (window.currentTestCases && window.currentTestCases.length > 0) {
        // JIRA integration - generate CSV from test cases
        csvContent = generateCsvFromTestCases(window.currentTestCases);
        if (window.currentJiraKey) {
            fileName = `test-cases-${window.currentJiraKey}-${Date.now()}.csv`;
        }
    }
    
    console.log('CSV content available:', !!csvContent);
    
    if (!csvContent) {
        alert('No test cases to download. Please generate test cases first.');
        return;
    }
    
    try {
        // Create blob from CSV content
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log('CSV downloaded successfully');
        showNotification('CSV downloaded successfully!', 'success');
    } catch (error) {
        console.error('Error downloading CSV:', error);
        alert('Error downloading CSV. Please try again.');
    }
}

/**
 * Generate CSV content from test cases array
 */
function generateCsvFromTestCases(testCases) {
    const headers = ['Test Case ID', 'Test Scenario', 'Preconditions', 'Test Steps', 'Expected Result', 'Priority', 'Test Type'];
    let csv = headers.join(',') + '\n';
    
    testCases.forEach(tc => {
        const row = [
            escapeCsvField(tc.testCaseId || tc.testCase || ''),
            escapeCsvField(tc.testScenario || tc.testCase || ''),
            escapeCsvField(tc.preconditions || tc.precondition || ''),
            escapeCsvField(tc.testSteps || ''),
            escapeCsvField(tc.expectedResult || ''),
            escapeCsvField(tc.priority || 'Medium'),
            escapeCsvField(tc.testType || tc.type || 'Functional')
        ];
        csv += row.join(',') + '\n';
    });
    
    return csv;
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

/**
 * Handle copy to clipboard
 */
async function handleCopyToClipboard() {
    if (!currentResponse || !currentResponse.csvContent) {
        alert('No test cases to copy');
        return;
    }
    
    try {
        await navigator.clipboard.writeText(currentResponse.csvContent);
        showNotification('Test cases copied to clipboard!', 'success');
    } catch (error) {
        console.error('Error copying to clipboard:', error);
        alert('Error copying to clipboard. Please try again.');
    }
}

/**
 * Handle clear form
 */
function handleClearForm() {
    if (confirm('Are you sure you want to clear the form?')) {
        if (jiraForm) jiraForm.reset();
        hideOutput();
        currentResponse = null;
    }
}

/**
 * Show/hide loading overlay
 */
function showLoading(show) {
    if (loadingOverlay) loadingOverlay.style.display = show ? 'flex' : 'none';
    if (generateBtn) generateBtn.disabled = show;
    if (uploadGenerateBtn) uploadGenerateBtn.disabled = show;
    
    const btnText = generateBtn ? generateBtn.querySelector('.btn-text') : null;
    const spinner = generateBtn ? generateBtn.querySelector('.spinner') : null;
    const uploadBtnText = uploadGenerateBtn ? uploadGenerateBtn.querySelector('.btn-text') : null;
    const uploadSpinner = uploadGenerateBtn ? uploadGenerateBtn.querySelector('.spinner') : null;
    
    if (show) {
        if (btnText) btnText.textContent = 'Generating...';
        if (spinner) spinner.style.display = 'inline-block';
        if (uploadBtnText) uploadBtnText.textContent = 'Generating...';
        if (uploadSpinner) uploadSpinner.style.display = 'inline-block';
    } else {
        if (btnText) btnText.textContent = 'Generate Test Cases';
        if (spinner) spinner.style.display = 'none';
        if (uploadBtnText) uploadBtnText.textContent = 'Generate Test Cases';
        if (uploadSpinner) uploadSpinner.style.display = 'none';
    }
}

/**
 * Hide output section
 */
function hideOutput() {
    if (outputSection) outputSection.style.display = 'none';
    if (testCasesContainer) testCasesContainer.innerHTML = '';
    if (summary) summary.innerHTML = '';
    if (validationMessage) validationMessage.style.display = 'none';
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    // Simple notification - you can enhance this
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'var(--success-color)' : 'var(--primary-color)'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        animation: fadeIn 0.3s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
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
 * Add fadeOut animation
 */
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(20px);
        }
    }
`;
document.head.appendChild(style);

// Initialize
console.log('TestMate AI initialized');

/**
 * Handle sending chat message
 */
async function handleSendMessage() {
    if (!chatInput || !chatMessages || !sendChatBtn) return;
    
    const message = chatInput.value.trim();
    
    if (!message) {
        return;
    }
    
    // Hide suggested questions after first message
    const suggestedQuestions = document.getElementById('suggestedQuestions');
    if (suggestedQuestions) {
        suggestedQuestions.style.display = 'none';
    }
    
    // Add user message to chat
    addChatMessage(message, true);
    
    // Clear input and resize
    chatInput.value = '';
    chatInput.style.height = 'auto';
    
    // Show typing indicator
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) typingIndicator.style.display = 'flex';
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Show loading state
    const sendIcon = sendChatBtn.querySelector('.send-icon');
    const spinner = sendChatBtn.querySelector('.chat-spinner');
    if (sendIcon) sendIcon.style.display = 'none';
    if (spinner) spinner.style.display = 'block';
    sendChatBtn.disabled = true;
    
    try {
        const response = await fetch('/testmate/api/testcases/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: message })
        });
        
        if (!response.ok) {
            throw new Error('Failed to get response');
        }
        
        const data = await response.json();
        
        // Hide typing indicator
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) typingIndicator.style.display = 'none';
        
        // Add bot response to chat
        setTimeout(() => {
            addChatMessage(data.response, false);
        }, 300);
        
    } catch (error) {
        console.error('Chat error:', error);
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) typingIndicator.style.display = 'none';
        addChatMessage('Sorry, I encountered an error. Please try again.', false);
    } finally {
        // Reset button state
        const sendIcon = sendChatBtn ? sendChatBtn.querySelector('.send-icon') : null;
        const spinner = sendChatBtn ? sendChatBtn.querySelector('.chat-spinner') : null;
        if (sendIcon) sendIcon.style.display = 'block';
        if (spinner) spinner.style.display = 'none';
        if (sendChatBtn) sendChatBtn.disabled = false;
        if (chatInput) chatInput.focus();
    }
}

/**
 * Add message to chat
 */
function addChatMessage(message, isUser) {
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isUser ? 'user-message' : 'bot-message'}`;
    messageDiv.style.opacity = '0';
    messageDiv.style.transform = 'translateY(10px)';
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = isUser ? '👤' : '🤖';
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    
    const header = document.createElement('div');
    header.className = 'message-header';
    header.innerHTML = `
        <span class="message-sender">${isUser ? 'You' : 'TestMate AI'}</span>
        <span class="message-time">${getCurrentTime()}</span>
    `;
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    // Convert markdown-like formatting to HTML
    const formattedMessage = message
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code style=\"background: rgba(0,0,0,0.05); padding: 2px 6px; border-radius: 4px; font-family: monospace;\">$1</code>');
    
    content.innerHTML = `<p>${formattedMessage}</p>`;
    
    bubble.appendChild(header);
    bubble.appendChild(content);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(bubble);
    
    chatMessages.appendChild(messageDiv);
    
    // Animate message in
    setTimeout(() => {
        messageDiv.style.transition = 'all 0.3s ease';
        messageDiv.style.opacity = '1';
        messageDiv.style.transform = 'translateY(0)';
    }, 10);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Get current time formatted
 */
function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
/**
 * Validate Coverage - Compare test cases with user story
 */
function handleValidateCoverage() {
    console.log('handleValidateCoverage called');
    console.log('currentResponse:', window.currentResponse);
    console.log('currentTestCases:', window.currentTestCases);
    console.log('originalRequestData:', window.originalRequestData);
    
    const coverageAnalysis = document.getElementById('coverageAnalysis');
    const validateBtn = document.getElementById('validateBtn');
    
    if (!coverageAnalysis || !validateBtn) {
        console.error('Coverage elements not found:', { coverageAnalysis, validateBtn });
        alert('Coverage validation elements not found. Please refresh the page.');
        return;
    }
    
    // Check if we have test cases (support both single and multi-document formats)
    const hasSingleTestCases = (window.currentResponse && window.currentResponse.testCases && window.currentResponse.testCases.length > 0) ||
                               (window.currentTestCases && window.currentTestCases.length > 0);
    
    const hasMultiDocumentTestCases = window.currentResponse && 
                                      window.currentResponse.documentResults && 
                                      window.currentResponse.documentResults.length > 0 &&
                                      window.currentResponse.documentResults.some(doc => doc.success && doc.testCaseResponse && doc.testCaseResponse.testCases && doc.testCaseResponse.testCases.length > 0);
    
    console.log('Has single test cases:', hasSingleTestCases);
    console.log('Has multi-document test cases:', hasMultiDocumentTestCases);
    
    if (!hasSingleTestCases && !hasMultiDocumentTestCases) {
        alert('Please generate test cases first before validating coverage.');
        return;
    }
    
    if (coverageAnalysis.style.display === 'none' || coverageAnalysis.style.display === '') {
        // Show coverage analysis
        coverageAnalysis.style.display = 'block';
        validateBtn.textContent = '✓ Hide Coverage';
        console.log('Calling generateCoverageAnalysis...');
        generateCoverageAnalysis();
    } else {
        // Hide coverage analysis
        coverageAnalysis.style.display = 'none';
        validateBtn.textContent = '✓ Validate Coverage';
    }
}

// Make function globally accessible
window.handleValidateCoverage = handleValidateCoverage;

/**
 * Generate Coverage Analysis
 */
function generateCoverageAnalysis() {
    console.log('generateCoverageAnalysis called');
    console.log('currentResponse:', window.currentResponse);
    console.log('originalRequestData:', window.originalRequestData);
    
    // Get test cases from either single or multi-document format
    let testCases = [];
    let allDocuments = [];
    
    // Check for multi-document format (JIRA batch or multiple uploads)
    if (window.currentResponse && window.currentResponse.documentResults && window.currentResponse.documentResults.length > 0) {
        console.log('Using multi-document format');
        // Collect all test cases from all documents
        window.currentResponse.documentResults.forEach(doc => {
            if (doc.success && doc.testCaseResponse && doc.testCaseResponse.testCases) {
                testCases = testCases.concat(doc.testCaseResponse.testCases);
                allDocuments.push({
                    name: doc.fileName,
                    testCases: doc.testCaseResponse.testCases
                });
            }
        });
    } 
    // Check for single document format
    else if (window.currentResponse && window.currentResponse.testCases) {
        console.log('Using single document format');
        testCases = window.currentResponse.testCases;
    } 
    // Check for window.currentTestCases
    else if (window.currentTestCases && window.currentTestCases.length > 0) {
        console.log('Using window.currentTestCases');
        testCases = window.currentTestCases;
    }
    
    console.log('Total test cases found:', testCases.length);
    
    if (testCases.length === 0) {
        alert('No test cases available for coverage analysis.');
        return;
    }
    
    // Get original story data from stored request
    let userStory = 'N/A';
    let acceptanceCriteria = 'N/A';
    let businessRules = 'N/A';
    let isDocumentUpload = false;
    let isJiraIntegration = false;
    
    if (window.originalRequestData) {
        userStory = window.originalRequestData.userStory || 'N/A';
        acceptanceCriteria = window.originalRequestData.acceptanceCriteria || 'N/A';
        businessRules = window.originalRequestData.businessRules || 'N/A';
        isDocumentUpload = window.originalRequestData.isDocumentUpload || false;
        isJiraIntegration = window.originalRequestData.isJiraIntegration || false;
    }
    
    console.log('Coverage data:', { userStory, acceptanceCriteria, businessRules, isJiraIntegration });
    
    // For multi-document JIRA, use the first document's metadata if available
    if (allDocuments.length > 0 && window.currentResponse.documentResults && window.currentResponse.documentResults[0]) {
        const firstDoc = window.currentResponse.documentResults[0];
        if (firstDoc.testCaseResponse && firstDoc.testCaseResponse.extractedContent) {
            const extracted = firstDoc.testCaseResponse.extractedContent;
            console.log('Extracted content from first doc:', extracted);
            userStory = extracted.userStory || userStory;
            acceptanceCriteria = extracted.acceptanceCriteria || acceptanceCriteria;
            businessRules = extracted.businessRules || businessRules;
        }
        if (!isJiraIntegration && firstDoc.fileName) {
            isJiraIntegration = firstDoc.fileName.match(/^[A-Z]+-\d+$/); // Detect JIRA issue key pattern
        }
    }
    
    console.log('Final coverage data after extraction:', { userStory, acceptanceCriteria, businessRules, isJiraIntegration });
    
    // Display original story
    const originalStory = document.getElementById('originalStory');
    let storyHTML = '';
    
    // Show multi-document summary if applicable
    if (allDocuments.length > 1) {
        storyHTML += `<div style="margin-bottom: 15px; padding: 12px; background: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 6px;">
            <strong style="color: #1e40af;">📚 Multiple Documents: ${allDocuments.length} stories analyzed</strong>
            <div style="margin-top: 8px; font-size: 0.9rem; color: #1e40af;">
                ${allDocuments.map(doc => `• ${doc.name} (${doc.testCases.length} test cases)`).join('<br>')}
            </div>
        </div>`;
    } else if (isJiraIntegration && originalRequestData && originalRequestData.jiraKey) {
        storyHTML += `<div style="margin-bottom: 15px; padding: 12px; background: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 6px;">
            <strong style="color: #1e40af;">📋 JIRA Story: ${originalRequestData.jiraKey}</strong>
        </div>`;
    } else if (isDocumentUpload && originalRequestData && originalRequestData.documentName) {
        storyHTML += `<div style="margin-bottom: 15px; padding: 12px; background: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 6px;">
            <strong style="color: #1e40af;">📄 Document: ${originalRequestData.documentName}</strong>
        </div>`;
    }
    
    if (userStory && userStory !== 'N/A') {
        storyHTML += `<div style="margin-bottom: 15px;">
            <strong style="color: var(--primary-color);">User Story:</strong><br>
            <div style="margin-top: 8px; padding: 12px; background: #f8fafc; border-left: 3px solid #3b82f6; border-radius: 4px;">
                ${userStory.replace(/\n/g, '<br>')}
            </div>
        </div>`;
    }
    
    if (acceptanceCriteria && acceptanceCriteria !== 'N/A') {
        storyHTML += `<div style="margin-bottom: 15px;">
            <strong style="color: var(--primary-color);">Acceptance Criteria:</strong><br>
            <div style="margin-top: 8px; padding: 12px; background: #f0fdf4; border-left: 3px solid #10b981; border-radius: 4px; white-space: pre-wrap;">
                ${escapeHtml(acceptanceCriteria)}
            </div>
        </div>`;
    } else {
        storyHTML += `<div style="margin-bottom: 15px;">
            <strong style="color: var(--primary-color);">Acceptance Criteria:</strong><br>
            <div style="margin-top: 8px; padding: 12px; background: #fef3c7; border-left: 3px solid #f59e0b; border-radius: 4px;">
                <em>No acceptance criteria extracted from the ${isJiraIntegration ? 'JIRA stories' : 'document'}.</em>
            </div>
        </div>`;
    }
    
    if (businessRules && businessRules !== 'N/A') {
        storyHTML += `<div style="margin-bottom: 15px;">
            <strong style="color: var(--primary-color);">Business Rules:</strong><br>
            <div style="margin-top: 8px; padding: 12px; background: #fef3c7; border-left: 3px solid #f59e0b; border-radius: 4px; white-space: pre-wrap;">
                ${escapeHtml(businessRules)}
            </div>
        </div>`;
    }
    
    originalStory.innerHTML = storyHTML || '<p style="color: var(--text-secondary);">No content extracted.</p>';
    
    // Analyze AC coverage - Always show summary
    const acCoverage = document.getElementById('acCoverage');
    if (acceptanceCriteria && acceptanceCriteria !== 'N/A' && !acceptanceCriteria.includes('No acceptance criteria extracted')) {
        const acLines = acceptanceCriteria.split('\n').filter(line => line.trim());
        const coverageResult = analyzeCriteriaCoverage(acLines, testCases);
        
        // Display coverage summary
        const coveragePercentage = acLines.length > 0 
            ? Math.round((coverageResult.coveredCount / acLines.length) * 100) 
            : 0;
        
        const summaryClass = coveragePercentage >= 80 ? 'success' : coveragePercentage >= 50 ? 'warning' : 'danger';
        const summaryIcon = coveragePercentage >= 80 ? '✅' : coveragePercentage >= 50 ? '⚠️' : '❌';
        
        acCoverage.innerHTML = `
            <div class="coverage-summary ${summaryClass}" style="margin-bottom: 20px; padding: 20px; background: ${coveragePercentage >= 80 ? '#d1fae5' : coveragePercentage >= 50 ? '#fef3c7' : '#fee2e2'}; border-left: 4px solid ${coveragePercentage >= 80 ? '#10b981' : coveragePercentage >= 50 ? '#f59e0b' : '#ef4444'}; border-radius: 8px;">
                <h4 style="margin: 0 0 10px 0; color: ${coveragePercentage >= 80 ? '#065f46' : coveragePercentage >= 50 ? '#92400e' : '#991b1b'};">
                    ${summaryIcon} Coverage Summary
                </h4>
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 10px;">
                    <div style="flex: 1;">
                        <div style="background: #fff; border-radius: 10px; height: 20px; overflow: hidden; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);">
                            <div style="height: 100%; width: ${coveragePercentage}%; background: linear-gradient(90deg, ${coveragePercentage >= 80 ? '#10b981, #059669' : coveragePercentage >= 50 ? '#f59e0b, #d97706' : '#ef4444, #dc2626'}); transition: width 0.3s;"></div>
                        </div>
                    </div>
                    <div style="font-size: 1.5rem; font-weight: bold; color: ${coveragePercentage >= 80 ? '#059669' : coveragePercentage >= 50 ? '#d97706' : '#dc2626'};">
                        ${coveragePercentage}%
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 15px;">
                    <div style="text-align: center; padding: 10px; background: rgba(255,255,255,0.6); border-radius: 6px;">
                        <div style="font-size: 1.2rem; font-weight: bold; color: #059669;">${coverageResult.coveredCount}</div>
                        <div style="font-size: 0.85rem; color: #6b7280;">Covered</div>
                    </div>
                    <div style="text-align: center; padding: 10px; background: rgba(255,255,255,0.6); border-radius: 6px;">
                        <div style="font-size: 1.2rem; font-weight: bold; color: #dc2626;">${coverageResult.notCoveredCount}</div>
                        <div style="font-size: 0.85rem; color: #6b7280;">Not Covered</div>
                    </div>
                    <div style="text-align: center; padding: 10px; background: rgba(255,255,255,0.6); border-radius: 6px;">
                        <div style="font-size: 1.2rem; font-weight: bold; color: #3b82f6;">${acLines.length}</div>
                        <div style="font-size: 0.85rem; color: #6b7280;">Total Criteria</div>
                    </div>
                </div>
            </div>
            <h4 style="margin: 20px 0 10px 0; color: var(--primary-color);">📋 Detailed Coverage Analysis</h4>
            ${coverageResult.html}
        `;
    } else {
        // Show test case summary when no AC available
        const totalTestCases = testCases.length;
        const testTypes = {};
        const testPriorities = {};
        
        testCases.forEach(tc => {
            const type = tc.testType || tc.type || 'Functional';
            const priority = tc.priority || 'Medium';
            testTypes[type] = (testTypes[type] || 0) + 1;
            testPriorities[priority] = (testPriorities[priority] || 0) + 1;
        });
        
        acCoverage.innerHTML = `
            <div style="padding: 20px; background: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 6px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 10px 0; color: #1e40af;">📊 Test Case Summary</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-top: 15px;">
                    <div style="text-align: center; padding: 15px; background: white; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                        <div style="font-size: 2rem; font-weight: bold; color: #3b82f6;">${totalTestCases}</div>
                        <div style="font-size: 0.9rem; color: #6b7280; margin-top: 5px;">Total Test Cases</div>
                    </div>
                    ${Object.entries(testTypes).map(([type, count]) => `
                        <div style="text-align: center; padding: 15px; background: white; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                            <div style="font-size: 1.5rem; font-weight: bold; color: #059669;">${count}</div>
                            <div style="font-size: 0.9rem; color: #6b7280; margin-top: 5px;">${type}</div>
                        </div>
                    `).join('')}
                    ${Object.entries(testPriorities).map(([priority, count]) => `
                        <div style="text-align: center; padding: 15px; background: white; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                            <div style="font-size: 1.5rem; font-weight: bold; color: ${priority === 'High' ? '#dc2626' : priority === 'Medium' ? '#f59e0b' : '#6b7280'};">${count}</div>
                            <div style="font-size: 0.9rem; color: #6b7280; margin-top: 5px;">${priority} Priority</div>
                        </div>
                    `).join('')}
                </div>
                <p style="margin-top: 15px; color: #6b7280; font-size: 0.9rem; text-align: center;">
                    <em>Coverage analysis requires acceptance criteria. Add AC to the source to enable detailed coverage tracking.</em>
                </p>
            </div>
        `;
    }
    
    // Display coverage stats with percentage
    const coverageStats = document.getElementById('coverageStats');
    if (coverageStats) {
        const stats = calculateCoverageStats(testCases);
        const detailedCoverage = calculateDetailedCoverage(testCases);
        
        console.log('Displaying coverage stats:', detailedCoverage);
        
        // Check if we have valid coverage data
        if (!detailedCoverage.hasData || detailedCoverage.totalItems === 0) {
            // Show basic stats without percentage
            coverageStats.innerHTML = `
                <div class="coverage-info-card" style="grid-column: 1 / -1; background: linear-gradient(135deg, #f3f4f6, #e5e7eb); border: 2px solid #d1d5db; border-radius: 12px; padding: 20px; margin-bottom: 15px;">
                    <div style="text-align: center;">
                        <div style="font-size: 2.5rem; margin-bottom: 10px;">📊</div>
                        <div style="font-size: 1.2rem; font-weight: 600; color: #374151; margin-bottom: 8px;">Coverage Analysis Not Available</div>
                        <div style="font-size: 0.9rem; color: #6b7280; margin-bottom: 15px;">
                            No Acceptance Criteria or Business Rules found in the source story.
                        </div>
                        <div style="background: white; padding: 12px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                            <div style="font-size: 0.85rem; color: #1e40af; font-weight: 600;">💡 To enable coverage analysis:</div>
                            <ul style="text-align: left; margin: 10px 0 0 0; padding-left: 20px; color: #374151; font-size: 0.85rem;">
                                <li>Add Acceptance Criteria to your JIRA story</li>
                                <li>Include Business Rules in the story description</li>
                                <li>Or use Manual Entry tab to input AC and BR manually</li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-number">${stats.totalTestCases}</div>
                    <div class="stat-label">Total Test Cases</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.positiveTests}</div>
                    <div class="stat-label">Positive Scenarios</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.negativeTests}</div>
                    <div class="stat-label">Negative/Error Tests</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.validationTests}</div>
                    <div class="stat-label">Validation Tests</div>
                </div>
            `;
            return;
        }
        
        const overallPercentage = detailedCoverage.overallPercentage;
        const percentageColor = overallPercentage >= 80 ? '#10b981' : overallPercentage >= 50 ? '#f59e0b' : '#ef4444';
        const percentageIcon = overallPercentage >= 80 ? '🎯' : overallPercentage >= 50 ? '⚠️' : '❌';
        
        coverageStats.innerHTML = `
            <div class="coverage-percentage-card" style="grid-column: 1 / -1; background: linear-gradient(135deg, ${percentageColor}15, ${percentageColor}05); border: 2px solid ${percentageColor}; border-radius: 12px; padding: 20px; margin-bottom: 15px; cursor: pointer;" onclick="toggleCoverageDetails()">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="flex: 1;">
                        <div style="font-size: 0.9rem; color: #6b7280; font-weight: 600; margin-bottom: 8px;">OVERALL COVERAGE</div>
                        <div style="font-size: 3rem; font-weight: 800; color: ${percentageColor}; line-height: 1;">
                            ${percentageIcon} ${overallPercentage}%
                        </div>
                        <div style="margin-top: 12px; font-size: 0.85rem; color: #374151;">
                            <span style="font-weight: 600;">AC Coverage:</span> ${detailedCoverage.acPercentage}% 
                            <span style="margin: 0 8px;">•</span>
                            <span style="font-weight: 600;">BR Coverage:</span> ${detailedCoverage.brPercentage}%
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 1.2rem; color: ${percentageColor}; font-weight: 600; margin-bottom: 8px;">
                            ${detailedCoverage.coveredItems}/${detailedCoverage.totalItems} Items Covered
                        </div>
                        <button style="background: ${percentageColor}; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.85rem;">
                            View Details →
                        </button>
                    </div>
                </div>
                <div class="coverage-progress-bar" style="margin-top: 15px; background: #e5e7eb; height: 12px; border-radius: 6px; overflow: hidden;">
                    <div style="width: ${overallPercentage}%; height: 100%; background: ${percentageColor}; transition: width 0.5s ease;"></div>
                </div>
            </div>
            
            <div id="coverageDetailsPanel" style="display: none; grid-column: 1 / -1; background: white; border: 2px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 15px;">
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
                    <div style="background: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                        <div style="font-weight: 600; color: #1e40af; margin-bottom: 8px;">📝 Acceptance Criteria</div>
                        <div style="font-size: 2rem; font-weight: 800; color: #3b82f6;">${detailedCoverage.acPercentage}%</div>
                        <div style="font-size: 0.85rem; color: #374151; margin-top: 5px;">
                            ${detailedCoverage.acCovered}/${detailedCoverage.acTotal} criteria covered
                        </div>
                    </div>
                    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                        <div style="font-weight: 600; color: #92400e; margin-bottom: 8px;">📋 Business Rules</div>
                        <div style="font-size: 2rem; font-weight: 800; color: #f59e0b;">${detailedCoverage.brPercentage}%</div>
                        <div style="font-size: 0.85rem; color: #374151; margin-top: 5px;">
                            ${detailedCoverage.brCovered}/${detailedCoverage.brTotal} rules covered
                        </div>
                    </div>
                </div>
                <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
                    <div style="font-weight: 600; color: #374151; margin-bottom: 10px;">📊 Coverage Breakdown:</div>
                    <ul style="margin: 0; padding-left: 20px; color: #6b7280; font-size: 0.9rem;">
                        <li style="margin-bottom: 5px;">Total Requirements: ${detailedCoverage.totalItems}</li>
                        <li style="margin-bottom: 5px;">Covered by Tests: ${detailedCoverage.coveredItems}</li>
                        <li style="margin-bottom: 5px;">Not Covered: ${detailedCoverage.notCoveredItems}</li>
                        <li style="margin-bottom: 5px;">Total Test Cases: ${stats.totalTestCases}</li>
                    </ul>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-number">${stats.totalTestCases}</div>
                <div class="stat-label">Total Test Cases</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.positiveTests}</div>
                <div class="stat-label">Positive Scenarios</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.negativeTests}</div>
                <div class="stat-label">Negative/Error Tests</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.validationTests}</div>
                <div class="stat-label">Validation Tests</div>
            </div>
        `;
    }
}

/**
 * Analyze criteria coverage
 */
function analyzeCriteriaCoverage(criteriaLines, testCases) {
    let html = '';
    let coveredCount = 0;
    let notCoveredCount = 0;
    
    criteriaLines.forEach((criteria, index) => {
        if (!criteria.trim()) return;
        
        const matchingTests = testCases.filter(tc => {
            const searchText = criteria.toLowerCase();
            const tcName = tc.testScenario.toLowerCase();
            const tcSteps = tc.testSteps.toLowerCase();
            const tcExpected = tc.expectedResult.toLowerCase();
            
            // Extract key terms from criteria
            const keywords = extractKeywords(criteria);
            
            // Check if test case covers this criteria
            return keywords.some(keyword => 
                tcName.includes(keyword) || 
                tcSteps.includes(keyword) || 
                tcExpected.includes(keyword)
            );
        });
        
        if (matchingTests.length > 0) {
            coveredCount++;
        } else {
            notCoveredCount++;
        }
        
        const itemStyle = matchingTests.length > 0 
            ? 'background: #d1fae5; border-left: 4px solid #10b981;' 
            : 'background: #fee2e2; border-left: 4px solid #ef4444;';
        
        html += `
            <div class="ac-item" style="margin-bottom: 15px; padding: 15px; ${itemStyle} border-radius: 8px;">
                <div class="ac-item-header" style="font-weight: 600; margin-bottom: 10px; color: #1f2937;">
                    ${matchingTests.length > 0 ? '✅' : '❌'} <strong>AC ${index + 1}:</strong> ${criteria}
                </div>
                <div class="ac-item-coverage">
                    ${matchingTests.length > 0 ? `
                        <div style="color: #065f46; font-weight: 600; margin-bottom: 8px;">
                            ✓ Covered by ${matchingTests.length} test case${matchingTests.length > 1 ? 's' : ''}:
                        </div>
                        <ul style="margin: 0; padding-left: 20px; color: #374151;">
                            ${matchingTests.map(tc => `<li style="margin-bottom: 5px;"><strong>${tc.testCaseId}:</strong> ${tc.testScenario}</li>`).join('')}
                        </ul>
                    ` : `
                        <div style="color: #991b1b; font-weight: 600; padding: 10px; background: rgba(255,255,255,0.5); border-radius: 6px;">
                            ❌ <strong>Not Covered</strong> - No test case found for this acceptance criteria
                            <div style="margin-top: 8px; font-weight: normal; font-size: 0.9rem; color: #6b7280;">
                                💡 Recommendation: Add test case(s) to validate this specific requirement
                            </div>
                        </div>
                    `}
                </div>
            </div>
        `;
    });
    
    return {
        html: html || '<p>No specific criteria to analyze.</p>',
        coveredCount: coveredCount,
        notCoveredCount: notCoveredCount
    };
}

/**
 * Extract keywords from criteria text
 */
function extractKeywords(text) {
    // Remove common words and extract meaningful keywords
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'that', 'this', 'these', 'those', 'when', 'where', 'which', 'who', 'whom', 'whose', 'why', 'how'];
    
    const words = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3 && !commonWords.includes(word));
    
    return [...new Set(words)];
}

/**
 * Calculate detailed coverage percentage based on AC and BR
 */
function calculateDetailedCoverage(testCases) {
    const defaultResult = {
        overallPercentage: 0,
        acPercentage: 0,
        brPercentage: 0,
        acCovered: 0,
        acTotal: 0,
        brCovered: 0,
        brTotal: 0,
        totalItems: 0,
        coveredItems: 0,
        notCoveredItems: 0,
        hasData: false
    };
    
    if (!originalRequestData) {
        console.log('Coverage: No originalRequestData available');
        return defaultResult;
    }
    
    const ac = originalRequestData.acceptanceCriteria || '';
    const br = originalRequestData.businessRules || '';
    
    // Check if AC/BR contain actual data (not "No acceptance criteria" messages)
    const hasValidAC = ac && ac.length > 20 && !ac.toLowerCase().includes('no acceptance criteria');
    const hasValidBR = br && br.length > 20 && !br.toLowerCase().includes('no business rule');
    
    if (!hasValidAC && !hasValidBR) {
        console.log('Coverage: No valid AC or BR data found');
        return defaultResult;
    }
    
    // Split AC and BR into individual items
    const acLines = ac.split(/\n|\.(?=\s|$)/)
        .map(line => line.trim())
        .filter(line => line.length > 10 && !line.toLowerCase().startsWith('acceptance criteria'));
    
    const brLines = br.split(/\n|\.(?=\s|$)/)
        .map(line => line.trim())
        .filter(line => line.length > 10 && !line.toLowerCase().startsWith('business rule'));
    
    const acTotal = acLines.length;
    const brTotal = brLines.length;
    const totalItems = acTotal + brTotal;
    
    if (totalItems === 0) {
        console.log('Coverage: No AC/BR items found after splitting');
        return defaultResult;
    }
    
    // Calculate AC coverage
    let acCovered = 0;
    acLines.forEach(criteria => {
        const keywords = extractKeywords(criteria);
        const isCovered = testCases.some(tc => {
            const tcText = `${tc.testScenario} ${tc.testSteps} ${tc.expectedResult}`.toLowerCase();
            return keywords.some(keyword => tcText.includes(keyword));
        });
        if (isCovered) acCovered++;
    });
    
    // Calculate BR coverage
    let brCovered = 0;
    brLines.forEach(rule => {
        const keywords = extractKeywords(rule);
        const isCovered = testCases.some(tc => {
            const tcText = `${tc.testScenario} ${tc.testSteps} ${tc.expectedResult}`.toLowerCase();
            return keywords.some(keyword => tcText.includes(keyword));
        });
        if (isCovered) brCovered++;
    });
    
    const coveredItems = acCovered + brCovered;
    const notCoveredItems = totalItems - coveredItems;
    
    const acPercentage = acTotal > 0 ? Math.round((acCovered / acTotal) * 100) : 0;
    const brPercentage = brTotal > 0 ? Math.round((brCovered / brTotal) * 100) : 0;
    const overallPercentage = Math.round((coveredItems / totalItems) * 100);
    
    console.log('Coverage calculated:', {
        overallPercentage,
        acPercentage,
        brPercentage,
        acCovered,
        acTotal,
        brCovered,
        brTotal,
        coveredItems,
        totalItems
    });
    
    return {
        overallPercentage,
        acPercentage,
        brPercentage,
        acCovered,
        acTotal,
        brCovered,
        brTotal,
        totalItems,
        coveredItems,
        notCoveredItems,
        hasData: true
    };
}

/**
 * Toggle coverage details panel
 */
function toggleCoverageDetails() {
    const panel = document.getElementById('coverageDetailsPanel');
    if (panel) {
        if (panel.style.display === 'none') {
            panel.style.display = 'block';
        } else {
            panel.style.display = 'none';
        }
    }
}

/**
 * Calculate coverage statistics
 */
function calculateCoverageStats(testCases) {
    if (!testCases || !Array.isArray(testCases)) {
        return {
            totalTestCases: 0,
            positiveTests: 0,
            negativeTests: 0,
            validationTests: 0
        };
    }
    
    return {
        totalTestCases: testCases.length,
        positiveTests: testCases.filter(tc => tc.testType === 'Positive').length,
        negativeTests: testCases.filter(tc => ['Negative', 'Error'].includes(tc.testType)).length,
        validationTests: testCases.filter(tc => tc.testType === 'Validation').length
    };
}

/**
 * Toggle coverage display
 */
function handleToggleCoverage() {
    const coverageContent = document.querySelector('.coverage-content');
    const toggleBtn = document.getElementById('toggleCoverageBtn');
    
    if (coverageContent.style.display === 'none') {
        coverageContent.style.display = 'grid';
        toggleBtn.textContent = 'Hide';
    } else {
        coverageContent.style.display = 'none';
        toggleBtn.textContent = 'Show';
    }
}

// Initialize validate button
document.addEventListener('DOMContentLoaded', function() {
    const validateBtn = document.getElementById('validateBtn');
    const toggleCoverageBtn = document.getElementById('toggleCoverageBtn');
    const reviewBtn = document.getElementById('reviewBtn');
    const toggleReviewBtn = document.getElementById('toggleReviewBtn');
    const submitReviewBtn = document.getElementById('submitReviewBtn');
    const cancelReviewBtn = document.getElementById('cancelReviewBtn');
    
    if (validateBtn) {
        validateBtn.addEventListener('click', handleValidateCoverage);
    }
    
    if (toggleCoverageBtn) {
        toggleCoverageBtn.addEventListener('click', handleToggleCoverage);
    }
    
    if (reviewBtn) {
        reviewBtn.addEventListener('click', handleShowReview);
    }
    
    if (toggleReviewBtn) {
        toggleReviewBtn.addEventListener('click', handleToggleReview);
    }
    
    if (submitReviewBtn) {
        submitReviewBtn.addEventListener('click', handleSubmitReview);
    }
    
    if (cancelReviewBtn) {
        cancelReviewBtn.addEventListener('click', handleCancelReview);
    }
    
    // Add click listeners to radio options
    const radioOptions = document.querySelectorAll('.radio-option');
    radioOptions.forEach(option => {
        option.addEventListener('click', function() {
            const radio = this.querySelector('input[type="radio"]');
            if (radio) {
                radio.checked = true;
            }
        });
    });
    
    // Initialize chat welcome time
    const welcomeTime = document.getElementById('welcomeTime');
    if (welcomeTime) {
        welcomeTime.textContent = getCurrentTime();
    }
    
    // Add suggested question handlers
    const suggestionChips = document.querySelectorAll('.suggestion-chip');
    suggestionChips.forEach(chip => {
        chip.addEventListener('click', function() {
            const question = this.getAttribute('data-question');
            if (question && chatInput) {
                chatInput.value = question;
                chatInput.style.height = 'auto';
                chatInput.style.height = chatInput.scrollHeight + 'px';
                handleSendMessage();
            }
        });
    });
    
    // Auto-resize textarea
    if (chatInput) {
        chatInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 80) + 'px';
        });
    }
});

/**
 * Show review section when review button is clicked
 */
function handleShowReview() {
    console.log('handleShowReview called');
    console.log('currentResponse:', window.currentResponse);
    console.log('currentTestCases:', window.currentTestCases);
    
    const reviewSection = document.getElementById('reviewSection');
    if (!reviewSection) {
        console.error('reviewSection element not found');
        return;
    }
    
    // Check if we have test cases from single document format
    const hasSingleTestCases = (window.currentResponse && window.currentResponse.testCases && window.currentResponse.testCases.length > 0) ||
                               (window.currentTestCases && window.currentTestCases.length > 0);
    
    // Check if we have test cases from multi-document format
    const hasMultiDocumentTestCases = window.currentResponse && 
                                      window.currentResponse.documentResults && 
                                      window.currentResponse.documentResults.length > 0 &&
                                      window.currentResponse.documentResults.some(doc => doc.success && doc.testCaseResponse && doc.testCaseResponse.testCases && doc.testCaseResponse.testCases.length > 0);
    
    console.log('Has single test cases:', hasSingleTestCases);
    console.log('Has multi-document test cases:', hasMultiDocumentTestCases);
    
    if (!hasSingleTestCases && !hasMultiDocumentTestCases) {
        showNotification('Please generate test cases first before reviewing.', 'warning');
        return;
    }
    
    // Show the review section
    reviewSection.style.display = 'block';
    
    // Also show the review content by default
    const reviewContent = document.getElementById('reviewContent');
    const toggleBtn = document.getElementById('toggleReviewBtn');
    if (reviewContent && toggleBtn) {
        reviewContent.style.display = 'block';
        toggleBtn.textContent = 'Hide Review Panel';
    }
    
    // Scroll to the review section
    reviewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Toggle review content visibility
 */
function handleToggleReview() {
    const reviewContent = document.getElementById('reviewContent');
    const toggleBtn = document.getElementById('toggleReviewBtn');
    
    if (!reviewContent || !toggleBtn) {
        console.error('Review elements not found:', { reviewContent, toggleBtn });
        return;
    }
    
    if (reviewContent.style.display === 'none' || reviewContent.style.display === '') {
        reviewContent.style.display = 'block';
        toggleBtn.textContent = 'Hide Review Panel';
    } else {
        reviewContent.style.display = 'none';
        toggleBtn.textContent = 'Show Review Panel';
    }
}

/**
 * Submit review
 */
async function handleSubmitReview() {
    const reviewerName = document.getElementById('reviewerName').value.trim();
    const creatorEmail = document.getElementById('creatorEmail').value.trim();
    const statusRadio = document.querySelector('input[name="reviewStatus"]:checked');
    const comments = document.getElementById('reviewComments').value.trim();
    
    // Validation
    if (!reviewerName) {
        showNotification('Please enter your name.', 'warning');
        return;
    }
    
    if (!creatorEmail) {
        showNotification('Please enter the test creator\'s email.', 'warning');
        return;
    }
    
    if (!validateEmail(creatorEmail)) {
        showNotification('Please enter a valid email address.', 'warning');
        return;
    }
    
    if (!statusRadio) {
        showNotification('Please select a review status.', 'warning');
        return;
    }
    
    if (!comments) {
        showNotification('Please provide review comments or queries.', 'warning');
        return;
    }
    
    const reviewStatus = statusRadio.value;
    
    // Show confirmation before sending
    if (!confirm(`Send review notification email to ${creatorEmail}?`)) {
        return;
    }
    
    // Show loading
    showLoading(true);
    
    try {
        // Get test case count from either single or multi-document source
        let testCases = [];
        
        // Check for multi-document format
        if (window.currentResponse && window.currentResponse.documentResults && window.currentResponse.documentResults.length > 0) {
            window.currentResponse.documentResults.forEach(doc => {
                if (doc.success && doc.testCaseResponse && doc.testCaseResponse.testCases) {
                    testCases = testCases.concat(doc.testCaseResponse.testCases);
                }
            });
        } 
        // Check for single document format
        else if (window.currentResponse && window.currentResponse.testCases) {
            testCases = window.currentResponse.testCases;
        } 
        // Check for window.currentTestCases
        else if (window.currentTestCases) {
            testCases = window.currentTestCases;
        }
        
        const testCaseCount = testCases.length;
        
        const response = await fetch('/testmate/api/testcases/review/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                reviewerName: reviewerName,
                creatorEmail: creatorEmail,
                status: reviewStatus,
                comments: comments,
                testCaseCount: testCaseCount
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification('✅ ' + result.message, 'success');
            
            // Generate preview
            generateReviewPreview(reviewerName, creatorEmail, reviewStatus, comments);
            
            // Clear form after 3 seconds
            setTimeout(() => {
                handleCancelReview();
            }, 3000);
        } else {
            showNotification('❌ ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error sending review notification:', error);
        showNotification('❌ Network error. Please check your connection and try again.', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Cancel review and reset form
 */
function handleCancelReview() {
    document.getElementById('reviewerName').value = '';
    document.getElementById('creatorEmail').value = '';
    document.getElementById('reviewComments').value = '';
    
    const statusRadios = document.querySelectorAll('input[name="reviewStatus"]');
    statusRadios.forEach(radio => radio.checked = false);
    
    const reviewPreview = document.getElementById('reviewPreview');
    if (reviewPreview) {
        reviewPreview.innerHTML = '';
        reviewPreview.style.display = 'none';
    }
    
    showNotification('Review form cleared.', 'info');
}

/**
 * Generate review preview
 */
function generateReviewPreview(reviewerName, creatorEmail, status, comments) {
    const previewDiv = document.getElementById('reviewPreview');
    if (!previewDiv) return;
    
    const statusText = {
        'approved': '✅ Approved',
        'changes-requested': '⚠️ Changes Requested',
        'rejected': '❌ Rejected'
    }[status];
    
    const statusColor = {
        'approved': '#10b981',
        'changes-requested': '#f59e0b',
        'rejected': '#ef4444'
    }[status];
    
    const testCasesCount = currentResponse && currentResponse.testCases ? currentResponse.testCases.length : 0;
    const reviewDateTime = getCurrentDateTime();
    
    previewDiv.innerHTML = `
        <h4>📧 Review Notification Preview</h4>
        <div class="preview-content">
            <div class="preview-item">
                <strong>To:</strong> ${creatorEmail}
            </div>
            <div class="preview-item">
                <strong>From:</strong> ${reviewerName} (Test Lead/Manager)
            </div>
            <div class="preview-item">
                <strong>Subject:</strong> Test Cases Review - ${statusText}
            </div>
            <div class="preview-item">
                <strong>Date & Time:</strong> ${reviewDateTime}
            </div>
            <div class="preview-item">
                <strong>Status:</strong> <span style="color: ${statusColor}; font-weight: 600;">${statusText}</span>
            </div>
            <div class="preview-item">
                <strong>Test Cases Reviewed:</strong> ${testCasesCount} test case(s)
            </div>
            <div class="preview-item">
                <strong>Review Comments:</strong>
                <div style="margin-top: 8px; padding: 12px; background: white; border-left: 3px solid ${statusColor}; border-radius: 4px;">
                    ${comments.replace(/\n/g, '<br>')}
                </div>
            </div>
            <div class="preview-item" style="background: #fffbeb; border-left: 3px solid #f59e0b;">
                <strong>📝 Note:</strong> This is a preview of the notification that would be sent to the test creator. 
                In production, this would be sent via email with the complete test case details attached.
            </div>
        </div>
    `;
    
    previewDiv.style.display = 'block';
    previewDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Validate email format
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Show notification message
 */
function showNotification(message, type = 'info') {
    const colors = {
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
    };
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        max-width: 400px;
        font-weight: 500;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}
/**
 * Setup test case search and filter functionality
 */
function setupTestCaseFilters() {
    const searchInput = document.getElementById('testCaseSearchInput');
    const coverageFilter = document.getElementById('coverageFilter');
    const typeFilter = document.getElementById('typeFilter');
    const sortBy = document.getElementById('testCaseSortBy');
    const clearFiltersBtn = document.getElementById('clearTestCaseFilters');
    
    // Remove existing event listeners
    if (searchInput) {
        const newSearchInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newSearchInput, searchInput);
        newSearchInput.addEventListener('input', applyTestCaseFilters);
    }
    
    if (coverageFilter) {
        const newCoverageFilter = coverageFilter.cloneNode(true);
        coverageFilter.parentNode.replaceChild(newCoverageFilter, coverageFilter);
        newCoverageFilter.addEventListener('change', applyTestCaseFilters);
    }
    
    if (typeFilter) {
        const newTypeFilter = typeFilter.cloneNode(true);
        typeFilter.parentNode.replaceChild(newTypeFilter, typeFilter);
        newTypeFilter.addEventListener('change', applyTestCaseFilters);
    }
    
    if (sortBy) {
        const newSortBy = sortBy.cloneNode(true);
        sortBy.parentNode.replaceChild(newSortBy, sortBy);
        newSortBy.addEventListener('change', applyTestCaseFilters);
    }
    
    if (clearFiltersBtn) {
        clearFiltersBtn.onclick = clearTestCaseFilters;
    }
}

/**
 * Apply test case filters
 */
function applyTestCaseFilters() {
    const searchInput = document.getElementById('testCaseSearchInput');
    const coverageFilter = document.getElementById('coverageFilter');
    const typeFilter = document.getElementById('typeFilter');
    const sortBy = document.getElementById('testCaseSortBy');
    
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const coverageValue = coverageFilter ? coverageFilter.value : '';
    const typeValue = typeFilter ? typeFilter.value : '';
    const sortValue = sortBy ? sortBy.value : 'default';
    
    // Filter test cases
    let filteredTestCases = allTestCases.filter(tc => {
        // Search filter
        const matchesSearch = !searchTerm ||
            (tc.scenario && tc.scenario.toLowerCase().includes(searchTerm)) ||
            (tc.description && tc.description.toLowerCase().includes(searchTerm)) ||
            (tc.steps && tc.steps.some(s => s.toLowerCase().includes(searchTerm)));
        
        // Coverage filter
        const matchesCoverage = !coverageValue ||
            (coverageValue === 'covered' && tc.covered) ||
            (coverageValue === 'not-covered' && !tc.covered);
        
        // Type filter (based on scenario name keywords)
        let matchesType = !typeValue;
        if (typeValue && tc.scenario) {
            const scenarioLower = tc.scenario.toLowerCase();
            if (typeValue === 'positive') matchesType = !scenarioLower.includes('invalid') && !scenarioLower.includes('error') && !scenarioLower.includes('negative');
            else if (typeValue === 'negative') matchesType = scenarioLower.includes('invalid') || scenarioLower.includes('error') || scenarioLower.includes('negative');
            else if (typeValue === 'edge') matchesType = scenarioLower.includes('edge') || scenarioLower.includes('boundary') || scenarioLower.includes('limit');
        }
        
        return matchesSearch && matchesCoverage && matchesType;
    });
    
    // Sort test cases
    if (sortValue !== 'default') {
        filteredTestCases = sortTestCases(filteredTestCases, sortValue);
    }
    
    // Group by document
    const filteredDocResults = currentDocumentResults.map(docResult => {
        if (!docResult.success || !docResult.testCaseResponse) return docResult;
        
        const filteredForDoc = filteredTestCases.filter(tc => tc.documentName === docResult.fileName);
        return {
            ...docResult,
            testCaseResponse: {
                ...docResult.testCaseResponse,
                testCases: filteredForDoc,
                totalTestCases: filteredForDoc.length
            }
        };
    });
    
    // Re-render
    renderFilteredTestCases(filteredDocResults);
    
    // Update count
    const filteredCount = document.getElementById('testCaseFilteredCount');
    if (filteredCount) {
        filteredCount.textContent = `Showing ${filteredTestCases.length} test case${filteredTestCases.length !== 1 ? 's' : ''}`;
    }
}

/**
 * Sort test cases
 */
function sortTestCases(testCases, sortBy) {
    return [...testCases].sort((a, b) => {
        switch (sortBy) {
            case 'scenario':
                return (a.scenario || '').localeCompare(b.scenario || '');
            case 'coverage':
                return (b.covered ? 1 : 0) - (a.covered ? 1 : 0);
            case 'type':
                const getType = (tc) => {
                    const s = (tc.scenario || '').toLowerCase();
                    if (s.includes('invalid') || s.includes('error')) return 'negative';
                    if (s.includes('edge') || s.includes('boundary')) return 'edge';
                    return 'positive';
                };
                return getType(a).localeCompare(getType(b));
            default:
                return 0;
        }
    });
}

/**
 * Clear test case filters
 */
function clearTestCaseFilters() {
    const searchInput = document.getElementById('testCaseSearchInput');
    const coverageFilter = document.getElementById('coverageFilter');
    const typeFilter = document.getElementById('typeFilter');
    const sortBy = document.getElementById('testCaseSortBy');
    
    if (searchInput) searchInput.value = '';
    if (coverageFilter) coverageFilter.value = '';
    if (typeFilter) typeFilter.value = '';
    if (sortBy) sortBy.value = 'default';
    
    applyTestCaseFilters();
}

/**
 * Download test cases as Excel
 */
function downloadExcel() {
    if (!allTestCases || allTestCases.length === 0) {
        alert('No test cases available to download');
        return;
    }
    
    // Create Excel-compatible HTML table
    let excelContent = '<html xmlns:o=\"urn:schemas-microsoft-com:office:office\" xmlns:x=\"urn:schemas-microsoft-com:office:excel\" xmlns=\"http://www.w3.org/TR/REC-html40\">';
    excelContent += '<head><meta charset=\"utf-8\"><style>table {border-collapse: collapse;} th, td {border: 1px solid black; padding: 8px; text-align: left;}</style></head>';
    excelContent += '<body><table>';
    
    // Header
    excelContent += '<tr><th>Document</th><th>Test Case ID</th><th>Scenario</th><th>Description</th><th>Steps</th><th>Expected Result</th><th>Coverage Status</th></tr>';
    
    // Rows
    allTestCases.forEach((tc, index) => {
        const steps = Array.isArray(tc.steps) ? tc.steps.join(' | ') : tc.steps;
        excelContent += `<tr>
            <td>${escapeHtml(tc.documentName || 'N/A')}</td>
            <td>TC${(index + 1).toString().padStart(3, '0')}</td>
            <td>${escapeHtml(tc.scenario || 'N/A')}</td>
            <td>${escapeHtml(tc.description || 'N/A')}</td>
            <td>${escapeHtml(steps || 'N/A')}</td>
            <td>${escapeHtml(tc.expectedResult || 'N/A')}</td>
            <td>${tc.covered ? 'Covered' : 'Not Covered'}</td>
        </tr>`;
    });
    
    excelContent += '</table></body></html>';
    
    // Create blob and download
    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-cases-${new Date().toISOString().split('T')[0]}.xls`;
    a.click();
    window.URL.revokeObjectURL(url);
}

/**
 * Download test cases as PDF (simplified HTML version)
 */
function downloadPdf() {
    if (!allTestCases || allTestCases.length === 0) {
        alert('No test cases available to download');
        return;
    }
    
    // Create printable HTML
    let pdfContent = '<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>Test Cases Report</title>';
    pdfContent += '<style>body{font-family:Arial,sans-serif;margin:20px;}h1{color:#2563eb;}table{width:100%;border-collapse:collapse;margin-top:20px;}th,td{border:1px solid #ddd;padding:8px;text-align:left;}th{background:#2563eb;color:white;}.covered{color:green;font-weight:bold;}.not-covered{color:red;font-weight:bold;}</style>';
    pdfContent += '</head><body>';
    pdfContent += '<h1>Test Cases Report</h1>';
    pdfContent += `<p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>`;
    pdfContent += `<p><strong>Total Test Cases:</strong> ${allTestCases.length}</p>`;
    pdfContent += '<table><tr><th>ID</th><th>Document</th><th>Scenario</th><th>Description</th><th>Steps</th><th>Expected Result</th><th>Coverage</th></tr>';
    
    allTestCases.forEach((tc, index) => {
        const steps = Array.isArray(tc.steps) ? tc.steps.map((s, i) => `${i + 1}. ${s}`).join('<br>') : tc.steps;
        const coverageClass = tc.covered ? 'covered' : 'not-covered';
        const coverageText = tc.covered ? '✓ Covered' : '✗ Not Covered';
        
        pdfContent += `<tr>
            <td>TC${(index + 1).toString().padStart(3, '0')}</td>
            <td>${escapeHtml(tc.documentName || 'N/A')}</td>
            <td>${escapeHtml(tc.scenario || 'N/A')}</td>
            <td>${escapeHtml(tc.description || 'N/A')}</td>
            <td>${steps || 'N/A'}</td>
            <td>${escapeHtml(tc.expectedResult || 'N/A')}</td>
            <td class="${coverageClass}">${coverageText}</td>
        </tr>`;
    });
    
    pdfContent += '</table></body></html>';
    
    // Open in new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(pdfContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Trigger print dialog
    setTimeout(() => {
        printWindow.print();
    }, 250);
}