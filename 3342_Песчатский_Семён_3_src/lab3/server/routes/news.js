import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const newssFile = path.join(__dirname, '../data/news.json');
const usersFile = path.join(__dirname, '../data/users.json');

router.get('/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        
        const newssData = await fs.readFile(newssFile, 'utf8');
        const usersData = await fs.readFile(usersFile, 'utf8');
        
        const newss = JSON.parse(newssData);
        const users = JSON.parse(usersData);
        
        const usernewss = newss.filter(news => 
            news.senderId === userId || news.receiverId === userId
        );
        
        const enrichednewss = usernewss.map(news => {
            const sender = users.find(user => user.id === news.senderId);
            const receiver = users.find(user => user.id === news.receiverId);
            
            return {
                ...news,
                senderName: sender ? sender.fullName : 'Unknown User',
                receiverName: receiver ? receiver.fullName : 'Unknown User',
                senderPhoto: sender ? sender.photo : null,
                receiverPhoto: receiver ? receiver.photo : null
            };
        });
        
        res.json(enrichednewss);
    } catch (error) {
        console.error('Error loading newss:', error);
        res.status(500).json({ error: 'Failed to load newss' });
    }
});

router.get('/:userId/feed', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        
        const newssData = await fs.readFile(newssFile, 'utf8');
        const friendsData = await fs.readFile(path.join(__dirname, '../data/friends.json'), 'utf8');
        const usersData = await fs.readFile(usersFile, 'utf8');
        
        const newss = JSON.parse(newssData);
        const friends = JSON.parse(friendsData);
        const users = JSON.parse(usersData);
        
        const userFriends = friends.find(item => item.userId === userId);
        const friendIds = userFriends ? userFriends.friends : [];
        const allIDs = [...friendIds, userId];

        const feednewss = newss.filter(news => 
            allIDs.includes(news.senderId)
        );
        
        const enrichedFeed = feednewss.map(news => {
            const sender = users.find(user => user.id === news.senderId);
            
            return {
                ...news,
                senderName: sender ? sender.fullName : 'Unknown User',
                senderPhoto: sender ? sender.photo : null,
                canBlock: true
            };
        });
        
        res.json(enrichedFeed);
    } catch (error) {
        console.error('Error loading feed:', error);
        res.status(500).json({ error: 'Failed to load feed' });
    }
});

router.post('/', async (req, res) => {
        console.log("recievedasdasd");
    
    try {
        const { senderId, content, isPublic = false } = req.body;
        
        const data = await fs.readFile(newssFile, 'utf8');
        const newss = JSON.parse(data);
        
        const newnews = {
            id: Date.now(),
            senderId: parseInt(senderId),
            content: content,
            isPublic: Boolean(isPublic),
            timestamp: new Date().toISOString(),
            isBlocked: false
        };
        
        newss.push(newnews);
        await fs.writeFile(newssFile, JSON.stringify(newss, null, 2));
        
        res.status(201).json(newnews);
    } catch (error) {
        console.error('Error sending news:', error);
        res.status(500).json({ error: 'Failed to send news' });
    }
});

router.patch('/:newsId/block', async (req, res) => {
    try {
        const newsId = parseInt(req.params.newsId);
        const { isBlocked } = req.body;
        
        const data = await fs.readFile(newssFile, 'utf8');
        const newss = JSON.parse(data);
        
        const newsIndex = newss.findIndex(msg => msg.id === newsId);
        
        if (newsIndex === -1) {
            return res.status(404).json({ error: 'news not found' });
        }
        
        newss[newsIndex].isBlocked = Boolean(isBlocked);
        await fs.writeFile(newssFile, JSON.stringify(newss, null, 2));
        
        res.json({ 
            news: `news ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
            news: newss[newsIndex]
        });
    } catch (error) {
        console.error('Error blocking news:', error);
        res.status(500).json({ error: 'Failed to block news' });
    }
});

router.delete('/:newsId', async (req, res) => {
    try {
        const newsId = parseInt(req.params.newsId);
        
        const data = await fs.readFile(newssFile, 'utf8');
        let newss = JSON.parse(data);
        
        newss = newss.filter(msg => msg.id !== newsId);
        await fs.writeFile(newssFile, JSON.stringify(newss, null, 2));
        
        res.json({ news: 'news deleted successfully' });
    } catch (error) {
        console.error('Error deleting news:', error);
        res.status(500).json({ error: 'Failed to delete news' });
    }
});

export default router;