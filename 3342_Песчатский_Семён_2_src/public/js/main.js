async function filterBooks(status) {
    try {
        const response = await fetch(`/api/books`);
        const books = await response.json();
        const now = new Date();
        
        const filteredBooks = books.filter(book => {
            // Фильтр по статусу
            if (status === 'available' && !book.isAvailable) return false;
            if (status === 'borrowed' && book.isAvailable) return false;
            if (status === 'overdue') {
                if (book.isAvailable) return false;
                if (new Date(book.dueDate) >= now) return false;
            }
            
            return true;
        });

        renderBooks(filteredBooks);
    } catch (error) {
        console.error('Ошибка фильтрации:', error);
    }
}

function renderBooks(books) {
    const booksList = document.getElementById('booksList');
    booksList.innerHTML = books.map(book => `
        <div class="w3-col l4 m6 s12 w3-margin-bottom">
            <div class="w3-card-4 book-card ${!book.isAvailable ? 'borrowed' : ''}">
                <div class="w3-container">
                    <h3>${book.title}</h3>
                    <p><strong>Автор:</strong> ${book.author}</p>
                    <p><strong>Год:</strong> ${book.year}</p>
                    
                    ${book.isAvailable ? 
                        '<span class="w3-tag w3-green">В наличии</span>' : 
                        `<div class="w3-margin-top">
                            <p><strong>Читатель:</strong> ${book.borrowedBy}</p>
                            <p><strong>Вернуть до:</strong> ${book.dueDate}</p>
                            ${new Date(book.dueDate) < new Date() ? '<span class="w3-tag w3-red">Просрочена</span>' : ''}
                        </div>`
                    }
                </div>
                <footer class="w3-container w3-light-grey">
                    <div class="w3-bar">
                        <a class="w3-bar-item w3-button w3-purple" href="/book/${book.id}">
                            <i class="fas fa-edit"></i>
                        </a>
                        <button class="w3-bar-item w3-button w3-red" onclick="deleteBook(${book.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                        ${book.isAvailable ? 
                            `<button class="w3-bar-item w3-button w3-green" onclick="borrowBook(${book.id})">
                                <i class="fas fa-hand-holding"></i>
                            </button>` :
                            `<button class="w3-bar-item w3-button w3-orange" onclick="returnBook(${book.id})">
                                <i class="fas fa-undo"></i>
                            </button>`
                        }
                    </div>
                </footer>
            </div>
        </div>
    `).join('');
}

// Удаление книги
async function deleteBook(bookId) {
    if (!confirm('Вы уверены, что хотите удалить эту книгу?')) return;
    
    try {
        const response = await fetch(`/api/books/${bookId}`, { method: 'DELETE' });
        if (response.ok) {
            location.reload();
        }
    } catch (error) {
        console.error('Ошибка удаления:', error);
    }
}

// Выдать книгу
function borrowBook(bookId) {
    currentBookId = bookId;
    document.getElementById('readerDialog').showModal();
}

// Вернуть книгу
async function returnBook(bookId) {
    try {
        const response = await fetch(`/api/books/${bookId}/return`, { method: 'POST' });
        if (response.ok) {
            location.reload();
        }
    } catch (error) {
        console.error('Ошибка возврата:', error);
    }
}

// Диалог выдачи книги
document.getElementById('borrowForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const readerName = formData.get('readerName');
    
    try {
        const response = await fetch(`/api/books/${currentBookId}/borrow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ readerName })
        });
        
        if (response.ok) {
            closeDialog();
            location.reload();
        }
    } catch (error) {
        console.error('Ошибка выдачи:', error);
    }
});

function closeDialog() {
    document.getElementById('readerDialog').close();
    document.getElementById('borrowForm').reset();
}

// Форма добавления книги
function showAddBookForm() {
    document.getElementById('addBookForm').style.display = 'block';
}

function hideAddBookForm() {
    document.getElementById('addBookForm').style.display = 'none';
}

const newBookForm = document.getElementById('newBookForm');
if (newBookForm) {
    newBookForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        
        try {
            const response = await fetch('/api/books', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: formData.get('title'),   
                    author: formData.get('author'),
                    year: formData.get('year')
                })
            });
            if (response.ok) {
                hideAddBookForm();
                location.reload();
            }
        } catch (error) {
            console.error('Ошибка добавления:', error);
        }
    });
}
const bookForm = document.getElementById('bookForm');
const btn_id = document.getElementById('btn_id');
if (bookForm) {
    bookForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const currentBookId = btn_id.dataset.id;
        
        try {
            const response = await fetch(`/api/books/${currentBookId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: formData.get('title'),   
                    author: formData.get('author'),
                    year: formData.get('year'),
                    
                })
            });
            if (response.ok) {
                location.reload();
            }
        } catch (error) {
            console.error('Ошибка редактирования:', error);
        }
    });
}
let currentBookId = null;