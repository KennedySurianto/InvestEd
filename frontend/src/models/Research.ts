export interface ResearchArticle {
    research_id: number;
    stock_symbol: string;
    title: string;
    content: string;
    author_id: string; // UUID of a user with 'admin' role
    published_at: string; // ISO 8601 date string
    updated_at: string; // ISO 8601 date string
}
