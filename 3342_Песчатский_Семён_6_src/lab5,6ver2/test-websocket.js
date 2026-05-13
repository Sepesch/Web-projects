import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  transports: ['websocket', 'polling'],
  timeout: 5000
});

console.log('🔄 Attempting to connect to WebSocket server...');

socket.on('connect', () => {
  console.log('✅ Successfully connected to server');
  console.log('📡 Socket ID:', socket.id);
  
  // Тест отправки сообщения
  socket.emit('message', 'Hello from test client');
});

socket.on('message', (data) => {
  console.log('📨 Received message:', data);
});

socket.on('broadcast', (data) => {
  console.log('📢 Broadcast received:', data);
});

socket.on('echo', (data) => {
  console.log('🔁 Echo received:', data);
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection failed:', error.message);
  console.log('🔧 Error details:', error);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Disconnected:', reason);
});

socket.on('error', (error) => {
  console.log('💥 Socket error:', error);
});

// Тестируем эхо через 2 секунды после подключения
socket.on('connect', () => {
  setTimeout(() => {
    console.log('🧪 Testing echo...');
    socket.emit('echo', 'Test echo message');
  }, 2000);
});