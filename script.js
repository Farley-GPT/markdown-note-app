class NotesApp {
    constructor() {
        this.editor = document.getElementById('editor');
        this.preview = document.getElementById('preview');
        this.searchInput = document.getElementById('searchInput');
        this.newNoteBtn = document.getElementById('newNoteBtn');
        this.notesList = document.getElementById('notesList');
        this.toggleCheatSheet = document.getElementById('toggleCheatSheet');
        this.markdownCheatSheet = document.getElementById('markdownCheatSheet');
        
        // Initialize notes array in localStorage if it doesn't exist
        if (!localStorage.getItem('notes')) {
            localStorage.setItem('notes', JSON.stringify([]));
        }
        
        this.activeNoteIndex = -1;
        
        // Configure Showdown
        this.converter = new showdown.Converter({
            tables: true,
            tasklists: true,
            strikethrough: true,
            emoji: true,
            parseImgDimensions: true,
            simplifiedAutoLink: true,
            ghCodeBlocks: true
        });

        this.initializeEventListeners();
        this.loadNotes();
        this.initializeCheatSheet();
    }

    initializeEventListeners() {
        this.editor.addEventListener('input', () => {
            this.updatePreview();
            this.saveNote();
        });

        this.newNoteBtn.addEventListener('click', () => {
            this.createNewNote();
        });

        this.searchInput.addEventListener('input', (e) => {
            this.searchNotes(e.target.value);
        });
    }

    updatePreview() {
        const markdown = this.editor.value;
        const html = this.converter.makeHtml(markdown);
        this.preview.innerHTML = DOMPurify.sanitize(html);
        
        if (window.Prism) {
            Prism.highlightAllUnder(this.preview);
        }
    }

    saveNote() {
        const notes = JSON.parse(localStorage.getItem('notes'));
        const content = this.editor.value;
        
        if (this.activeNoteIndex === -1) {
            notes.push({
                content,
                timestamp: Date.now()
            });
            this.activeNoteIndex = notes.length - 1;
        } else {
            notes[this.activeNoteIndex].content = content;
            notes[this.activeNoteIndex].timestamp = Date.now();
        }
        
        localStorage.setItem('notes', JSON.stringify(notes));
        this.renderNotesList();
    }

    loadNotes() {
        const notes = JSON.parse(localStorage.getItem('notes'));
        this.renderNotesList();
        
        if (notes.length > 0) {
            this.activeNoteIndex = 0;
            this.editor.value = notes[0].content;
            this.updatePreview();
        } else {
            this.createNewNote();
        }
    }

    renderNotesList() {
        const notes = JSON.parse(localStorage.getItem('notes'));
        this.notesList.innerHTML = '';
        
        notes.forEach((note, index) => {
            const noteElement = document.createElement('div');
            noteElement.className = `note-item ${index === this.activeNoteIndex ? 'active' : ''}`;
            
            // Create note content wrapper
            const noteContent = document.createElement('div');
            noteContent.className = 'note-content';
            noteContent.textContent = note.content.split('\n')[0] || 'New Note';
            
            // Create delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.onclick = (e) => {
                e.stopPropagation(); // Prevent note selection when clicking delete
                this.deleteNote(index);
            };
            
            noteElement.appendChild(noteContent);
            noteElement.appendChild(deleteBtn);
            noteElement.addEventListener('click', () => this.selectNote(index));
            this.notesList.appendChild(noteElement);
        });
    }

    selectNote(index) {
        const notes = JSON.parse(localStorage.getItem('notes'));
        this.activeNoteIndex = index;
        this.editor.value = notes[index].content;
        this.updatePreview();
        this.renderNotesList();
    }

    createNewNote() {
        this.activeNoteIndex = -1;
        this.editor.value = '# New Note\n\nStart writing here...';
        this.updatePreview();
        this.saveNote();
    }

    searchNotes(searchTerm) {
        const notes = JSON.parse(localStorage.getItem('notes'));
        const filteredNotes = notes.filter(note => 
            note.content.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        this.renderFilteredNotes(filteredNotes);
    }

    renderFilteredNotes(filteredNotes) {
        this.notesList.innerHTML = '';
        
        filteredNotes.forEach((note, index) => {
            const noteElement = document.createElement('div');
            noteElement.className = 'note-item';
            noteElement.textContent = note.content.split('\n')[0] || 'New Note';
            noteElement.addEventListener('click', () => this.selectNote(index));
            this.notesList.appendChild(noteElement);
        });
    }

    deleteNote(index) {
        if (confirm('Are you sure you want to delete this note?')) {
            const notes = JSON.parse(localStorage.getItem('notes'));
            notes.splice(index, 1);
            localStorage.setItem('notes', JSON.stringify(notes));

            // Handle active note selection after deletion
            if (notes.length === 0) {
                this.createNewNote();
            } else if (index === this.activeNoteIndex) {
                // If we deleted the active note, select the previous note or the first one
                this.activeNoteIndex = Math.max(0, index - 1);
                this.editor.value = notes[this.activeNoteIndex].content;
                this.updatePreview();
            } else if (index < this.activeNoteIndex) {
                // If we deleted a note before the active note, adjust the index
                this.activeNoteIndex--;
            }

            this.renderNotesList();
        }
    }

    initializeCheatSheet() {
        this.toggleCheatSheet.addEventListener('click', () => {
            this.markdownCheatSheet.classList.toggle('hidden');
            // Optionally save the state to localStorage
            localStorage.setItem('cheatSheetVisible', 
                !this.markdownCheatSheet.classList.contains('hidden'));
        });

        // Optionally restore the last state
        const wasVisible = localStorage.getItem('cheatSheetVisible') === 'true';
        if (wasVisible) {
            this.markdownCheatSheet.classList.remove('hidden');
        }
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NotesApp();
});