-- Module 5 — JSONB in PostgreSQL (verbatim from the manual)

-- Add a flexible field to the relational table
ALTER TABLE students ADD COLUMN profile JSONB;

UPDATE students
SET profile = '{"skills": ["python", "sql"], "clubs": {"robotics": true}}'
WHERE email = 'alice@example.com';

-- Querying JSONB
-- -> returns JSON, ->> returns text
SELECT profile -> 'skills' FROM students WHERE email = 'alice@example.com';
SELECT profile ->> 'clubs' FROM students WHERE email = 'alice@example.com';

-- @> containment check (does profile include this key/value?)
SELECT * FROM students WHERE profile @> '{"clubs": {"robotics": true}}';

-- index JSONB for fast lookups, same idea as a MongoDB index
CREATE INDEX idx_students_profile ON students USING GIN (profile);

-- Beyond the manual: show the GIN index is usable and type the JSON result
\d students
UPDATE students SET profile = '{"skills": ["c", "verilog"], "clubs": {"robotics": false, "music": true}}' WHERE email = 'bilal@example.com';
SELECT name, branch, profile ->> 'skills' AS skills, (profile -> 'clubs' ->> 'robotics')::boolean AS robotics FROM students ORDER BY id;
SELECT name FROM students WHERE profile -> 'skills' ? 'sql';
SET enable_seqscan = off;
EXPLAIN SELECT * FROM students WHERE profile @> '{"clubs": {"robotics": true}}';
RESET enable_seqscan;
