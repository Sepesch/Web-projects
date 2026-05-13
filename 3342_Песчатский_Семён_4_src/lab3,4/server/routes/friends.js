import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const friendsFile = path.join(__dirname, '../data/friends.json');
const usersFile = path.join(__dirname, '../data/users.json');

router.get('/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        
        const friendsData = await fs.readFile(friendsFile, 'utf8');
        const usersData = await fs.readFile(usersFile, 'utf8');
        
        const friends = JSON.parse(friendsData);
        const users = JSON.parse(usersData);
        
        const userFriends = friends.find(item => item.userId === userId);
        
        if (!userFriends) {
            return res.json({ userId, friends: [] });
        }
        
        const enrichedFriends = userFriends.friends.map(friendId => {
            const friendUser = users.find(user => user.id === friendId);
            return friendUser ? {
                id: friendUser.id,
                fullName: friendUser.fullName,
                email: friendUser.email,
                photo: friendUser.photo,
                status: friendUser.status
            } : null;
        }).filter(friend => friend !== null);
        
        res.json({
            userId,
            friends: enrichedFriends
        });
    } catch (error) {
        console.error('Error loading friends:', error);
        res.status(500).json({ error: 'Failed to load friends' });
    }
});

router.post('/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const { friendId } = req.body;
        
        const data = await fs.readFile(friendsFile, 'utf8');
        let friends = JSON.parse(data);
        
        let userFriends = friends.find(item => item.userId === userId);
        
        if (!userFriends) {
            userFriends = { userId, friends: [] };
            friends.push(userFriends);
        }
        
        if (!userFriends.friends.includes(friendId)) {
            userFriends.friends.push(friendId);
            await fs.writeFile(friendsFile, JSON.stringify(friends, null, 2));
        }
        
        res.json({ message: 'Friend added successfully', friends: userFriends.friends });
    } catch (error) {
        console.error('Error adding friend:', error);
        res.status(500).json({ error: 'Failed to add friend' });
    }
});

router.delete('/:userId/:friendId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const friendId = parseInt(req.params.friendId);
        
        const data = await fs.readFile(friendsFile, 'utf8');
        let friends = JSON.parse(data);
        
        const userFriends = friends.find(item => item.userId === userId);
        
        if (userFriends) {
            userFriends.friends = userFriends.friends.filter(id => id !== friendId);
            await fs.writeFile(friendsFile, JSON.stringify(friends, null, 2));
        }
        
        res.json({ message: 'Friend removed successfully' });
    } catch (error) {
        console.error('Error removing friend:', error);
        res.status(500).json({ error: 'Failed to remove friend' });
    }
});

router.get('/', async (req, res) => {
    try {
        const data = await fs.readFile(friendsFile, 'utf8');
        const friends = JSON.parse(data);
        res.json(friends);
    } catch (error) {
        console.error('Error loading friendships:', error);
        res.status(500).json({ error: 'Failed to load friendships' });
    }
});

export default router;