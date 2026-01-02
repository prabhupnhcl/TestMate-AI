/**
 * Draggable Testing Facts Widget
 * Shows random testing facts every 15 seconds
 */

// Array of testing facts
const testingFacts = [
    "Did you know? The first computer bug was an actual bug - a moth found in a Harvard Mark II computer in 1947! 🦋",
    "Quality Tip: Writing test cases before coding (TDD) can reduce bugs by up to 40-80%! 🎯",
    "Fun Fact: NASA's software for the Mars Rover has 99.9% test coverage. Aim high! 🚀",
    "Testing Wisdom: A bug found in production costs 10-100x more to fix than one found during testing! 💰",
    "Did you know? The average software has 15-50 errors per 1000 lines of code. Test thoroughly! 🐛",
    "Best Practice: The 80/20 rule - 80% of bugs are found in 20% of modules. Focus your testing! 📊",
    "Industry Fact: Companies spend 80% of their development costs on identifying and correcting defects! 💡",
    "Testing Truth: Exhaustive testing is impossible - we can only test a subset of all possible inputs! ♾️",
    "Quality Insight: Automated testing can execute thousands of test cases in minutes vs. days manually! ⚡",
    "Did you know? Exploratory testing finds 65% more bugs than scripted testing in the same time! 🔍",
    "Testing Fact: The cost of poor quality software in the US alone exceeds $2 trillion annually! 📈",
    "Pro Tip: Boundary value analysis finds 80% of bugs with 20% of test cases! 🎲",
    "Industry Standard: Most successful companies maintain at least 70% test automation coverage! 🤖",
    "Quality Metric: High-performing teams spend 50% less time on unplanned work and rework! ✨",
    "Testing Wisdom: Negative testing is as important as positive testing - test what shouldn't happen! ⚖️",
    "Did you know? Peer reviews catch 60% of defects before testing even begins! 👥",
    "Fun Fact: Google runs over 4 million tests per day across all their products! 🌐",
    "Quality Rule: Fix bugs immediately - delayed fixes take 24x longer on average! ⏰",
    "Testing Fact: 70% of software failures are due to requirement and design errors, not coding! 📋",
    "Industry Insight: Continuous testing can reduce release cycles from months to days! 🔄",
    "Pro Tip: Flaky tests are worse than no tests - they erode confidence in your test suite! 🎭",
    "Quality Fact: Well-tested code is typically 3-10x more reliable than untested code! 🛡️",
    "Did you know? The Pentium FDIV bug cost Intel $475 million - test your calculations! 🧮",
    "Testing Truth: You can't test quality into a product - it must be built in from the start! 🏗️",
    "Industry Standard: Top teams achieve 90%+ pass rates on their automated test suites! 🏆"
];

// Widget state
let currentFactIndex = 0;
let factInterval = null;
let isDragging = false;
let currentX = 0;
let currentY = 0;
let initialX = 0;
let initialY = 0;
let xOffset = 0;
let yOffset = 0;

/**
 * Initialize the fact widget
 */
function initFactWidget() {
    const factWidget = document.getElementById('factWidget');
    const factText = document.getElementById('factText');
    const factNextBtn = document.getElementById('factNextBtn');
    const factCloseBtn = document.getElementById('factCloseBtn');
    const factMinimizeBtn = document.getElementById('factMinimizeBtn');
    const factWidgetHeader = document.getElementById('factWidgetHeader');
    const factProgress = document.getElementById('factProgress');
    const factContent = document.getElementById('factContent');
    const factFooter = document.getElementById('factFooter');
    
    if (!factWidget || !factText) {
        console.warn('Fact widget elements not found');
        return;
    }
    
    console.log('Testing Facts Widget initialized');
    
    let isMinimized = false;
    
    // Show first fact
    showRandomFact();
    
    // Start auto-rotation every 15 seconds
    startFactRotation();
    
    // Minimize/Expand button click
    if (factMinimizeBtn) {
        factMinimizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            isMinimized = !isMinimized;
            factWidget.classList.toggle('minimized');
            
            // Update icon
            const svg = factMinimizeBtn.querySelector('svg');
            if (isMinimized) {
                svg.innerHTML = '<polyline points="18 15 12 9 6 15" stroke-width="2"></polyline>';
                factMinimizeBtn.title = 'Expand';
            } else {
                svg.innerHTML = '<line x1="5" y1="12" x2="19" y2="12" stroke-width="2"></line>';
                factMinimizeBtn.title = 'Minimize';
            }
        });
    }
    
    // Next button click
    if (factNextBtn) {
        factNextBtn.addEventListener('click', () => {
            resetProgressBar();
            showRandomFact();
            restartFactRotation();
        });
    }
    
    // Close button click
    if (factCloseBtn) {
        factCloseBtn.addEventListener('click', () => {
            factWidget.classList.add('hidden');
            stopFactRotation();
        });
    }
    
    // Make widget draggable
    if (factWidgetHeader) {
        factWidgetHeader.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);
        
        // Touch events for mobile
        factWidgetHeader.addEventListener('touchstart', dragStart);
        document.addEventListener('touchmove', drag);
        document.addEventListener('touchend', dragEnd);
    }
    
    /**
     * Show a random fact
     */
    function showRandomFact() {
        // Get random fact different from current
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * testingFacts.length);
        } while (newIndex === currentFactIndex && testingFacts.length > 1);
        
        currentFactIndex = newIndex;
        
        // Animate text change
        factText.style.animation = 'none';
        setTimeout(() => {
            factText.textContent = testingFacts[currentFactIndex];
            factText.style.animation = 'factFadeIn 0.5s ease-out';
        }, 10);
    }
    
    /**
     * Start fact rotation timer
     */
    function startFactRotation() {
        factInterval = setInterval(() => {
            resetProgressBar();
            showRandomFact();
        }, 15000); // 15 seconds
    }
    
    /**
     * Stop fact rotation
     */
    function stopFactRotation() {
        if (factInterval) {
            clearInterval(factInterval);
            factInterval = null;
        }
    }
    
    /**
     * Restart fact rotation
     */
    function restartFactRotation() {
        stopFactRotation();
        startFactRotation();
    }
    
    /**
     * Reset progress bar animation
     */
    function resetProgressBar() {
        const progressBar = factProgress.querySelector('::before') || factProgress;
        factProgress.style.animation = 'none';
        setTimeout(() => {
            factProgress.style.animation = '';
        }, 10);
    }
    
    /**
     * Drag start handler
     */
    function dragStart(e) {
        if (e.type === 'touchstart') {
            initialX = e.touches[0].clientX - xOffset;
            initialY = e.touches[0].clientY - yOffset;
        } else {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
        }
        
        if (e.target === factWidgetHeader || factWidgetHeader.contains(e.target)) {
            // Don't start drag if clicking close or minimize button
            if (!e.target.classList.contains('fact-close-btn') && 
                !e.target.classList.contains('fact-minimize-btn') &&
                !e.target.closest('.fact-close-btn') &&
                !e.target.closest('.fact-minimize-btn')) {
                isDragging = true;
                factWidget.classList.add('dragging');
            }
        }
    }
    
    /**
     * Drag handler
     */
    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            
            if (e.type === 'touchmove') {
                currentX = e.touches[0].clientX - initialX;
                currentY = e.touches[0].clientY - initialY;
            } else {
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
            }
            
            xOffset = currentX;
            yOffset = currentY;
            
            setTranslate(currentX, currentY, factWidget);
        }
    }
    
    /**
     * Drag end handler
     */
    function dragEnd(e) {
        if (isDragging) {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
            factWidget.classList.remove('dragging');
        }
    }
    
    /**
     * Set element position
     */
    function setTranslate(xPos, yPos, el) {
        el.style.transform = `translate(${xPos}px, ${yPos}px)`;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFactWidget);
} else {
    initFactWidget();
}
