import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const photosFile = path.join(__dirname, '../data/photos.json');
const usersFile = path.join(__dirname, '../data/users.json');

router.get('/user/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        
        const data = await fs.readFile(usersFile, 'utf8');
        const photos = JSON.parse(data);
        
        const userPhotos = photos.filter(photo => photo.userId === userId);
        res.json(userPhotos);
    } catch (error) {
        console.error('Error loading photos:', error);
        res.status(500).json({ error: 'Failed to load photos' });
    }
});

router.get('/', async (req, res) => {
    try {
        const photosData = await fs.readFile(photosFile, 'utf8');
        const usersData = await fs.readFile(usersFile, 'utf8');
        
        const photos = JSON.parse(photosData);
        const users = JSON.parse(usersData);
        
        // Enrich photos with user data
        const enrichedPhotos = photos.map(photo => {
            const user = users.find(u => u.id === photo.userId);
            return {
                ...photo,
                userName: user ? user.fullName : 'Unknown User',
                userEmail: user ? user.email : 'Unknown'
            };
        });
        
        res.json(enrichedPhotos);
    } catch (error) {
        console.error('Error loading all photos:', error);
        res.status(500).json({ error: 'Failed to load photos' });
    }
});

// Upload new photo
router.post('/', async (req, res) => {
    try {
        const { userId, photoUrl, description = '' } = req.body;
        
        const data = await fs.readFile(photosFile, 'utf8');
        const photos = JSON.parse(data);
        
        const newPhoto = {
            id: Date.now(),
            userId: parseInt(userId),
            photoUrl,
            description,
            uploadDate: new Date().toISOString(),
            isActive: true,
            isBlocked: false,
            blockedReason: null
        };
        
        photos.push(newPhoto);
        await fs.writeFile(photosFile, JSON.stringify(photos, null, 2));
        
        res.status(201).json(newPhoto);
    } catch (error) {
        console.error('Error uploading photo:', error);
        res.status(500).json({ error: 'Failed to upload photo' });
    }
});

// Block/unblock photo (admin only)
router.patch('/:photoId/block', async (req, res) => {
    try {
        const photoId = parseInt(req.params.photoId);
        const { isBlocked, blockedReason = null } = req.body;
        
        const data = await fs.readFile(photosFile, 'utf8');
        const photos = JSON.parse(data);
        
        const photoIndex = photos.findIndex(photo => photo.id === photoId);
        
        if (photoIndex === -1) {
            return res.status(404).json({ error: 'Photo not found' });
        }
        
        photos[photoIndex].isBlocked = Boolean(isBlocked);
        photos[photoIndex].blockedReason = blockedReason;
        
        // If blocked, also deactivate
        if (isBlocked) {
            photos[photoIndex].isActive = false;
        }
        
        await fs.writeFile(photosFile, JSON.stringify(photos, null, 2));
        
        res.json({ 
            message: `Photo ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
            photo: photos[photoIndex]
        });
    } catch (error) {
        console.error('Error blocking photo:', error);
        res.status(500).json({ error: 'Failed to block photo' });
    }
});

// Activate/deactivate photo
router.patch('/:photoId/activate', async (req, res) => {
    try {
        const photoId = parseInt(req.params.photoId);
        const { isActive } = req.body;
        
        const data = await fs.readFile(photosFile, 'utf8');
        const photos = JSON.parse(data);
        
        const photoIndex = photos.findIndex(photo => photo.id === photoId);
        
        if (photoIndex === -1) {
            return res.status(404).json({ error: 'Photo not found' });
        }
        
        photos[photoIndex].isActive = Boolean(isActive);
        await fs.writeFile(photosFile, JSON.stringify(photos, null, 2));
        
        res.json({ 
            message: `Photo ${isActive ? 'activated' : 'deactivated'} successfully`,
            photo: photos[photoIndex]
        });
    } catch (error) {
        console.error('Error activating photo:', error);
        res.status(500).json({ error: 'Failed to activate photo' });
    }
});

// Delete photo
router.delete('/:photoId', async (req, res) => {
    try {
        const photoId = parseInt(req.params.photoId);
        
        const data = await fs.readFile(photosFile, 'utf8');
        let photos = JSON.parse(data);
        
        photos = photos.filter(photo => photo.id !== photoId);
        await fs.writeFile(photosFile, JSON.stringify(photos, null, 2));
        
        res.json({ message: 'Photo deleted successfully' });
    } catch (error) {
        console.error('Error deleting photo:', error);
        res.status(500).json({ error: 'Failed to delete photo' });
    }
});

export default router;