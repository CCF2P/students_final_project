/**
 * Класс Book - представляет модель книги
 * Инкапсулирует данные о книге и методы для их обработки
 */
class Book {
    /**
     * Конструктор класса Book
     * @param {Object} data - Объект с данными о книге (обычно из API)
     */
    constructor(data) {
        // Базовые свойства, которые будут у каждой книги
        this.id = data.id || this.generateId(); // Уникальный идентификатор
        this.title = data.title || 'Без названия';
        this.authors = Array.isArray(data.authors) ? data.authors : 
                      (data.author_name || [data.author] || ['Неизвестный автор']);
        this.description = data.description || 
                          (typeof data.description === 'object' ? 
                           data.description.value || 'Нет описания' : 
                           'Нет описания');
        this.coverUrl = this.getCoverUrl(data);
        this.publishedDate = data.publishedDate || 
                            (data.publish_date && data.publish_date[0]) || 
                            'Не указано';
        this.publisher = data.publisher || 
                        (data.publisher && data.publisher[0]) || 
                        'Не указано';
        this.pageCount = data.pageCount || 0;
    }

    /**
     * Генерирует уникальный ID для книги, если API не предоставляет
     * @returns {string} Случайный ID
     */
    generateId() {
        return 'book_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Получает URL обложки книги из данных API
     * Open Library API хранит обложки в поле 'cover_i'
     * Google Books API хранит в 'imageLinks.thumbnail'
     * @param {Object} data - Данные книги
     * @returns {string} URL обложки или заглушку
     */
    getCoverUrl(data) {
        // Для Open Library API
        if (data.cover_i) {
            return `https://covers.openlibrary.org/b/id/${data.cover_i}-M.jpg`;
        }
        
        // Для Google Books API
        if (data.imageLinks && data.imageLinks.thumbnail) {
            return data.imageLinks.thumbnail;
        }
        
        // Если есть прямая ссылка
        if (data.coverUrl) {
            return data.coverUrl;
        }
        
        // Заглушка, если обложки нет
        return 'https://via.placeholder.com/150x200?text=No+Cover';
    }

    /**
     * Форматирует список авторов в строку
     * @returns {string} Строка с авторами, разделенными запятыми
     */
    getFormattedAuthors() {
        if (!this.authors || this.authors.length === 0) {
            return 'Автор не указан';
        }
        return this.authors.join(', ');
    }

    /**
     * Обрезает описание до указанной длины
     * @param {number} maxLength - Максимальная длина описания
     * @returns {string} Обрезанное описание с многоточием
     */
    getShortDescription(maxLength = 200) {
        if (!this.description || this.description.length <= maxLength) {
            return this.description || 'Нет описания';
        }
        return this.description.substring(0, maxLength) + '...';
    }

    /**
     * Возвращает год публикации
     * @returns {string} Год публикации или 'Не указан'
     */
    getPublicationYear() {
        if (!this.publishedDate) return 'Не указан';
        
        // Пытаемся извлечь год из даты
        const yearMatch = this.publishedDate.match(/\d{4}/);
        return yearMatch ? yearMatch[0] : this.publishedDate;
    }
}