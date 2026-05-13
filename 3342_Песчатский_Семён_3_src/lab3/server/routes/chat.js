import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const messagesFile = path.join(__dirname, '../data/messages.json');
const usersFile = path.join(__dirname, '../data/users.json');

console.log('Chat routes loaded');
console.log('Messages file path:', messagesFile);

// Вспомогательные функции для работы с файлами
const readMessages = async () => {
  try {
    try {
      await fs.access(messagesFile);
    } catch (error) {
      // Файл не существует, создаем пустой
      await fs.writeFile(messagesFile, JSON.stringify([]));
      return [];
    }
    const data = await fs.readFile(messagesFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading messages file:', error);
    return [];
  }
};

const writeMessages = async (messages) => {
  try {
    await fs.writeFile(messagesFile, JSON.stringify(messages, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing messages file:', error);
    return false;
  }
};

const readUsers = async () => {
  try {
    try {
      await fs.access(usersFile);
      // Файл существует, читаем его
      const data = await fs.readFile(usersFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      // Файл не существует, создаем пустой
      if (error.code === 'ENOENT') {
        await fs.writeFile(usersFile, JSON.stringify([]));
        return [];
      }
      throw error; // Другие ошибки пробрасываем дальше
    }
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
};

// Получение сообщений с пользователем
router.get('/messages/:userId/:id', async (req, res) => {
  try {
    const currentUserId = parseInt(req.params.id); // Извлекаем ID текущего пользователя из middleware аутентификации
    const targetUserId = parseInt(req.params.userId);
    
    console.log(`GET /api/messages/${targetUserId} requested by user ${currentUserId}`);
    
    const messages = await readMessages();
    
    // Фильтруем сообщения между текущим пользователем и целевым пользователем
    const userMessages = messages.filter(message => 
      (message.senderId === currentUserId && message.recipientId === targetUserId) ||
      (message.senderId === targetUserId && message.recipientId === currentUserId)
    );
    
    // Преобразуем сообщения в формат для клиента
    const formattedMessages = userMessages.map(message => ({
      id: message.id,
      text: message.text,
      type: message.senderId === currentUserId ? 'sent' : 'received',
      timestamp: message.timestamp,
      userId: message.senderId === currentUserId ? targetUserId : message.senderId,
      read: message.read || false
    })).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    console.log(`Found ${formattedMessages.length} messages between users ${currentUserId} and ${targetUserId}`);
    
    res.json({
      success: true,
      data: formattedMessages
    });
    
  } catch (error) {
    console.error('Error in GET /api/messages/:userId:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to load messages',
      details: error.message 
    });
  }
});

// Отправка сообщения
router.post('/messages/:id', async (req, res) => {
  try {
    const currentUserId = parseInt(req.params.id || 1);
    const { recipientId, text } = req.body;
    
    console.log(`POST /api/messages requested by user ${currentUserId} to ${recipientId}`);
    console.log('Message text:', text);
    
    if (!recipientId || !text || text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Recipient ID and message text are required'
      });
    }
    
    const messages = await readMessages();
    const users = await readUsers();
    
    // Проверяем существование получателя
    const recipient = users.find(user => user.id === parseInt(recipientId));
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }
    
    // Создаем новое сообщение
    const newMessage = {
      id: messages.length > 0 ? Math.max(...messages.map(m => m.id)) + 1 : 1,
      senderId: currentUserId,
      recipientId: parseInt(recipientId),
      text: text.trim(),
      timestamp: new Date().toISOString(),
      read: false
    };
    
    messages.push(newMessage);
    const writeSuccess = await writeMessages(messages);
    
    if (!writeSuccess) {
      return res.status(500).json({
        success: false,
        message: 'Failed to save message'
      });
    }
    
    console.log(`Message ${newMessage.id} sent successfully`);
    
    // Возвращаем сообщение в формате для клиента
    const responseMessage = {
      id: newMessage.id,
      text: newMessage.text,
      type: 'sent',
      timestamp: new Date(newMessage.timestamp),
      userId: parseInt(recipientId),
      read: true
    };
    
    res.json({
      success: true,
      data: responseMessage
    });
    
  } catch (error) {
    console.error('Error in POST /api/messages:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send message',
      details: error.message 
    });
  }
});

// Отметка сообщений как прочитанных
router.post('/messages/mark-read/:userId', async (req, res) => {
  try {
    const currentUserId = parseInt(req.user?.id || 1);
    const targetUserId = parseInt(req.params.userId);
    const { messageIds } = req.body;
    
    console.log(`POST /api/messages/mark-read/${targetUserId} requested by user ${currentUserId}`);
    console.log('Message IDs to mark as read:', messageIds);
    
    if (!messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({
        success: false,
        message: 'Message IDs array is required'
      });
    }
    
    const messages = await readMessages();
    let updated = false;
    
    // Отмечаем сообщения как прочитанные
    const updatedMessages = messages.map(message => {
      if (messageIds.includes(message.id) && 
          message.senderId === targetUserId && 
          message.recipientId === currentUserId &&
          !message.read) {
        updated = true;
        return { ...message, read: true };
      }
      return message;
    });
    
    if (updated) {
      await writeMessages(updatedMessages);
      console.log(`Marked ${messageIds.length} messages as read`);
    }
    
    res.json({
      success: true,
      data: null
    });
    
  } catch (error) {
    console.error('Error in POST /api/messages/mark-read/:userId:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to mark messages as read',
      details: error.message 
    });
  }
});

// Очистка истории чата
router.delete('/messages/:userId', async (req, res) => {
  try {
    const currentUserId = parseInt(req.user?.id || 1);
    const targetUserId = parseInt(req.params.userId);
    
    console.log(`DELETE /api/messages/${targetUserId} requested by user ${currentUserId}`);
    
    const messages = await readMessages();
    
    // Удаляем все сообщения между пользователями
    const filteredMessages = messages.filter(message => 
      !((message.senderId === currentUserId && message.recipientId === targetUserId) ||
        (message.senderId === targetUserId && message.recipientId === currentUserId))
    );
    
    const deletedCount = messages.length - filteredMessages.length;
    
    await writeMessages(filteredMessages);
    
    console.log(`Deleted ${deletedCount} messages between users ${currentUserId} and ${targetUserId}`);
    
    res.json({
      success: true,
      data: null
    });
    
  } catch (error) {
    console.error('Error in DELETE /api/messages/:userId:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to clear chat history',
      details: error.message 
    });
  }
});

// Получение количества непрочитанных сообщений
router.get('/messages/unread-counts', async (req, res) => {
  try {
    const currentUserId = parseInt(req.user?.id || 1);
    
    console.log(`GET /api/messages/unread-counts requested by user ${currentUserId}`);
    
    const messages = await readMessages();
    const users = await readUsers();
    
    // Считаем непрочитанные сообщения от каждого пользователя
    const unreadCounts = {};
    
    users.forEach(user => {
      if (user.id !== currentUserId) {
        const unreadCount = messages.filter(message => 
          message.senderId === user.id && 
          message.recipientId === currentUserId && 
          !message.read
        ).length;
        
        if (unreadCount > 0) {
          unreadCounts[user.id] = unreadCount;
        }
      }
    });
    
    console.log(`Unread counts for user ${currentUserId}:`, unreadCounts);
    
    res.json({
      success: true,
      data: unreadCounts
    });
    
  } catch (error) {
    console.error('Error in GET /api/messages/unread-counts:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to load unread counts',
      details: error.message 
    });
  }
});


export default router;