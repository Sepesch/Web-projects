const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const BOOKS_FILE = './books.json';

app.set('view engine', 'pug');
app.set('views', './views');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const readBooks = () => {
    try {
        const data = fs.readFileSync(BOOKS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { books: [] };
    }
};

const writeBooks = (data) => {
    fs.writeFileSync(BOOKS_FILE, JSON.stringify(data, null, 2));
};

const getNextId = (books) => {
    return books.length > 0 ? Math.max(...books.map(b => b.id)) + 1 : 1;
};


app.get('/', (req, res) => {
    const data = readBooks();
    res.render('index', { 
        books: data.books,
        filter: req.query.filter || 'all'
    });
});

app.get('/book/:id', (req, res) => {
    const data = readBooks();
    const book = data.books.find(b => b.id === parseInt(req.params.id));
    if (!book) {
        return res.status(404).send('Книга не найдена');
    }
    res.render('book', { book });
});

app.get('/api/books', (req, res) => {
    const data = readBooks();
    let books = data.books;
    
    const filter = req.query.filter;
    const today = new Date().toISOString().split('T')[0];
    
    if (filter === 'available') {
        books = books.filter(book => book.isAvailable);
    } else if (filter === 'overdue') {
        books = books.filter(book => !book.isAvailable && book.dueDate < today);
    }
    
    res.json(books);
});

app.post('/api/books', (req, res) => {
    const data = readBooks();
    const newBook = {
        id: getNextId(data.books),
        title: req.body.title,
        author: req.body.author,
        year: parseInt(req.body.year),
        isAvailable: true,
        borrowedBy: '',
        dueDate: '',
        borrowDate: ''
    };
    
    data.books.push(newBook);
    writeBooks(data);
    res.json(newBook);
});

app.put('/api/books/:id', (req, res) => {
    const data = readBooks();
    const bookIndex = data.books.findIndex(b => b.id === parseInt(req.params.id));
    
    if (bookIndex === -1) {
        return res.status(404).json({ error: 'Книга не найдена' });
    }
    
    data.books[bookIndex] = { ...data.books[bookIndex], ...req.body };
    writeBooks(data);
    res.json(data.books[bookIndex]);
});

app.delete('/api/books/:id', (req, res) => {
    const data = readBooks();
    const bookIndex = data.books.findIndex(b => b.id === parseInt(req.params.id));
    
    if (bookIndex === -1) {
        return res.status(404).json({ error: 'Книга не найдена' });
    }
    
    data.books.splice(bookIndex, 1);
    writeBooks(data);
    res.json({ success: true });
});

app.post('/api/books/:id/borrow', (req, res) => {
    const data = readBooks();
    const bookIndex = data.books.findIndex(b => b.id === parseInt(req.params.id));
    
    if (bookIndex === -1) {
        return res.status(404).json({ error: 'Книга не найдена' });
    }
    
    const borrowDate = new Date();
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + 1);
    
    data.books[bookIndex] = {
        ...data.books[bookIndex],
        isAvailable: false,
        borrowedBy: req.body.readerName,
        borrowDate: borrowDate.toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0]
    };
    
    writeBooks(data);
    res.json(data.books[bookIndex]);
});

app.post('/api/books/:id/return', (req, res) => {
    const data = readBooks();
    const bookIndex = data.books.findIndex(b => b.id === parseInt(req.params.id));
    
    if (bookIndex === -1) {
        return res.status(404).json({ error: 'Книга не найдена' });
    }
    
    data.books[bookIndex] = {
        ...data.books[bookIndex],
        isAvailable: true,
        borrowedBy: '',
        dueDate: '',
        borrowDate: ''
    };
    
    writeBooks(data);
    res.json(data.books[bookIndex]);
});

app.listen(PORT, () => {
    console.log(`Сервер библиотеки запущен на http://localhost:${PORT}`);
});