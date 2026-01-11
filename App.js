class App {
    constructor() {
        this.library = new Library();
        this.ui = new UI(this.library);

        this.handleSearch = this.handleSearch.bind(this);
        this.handleLoadMore = this.handleLoadMore.bind(this);
        this.handleFavoriteToggle = this.handleFavoriteToggle.bind(this);
        this.handleBookDetails = this.handleBookDetails.bind(this);
        this.handleClearHistory = this.handleClearHistory.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);

        // Флаг для предотвращения повторных запросов
        this.isSearching = false;
    }

    async init() {
        try {
            // Загружаем избранное из localStorage
            this.library.loadFromLocalStorage();

            // Инициализация UI
            this.ui.init();
            // Отрисовываем выбранное
            this.ui.renderFavorites();

            // Навешиваем обработчики событий
            this.bindEvents();
        } catch (error) {
            console.log("[ERROR] ", error);
            this.ui.showError("Не удалось создать приложение");
        }
    }

    bindEvents() {
        const elements = this.ui.elements;

        // Обработчик формы поиска
        if (elements.searchForm) {
            elements.searchForm.addEventListener("submit", this.handleSearch);
        }
        //  Обработчик кнопки поиска
        if (elements.searchButton) {
            elements.searchButton.addEventListener("submit", this.handleSearch);
        }
        // Обработчик поля ввода (поиск при нажатии Enter)
        if (elements.searchInput) {
            elements.searchInput.addEventListener("keypress", this.handleKeyPress);
        }
        // Обработчик кнопки "Загрузить еще"
        if (elements.loadMoreButton) {
            elements.loadMoreButton.addEventListener('click', this.handleLoadMore);
        }
        // Обработчик кнопки очистки истории
        if (elements.clearHistoryButton) {
            elements.clearHistoryButton.addEventListener('click', this.handleClearHistory);
        }

        // Делегирование событий для динамических элементов
        document.addEventListener('click', (event) => {
            // Обработка кликов по кнопкам избранного
            if (event.target.closest('.favorite-button')) {
                const button = event.target.closest('.favorite-button');
                const bookId = button.dataset.bookId;
                this.handleFavoriteToggle(bookId);
            }

            // Обработка кликов по кнопкам удаления из избранного
            if (event.target.closest('.remove-favorite-button')) {
                const button = event.target.closest('.remove-favorite-button');
                const bookId = button.dataset.bookId;
                this.handleFavoriteToggle(bookId);
            }

            // Обработка кликов по кнопкам "Подробнее"
            if (event.target.closest('.details-button')) {
                const button = event.target.closest('.details-button');
                const bookId = button.dataset.bookId;
                this.handleBookDetails(bookId);
            }

            // Обработка кликов по элементам истории поиска
            if (event.target.closest('.search-history-item')) {
                const item = event.target.closest('.search-history-item');
                elements.searchInput.value = item.textContent;
                this.handleSearch(new Event('submit'));
            }
        });
    }

    /**
     * Обрабатывает поиск книг
     * @param {Event} event - Событие отправки формы
    */
    async handleSearch(event) {
        event.preventDefault();

        // Если уже выполняется поиск, выходим
        if (this.isSearching) return;

        const query = this.ui.elements.searchInput.value.trim();

        // Если запрос пустой, показываем ошибку
        if (!query) {
            this.ui.showError('Введите поисковый запрос');
            return;
        }

        this.isSearching = true;
        this.ui.showLoading();
        this.ui.hideError();

        try {
            // Выполняем поиск
            await this.library.searchBooks(query, 1);

            // Отрисовываем результаты
            this.ui.renderSearchResults(this.library.searchResults);

            // Отрисовываем обновленную историю поиска
            this.ui.renderSearchHistory();

        } catch (error) {
            console.error('Ошибка при выполнении поиска:', error);
            this.ui.showError(error.message || 'Произошла ошибка при поиске книг');

            // Очищаем результаты при ошибке
            this.library.clearSearchResults();
            this.ui.renderSearchResults([]);

        } finally {
            this.isSearching = false;
            this.ui.hideLoading();
        }
    }

    async handleLoadMore() {
        if (this.isSearching || !this.library.hasNextPage()) return;

        this.isSearching = true;
        this.ui.showLoading();

        try {
            const nextPage = this.library.currentPage + 1;
            const newBooks = await this.library.searchBooks(
                this.library.currentQuery,
                nextPage
            );

            // Добавляем новые книги к существующим результатам
            this.library.searchResults = [...this.library.searchResults, ...newBooks];

            // Отрисовываем обновленные результаты
            this.ui.renderSearchResults(this.library.searchResults);

        } catch (error) {
            console.error('Ошибка при загрузке следующей страницы:', error);
            this.ui.showError('Не удалось загрузить дополнительные результаты');

        } finally {
            this.isSearching = false;
            this.ui.hideLoading();
        }
    }

    /**
     * Обрабатывает переключение состояния "избранное" для книги
     * @param {string} bookId - ID книги
     */
    handleFavoriteToggle(bookId) {
        try {
            this.ui.toggleFavorite(bookId);
        } catch (error) {
            console.error('Ошибка при изменении избранного:', error);
            this.ui.showError('Не удалось обновить избранное');
        }
    }

    /**
     * Обрабатывает показ деталей книги
     * @param {string} bookId - ID книги
     */
    handleBookDetails(bookId) {
        try {
            const book = this.library.findBookById(bookId);
            if (book) {
                this.ui.showBookDetails(book);
            }
        } catch (error) {
            console.error('Ошибка при показе деталей книги:', error);
            this.ui.showError('Не удалось загрузить информацию о книге');
        }
    }

    /**
     * Обрабатывает нажатие клавиш
     * @param {KeyboardEvent} event - Событие клавиатуры
     */
    handleKeyPress(event) {
        // Если нажата Enter в поле поиска, выполняем поиск
        if (event.key === 'Enter' && event.target === this.ui.elements.searchInput) {
            this.handleSearch(event);
        }
    }

    /**
     * Обрабатывает очистку истории поиска
     */
    handleClearHistory() {
        try {
            this.library.clearSearchHistory();
            this.ui.renderSearchHistory();
        } catch (error) {
            console.error('Ошибка при очистке истории:', error);
            this.ui.showError('Не удалось очистить историю поиска');
        }
    }

    /**
     * Восстанавливает последний поисковый запрос из localStorage
     */
    restoreLastSearch() {
        try {
            const history = this.library.getSearchHistory();
            if (history.length > 0) {
                // Устанавливаем последний запрос в поле ввода
                this.ui.elements.searchInput.value = history[0];
                // Опционально: автоматически выполнять поиск
                // this.handleSearch(new Event('submit'));
            }
        } catch (error) {
            console.error('Ошибка при восстановлении истории:', error);
        }
    }

    /**
     * Сохраняет состояние приложения перед закрытием
     */
    saveAppState() {
        try {
            const state = {
                searchQuery: this.library.currentQuery,
                currentPage: this.library.currentPage
            };
            localStorage.setItem('bookHive_appState', JSON.stringify(state));
        } catch (error) {
            console.error('Ошибка при сохранении состояния:', error);
        }
    }

    /**
     * Загружает сохраненное состояние приложения
     */
    loadAppState() {
        try {
            const state = JSON.parse(localStorage.getItem('bookHive_appState') || '{}');
            if (state.searchQuery) {
                this.ui.elements.searchInput.value = state.searchQuery;
            }
        } catch (error) {
            console.error('Ошибка при загрузке состояния:', error);
        }
    }

    /**
     * Сбрасывает состояние приложения
     */
    resetApp() {
        this.library.clearSearchResults();
        this.ui.renderSearchResults([]);
        this.ui.elements.searchInput.value = '';
        this.ui.hideError();
    }
}

// Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
    
    // Экспортируем app в глобальную область видимости для отладки
    window.app = app;
    
    // Сохраняем состояние при закрытии страницы
    window.addEventListener('beforeunload', () => {
        app.saveAppState();
    });
});