import express from 'express';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import cors from 'cors';
import { WebSocketServer } from 'ws';

import userRoutes from './routes/users.js';
import friendRoutes from './routes/friends.js';
import newsRoutes from './routes/news.js';
import chatRoutes from './routes/chat.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = 3000;
const messagesFile = '/home/sepesch/ground/educ/web/lab3,4/server/data/messages.json';

app.use(
  cors({
    origin: ["https://localhost:4200","https://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);
app.use(bodyParser.json());

app.use('/gulp', express.static(path.join(__dirname, '../admin/client-gulp/dist')));
app.use('/webpack', express.static(path.join(__dirname, '../admin/client-webpack/dist')));
app.use('/user', express.static(path.join(__dirname, '../user/dist/user/browser')));

app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/chat', chatRoutes);

const readMessages = () => {
  return new Promise((resolve, reject) => {
    fs.access(messagesFile, (err) => {
      if (err) {
        if (err.code === 'ENOENT') {
          fs.writeFile(messagesFile, JSON.stringify([]), (writeErr) => {
            if (writeErr) {
              reject(writeErr);
            } else {
              resolve([]);
            }
          });
        } else {
          reject(err);
        }
      } else {
        fs.readFile(messagesFile, 'utf8', (readErr, data) => {
          if (readErr) {
            reject(readErr);
          } else {
            try {
              const messages = JSON.parse(data);
              resolve(messages);
            } catch (parseErr) {
              reject(parseErr);
            }
          }
        });
      }
    });
  });
};

const writeMessages = async (messages) => {
  try {
    await fs.writeFile(messagesFile, JSON.stringify(messages, null, 2), function (err){
  if (err) throw err;
  console.log('It\'s saved!');
});
    return true;
  } catch (error) {
    console.error('Error writing messages:', error);
    return false;
  }
};
app.get('/gulp', (req, res) => {
    res.redirect('/gulp/users');
});
app.get('/gulp/users', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin/client-gulp/dist/users.html'));
});

app.get('/gulp/friends', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin/client-gulp/dist/friends.html'));
});

app.get('/gulp/news', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin/client-gulp/dist/news.html'));
});
app.get('/webpack', (req, res) => {
    res.redirect('/webpack/users');
});
app.get('/webpack/users', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin/client-webpack/dist/users.html'));
});

app.get('/webpack/friends', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin/client-webpack/dist/friends.html'));
});

app.get('/webpack/news', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin/client-webpack/dist/news.html'));
});
const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, '../ssl/private-key.pem')),
    cert: fs.readFileSync(path.join(__dirname, '../ssl/certificate.pem'))
};
app.options('*', cors());
app.use((err, req, res, next) => {
  if (err.message.includes('CORS')) {
    res.status(403).json({ error: 'CORS error' });
  } else {
    next(err);
  }
});
const server = https.createServer(sslOptions, app);

const wss = new WebSocketServer({server: server});

const connectedUsers = new Map();

wss.on('connection', (ws, req) => {
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      handleWebSocketMessage(ws, message);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Invalid message format' }
      }));
    }
  });
  
  ws.on('close', () => {
    for (const [userId, userWs] of connectedUsers.entries()) {
      if (userWs === ws) {
        connectedUsers.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
  
  ws.on('error', (error) => {
    console.error('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA:', error);
  });
});

async function handleWebSocketMessage(ws, message) {
  console.log('Received WebSocket message:', message);
  
  switch (message.type) {
    case 'user_connect':
      const userId = message.userId;
      connectedUsers.set(userId, ws);
      ws.userId = userId;
      console.log(`User ${userId} connected via WebSocket`);
      break;
      
    case 'send_message':
      try {
        const { recipientId, senderId, text, timestamp } = message.data;
        
        if (!senderId) {
          console.error('Sender ID not found for WebSocket connection');
          ws.send(JSON.stringify({
            type: 'error',
            data: { message: 'User not authenticated' }
          }));
          return;
        }
        
        console.log(`Message from ${senderId} to ${recipientId}: ${text}`);
        
        const messages = await readMessages().catch(() => []); 
        
        const newId = messages.length > 0 ? Math.max(...messages.map(m => m.id)) + 1 : 1;
        
        const newMessage = {
          id: newId,
          senderId: parseInt(senderId),
          recipientId: parseInt(recipientId),
          text: text.trim(),
          timestamp: new Date().toISOString(),
          read: false
        };
        
        messages.push(newMessage);
        
        const saveSuccess = await writeMessages(messages);
        
        if (!saveSuccess) {
          console.error('Failed to save message to file, but continuing...');
        } else {
          console.log(`Message ${newMessage.id} saved to JSON database`);
        }
        
        const recipientIdNum = parseInt(recipientId);
        const recipientWs = connectedUsers.get(recipientIdNum);
        
        if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
          const messageForRecipient = {
            type: 'new_message',
            data: {
              id: newMessage.id,
              text: newMessage.text,
              type: 'received',
              timestamp: newMessage.timestamp,
              userId: parseInt(senderId),
              read: false
            }
          };
          recipientWs.send(JSON.stringify(messageForRecipient));
          console.log(`Message delivered to recipient ${recipientId}`);
        } else {
          console.log(`Recipient ${recipientId} is not connected`);
        }
        
      } catch (error) {
        console.error('Unexpected error in send_message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          data: { message: 'Failed to send message' }
        }));
      }
      break;

    default:
      console.log('Unknown message type:', message.type);
  }
}

server.listen(PORT, () => {
    console.log(`HTTPS Server running on port ${PORT}`);
    console.log('WebSocket server running on /ws');
    console.log('Gulp version: https://localhost:3000/gulp');
    console.log('Webpack version: https://localhost:3000/webpack');
    console.log('Angular user app: https://localhost:3000/user');
});