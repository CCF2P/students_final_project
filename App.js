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
}