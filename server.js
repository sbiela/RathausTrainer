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

// Statische Dateien servieren
app.use(express.static('.'));

// Root route für Railway
app.get('/', (req, res) => {
    res.json({
        message: 'Rathaus Trainer Socket.io Server',
        status: 'running',
        socketio: 'available',
        timestamp: new Date().toISOString()
    });
});

// CORS für Express
app.use(cors());

// Raum-Management
const rooms = new Map();

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
            shuffledData: data.shuffledData || []
        };
        
        rooms.set(roomId, roomData);
        socket.join(roomId);
        socket.emit('room-created', { roomId, roomData });
        
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

    // Spiel starten (Regie)
    socket.on('start-game', (data) => {
        const roomId = data.roomId;
        const room = rooms.get(roomId);
        
        if (room && room.regie === socket.id) {
            room.gameActive = true;
            room.currentIndex = 0;
            room.recognizedCount = 0;
            
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

    // Raum-Liste anfordern
    socket.on('get-rooms', () => {
        const roomList = Array.from(rooms.values()).map(room => ({
            id: room.id,
            candidateCount: room.candidates.length,
            gameActive: room.gameActive
        }));
        
        socket.emit('room-list', roomList);
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