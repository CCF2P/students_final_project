/**
 * Класс Library - управляет данными библиотеки
 * Отвечает за взаимодействие с API и хранение данных
 */
class Library {
    /**
     * Конструктор класса Library
     */
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
        // Если запрос пустой, не выполняем поиск
        if (!query || query.trim() === '') {
            throw new Error('Введите поисковый запрос');
        }

        this.currentQuery = query;
        this.currentPage = page;
        this.isLoading = true;

        try {
            // Формируем URL для запроса
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
     * Преобразует данные из API в объекты Book
     * @param {Array} apiData - Массив данных из API
     * @returns {Array} Массив объектов Book
     */
    transformApiData(apiData) {
        return apiData.map(item => {
            // Создаем объект с нужной структурой для конструктора Book
            const bookData = {
                id: item.key || item.id,
                title: item.title,
                authors: item.author_name || [],
                description: item.description,
                cover_i: item.cover_i,
                publishedDate: item.publish_date && item.publish_date[0],
                publisher: item.publisher && item.publisher[0],
                pageCount: item.number_of_pages_median || item.pages || 0,
                rating: item.ratings_average || 0
            };
            
            return new Book(bookData);
        });
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
        const itemsPerPage = 12;
        return this.currentPage * itemsPerPage < this.totalResults;
    }
}