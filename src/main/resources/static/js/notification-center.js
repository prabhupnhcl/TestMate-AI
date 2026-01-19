/**
 * Notification Center and Toast System
 */

// Notification storage
let notifications = [];
let notificationIdCounter = 0;

// Initialize notification center
function initNotificationCenter() {
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationCenter = document.getElementById('notificationCenter');
    const closeBtn = document.getElementById('closeNotifications');
    const clearAllBtn = document.getElementById('clearAllNotifications');
    
    // Load saved notifications from localStorage
    loadNotifications();
    
    // Toggle notification center
    notificationBtn.addEventListener('click', () => {
        const isVisible = notificationCenter.style.display === 'block';
        notificationCenter.style.display = isVisible ? 'none' : 'block';
    });
    
    // Close notification center
    closeBtn.addEventListener('click', () => {
        notificationCenter.style.display = 'none';
    });
    
    // Clear all notifications
    clearAllBtn.addEventListener('click', () => {
        notifications = [];
        updateNotificationUI();
        saveNotifications();
        showToast('Cleared', 'All notifications cleared', 'success');
    });
    
    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!notificationCenter.contains(e.target) && !notificationBtn.contains(e.target)) {
            notificationCenter.style.display = 'none';
        }
    });
    
    // Initial UI update
    updateNotificationUI();
}

// Add notification to center
function addNotification(title, message, type = 'info') {
    const notification = {
        id: notificationIdCounter++,
        title,
        message,
        type,
        timestamp: new Date().toISOString(),
        time: formatTime(new Date())
    };
    
    notifications.unshift(notification);
    
    // Keep only last 50 notifications
    if (notifications.length > 50) {
        notifications = notifications.slice(0, 50);
    }
    
    updateNotificationUI();
    saveNotifications();
}

// Show toast notification
function showToast(title, message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = getToastIcon(type);
    
    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    container.appendChild(toast);
    
    // Also add to notification center
    addNotification(title, message, type);
    
    // Auto remove after duration
    setTimeout(() => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Get icon for toast type
function getToastIcon(type) {
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    return icons[type] || icons.info;
}

// Update notification center UI
function updateNotificationUI() {
    const notificationList = document.getElementById('notificationList');
    const badge = document.getElementById('notificationBadge');
    
    // Update badge
    if (notifications.length > 0) {
        badge.textContent = notifications.length > 99 ? '99+' : notifications.length;
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
    
    // Update list
    if (notifications.length === 0) {
        notificationList.innerHTML = `
            <div class="no-notifications">
                <span class="no-notif-icon">🔔</span>
                <p>No notifications yet</p>
            </div>
        `;
        return;
    }
    
    notificationList.innerHTML = notifications.map(notif => `
        <div class="notification-item ${notif.type}" data-id="${notif.id}">
            <div class="notification-header">
                <div class="notification-title">${notif.title}</div>
                <button class="notification-delete" onclick="deleteNotification(${notif.id})">&times;</button>
            </div>
            <div class="notification-message">${notif.message}</div>
            <div class="notification-time">${notif.time}</div>
        </div>
    `).join('');
}

// Delete single notification
function deleteNotification(id) {
    notifications = notifications.filter(n => n.id !== id);
    updateNotificationUI();
    saveNotifications();
}

// Format time for display
function formatTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
}

// Save notifications to localStorage
function saveNotifications() {
    try {
        localStorage.setItem('notifications', JSON.stringify(notifications));
    } catch (e) {
        console.error('Failed to save notifications:', e);
    }
}

// Load notifications from localStorage
function loadNotifications() {
    try {
        const saved = localStorage.getItem('notifications');
        if (saved) {
            notifications = JSON.parse(saved);
            // Update times
            notifications.forEach(n => {
                n.time = formatTime(new Date(n.timestamp));
            });
            // Find max ID to continue counter
            if (notifications.length > 0) {
                notificationIdCounter = Math.max(...notifications.map(n => n.id)) + 1;
            }
        }
    } catch (e) {
        console.error('Failed to load notifications:', e);
        notifications = [];
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNotificationCenter);
} else {
    initNotificationCenter();
}

// Welcome notification disabled - users can use the app without interruption

// Expose functions globally for use in other scripts
window.showToast = showToast;
window.addNotification = addNotification;
window.deleteNotification = deleteNotification;
