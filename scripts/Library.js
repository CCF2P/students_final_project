/**
 * Класс Library - управляет данными библиотеки
 * Отвечает за взаимодействие с API и хранение данных
 */
class Library {
    constructor() {
        this.searchResults = []; // Результаты поиска
        this.currentQuery = ''; // Текущий поисковый запрос
        this.currentPage = 1; // Текущая страница пагинации
        this.totalResults = 0; // Всего найдено книг
        this.isLoading = false; // Флаг загрузки
        this.API_BASE_URL = 'https://openlibrary.org/search.json'; // Базовый URL API
    }

    /**
     * Ищет книги по запросу через API
     * @param {string} query - Поисковый запрос
     * @param {number} page - Номер страницы (для пагинации)
     * @returns {Promise<Array>} Массив объектов Book
     */
    async searchBooks(query, page = 1) {
        this.currentQuery = query;
        this.currentPage = page;
        this.isLoading = true;

        try {
            // Формируем URL для запроса, с использование параметров поисковой строки
            const url = `${this.API_BASE_URL}?q=${encodeURIComponent(query)}&page=${page}&limit=12`;

            // Выполняем запрос к API
            const response = await fetch(url);

            // Проверяем статус ответа
            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }

            // Парсим JSON ответ
            const data = await response.json();

            // Сохраняем общее количество результатов
            this.totalResults = data.numFound || 0;

            // Преобразуем данные API в массив объектов Book
            this.searchResults = this.transformApiData(data.docs || []);

            // Сохраняем историю поиска
            this.saveSearchHistory(query);

            return this.searchResults;
        } catch (error) {
            console.error('Ошибка при поиске книг:', error);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Загружает следующую страницу результатов
     * @returns {Promise<Array>} Массив новых объектов Book
     */
    async loadNextPage() {
        if (!this.hasNextPage() || this.isLoading) {
            throw new Error('Нет следующей страницы или идет загрузка');
        }

        const nextPage = this.currentPage + 1;
        return this.searchBooks(this.currentQuery, nextPage);
    }

    normalizeID(rawID) {
        /**
         * ID из API может быть формата "/works/OL123456W", что неудобно для использования в DOM
         */
        if (!rawID)
            return "";
        return rawID.replace(/^\//, "").replace(/\//g, "_");
    }

    getDescription(item) {
        if (!item.description)
            return "";

        if (typeof (item.description) === "string")
            return item.description;

        if (Array.isArray(item.description))
            return item.description.join(" ");

        if (typeof (item.description) === "object" && item.description.value)
            return item.description.value;

        return String(item.description);
    }

    /**
     * Преобразует данные из API в объекты Book
     * @param {Array} apiData - Массив данных из API
     * @returns {Array} Массив объектов Book
     */
    transformApiData(apiData) {
        if (!Array.isArray(apiData)) {
            console.warn("API вернул не массив данных: ", apiData);
            return [];
        }

        return apiData.map(item => {
            // Валидация обязательных полей
            if (!item.title) {
                console.warn("Книга без названия пропущена: ", item);
                return null;
            }

            // Создаем объект с нужной структурой для конструктора Book
            const bookData = {
                id: this.normalizeID(item.key || item.id) || `book_${Date.now()}`, // Может быть "/works/OL123456W"
                title: item.title || "Без названия",
                authors: Array.isArray(item.author_name) ? item.author_name : [],
                description: this.getDescription(item),
                cover_i: item.cover_i,
                publishedDate: item.publish_date && item.publish_date[0],
                publisher: item.publisher && item.publisher[0],
                pageCount: item.number_of_pages_median || item.pages || 0,
                rating: item.ratings_average || 0
            };

            return bookData.id && bookData.title ? new Book(bookData) : null;
        }).filter(book => book !== null);
    }

    /**
     * Находит книгу по ID в результатах поиска
     * @param {string} bookId - ID книги
     * @returns {Book|null} Найденная книга или null
     */
    findBookById(bookId) {
        // Ищем в результатах поиска
        return this.searchResults.find(b => b.id === bookId) || null;
    }

    /**
     * Сохраняет историю поиска
     * @param {string} query - Поисковый запрос
     */
    saveSearchHistory(query) {
        try {
            let history = JSON.parse(localStorage.getItem('bookHive_searchHistory') || '[]');

            // Добавляем запрос в начало, удаляем дубликаты
            history = [query, ...history.filter(item => item !== query)].slice(0, 10);

            localStorage.setItem('bookHive_searchHistory', JSON.stringify(history));
        } catch (error) {
            console.error('Ошибка при сохранении истории поиска:', error);
        }
    }

    /**
     * Получает историю поиска
     * @returns {Array} Массив последних поисковых запросов
     */
    getSearchHistory() {
        try {
            return JSON.parse(localStorage.getItem('bookHive_searchHistory') || '[]');
        } catch (error) {
            console.error('Ошибка при загрузке истории поиска:', error);
            return [];
        }
    }

    /**
     * Очищает историю поиска
     */
    clearSearchHistory() {
        localStorage.removeItem('bookHive_searchHistory');
    }

    /**
     * Очищает результаты поиска
     */
    clearSearchResults() {
        this.searchResults = [];
        this.currentQuery = '';
        this.currentPage = 1;
        this.totalResults = 0;
    }

    /**
     * Проверяет, есть ли следующая страница результатов
     * @returns {boolean} true если есть следующая страница
     */
    hasNextPage() {
        return this.searchResults.length < this.totalResults;
    }
}