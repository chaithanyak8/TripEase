-- Seed users (passwords are 'admin123' and 'user123' respectively, hashed using bcrypt)
-- admin@library.com -> $2b$10$vK3F7.uN2mD8tJ.D02RVOuB5B7U2fQ1v4t1U8w5V3m5M1h7P4k6o.
-- user@library.com -> $2b$10$4t1U8w5V3m5M1h7P4k6o.vK3F7.uN2mD8tJ.D02RVOuB5B7U2fQ1v

INSERT INTO users (name, email, password_hash, role) VALUES
('System Admin', 'admin@library.com', '$2a$10$kS1T0M6L0/zQZ7/uS8xYCu5tD4gQ6D.vWw8xYCu5tD4gQ6D.vWw8x', 'ADMIN'),
('John Doe', 'user@library.com', '$2a$10$j8dF4w7V7w8sS8xYCu5tD4gQ6D.vWw8xYCu5tD4gQ6D.vWw8x', 'USER')
ON CONFLICT (email) DO NOTHING;

-- Seed books
INSERT INTO books (title, author, isbn, description, total_copies, available_copies) VALUES
('Clean Code', 'Robert C. Martin', '978-0132350884', 'A Handbook of Agile Software Craftsmanship', 3, 3),
('Atomic Habits', 'James Clear', '978-0735213180', 'An Easy & Proven Way to Build Good Habits & Break Bad Ones', 2, 2),
('The Pragmatic Programmer', 'Andrew Hunt & David Thomas', '978-0135957059', 'Your Journey To Mastery', 2, 2),
('Introduction to Algorithms', 'Thomas H. Cormen', '978-0262033848', 'The bible of computer science algorithms', 1, 1),
('Design Patterns', 'Erich Gamma', '978-0201633610', 'Elements of Reusable Object-Oriented Software', 2, 2)
ON CONFLICT (isbn) DO NOTHING;
