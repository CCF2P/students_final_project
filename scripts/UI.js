/**
 * Класс UI - отвечает за отображение данных и взаимодействие с пользователем
 * Управляет DOM элементами и визуальным состоянием приложения
 */
class UI {
    /**
     * Конструктор класса UI
     * @param {Library} library - Экземпляр класса Library
     */
    constructor(library) {
        this.library = library;

        // Кэшируем часто используемые DOM элементы
        this.elements = {
            searchForm: document.getElementById('searchForm'),
            searchInput: document.getElementById('searchInput'),
            searchButton: document.getElementById('searchButton'),
            searchResults: document.getElementById('searchResults'),
            favoritesList: document.getElementById('favoritesList'),
            loadingSpinner: document.getElementById('loadingSpinner'),
            errorContainer: document.getElementById('errorContainer'),
            resultsCount: document.getElementById('resultsCount'),
            loadMoreButton: document.getElementById('loadMoreButton'),
            searchHistory: document.getElementById('searchHistory'),
            clearHistoryButton: document.getElementById('clearHistoryButton')
        };

        // Шаблоны для создания элементов
        this.templates = {
            bookCard: this.createBookCardTemplate()
        };
    }

    /**
     * Инициализирует UI компоненты
     */
    init() {
        this.hideError();
    }

    /**
     * Показывает индикатор загрузки
     */
    showLoading() {
        if (this.elements.loadingSpinner) {
            this.elements.loadingSpinner.classList.remove('hidden');
        }
    }

    /**
     * Скрывает индикатор загрузки
     */
    hideLoading() {
        if (this.elements.loadingSpinner) {
            this.elements.loadingSpinner.classList.add('hidden');
        }
    }

    /**
     * Показывает сообщение об ошибке
     * @param {string} message - Текст сообщения об ошибке
     */
    showError(message) {
        if (this.elements.errorContainer) {
            this.elements.errorContainer.textContent = message;
            this.elements.errorContainer.classList.remove('hidden');
        }
    }

    /**
     * Скрывает сообщение об ошибке
     */
    hideError() {
        if (this.elements.errorContainer) {
            this.elements.errorContainer.classList.add('hidden');
        }
    }

    /**
     * Отрисовывает результаты поиска
     * @param {Array} books - Массив объектов Book для отображения
     */
    renderSearchResults(books) {
        const container = this.elements.searchResults;
        if (!container) return;

        // Очищаем контейнер
        container.innerHTML = '';

        // Если результатов нет, показываем сообщение
        if (!books || books.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <h3>Книги не найдены</h3>
                    <p>Попробуйте изменить поисковый запрос</p>
                </div>
            `;
            return;
        }

        // Создаем и добавляем карточки книг
        books.forEach(book => {
            const card = this.createBookCardElement(book);
            container.appendChild(card);
        });

        // Обновляем счетчик результатов
        this.updateResultsCount();

        // Показываем/скрываем кнопку "Загрузить еще"
        this.updateLoadMoreButton();
    }

    /**
     * Создает DOM элемент карточки книги
     * @param {Book} book - Объект книги
     * @returns {HTMLElement} DOM элемент карточки
     */
    createBookCardElement(book) {
        const card = document.createElement('div');
        card.className = 'book-card';
        card.dataset.bookId = book.id;

        card.innerHTML = `
            <div class="book-cover">
                <img src="${book.coverUrl}" alt="Обложка: ${book.title}" 
                     onerror="this.src='https://via.placeholder.com/150x200?text=No+Cover'">
            </div>
            <div class="book-info">
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">${book.getFormattedAuthors()}</p>
                <p class="book-year">${book.getPublicationYear()}</p>
                <p class="book-description">${book.getShortDescription(150)}</p>
                <div class="book-actions">
                    <button class="details-button" data-book-id="${book.id}">
                        Подробнее
                    </button>
                </div>
            </div>
        `;

        return card;
    }

    /**
     * Обновляет счетчик результатов поиска
     */
    updateResultsCount() {
        if (this.elements.resultsCount) {
            const count = this.library.totalResults;
            this.elements.resultsCount.textContent =
                `Найдено книг: ${count.toLocaleString('ru-RU')}`;
        }
    }

    /**
     * Обновляет состояние кнопки "Загрузить еще"
     */
    updateLoadMoreButton() {
        if (this.elements.loadMoreButton) {
            if (this.library.hasNextPage()) {
                this.elements.loadMoreButton.classList.remove('hidden');
            } else {
                this.elements.loadMoreButton.classList.add('hidden');
            }
        }
    }

    /**
     * Показывает модальное окно с деталями книги
     * @param {Book} book - Объект книги
     */
    showBookDetails(book) {
        // Создаем модальное окно
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="close-modal">&times;</button>
                <div class="modal-body">
                    <div class="modal-cover">
                        <img src="${book.coverUrl}" alt="Обложка: ${book.title}">
                    </div>
                    <div class="modal-info">
                        <h2>${book.title}</h2>
                        <p><strong>Автор:</strong> ${book.getFormattedAuthors()}</p>
                        <p><strong>Год издания:</strong> ${book.getPublicationYear()}</p>
                        <p><strong>Издатель:</strong> ${book.publisher}</p>
                        <p><strong>Количество страниц:</strong> ${book.pageCount || 'Не указано'}</p>
                        <div class="modal-description">
                            <h3>Описание</h3>
                            <p>${book.description || 'Нет описания'}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Добавляем модальное окно в DOM
        document.body.appendChild(modal);

        // Добавляем обработчики событий
        const closeButton = modal.querySelector('.close-modal');

        closeButton.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        // Закрытие по клику вне контента
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    /**
     * Отрисовывает историю поиска
     */
    renderSearchHistory() {
        const container = this.elements.searchHistory;
        if (!container) return;

        const history = this.library.getSearchHistory();

        container.innerHTML = '';

        if (history.length === 0) {
            container.innerHTML = '<p>История поиска пуста</p>';
            return;
        }

        history.forEach(query => {
            const item = document.createElement('div');
            item.className = 'search-history-item';
            item.textContent = query;
            item.addEventListener('click', () => {
                this.elements.searchInput.value = query;
                // Инициируем поиск
                this.elements.searchForm.dispatchEvent(new Event('submit'));
            });
            container.appendChild(item);
        });
    }

    /**
     * Создает шаблон карточки книги (для возможного использования с template)
     * @returns {string} HTML шаблон
     */
    createBookCardTemplate() {
        return `
            <div class="book-card" data-book-id="{{id}}">
                <div class="book-cover">
                    <img src="{{coverUrl}}" alt="{{title}}">
                </div>
                <div class="book-info">
                    <h3>{{title}}</h3>
                    <p>{{authors}}</p>
                    <p>{{description}}</p>
                </div>
            </div>
        `;
    }
}