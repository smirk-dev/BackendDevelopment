-- Task 4 — containment: does attributes contain this key/value pair?
SELECT name FROM products WHERE attributes @> '{"wireless": true}';

-- containment also works on nested objects and on array members
SELECT name FROM products WHERE attributes @> '{"storage": {"type": "ssd"}}';
SELECT name FROM products WHERE attributes @> '{"dpi": [1600]}';

-- the four operators from Part A, question 3, on one row
SELECT attributes -> 'author'           AS arrow_json,
       pg_typeof(attributes -> 'author') AS arrow_type,
       attributes ->> 'author'          AS arrow_text,
       pg_typeof(attributes ->> 'author') AS arrow_text_type,
       attributes @> '{"pages": 464}'   AS contains_464,
       attributes ? 'pages'             AS has_pages_key
FROM products WHERE name = 'Clean Code';
