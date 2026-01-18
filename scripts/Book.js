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
        if (!data || typeof(data) !== "object")
            throw new Error("Требуется объект для конструктора класса Book");

        // Базовые свойства, которые будут у каждой книги
        this.id = data.id || this.generateId(); // Уникальный идентификатор
        this.title = this.normalizeTitle(data);
        this.authors = this.normalizeAuthors(data);
        this.description = this.normalizeDescription(data);
        this.coverUrl = this.getCoverUrl(data);
        this.publishedDate = this.normalizePublishedDate(data);
        this.publisher = this.normalizePublisher(data);
        this.pageCount = this.normalizePageCount(data);
        this.rating = this.normalizeRating(data);
    }

    normalizeTitle(data) {
        const title = data.title || data.Title || "";
        return typeof(title) === "string" ? title.trim() || "Без названия" : "Без названния";
    }

    normalizeAuthors(data) {
        // authors как массив JS
        if (Array.isArray(data.authors))
            return data.authors;

        // author_name как массив Open Library
        if (Array.isArray(data.author_name))
            return data.author_name;

        // author как строка
        if (typeof(data.author) === "string" && data.author.trim())
            return [data.author];

        // author_name как строка
        if (typeof(data.author_name) === "string" && data.author_name.trim())
            return [data.author_name];

        return ["Неизвестный автор"];
    }

    normalizeDescription(data) {
        if (!data.description)
            return "Нет описания";

        if (typeof(data.description) === "string")
            return data.description.trim();

        // если описание - объект с полем value (Open Library)
        if (typeof(data.description) === "object" && data.description.value)
            return String(data.description.value);

        if (Array.isArray(data.description))
            return data.description.join(" ").trim();

        return String(data.description).trim() || "Нет описания";
    }

    /**
     * Генерирует уникальный ID для книги, если API не предоставляет
     * @returns {string} Случайный ID
     */
    generateId() {
        const timestamp = performance.now().toString(36).replace(',', '');
        const random = Math.random().toString(36).substring(2, 15);
        return `book_${timestamp}_${random}`;
    }

    /**
     * Получает URL обложки книги из данных API
     * Open Library API хранит обложки в поле 'cover_i'
     * Google Books API хранит в 'imageLinks.thumbnail'
     * @param {Object} data - Данные книги
     * @returns {string} URL обложки или заглушку
     */
    getCoverUrl(data) {
        // Прямой URL
        if (data.coverUrl && typeof(data.coverUrl) === "string")
            return data.coverUrl;
        if (data.coverURL && typeof(data.coverURL) === 'string')
            return data.coverURL;

        // Для Open Library API
        if (data.cover_i)
            return `https://covers.openlibrary.org/b/id/${data.cover_i}-M.jpg`;
        
        // Для Google Books API
        if (data.imageLinks && data.imageLinks.thumbnail)
            return data.imageLinks.thumbnail;

        // Другие варианты
        if (data.cover_image)
            return data.cover_image;

        // Заглушка, если обложки нет
        const width = 150;
        const height = 200;        
        return `https://via.placeholder.com/${width}x${height}?text=${encodeURIComponent(this.title || 'No+Cover')}`;
    }

    normalizePublishedDate(data) {
        const date = data.publishedDate || data.publish_date || data.PublishDate || "";
        if (Array.isArray(date) && date.length > 0)
            return String(date[0].trim() || "Не указано");

        return typeof(date) === "string" ? date.trim() || "Не указано" : "Не указано";
    }

    normalizePublisher(data) {
        const pub = data.publisher || data.Publisher || '';
        
        if (Array.isArray(pub) && pub.length > 0) {
            return String(pub[0]).trim() || 'Не указано';
        }
        
        return typeof pub === 'string' ? pub.trim() || 'Не указано' : 'Не указано';
    }

    normalizePageCount(data) {
        const pages = data.pageCount || data.pages || data.number_of_pages_median || 0;
        const num = parseInt(pages, 10);
        return isNaN(num) || num < 0 ? 0 : num;
    }
    
    normalizeRating(data) {
        const rating = data.rating || data.ratings_average || data.Rating || 0;
        const num = parseFloat(rating);
        return isNaN(num) || num < 0 ? 0 : Math.min(num, 5); // Ограничиваем 5
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
    getShortDescription(maxLength=200) {
        if (!this.description || this.description.trim() === "" || this.description === "Нет описания")
            return 'Нет описания';

        if (this.description.length <= maxLength)
            return this.description;

        // Обрезаем до последнего пробела, чтобы не резать слова
        const shortDesc = this.description.substring(0, maxLength);
        const lastSpace = shortDesc.lastIndexOf(' ');
        // Если есть разумное место для обрезки
        if (lastSpace > maxLength * 0.7)
            return shortDesc.substring(0, lastSpace) + "...";

        return shortDesc + '...';
    }

    /**
     * Возвращает год публикации
     * @returns {string} Год публикации или 'Не указан'
     */
    getPublicationYear() {
        if (!this.publishedDate || this.publishedDate === "Не указано")
            return 'Не указан';

        // Пытаемся извлечь год разными способами
        const dateStr = String(this.publishedDate);

        // Ищем 4 цифры подряд
        const yearMatch = dateStr.match(/\b(1[0-9]{3}|20[0-9]{2})\b/);
        if (yearMatch)
            return yearMatch[0];

        // Пытаемся разобрать как Date
        try {
            const date = new Date(dateStr);
            if (!isNaN(date.getFullYear()))
                return date.getFullYear().toString();
        } catch(e) {
            // игнорируем ошибки парсинга
        }

        // Возвращаем как есть
        return dateStr;
    }
}