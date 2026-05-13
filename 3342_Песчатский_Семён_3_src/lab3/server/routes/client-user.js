import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Путь к файлу с пользователями - УКАЖИТЕ ПРАВИЛЬНЫЙ ПУТЬ
const usersFilePath = path.join(__dirname, '../../data/users.json');
// Или если файл в той же папке:
// const usersFilePath = path.join(__dirname, 'users.json');

// Создаем папку data если не существует
const ensureDataDir = () => {
  const dataDir = path.dirname(usersFilePath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('Created data directory:', dataDir);
  }
};

// Чтение пользователей из файла
const readUsers = () => {
  try {
    ensureDataDir();
    
    if (!fs.existsSync(usersFilePath)) {
      // Создаем файл с пустым массивом если не существует
      fs.writeFileSync(usersFilePath, JSON.stringify([]));
      return [];
    }
    
    const data = fs.readFileSync(usersFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
};

// Запись пользователей в файл
const writeUsers = (users) => {
  try {
    ensureDataDir();
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
    console.log('Users saved to:', usersFilePath);
    return true;
  } catch (error) {
    console.error('Error writing users file:', error);
    return false;
  }
};

// Регистрация пользователя
router.post('/register', (req, res) => {
  try {
    const { firstName, lastName, email, username, password, birthDate, gender, agreeTerms, newsletter } = req.body;

    console.log('Registration request received');
    console.log('Data directory:', path.dirname(usersFilePath));
    console.log('Users file path:', usersFilePath);

    // Валидация
    if (!firstName || !lastName || !email || !username || !password || !birthDate || !gender) {
      return res.status(400).json({ 
        success: false, 
        message: 'Все поля обязательны для заполнения' 
      });
    }

    // Читаем текущих пользователей
    const users = readUsers();
    console.log('Current users count:', users.length);

    // Проверка на существующего пользователя
    const existingUser = users.find(user => 
      user.email === email || user.username === username
    );

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Пользователь с таким email или именем уже существует' 
      });
    }

    // Создаем нового пользователя
    const newUser = {
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
      firstName,
      lastName,
      email,
      username,
      password, // В реальном приложении нужно хэшировать!
      birthDate,
      gender,
      agreeTerms: agreeTerms || false,
      newsletter: newsletter || false,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    // Добавляем пользователя и сохраняем
    users.push(newUser);
    const writeSuccess = writeUsers(users);

    if (!writeSuccess) {
      return res.status(500).json({ 
        success: false, 
        message: 'Ошибка сохранения данных' 
      });
    }

    console.log('User registered successfully. ID:', newUser.id);

    // Возвращаем ответ без пароля
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

// Получение всех пользователей
router.get('/', (req, res) => {
  try {
    const users = readUsers();
    // Убираем пароли из ответа
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    res.json(usersWithoutPasswords);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка получения пользователей' 
    });
  }
});

// Получение пользователя по ID
router.get('/:id', (req, res) => {
  try {
    const users = readUsers();
    const user = users.find(u => u.id === parseInt(req.params.id));
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Пользователь не найден' 
      });
    }

    // Убираем пароль из ответа
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка получения пользователя' 
    });
  }
});

export default router;