import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const usersFile = path.join(__dirname, '../data/users.json');

console.log('Users route loaded');
console.log('Users file path:', usersFile);

const readUsers = () => {
  try {
    
    if (!fs.existsSync(usersFile)) {
      fs.writeFileSync(usersFile, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(usersFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
};
router.get('/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        
        console.log(`GET /api/users/${userId} requested`);
        
        try {
            await fs.access(usersFile);
        } catch (error) {
            console.error('Users file does not exist:', usersFile);
            return res.status(500).json({ error: 'Users file not found' });
        }
        
        const data = await fs.readFile(usersFile, 'utf8');
        const users = JSON.parse(data);
        
        const user = users.find(user => user.id === userId);
        if (!user) {
            console.log(`User with id ${userId} not found`);
            return res.status(404).json({ error: 'User not found' });
        }
        
        const userWithoutPassword = { ...user };
        delete userWithoutPassword.password;
        
        console.log(`User ${userId} found`);
        res.json(userWithoutPassword);
        
    } catch (error) {
        console.error('Error in GET /api/users/:id:', error);
        res.status(500).json({ 
            error: 'Failed to get user',
            details: error.message 
        });
    }
});

router.get('/', async (req, res) => {
    try {
        console.log('GET /api/users requested');
        
        try {
            await fs.access(usersFile);
        } catch (error) {
            console.error('Users file does not exist:', usersFile);
            return res.status(500).json({ error: 'Users file not found' });
        }
        
        const data = await fs.readFile(usersFile, 'utf8');
        console.log('Raw data from file:', data);
        
        const users = JSON.parse(data);
        console.log(`Loaded ${users.length} users`);
        
        res.json(users);
    } catch (error) {
        console.error('Error in GET /api/users:', error);
        res.status(500).json({ 
            error: 'Failed to read users data',
            details: error.message 
        });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const updatedUser = req.body;
        
        console.log(`PUT /api/users/${userId} requested`);
        console.log('Update data:', updatedUser);
        
        try {
            await fs.access(usersFile);
        } catch (error) {
            console.error('Users file does not exist:', usersFile);
            return res.status(500).json({ error: 'Users file not found' });
        }
        
        const data = await fs.readFile(usersFile, 'utf8');
        const users = JSON.parse(data);
        const userIndex = users.findIndex(user => user.id === userId);
        if (userIndex === -1) {
            console.log(`User not found`);
            return res.status(404).json({ error: 'User not found' });
        }
        
        users[userIndex] = { 
            ...users[userIndex], 
            ...updatedUser,      
            id: userId          
        };
        
        await fs.writeFile(usersFile, JSON.stringify(users, null, 2));
        
        console.log(`User ${userId} updated successfully`);
        res.json(users[userIndex]);
        
    } catch (error) {
        console.error('Error in PUT /api/users/:id:', error);
        res.status(500).json({ 
            error: 'Failed to update user',
            details: error.message 
        });
    }
});
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login request received:', { email });
        try {
            await fs.access(usersFile);
        } catch (error) {
            console.error('Users file does not exist:', usersFile);
            return res.status(500).json({ error: 'Users file not found' });
        }
        
        const data = await fs.readFile(usersFile, 'utf8');
        
        const users = JSON.parse(data);
        console.log(`Loaded ${users.length} users`);

    const user = users.find(u => u.email === email);

    console.log('User logged in successfully:', user.id);

    const userResponse = { ...user };
    delete userResponse.password;

    const token = `user_token_${user.id}_${Date.now()}`;

    res.json({
      success: true,
      message: 'Вход выполнен успешно',
      user: userResponse,
      token: token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Внутренняя ошибка сервера: ' + error.message 
    });
  }
});
router.delete('/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        
        console.log(`DELETE /api/users/${userId} requested`);
        
        try {
            await fs.access(usersFile);
        } catch (error) {
            console.error('Users file does not exist:', usersFile);
            return res.status(500).json({ error: 'Users file not found' });
        }
        
        const data = await fs.readFile(usersFile, 'utf8');
        let users = JSON.parse(data);
        
        const userExists = users.some(user => user.id === userId);
        if (!userExists) {
            console.log(`User with id ${userId} not found`);
            return res.status(404).json({ error: 'User not found' });
        }
        
        users = users.filter(user => user.id !== userId);
        
        await fs.writeFile(usersFile, JSON.stringify(users, null, 2));
        
        console.log(`User ${userId} deleted successfully`);
        res.json({ message: 'User deleted successfully' });
        
    } catch (error) {
        console.error('Error in DELETE /api/users/:id:', error);
        res.status(500).json({ 
            error: 'Failed to delete user',
            details: error.message 
        });
    }
});
router.post('/register', (req, res) => {
  try {
    const { fullName,email,password, birthDate} = req.body;

    console.log('Registration request received');
    console.log('Data directory:', path.dirname(usersFile));
    console.log('Users file path:', usersFile);

    if (!fullName || !email ||!password || !birthDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Все поля обязательны для заполнения' 
      });
    }

    const users = readUsers();
    console.log('Current users count:', users.length);

    const existingUser = users.find(user => 
      user.email === email
    );

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Пользователь с таким emailуже существует' 
      });
    }

    const newUser = {
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
      fullName,
      email,
      password,
      birthDate,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    users.push(newUser);
    const writeSuccess = writeUsers(users);

    if (!writeSuccess) {
      return res.status(500).json({ 
        success: false, 
        message: 'Ошибка сохранения данных' 
      });
    }

    console.log('User registered successfully. ID:', newUser.id);

    const userResponse = { ...newUser };
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Пользователь успешно зарегистрирован',
      user: userResponse
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Внутренняя ошибка сервера: ' + error.message 
    });
  }
});

export default router;