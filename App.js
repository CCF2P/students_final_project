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
}