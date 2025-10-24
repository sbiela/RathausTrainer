const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);

// CORS für alle Origins erlauben
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Statische Dateien servieren (immer)
app.use(express.static('.'));

// Root route für Railway - serviert die HTML-Seite
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// CORS für Express
app.use(cors());

// Raum-Management
const rooms = new Map();

// Bestenliste-Management
const leaderboard = [];

// Socket.io Events
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Raum erstellen (Regie)
    socket.on('create-room', (data) => {
        const roomId = data.roomId || generateRoomId();
        const roomData = {
            id: roomId,
            regie: socket.id,
            candidates: [],
            gameActive: false,
            currentIndex: 0,
            recognizedCount: 0,
            shuffledData: data.shuffledData || [],
            gameSettings: {
                gameTime: 90,
                fromNumber: 1,
                toNumber: 90,
                randomOrder: true
            }
        };
        
        rooms.set(roomId, roomData);
        socket.join(roomId);
        socket.emit('room-created', { roomId, roomData });
        
        // Broadcast room list to all connected clients
        const roomList = Array.from(rooms.values()).map(room => ({
            id: room.id,
            candidateCount: room.candidates.length,
            gameActive: room.gameActive
        }));
        io.emit('room-list', roomList);
        
        console.log('Room created:', roomId);
    });

    // Raum beitreten (Kandidat)
    socket.on('join-room', (data) => {
        const roomId = data.roomId;
        const room = rooms.get(roomId);
        
        if (room) {
            socket.join(roomId);
            room.candidates.push(socket.id);
            socket.emit('room-joined', { roomId, roomData: room });
            
            // Spiel-Einstellungen an neuen Kandidaten senden
            if (room.gameSettings) {
                socket.emit('game-settings-update', room.gameSettings);
            }
            
            // Alle Kandidaten über neuen Teilnehmer informieren
            io.to(roomId).emit('candidate-joined', { 
                candidateId: socket.id,
                candidateCount: room.candidates.length 
            });
            
            console.log('Candidate joined room:', roomId);
        } else {
            socket.emit('room-not-found', { roomId });
        }
    });

    // Countdown starten (Regie)
    socket.on('countdown-start', (data) => {
        const roomId = data.roomId;
        const room = rooms.get(roomId);
        
        if (room && room.regie === socket.id) {
            // Alle Teilnehmer über Countdown-Start informieren
            io.to(roomId).emit('countdown-start', { 
                timeLeft: data.timeLeft || 90
            });
            
            console.log('Countdown started in room:', roomId);
        }
    });

    // Spiel starten (Regie)
    socket.on('start-game', (data) => {
        const roomId = data.roomId;
        const room = rooms.get(roomId);
        
        if (room && room.regie === socket.id) {
            room.gameActive = true;
            room.currentIndex = 0;
            room.recognizedCount = 0;
            
            // Update room with new shuffled data if provided
            if (data.shuffledData && data.shuffledData.length > 0) {
                room.shuffledData = data.shuffledData;
            }
            
            // Alle Teilnehmer über Spielstart informieren
            io.to(roomId).emit('game-started', { 
                roomData: room,
                currentRathaus: room.shuffledData[0] 
            });
            
            console.log('Game started in room:', roomId);
        }
    });

    // Nächstes Rathaus (Regie)
    socket.on('next-rathaus', (data) => {
        const roomId = data.roomId;
        const room = rooms.get(roomId);
        
        if (room && room.regie === socket.id) {
            room.currentIndex++;
            
            if (room.currentIndex < room.shuffledData.length) {
                const currentRathaus = room.shuffledData[room.currentIndex];
                io.to(roomId).emit('rathaus-updated', { 
                    roomData: room,
                    currentRathaus 
                });
            } else {
                // Spiel beendet
                room.gameActive = false;
                io.to(roomId).emit('game-ended', { roomData: room });
            }
            
            console.log('Next rathaus in room:', roomId);
        }
    });

    // Ergebnis speichern (Regie)
    socket.on('save-result', (data) => {
        const roomId = data.roomId;
        const room = rooms.get(roomId);
        
        if (room && room.regie === socket.id) {
            room.recognizedCount++;
            io.to(roomId).emit('result-saved', { 
                roomData: room,
                recognizedCount: room.recognizedCount 
            });
            
            console.log('Result saved in room:', roomId);
        }
    });

    // Spiel-Einstellungen aktualisieren (Regie)
    socket.on('game-settings-update', (data) => {
        const roomId = data.roomId;
        const room = rooms.get(roomId);
        
        if (room && room.regie === socket.id) {
            room.gameSettings = {
                gameTime: data.gameTime || 90,
                fromNumber: data.fromNumber || 1,
                toNumber: data.toNumber || 90,
                randomOrder: data.randomOrder !== undefined ? data.randomOrder : true
            };
            
            // Alle Kandidaten über neue Einstellungen informieren
            io.to(roomId).emit('game-settings-update', room.gameSettings);
            
            console.log('Game settings updated in room:', roomId, room.gameSettings);
        }
    });

    // Timer-Synchronisation
    socket.on('timer-sync', (data) => {
        const roomId = data.roomId;
        const room = rooms.get(roomId);
        
        if (room && room.regie === socket.id) {
            room.timeLeft = data.timeLeft;
            room.currentIndex = data.currentIndex;
            room.recognizedCount = data.recognizedCount;
            
            // Timer an alle Kandidaten weiterleiten
            io.to(roomId).emit('timer-sync', {
                timeLeft: data.timeLeft,
                currentIndex: data.currentIndex,
                recognizedCount: data.recognizedCount
            });
            
            console.log('Timer synced in room:', roomId, data.timeLeft);
        }
    });

    // Raum-Liste anfordern
    socket.on('get-rooms', () => {
        const roomList = Array.from(rooms.values()).map(room => ({
            id: room.id,
            candidateCount: room.candidates.length,
            gameActive: room.gameActive
        }));
        
        socket.emit('room-list', roomList);
    });

    // Bestenliste-Events
    socket.on('save-result', (data) => {
        const result = {
            ...data,
            timestamp: Date.now(),
            id: Math.random().toString(36).substring(2, 15)
        };
        
        leaderboard.push(result);
        
        // Keep only last 1000 results
        if (leaderboard.length > 1000) {
            leaderboard.splice(0, leaderboard.length - 1000);
        }
        
        // Sort by score (correct/total ratio)
        leaderboard.sort((a, b) => {
            const scoreA = a.correct / a.total;
            const scoreB = b.correct / b.total;
            return scoreB - scoreA;
        });
        
        console.log('Result saved to leaderboard:', result);
        
        // Broadcast updated leaderboard to all clients
        io.emit('leaderboard-updated', leaderboard.slice(0, 100)); // Send top 100
    });
    
    socket.on('get-leaderboard', () => {
        socket.emit('leaderboard-data', leaderboard.slice(0, 100)); // Send top 100
    });

    // Verbindung trennen
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        // Raum aufräumen wenn Regie disconnected
        for (const [roomId, room] of rooms.entries()) {
            if (room.regie === socket.id) {
                rooms.delete(roomId);
                io.to(roomId).emit('room-closed', { roomId });
                console.log('Room closed:', roomId);
            }
        }
    });
});

// Hilfsfunktionen
function generateRoomId() {
    return Math.random().toString(36).substr(2, 9);
}

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
    console.log(`Server running on ${HOST}:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});