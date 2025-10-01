export interface NewsArticle {
    news_id: number;
    title: string;
    content: string;
    category_id: number;
    category_name?: string; // Optional: Name of the category
    author_id: string; // UUID of a user with 'admin' role
    author_name: string; // Name of the author or source
    published_at: string; // ISO 8601 date string
    updated_at: string; // ISO 8601 date string

}