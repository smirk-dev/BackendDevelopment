-- Task 3 — one query per category, each filtering on a key only that category has.

-- book: more than 500 pages
SELECT name, attributes ->> 'author' AS author, (attributes ->> 'pages')::int AS pages
FROM products
WHERE category = 'book'
  AND (attributes ->> 'pages')::int > 500;

-- laptop: at least 16 GB RAM
SELECT name, attributes ->> 'cpu' AS cpu, (attributes ->> 'ram_gb')::int AS ram_gb
FROM products
WHERE category = 'laptop'
  AND (attributes ->> 'ram_gb')::int >= 16;

-- accessory: colour is black (and show the nested array as well)
SELECT name, attributes ->> 'color' AS color, attributes -> 'dpi' AS dpi_steps
FROM products
WHERE category = 'accessory'
  AND attributes ->> 'color' = 'black';

-- bonus: reach into a nested object with the path operator #>>
SELECT name, attributes #>> '{storage,type}' AS storage_type, (attributes #>> '{storage,gb}')::int AS gb
FROM products
WHERE attributes ? 'storage';
