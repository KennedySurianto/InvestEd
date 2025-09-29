-- Create an ENUM type for user roles to ensure data integrity.
-- This restricts the 'role' column in the 'users' table to only accept 'member' or 'admin' as values.
CREATE TYPE user_role AS ENUM ('member', 'admin');

-- Users Table
-- Stores information about all users, including their credentials and role on the platform.
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'member',
    membership_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Course Categories Table
-- Organizes courses into broader categories like 'Stocks', 'Bonds', 'Cryptocurrency', etc.
CREATE TABLE course_categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Courses Table
-- Contains details for each course offered. An admin user is assigned as the author.
CREATE TABLE courses (
    course_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INT NOT NULL,
    author_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_course_category FOREIGN KEY(category_id) REFERENCES course_categories(category_id) ON DELETE CASCADE,
    CONSTRAINT fk_course_author FOREIGN KEY(author_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Course Lessons Table
-- Holds the content for each lesson within a course. 'lesson_order' helps in sequencing.
CREATE TABLE course_lessons (
    lesson_id SERIAL PRIMARY KEY,
    course_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    video_url VARCHAR(255), -- Optional: if lessons include video content
    lesson_order INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_lesson_course FOREIGN KEY(course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    UNIQUE(course_id, lesson_order) -- Ensures lesson order is unique within a course
);

-- User Course Enrollment Table
-- A linking table to track which users are enrolled in which courses and their overall progress.
CREATE TABLE user_course_enrollment (
    enrollment_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    course_id INT NOT NULL,
    enrollment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completion_status BOOLEAN NOT NULL DEFAULT FALSE,
    progress_percentage INT NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    CONSTRAINT fk_enrollment_user FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_enrollment_course FOREIGN KEY(course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    UNIQUE(user_id, course_id) -- A user can only enroll in a course once
);

-- User Lesson Completion Table
-- Tracks the completion status of each lesson for each enrolled user.
CREATE TABLE user_lesson_completion (
    completion_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    lesson_id INT NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_completion_user FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_completion_lesson FOREIGN KEY(lesson_id) REFERENCES course_lessons(lesson_id) ON DELETE CASCADE,
    UNIQUE(user_id, lesson_id) -- A user can complete a lesson only once
);

-- News Categories Table
-- Organizes news articles into relevant categories like 'Market Analysis', 'Company News', etc.
CREATE TABLE news_categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- News Table
-- Stores news articles. Each article is authored by an admin.
CREATE TABLE news (
    news_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category_id INT NOT NULL,
    author_id UUID NOT NULL,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_news_category FOREIGN KEY(category_id) REFERENCES news_categories(category_id) ON DELETE CASCADE,
    CONSTRAINT fk_news_author FOREIGN KEY(author_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Forums Table
-- Represents a forum thread started by a user.
CREATE TABLE forums (
    forum_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_forum_user FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Forum Replies Table
-- Stores replies to forum threads. 'parent_reply_id' allows for threaded, nested comments.
CREATE TABLE forum_replies (
    reply_id SERIAL PRIMARY KEY,
    forum_id INT NOT NULL,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    parent_reply_id INT, -- For creating threaded replies
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_reply_forum FOREIGN KEY(forum_id) REFERENCES forums(forum_id) ON DELETE CASCADE,
    CONSTRAINT fk_reply_user FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_parent_reply FOREIGN KEY(parent_reply_id) REFERENCES forum_replies(reply_id) ON DELETE CASCADE
);

-- Create indexes for frequently queried columns to improve performance.
CREATE INDEX idx_courses_category_id ON courses(category_id);
CREATE INDEX idx_lessons_course_id ON course_lessons(course_id);
CREATE INDEX idx_news_category_id ON news(category_id);
CREATE INDEX idx_forum_replies_forum_id ON forum_replies(forum_id);
CREATE INDEX idx_forum_replies_parent_reply_id ON forum_replies(parent_reply_id);
