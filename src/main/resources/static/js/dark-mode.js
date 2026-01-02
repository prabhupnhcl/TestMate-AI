/**
 * Dark Mode Toggle Functionality
 */

// Initialize dark mode on page load
function initDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const sunIcon = darkModeToggle.querySelector('.sun-icon');
    const moonIcon = darkModeToggle.querySelector('.moon-icon');
    
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateIcons(savedTheme, sunIcon, moonIcon);
    
    // Toggle dark mode on button click
    darkModeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateIcons(newTheme, sunIcon, moonIcon);
        
        // Show toast notification
        if (typeof showToast === 'function') {
            showToast(
                'Theme Changed',
                `Switched to ${newTheme} mode`,
                'info'
            );
        }
    });
}

// Update icon visibility based on theme
function updateIcons(theme, sunIcon, moonIcon) {
    if (theme === 'dark') {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    } else {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDarkMode);
} else {
    initDarkMode();
}
