/**
 * Notes Module - Personal notepad with auto-save
 */

// Initialize Notes functionality
function initNotes() {
    const notesTextarea = document.getElementById('notesTextarea');
    const saveNoteBtn = document.getElementById('saveNoteBtn');
    const clearNoteBtn = document.getElementById('clearNoteBtn');
    const copyNoteBtn = document.getElementById('copyNoteBtn');
    const downloadNoteBtn = document.getElementById('downloadNoteBtn');
    const noteStatus = document.getElementById('noteStatus');
    const charCount = document.getElementById('charCount');
    const wordCount = document.getElementById('wordCount');
    const lineCount = document.getElementById('lineCount');
    
    if (!notesTextarea) {
        console.warn('Notes elements not found');
        return;
    }
    
    // Load saved notes on init
    loadNotes();
    
    // Auto-save on typing (debounced)
    let saveTimeout;
    notesTextarea.addEventListener('input', () => {
        updateStats();
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            saveNotes();
        }, 1000); // Auto-save after 1 second of no typing
    });
    
    // Manual save button
    if (saveNoteBtn) {
        saveNoteBtn.addEventListener('click', () => {
            saveNotes();
            showStatus('✓ Notes saved!', 'success');
        });
    }
    
    // Clear notes
    if (clearNoteBtn) {
        clearNoteBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all notes? This cannot be undone.')) {
                notesTextarea.value = '';
                saveNotes();
                updateStats();
                showStatus('Notes cleared', 'info');
            }
        });
    }
    
    // Copy to clipboard
    if (copyNoteBtn) {
        copyNoteBtn.addEventListener('click', () => {
            notesTextarea.select();
            document.execCommand('copy');
            showStatus('✓ Copied to clipboard!', 'success');
        });
    }
    
    // Download as text file
    if (downloadNoteBtn) {
        downloadNoteBtn.addEventListener('click', () => {
            const text = notesTextarea.value;
            const blob = new Blob([text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `testmate-notes-${new Date().toISOString().split('T')[0]}.txt`;
            a.click();
            URL.revokeObjectURL(url);
            showStatus('✓ Notes downloaded!', 'success');
        });
    }
    
    // Keyboard shortcut: Ctrl+S to save
    notesTextarea.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveNotes();
            showStatus('✓ Notes saved!', 'success');
        }
    });
    
    // Initial stats update
    updateStats();
    
    console.log('Notes module initialized successfully');
    
    // Helper functions
    function saveNotes() {
        const notes = notesTextarea.value;
        localStorage.setItem('testmate-notes', notes);
        localStorage.setItem('testmate-notes-timestamp', new Date().toISOString());
    }
    
    function loadNotes() {
        const savedNotes = localStorage.getItem('testmate-notes');
        if (savedNotes) {
            notesTextarea.value = savedNotes;
            updateStats();
            
            const timestamp = localStorage.getItem('testmate-notes-timestamp');
            if (timestamp) {
                const date = new Date(timestamp);
                showStatus(`Last saved: ${date.toLocaleString()}`, 'info');
            }
        }
    }
    
    function updateStats() {
        const text = notesTextarea.value;
        const chars = text.length;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const lines = text ? text.split('\n').length : 0;
        
        if (charCount) charCount.textContent = `${chars} character${chars !== 1 ? 's' : ''}`;
        if (wordCount) wordCount.textContent = `${words} word${words !== 1 ? 's' : ''}`;
        if (lineCount) lineCount.textContent = `${lines} line${lines !== 1 ? 's' : ''}`;
    }
    
    function showStatus(message, type = 'info') {
        if (!noteStatus) return;
        
        noteStatus.textContent = message;
        noteStatus.className = `note-status ${type}`;
        noteStatus.style.display = 'inline-block';
        
        setTimeout(() => {
            noteStatus.style.display = 'none';
        }, 3000);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNotes);
} else {
    initNotes();
}
