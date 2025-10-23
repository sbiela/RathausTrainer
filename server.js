const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 4000;

// Serve static files
app.use(express.static('.'));

// Basic route for testing
app.get('/', (req, res) => {
  console.log('GET / request received');
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Store room data
const rooms = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join room
  socket.on('join-room', (roomId, role) => {
    socket.join(roomId);
    socket.roomId = roomId;
    socket.role = role;
    
    console.log(`User ${socket.id} joined room ${roomId} as ${role}`);
    
    // Send current room state to new user
    if (rooms.has(roomId)) {
      socket.emit('room-state', rooms.get(roomId));
    }
  });

  // Update room state
  socket.on('update-room', (roomData) => {
    if (socket.roomId) {
      rooms.set(socket.roomId, roomData);
      
      // Broadcast to all users in the room
      socket.to(socket.roomId).emit('room-update', roomData);
      
      console.log(`Room ${socket.roomId} updated by ${socket.role}`);
    }
  });

  // Get room list
  socket.on('get-rooms', () => {
    const roomList = Array.from(rooms.entries()).map(([id, data]) => ({
      id,
      active: data.gameActive || false,
      lastUpdate: data.lastUpdate || Date.now()
    }));
    
    socket.emit('room-list', roomList);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Clean up old rooms every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [roomId, data] of rooms.entries()) {
    const lastUpdate = data.lastUpdate || 0;
    if (now - lastUpdate > 300000) { // 5 minutes
      rooms.delete(roomId);
      console.log(`Cleaned up old room: ${roomId}`);
    }
  }
}, 300000);

// For Vercel deployment
if (process.env.VERCEL) {
  // Export for Vercel
  module.exports = app;
} else {
  // Local development
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
  });
}

// Also export the server for Socket.io
module.exports = { app, server };
