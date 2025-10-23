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

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Serve images from extracted_images directory
app.use('/extracted_images', express.static(path.join(__dirname, '../public/extracted_images')));

// Serve start and end images
app.get('/start.jpeg', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/start.jpeg'));
});

app.get('/ende.gif', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/ende.gif'));
});

// Basic route for testing
app.get('/', (req, res) => {
  console.log('GET / request received');
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Force all other routes to go through Node.js server
app.get('*', (req, res) => {
  console.log('GET * request received:', req.path);
  res.sendFile(path.join(__dirname, '../index.html'));
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
module.exports = app;
