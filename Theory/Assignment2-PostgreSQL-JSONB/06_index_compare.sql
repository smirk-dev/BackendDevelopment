-- Task 6 — GIN index, with EXPLAIN ANALYZE before and after.
--
-- Five rows fit in one 8 KB page, so the planner reads the whole table no matter what indexes
-- exist; a before/after on five rows shows nothing. This script first adds 200,000 generated
-- products (rows 6+), shaped like the real ones, so the plans have something to choose between.
-- About 1 in 200 generated accessories is wireless, which keeps the containment query selective.

INSERT INTO products (name, category, price, attributes)
SELECT
    'Generated ' || cat || ' #' || g,
    cat,
    round((100 + random() * 90000)::numeric, 2),
    CASE cat
        WHEN 'book' THEN jsonb_build_object('author', 'Author ' || (g % 5000), 'pages', 80 + (g % 900))
        WHEN 'laptop' THEN jsonb_build_object('ram_gb', (ARRAY[4, 8, 8, 16, 32])[1 + g % 5], 'cpu', 'CPU-' || (g % 40))
        ELSE jsonb_build_object('color', (ARRAY['black', 'white', 'grey', 'blue'])[1 + g % 4], 'wireless', (g % 200 = 0))
    END
FROM generate_series(1, 200000) AS g,
     LATERAL (SELECT (ARRAY['book', 'laptop', 'accessory'])[1 + g % 3] AS cat) AS c;

ANALYZE products;

SELECT category, count(*) FROM products GROUP BY category ORDER BY category;
SELECT pg_size_pretty(pg_relation_size('products')) AS table_size;

-- ---------- BEFORE: no index on attributes ----------
DROP INDEX IF EXISTS idx_products_attributes;

\echo '=== BEFORE  containment @> {"wireless": true}'
EXPLAIN ANALYZE SELECT name FROM products WHERE attributes @> '{"wireless": true}';

\echo '=== BEFORE  Task 3 laptop query (->> with a cast)'
EXPLAIN ANALYZE SELECT name, attributes ->> 'cpu' AS cpu FROM products
WHERE category = 'laptop' AND (attributes ->> 'ram_gb')::int >= 16;

\echo '=== BEFORE  key-exists ? storage'
EXPLAIN ANALYZE SELECT name FROM products WHERE attributes ? 'storage';

-- ---------- the index from the assignment ----------
CREATE INDEX idx_products_attributes ON products USING GIN (attributes);
ANALYZE products;
SELECT pg_size_pretty(pg_relation_size('idx_products_attributes')) AS gin_index_size;

\echo '=== AFTER  containment @> {"wireless": true}'
EXPLAIN ANALYZE SELECT name FROM products WHERE attributes @> '{"wireless": true}';

\echo '=== AFTER  Task 3 laptop query (->> with a cast)'
EXPLAIN ANALYZE SELECT name, attributes ->> 'cpu' AS cpu FROM products
WHERE category = 'laptop' AND (attributes ->> 'ram_gb')::int >= 16;

\echo '=== AFTER  key-exists ? storage'
EXPLAIN ANALYZE SELECT name FROM products WHERE attributes ? 'storage';

-- ---------- what fixes the ->> query: an expression index ----------
CREATE INDEX idx_products_ram ON products (((attributes ->> 'ram_gb')::int)) WHERE category = 'laptop';
ANALYZE products;

\echo '=== AFTER expression index  Task 3 laptop query, rarer value (>= 32)'
EXPLAIN ANALYZE SELECT name FROM products
WHERE category = 'laptop' AND (attributes ->> 'ram_gb')::int >= 32;
