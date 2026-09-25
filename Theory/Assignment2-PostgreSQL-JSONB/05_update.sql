-- Task 5 — add a key to one row's jsonb without touching the table definition.
UPDATE products
SET attributes = attributes || '{"discount_pct": 10}'
WHERE name = 'Wireless Mouse';

SELECT name, attributes FROM products WHERE name = 'Wireless Mouse';

-- the same idea with jsonb_set (change a nested value) and the - operator (remove a key)
UPDATE products
SET attributes = jsonb_set(attributes, '{storage,gb}', '1024')
WHERE name = 'ThinkPad E14';

UPDATE products
SET attributes = attributes - 'edition'
WHERE name = 'Designing Data-Intensive Applications';

SELECT name, attributes FROM products WHERE name IN ('ThinkPad E14', 'Designing Data-Intensive Applications') ORDER BY id;

-- the table definition is unchanged: still exactly five columns
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'products' ORDER BY ordinal_position;
