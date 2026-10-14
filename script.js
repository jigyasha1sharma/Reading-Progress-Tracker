const addBookBtn = document.getElementById("addBookBtn");
const bookFormSection = document.getElementById("bookFormSection");
const bookForm = document.getElementById("bookForm");
const formTitle = document.getElementById("formTitle");
const saveBookBtn = document.getElementById("saveBookBtn");
const cancelBtn = document.getElementById("cancelBtn");

const bookTitle = document.getElementById("bookTitle");
const bookAuthor = document.getElementById("bookAuthor");
const totalPages = document.getElementById("totalPages");
const currentPage = document.getElementById("currentPage");
const bookStatus = document.getElementById("bookStatus");

const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const booksContainer = document.getElementById("booksContainer");
const formMessage = document.getElementById("formMessage");

const totalBooksElement = document.getElementById("totalBooks");
const readingBooksElement = document.getElementById("readingBooks");
const completedBooksElement = document.getElementById("completedBooks");
const pagesReadElement = document.getElementById("pagesRead");

let books = [];

try {
    const savedBooks = JSON.parse(localStorage.getItem("readingBooks"));
    books = Array.isArray(savedBooks) ? savedBooks : [];
} catch {
    books = [];
}

let editingBookId = null;

function saveBooks() {
    localStorage.setItem("readingBooks", JSON.stringify(books));
}

function showForm() {
    bookFormSection.style.display = "block";
    formMessage.textContent = "";
    addBookBtn.style.display = "none";
    bookTitle.focus();
}

function hideForm() {
    bookFormSection.style.display = "none";
    addBookBtn.style.display = "inline-block";

    bookForm.reset();
    currentPage.value = 0;
    bookStatus.value = "want";

    editingBookId = null;
    formTitle.textContent = "Add a Book";
    saveBookBtn.textContent = "Save Book";
    formMessage.textContent = "";
}

addBookBtn.addEventListener("click", showForm);

cancelBtn.addEventListener("click", hideForm);

function calculateStatus(book) {
    if (book.currentPage === book.totalPages) {
        return "completed";
    }

    if (book.currentPage > 0) {
        return "reading";
    }

    return book.status === "completed" ? "want" : book.status;
}

bookForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const title = bookTitle.value.trim();
    const author = bookAuthor.value.trim();
    const total = Number(totalPages.value);
    const current = Number(currentPage.value);

    if (!title || !author) {
        formMessage.textContent = "Please enter the book title and author.";
        return;
    }

    if (
        !Number.isInteger(total) ||
        !Number.isInteger(current) ||
        total < 1 ||
        current < 0 ||
        current > total
    ) {
        formMessage.textContent =
            "Enter valid pages. Current page must be between 0 and total pages.";
        return;
    }

    const selectedStatus = bookStatus.value;

    if (selectedStatus === "completed" && current !== total) {
        formMessage.textContent =
            "For a completed book, current page must equal total pages.";
        return;
    }

    if (selectedStatus === "reading" && current === 0) {
        formMessage.textContent =
            "Enter a current page greater than 0 for a book you're reading.";
        return;
    }

    if (selectedStatus === "want" && current !== 0) {
        formMessage.textContent =
            "For a book you want to read, current page must be 0.";
        return;
    }

    if (editingBookId !== null) {
        const book = books.find(item => item.id === editingBookId);

        if (book) {
            book.title = title;
            book.author = author;
            book.totalPages = total;
            book.currentPage = current;
            book.status = selectedStatus;
        }
    } else {
        const newBook = {
            id: Date.now().toString() + Math.random().toString(36).slice(2),
            title,
            author,
            totalPages: total,
            currentPage: current,
            status: selectedStatus
        };

        books.push(newBook);
    }

    saveBooks();
    renderBooks();
    updateStatistics();
    hideForm();
});

function renderBooks() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedFilter = statusFilter.value;

    const filteredBooks = books.filter(book => {
        const matchesSearch =
            book.title.toLowerCase().includes(searchTerm) ||
            book.author.toLowerCase().includes(searchTerm);

        const matchesStatus =
            selectedFilter === "all" ||
            calculateStatus(book) === selectedFilter;

        return matchesSearch && matchesStatus;
    });

    booksContainer.innerHTML = "";

    if (filteredBooks.length === 0) {
        const emptyState = document.createElement("div");
        emptyState.className = "empty-state";

        const heading = document.createElement("h3");
        const paragraph = document.createElement("p");

        if (books.length === 0) {
            heading.textContent = "No books added yet";
            paragraph.textContent =
                "Add a book to start tracking your reading progress.";
        } else {
            heading.textContent = "No books found";
            paragraph.textContent =
                "Try changing your search or filter.";
        }

        emptyState.append(heading, paragraph);
        booksContainer.appendChild(emptyState);
        return;
    }

    filteredBooks.forEach(book => {
        const progress = Math.round(
            (book.currentPage / book.totalPages) * 100
        );

        const status = calculateStatus(book);

        const card = document.createElement("article");
        card.className = "book-card";

        const title = document.createElement("h3");
        title.textContent = book.title;

        const author = document.createElement("p");
        author.className = "book-author";
        author.textContent = `By ${book.author}`;

        const statusLabel = document.createElement("span");
        statusLabel.className = `book-status status-${status}`;
        statusLabel.textContent = {
            want: "Want to Read",
            reading: "Currently Reading",
            completed: "Completed"
        }[status];

        const details = document.createElement("div");
        details.className = "book-details";

        const pageCount = document.createElement("span");
        pageCount.textContent =
            `${book.currentPage} / ${book.totalPages} pages`;

        const percentage = document.createElement("span");
        percentage.textContent = `${progress}%`;

        details.append(pageCount, percentage);

        const progressBar = document.createElement("div");
        progressBar.className = "progress-bar";

        const progressFill = document.createElement("div");
        progressFill.className = "progress-fill";
        progressFill.style.width = `${progress}%`;

        progressBar.appendChild(progressFill);

        const progressText = document.createElement("p");
        progressText.className = "progress-text";
        progressText.textContent =
            progress === 100
                ? "You've finished this book."
                : `${book.totalPages - book.currentPage} pages left`;

        const actions = document.createElement("div");
        actions.className = "book-actions";

        const editBtn = document.createElement("button");
        editBtn.className = "edit-btn";
        editBtn.textContent = "Edit";

        editBtn.addEventListener("click", () => editBook(book.id));

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "Delete";

        deleteBtn.addEventListener("click", () => deleteBook(book.id));

        actions.append(editBtn, deleteBtn);

        card.append(
            title,
            author,
            statusLabel,
            details,
            progressBar,
            progressText,
            actions
        );

        booksContainer.appendChild(card);
    });
}

function editBook(id) {
    const book = books.find(item => item.id === id);

    if (!book) return;

    editingBookId = id;

    bookTitle.value = book.title;
    bookAuthor.value = book.author;
    totalPages.value = book.totalPages;
    currentPage.value = book.currentPage;
    bookStatus.value = calculateStatus(book);

    formTitle.textContent = "Edit Book";
    saveBookBtn.textContent = "Update Book";

    showForm();

    formTitle.textContent = "Edit Book";
    saveBookBtn.textContent = "Update Book";

    bookFormSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function deleteBook(id) {
    const confirmed = confirm("Do you want to delete this book?");

    if (!confirmed) return;

    books = books.filter(book => book.id !== id);

    saveBooks();
    renderBooks();
    updateStatistics();

    if (editingBookId === id) {
        hideForm();
    }
}

function updateStatistics() {
    totalBooksElement.textContent = books.length;

    readingBooksElement.textContent = books.filter(
        book => calculateStatus(book) === "reading"
    ).length;

    completedBooksElement.textContent = books.filter(
        book => calculateStatus(book) === "completed"
    ).length;

    const totalPagesRead = books.reduce(
        (total, book) => total + book.currentPage,
        0
    );

    pagesReadElement.textContent = totalPagesRead;
}

searchInput.addEventListener("input", renderBooks);

statusFilter.addEventListener("change", renderBooks);

renderBooks();
updateStatistics();