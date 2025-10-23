# Railway Deployment Guide

## Socket.io Server auf Railway deployen

### 1. Railway Account erstellen
- Gehe zu: https://railway.app
- Melde dich mit GitHub an
- Klicke "New Project"

### 2. Repository verbinden
- Wähle "Deploy from GitHub repo"
- Wähle `RathausTrainer` Repository
- Railway erkennt automatisch `package.json` und `server.js`

### 3. Environment Variables setzen
In Railway Dashboard → Variables:
```
PORT=4000
NODE_ENV=production
CORS_ORIGIN=https://rathaus-trainer.vercel.app
```

### 4. Domain konfigurieren
- Railway gibt automatisch eine Domain: `https://rathaus-trainer-socket.railway.app`
- Diese Domain in `index.html` verwenden für Socket.io Verbindung

### 5. Deployment testen
- Railway startet automatisch den Server
- Teste die Verbindung: `https://rathaus-trainer-socket.railway.app`
- Sollte "Server running" anzeigen

### 6. Frontend aktualisieren
Die `index.html` ist bereits konfiguriert für:
- Localhost: `http://localhost:4000` (für Entwicklung)
- Railway: `https://rathaus-trainer-socket.railway.app` (für Produktion)

### 7. Vollständige Architektur
- **Frontend:** Vercel (https://rathaus-trainer.vercel.app)
- **Backend:** Railway (https://rathaus-trainer-socket.railway.app)
- **Echtzeit:** WebSocket-Verbindung zwischen beiden

### Troubleshooting
- Falls Railway nicht startet: Prüfe `package.json` dependencies
- Falls CORS-Fehler: Prüfe `CORS_ORIGIN` Variable
- Falls Socket.io nicht verbindet: Prüfe Railway Domain
