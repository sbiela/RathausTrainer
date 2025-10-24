// UI Debugging Tool für Rathaus Trainer
// Dieses Tool hilft beim Debugging der Frontend-UI-Zustände

class UIDebugger {
    constructor() {
        this.currentRole = null;
        this.elements = {};
        this.init();
    }

    init() {
        // Wichtige UI-Elemente sammeln
        this.elements = {
            // Role Controls
            regieControls: document.querySelector('.regie-controls'),
            candidateControls: document.querySelector('.candidate-controls'),
            
            // Room Controls
            regieRoomControls: document.getElementById('regieRoomControls'),
            candidateRoomControls: document.getElementById('candidateRoomControls'),
            availableRooms: document.getElementById('availableRooms'),
            
            // Game Elements
            gameSettings: document.getElementById('gameSettings'),
            selectionArea: document.getElementById('selectionArea'),
            startBtn: document.getElementById('startBtn'),
            regieStartBtn: document.getElementById('regieStartBtn'),
            
            // Role Selection
            regieRadio: document.getElementById('roleRegie'),
            candidateRadio: document.getElementById('roleCandidate'),
            singlePlayerRadio: document.getElementById('roleSinglePlayer')
        };
    }

    // Aktuellen UI-Zustand analysieren
    analyzeCurrentState() {
        console.log('🔍 UI STATE ANALYSIS');
        console.log('==================');
        
        // Aktuelle Rolle ermitteln
        this.detectCurrentRole();
        console.log('📋 Current Role:', this.currentRole);
        
        // Element-Sichtbarkeit prüfen
        this.checkElementVisibility();
        
        // Mögliche Probleme identifizieren
        this.identifyIssues();
    }

    detectCurrentRole() {
        if (this.elements.regieRadio?.checked) {
            this.currentRole = 'regie';
        } else if (this.elements.candidateRadio?.checked) {
            this.currentRole = 'candidate';
        } else if (this.elements.singlePlayerRadio?.checked) {
            this.currentRole = 'singleplayer';
        } else {
            this.currentRole = 'unknown';
        }
    }

    checkElementVisibility() {
        console.log('\n👁️ ELEMENT VISIBILITY:');
        console.log('======================');
        
        const elementsToCheck = [
            { name: 'Regie Controls', element: this.elements.regieControls },
            { name: 'Candidate Controls', element: this.elements.candidateControls },
            { name: 'Regie Room Controls', element: this.elements.regieRoomControls },
            { name: 'Candidate Room Controls', element: this.elements.candidateRoomControls },
            { name: 'Available Rooms', element: this.elements.availableRooms },
            { name: 'Game Settings', element: this.elements.gameSettings },
            { name: 'Selection Area', element: this.elements.selectionArea },
            { name: 'Start Button', element: this.elements.startBtn },
            { name: 'Regie Start Button', element: this.elements.regieStartBtn }
        ];

        elementsToCheck.forEach(({ name, element }) => {
            if (element) {
                const isVisible = this.isElementVisible(element);
                const display = element.style.display || getComputedStyle(element).display;
                const visibility = element.style.visibility || getComputedStyle(element).visibility;
                const opacity = element.style.opacity || getComputedStyle(element).opacity;
                
                console.log(`${isVisible ? '✅' : '❌'} ${name}:`, {
                    visible: isVisible,
                    display: display,
                    visibility: visibility,
                    opacity: opacity
                });
            } else {
                console.log('❓', name, ': Element not found');
            }
        });
    }

    isElementVisible(element) {
        if (!element) return false;
        
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0' &&
               rect.width > 0 && 
               rect.height > 0;
    }

    identifyIssues() {
        console.log('\n🚨 POTENTIAL ISSUES:');
        console.log('====================');
        
        const issues = [];
        
        // Regie Mode Issues
        if (this.currentRole === 'regie') {
            if (!this.isElementVisible(this.elements.regieControls)) {
                issues.push('❌ Regie Controls should be visible in Regie mode');
            }
            if (!this.isElementVisible(this.elements.regieRoomControls)) {
                issues.push('❌ Regie Room Controls should be visible in Regie mode');
            }
            if (this.isElementVisible(this.elements.candidateControls)) {
                issues.push('⚠️ Candidate Controls should be hidden in Regie mode');
            }
        }
        
        // Candidate Mode Issues
        if (this.currentRole === 'candidate') {
            if (!this.isElementVisible(this.elements.candidateControls)) {
                issues.push('❌ Candidate Controls should be visible in Candidate mode');
            }
            if (!this.isElementVisible(this.elements.candidateRoomControls)) {
                issues.push('❌ Candidate Room Controls should be visible in Candidate mode');
            }
            if (this.isElementVisible(this.elements.regieControls)) {
                issues.push('⚠️ Regie Controls should be hidden in Candidate mode');
            }
            if (this.isElementVisible(this.elements.startBtn)) {
                issues.push('⚠️ Start Button should be hidden in Candidate mode');
            }
        }
        
        // SinglePlayer Mode Issues
        if (this.currentRole === 'singleplayer') {
            if (!this.isElementVisible(this.elements.gameSettings)) {
                issues.push('❌ Game Settings should be visible in SinglePlayer mode');
            }
            if (!this.isElementVisible(this.elements.selectionArea)) {
                issues.push('❌ Selection Area should be visible in SinglePlayer mode');
            }
            if (this.isElementVisible(this.elements.regieRoomControls)) {
                issues.push('⚠️ Regie Room Controls should be hidden in SinglePlayer mode');
            }
            if (this.isElementVisible(this.elements.candidateRoomControls)) {
                issues.push('⚠️ Candidate Room Controls should be hidden in SinglePlayer mode');
            }
        }
        
        if (issues.length === 0) {
            console.log('✅ No issues detected!');
        } else {
            issues.forEach(issue => console.log(issue));
        }
    }

    // UI-Zustand für bestimmten Modus simulieren
    simulateMode(mode) {
        console.log(`🎭 Simulating ${mode} mode...`);
        
        // Alle Elemente zurücksetzen
        this.resetAllElements();
        
        // Modus-spezifische Sichtbarkeit setzen
        switch (mode) {
            case 'regie':
                this.showRegieMode();
                break;
            case 'candidate':
                this.showCandidateMode();
                break;
            case 'singleplayer':
                this.showSinglePlayerMode();
                break;
        }
        
        this.analyzeCurrentState();
    }

    resetAllElements() {
        const allElements = Object.values(this.elements).filter(el => el);
        allElements.forEach(element => {
            element.style.display = '';
            element.style.visibility = '';
            element.style.opacity = '';
        });
    }

    showRegieMode() {
        if (this.elements.regieControls) this.elements.regieControls.style.display = 'flex';
        if (this.elements.regieRoomControls) this.elements.regieRoomControls.style.display = 'block';
        if (this.elements.gameSettings) this.elements.gameSettings.style.display = 'block';
        if (this.elements.selectionArea) this.elements.selectionArea.style.display = 'block';
        if (this.elements.startBtn) this.elements.startBtn.style.display = 'block';
        
        if (this.elements.candidateControls) this.elements.candidateControls.style.display = 'none';
        if (this.elements.candidateRoomControls) this.elements.candidateRoomControls.style.display = 'none';
    }

    showCandidateMode() {
        if (this.elements.candidateControls) this.elements.candidateControls.style.display = 'flex';
        if (this.elements.candidateRoomControls) this.elements.candidateRoomControls.style.display = 'block';
        if (this.elements.gameSettings) this.elements.gameSettings.style.display = 'block';
        if (this.elements.selectionArea) this.elements.selectionArea.style.display = 'block';
        
        if (this.elements.regieControls) this.elements.regieControls.style.display = 'none';
        if (this.elements.regieRoomControls) this.elements.regieRoomControls.style.display = 'none';
        if (this.elements.startBtn) this.elements.startBtn.style.display = 'none';
    }

    showSinglePlayerMode() {
        if (this.elements.gameSettings) this.elements.gameSettings.style.display = 'block';
        if (this.elements.selectionArea) this.elements.selectionArea.style.display = 'block';
        if (this.elements.regieControls) this.elements.regieControls.style.display = 'flex';
        if (this.elements.candidateControls) this.elements.candidateControls.style.display = 'flex';
        
        if (this.elements.regieRoomControls) this.elements.regieRoomControls.style.display = 'none';
        if (this.elements.candidateRoomControls) this.elements.candidateRoomControls.style.display = 'none';
        if (this.elements.availableRooms) this.elements.availableRooms.style.display = 'none';
    }
}

// Global verfügbar machen
window.UIDebugger = UIDebugger;

// Auto-Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    window.uiDebugger = new UIDebugger();
    console.log('🔧 UI Debugger loaded! Use window.uiDebugger.analyzeCurrentState() to debug');
});

// Console-Hilfen
console.log(`
🔧 UI DEBUGGING TOOLS LOADED!

Verfügbare Befehle:
- uiDebugger.analyzeCurrentState() - Aktuellen Zustand analysieren
- uiDebugger.simulateMode('regie') - Regie Modus simulieren
- uiDebugger.simulateMode('candidate') - Candidate Modus simulieren  
- uiDebugger.simulateMode('singleplayer') - SinglePlayer Modus simulieren
`);
