-- Module 3 — SQL CRUD (verbatim from the manual). Run while connected to student_management.

-- Insert (Create)
INSERT INTO students (name, branch, email, enrollment_date)
VALUES
    ('Alice Sharma',  'CSE', 'alice@example.com',  '2024-01-15'),
    ('Bilal Khan',    'ECE', 'bilal@example.com',  '2023-08-10'),
    ('Carla Gomez',   'CSE', 'carla@example.com',  '2024-03-02'),
    ('Divya Nair',    'ME',  'divya@example.com',  '2023-11-20'),
    ('Ethan Brooks',  'CSE', 'ethan@example.com',  '2024-02-18');

SELECT * FROM students;

-- Read (Retrieve)
-- all students in CSE
SELECT * FROM students WHERE branch = 'CSE';

-- students enrolled after Jan 2024
SELECT * FROM students WHERE enrollment_date > '2024-01-31';

-- case-insensitive name search
SELECT * FROM students WHERE name ILIKE 'a%';

-- Update
UPDATE students
SET branch = 'AI/ML'
WHERE email = 'bilal@example.com';

SELECT * FROM students WHERE email = 'bilal@example.com';

-- Delete
-- always check what you're about to delete first
SELECT * FROM students WHERE email = 'divya@example.com';

DELETE FROM students
WHERE email = 'divya@example.com';

SELECT * FROM students ORDER BY id;

-- Aggregation (bonus)
SELECT branch, COUNT(*) AS total
FROM students
GROUP BY branch
ORDER BY total DESC;

-- Constraints at work (not in the manual): duplicate email and missing name are refused
INSERT INTO students (name, branch, email) VALUES ('Alice Copy', 'CSE', 'alice@example.com');
INSERT INTO students (branch, email) VALUES ('CSE', 'noname@example.com');
-- id is GENERATED ALWAYS, so it cannot be set by hand
INSERT INTO students (id, name) VALUES (99, 'Manual Id');
-- enrollment_date falls back to CURRENT_DATE
INSERT INTO students (name, branch, email) VALUES ('Farah Ali', 'IT', 'farah@example.com');
SELECT id, name, enrollment_date, enrollment_date = CURRENT_DATE AS is_today FROM students WHERE email = 'farah@example.com';
