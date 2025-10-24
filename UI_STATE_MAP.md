# UI State Map - Rathaus Trainer Frontend

## 🎯 **UI Modi Übersicht**

### 1. **Regie Mode** (`currentRole = 'regie'`)
**Sichtbare Elemente:**
- ✅ `.regie-room-controls` - Raum erstellen/verwalten
- ✅ `.regie-controls` - Spiel starten/steuern
- ✅ `.game-settings` - Spielkonfiguration
- ✅ `.selection-area` - Rathaus-Auswahl
- ❌ `.candidate-room-controls` - Versteckt
- ❌ `.candidate-controls` - Versteckt

### 2. **Candidate Mode** (`currentRole = 'candidate'`)
**Sichtbare Elemente:**
- ✅ `.candidate-room-controls` - Raum beitreten
- ✅ `.candidate-controls` - Kandidaten-Interface
- ✅ `.game-settings` - Nur lesbar (disabled)
- ✅ `.selection-area` - Rathaus-Auswahl
- ❌ `.regie-room-controls` - Versteckt
- ❌ `.regie-controls` - Versteckt
- ❌ `#startBtn` - Versteckt
- ❌ `#regieStartBtn` - Versteckt

### 3. **SinglePlayer Mode** (`currentRole = 'singleplayer'`)
**Sichtbare Elemente:**
- ✅ `.game-settings` - Vollzugriff
- ✅ `.selection-area` - Rathaus-Auswahl
- ✅ `.controls` - Alle Steuerelemente
- ❌ `.regie-room-controls` - Versteckt
- ❌ `.candidate-room-controls` - Versteckt
- ❌ `#availableRooms` - Versteckt

## 🔧 **Kritische UI-Elemente**

### **Raum-Management:**
- `#regieRoomControls` - Regie: Raum erstellen
- `#candidateRoomControls` - Kandidat: Raum beitreten
- `#availableRooms` - Verfügbare Räume anzeigen

### **Spiel-Steuerung:**
- `#startBtn` - Spiel starten (nur Regie)
- `#regieStartBtn` - Regie Spiel starten
- `.regie-controls` - Regie Steuerung
- `.candidate-controls` - Kandidat Steuerung

### **Spiel-Konfiguration:**
- `#gameSettings` - Spiel-Einstellungen
- `#selectionArea` - Rathaus-Auswahl

## 🐛 **Häufige UI-Probleme**

### **Problem 1: Elemente werden nicht versteckt**
```javascript
// Lösung: Mehrere CSS-Properties setzen
element.style.setProperty('display', 'none', 'important');
element.style.setProperty('visibility', 'hidden', 'important');
element.style.setProperty('opacity', '0', 'important');
```

### **Problem 2: Elemente werden nicht angezeigt**
```javascript
// Lösung: Force display mit !important
element.style.setProperty('display', 'block', 'important');
```

### **Problem 3: Buttons in falschen Modi sichtbar**
- `#startBtn` - Nur in Regie Mode
- `#regieStartBtn` - Nur in Regie Mode
- Candidate Controls - Nur in Candidate Mode

## 📋 **Debugging-Checkliste**

### **Regie Mode Check:**
- [ ] `.regie-room-controls` sichtbar?
- [ ] `.regie-controls` sichtbar?
- [ ] `.candidate-room-controls` versteckt?
- [ ] `#startBtn` sichtbar?

### **Candidate Mode Check:**
- [ ] `.candidate-room-controls` sichtbar?
- [ ] `.candidate-controls` sichtbar?
- [ ] `.regie-room-controls` versteckt?
- [ ] `#startBtn` versteckt?

### **SinglePlayer Mode Check:**
- [ ] `.game-settings` sichtbar?
- [ ] `.controls` sichtbar?
- [ ] Alle room-controls versteckt?
- [ ] `#availableRooms` versteckt?

## 🎨 **CSS-Klassen für Modi**

```css
.regie-mode { /* Regie spezifische Styles */ }
.candidate-mode { /* Kandidat spezifische Styles */ }
.singleplayer-mode { /* SinglePlayer spezifische Styles */ }
```

## 🔍 **Console Debugging**

```javascript
// Aktueller Modus prüfen
console.log('Current role:', currentRole);

// Element Sichtbarkeit prüfen
console.log('Regie controls visible:', regieControls.style.display);
console.log('Candidate controls visible:', candidateControls.style.display);
```
