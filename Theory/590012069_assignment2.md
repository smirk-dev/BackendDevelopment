# Assignment 2 — PostgreSQL as SQL + NoSQL: Working with JSONB

**Name:** Suryansh Mishra  **SAP ID:** 590012069  **Course:** Backend Development (CSFS3008P), B.Tech Sem 5
**Runnable files:** [`Assignment2-PostgreSQL-JSONB/`](Assignment2-PostgreSQL-JSONB/) (`01_schema.sql` to `06_index_compare.sql`, `07_mongodb.js`, raw output in `output/`)

Everything in Part B was run on PostgreSQL 17.12 (Docker container `bdtheory-postgres`, image
`postgres:17-alpine`, host port 5434) and MongoDB 8.2.1 with mongosh 2.5.3. The outputs below are
pasted from those runs, not typed by hand.

---

## Part A — Conceptual questions

### 1. What is `jsonb`, and how does it differ from `json`?

Both types accept the same JSON text. The difference is what PostgreSQL keeps on disk. A `json`
column stores the text exactly as it was sent: spaces, key order and duplicate keys are all
preserved, and the server parses that text again every time a query reaches into it. A `jsonb`
column is parsed once, on the way in, and saved in a binary tree format. Keys are sorted, whitespace
is dropped, and if a key appears twice only the last value survives.

```sql
SELECT '{"b":1, "a":2, "a":3}'::json  AS as_json,    -- {"b":1, "a":2, "a":3}
       '{"b":1, "a":2, "a":3}'::jsonb AS as_jsonb;   -- {"a": 3, "b": 1}
```

That one-time parse is the trade-off. Writes cost a bit more, and the stored value can be slightly
larger: the Clean Code attributes take 48 bytes as `json` and 60 as `jsonb` (`pg_column_size`). When
I inserted 300,000 generated documents into a temporary table of each type, `json` took 511 ms and
`jsonb` took 608 ms. Reads go the other way. Filtering those same rows on `(doc->>'pages')::int = 464`
took 171 ms on `json` and 53 ms on `jsonb`, because nothing has to be re-parsed.

The bigger difference is indexing. `jsonb` supports GIN indexes and the containment (`@>`) and
key-exists (`?`) operators; plain `json` has no equality operator at all, so it cannot be indexed
that way. I would only pick `json` to keep a payload byte-for-byte, such as a webhook body kept for
audit.

### 2. How can one table be both SQL and NoSQL?

The idea is to split each row into the part every row shares and the part that changes from row to
row. The shared part goes into normal typed columns with constraints. The varying part goes into one
`jsonb` column that has no fixed shape.

```sql
CREATE TABLE products (
    id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name       VARCHAR(100)  NOT NULL,
    category   VARCHAR(50)   NOT NULL,
    price      NUMERIC(10,2) NOT NULL,
    attributes JSONB
);
```

In a shop catalogue every product has a name, a category and a price, so those columns are
`NOT NULL`, typed and safe to sort, sum and join on. A price of `'abc'` is rejected by the
database itself. What a product *is* depends on its category: a book has an author and a page count,
a laptop has RAM and a CPU, a mouse has a colour and a wireless flag. Making a column for every one
of those would leave most cells NULL, and each new category would need an `ALTER TABLE`. Inside
`attributes` each row carries only its own keys, much like a MongoDB document.

One query can then use both halves:

```sql
SELECT name, price FROM products
WHERE price < 50000 AND attributes ->> 'cpu' LIKE 'Core%';
```

`price < 50000` is ordinary SQL on a typed column; the `cpu` test reads inside the document. The
row stays in one table with one transaction, and you still get foreign keys and joins on the fixed
columns.

### 3. The `->`, `->>`, `@>` and `?` operators

These were run against the Clean Code row (`{"pages": 464, "author": "Robert C. Martin"}`):

```sql
SELECT attributes -> 'author'          AS arrow,        -- "Robert C. Martin"   (type jsonb)
       attributes ->> 'author'         AS arrow_text,   -- Robert C. Martin     (type text)
       attributes @> '{"pages": 464}'  AS contains,     -- t
       attributes ? 'pages'            AS has_key       -- t
FROM products WHERE name = 'Clean Code';
```

`->` takes a key and gives back the value still as `jsonb`. You can see the quotes around the
author's name in the output, because it is a JSON string, not SQL text. That makes `->` the
operator to chain when going deeper, for example `attributes -> 'storage' -> 'type'`.

`->>` does the same lookup but returns `text`. You use it at the end of a path, when you want to
compare, print or cast the value: `(attributes ->> 'pages')::int > 500`. Casting the result of `->`
only works when the JSON value is already a number. If a page count was stored as `"464"`,
`(attributes -> 'pages')::int` fails with "cannot cast jsonb string to type integer", while the
`->>` version still works.

`@>` asks "does the left document contain the right one?" It returns a boolean and matches nested
objects and array members too: `attributes @> '{"dpi": [1600]}'` is true for the mouse.

`?` asks whether a top-level key exists, whatever its value. `attributes ? 'storage'` returned the
two laptops and nothing else.

### 4. What a GIN index changes

A GIN (Generalized Inverted Index) on a `jsonb` column breaks every document into its keys and
key-value pairs and keeps, for each one, the list of rows that contain it. It works like the index
at the back of a book. A query like `attributes @> '{"wireless": true}'` then looks up that single
entry instead of opening every row.

On my 200,005-row table, before the index:

```
Seq Scan on products ... (actual time=0.070..25.713 rows=335 loops=1)
  Rows Removed by Filter: 199670
Execution Time: 25.739 ms
```

After `CREATE INDEX idx_products_attributes ON products USING GIN (attributes);`:

```
Bitmap Heap Scan on products ... (actual time=0.624..0.959 rows=335 loops=1)
  ->  Bitmap Index Scan on idx_products_attributes
Execution Time: 1.015 ms
```

That is roughly 25 times faster. The key-exists query `attributes ? 'storage'` dropped from 17 ms to
0.04 ms. The default operator class handles `@>`, `?`, `?|` and `?&`.

It does **not** help a query that pulls a value out and compares it, such as the Task 3 laptop
filter `(attributes ->> 'ram_gb')::int >= 16`. The GIN index stores "ram_gb is 16" as a fact; it
knows nothing about greater-than. The plan stayed a sequential scan (20.1 ms before, 19.4 ms after).
For that query I needed a B-tree expression index on `((attributes ->> 'ram_gb')::int)`.

### 5. When can PostgreSQL + `jsonb` replace MongoDB?

**Transactions.** PostgreSQL has always had ACID transactions across any number of tables.
MongoDB added multi-document transactions in 4.0, but they have a time limit and cost more, and its
documentation still says to fit related data into one document. An order that updates stock,
payment and the order row together is easier to trust in PostgreSQL.

**Joins.** A `jsonb` column sits next to normal columns, so it joins with `customers` or `orders`
using plain SQL and foreign keys. MongoDB's `$lookup` works but is awkward, so data usually ends up
copied between documents.

```sql
SELECT o.id, p.name, p.attributes ->> 'cpu'
FROM orders o JOIN products p ON p.id = o.product_id;
```

**Schema enforcement.** Postgres gives strict typed columns for the shared fields and a free-form
`jsonb` for the rest, and a `CHECK` constraint can add rules inside it, for example
`CHECK (category <> 'book' OR attributes ? 'author')`. MongoDB has `$jsonSchema` validators, but
they are optional and off by default.

**Horizontal scaling.** This is where MongoDB still wins. Sharding is built in: you choose a shard
key and the cluster spreads data and queries across machines. Core PostgreSQL scales up on one
primary with read replicas; going wider needs Citus or sharding in the application.

So for an app on one or two servers with relational data and some flexible fields (a catalogue,
user settings, event payloads), PostgreSQL with `jsonb` is enough and saves running a second
database. For write-heavy document data spread over many machines, such as IoT readings, MongoDB
is still the better fit.

---

## Part B — Hands-on exercise: Product catalog

### Task 1 — Schema (`01_schema.sql`)

```
                                  Table "public.products"
   Column   |          Type          | Collation | Nullable |           Default
------------+------------------------+-----------+----------+------------------------------
 id         | integer                |           | not null | generated always as identity
 name       | character varying(100) |           | not null |
 category   | character varying(50)  |           | not null |
 price      | numeric(10,2)          |           | not null |
 attributes | jsonb                  |           |          |
Indexes:
    "products_pkey" PRIMARY KEY, btree (id)
```

### Task 2 — Insert data (`02_insert.sql`)

Five products, three categories, different keys in each:

```sql
INSERT INTO products (name, category, price, attributes) VALUES
('Clean Code', 'book', 499.00,
    '{"author": "Robert C. Martin", "pages": 464}'),
('Designing Data-Intensive Applications', 'book', 1299.00,
    '{"author": "Martin Kleppmann", "pages": 616, "edition": 1}'),
('ThinkPad E14', 'laptop', 68990.00,
    '{"ram_gb": 16, "cpu": "Ryzen 7 7735HS", "storage": {"type": "ssd", "gb": 512}}'),
('IdeaPad Slim 3', 'laptop', 45990.00,
    '{"ram_gb": 8, "cpu": "Core i5-1235U", "storage": {"type": "ssd", "gb": 512}}'),
('Wireless Mouse', 'accessory', 799.00,
    '{"color": "black", "wireless": true, "dpi": [800, 1600, 2400]}');
```

```
INSERT 0 5
 id |                 name                  | category  |  price   |                                   attributes
----+---------------------------------------+-----------+----------+--------------------------------------------------------------------------------
  1 | Clean Code                            | book      |   499.00 | {"pages": 464, "author": "Robert C. Martin"}
  2 | Designing Data-Intensive Applications | book      |  1299.00 | {"pages": 616, "author": "Martin Kleppmann", "edition": 1}
  3 | ThinkPad E14                          | laptop    | 68990.00 | {"cpu": "Ryzen 7 7735HS", "ram_gb": 16, "storage": {"gb": 512, "type": "ssd"}}
  4 | IdeaPad Slim 3                        | laptop    | 45990.00 | {"cpu": "Core i5-1235U", "ram_gb": 8, "storage": {"gb": 512, "type": "ssd"}}
  5 | Wireless Mouse                        | accessory |   799.00 | {"dpi": [800, 1600, 2400], "color": "black", "wireless": true}
(5 rows)
```

The keys come back sorted (`pages` before `author`): that is `jsonb` normalising the document, as
described in Part A, question 1.

### Task 3 — Query by category-specific attribute (`03_category_queries.sql`)

```sql
-- book: more than 500 pages
SELECT name, attributes ->> 'author' AS author, (attributes ->> 'pages')::int AS pages
FROM products WHERE category = 'book' AND (attributes ->> 'pages')::int > 500;
```
```
                 name                  |      author      | pages
 Designing Data-Intensive Applications | Martin Kleppmann |   616
(1 row)
```

```sql
-- laptop: at least 16 GB RAM
SELECT name, attributes ->> 'cpu' AS cpu, (attributes ->> 'ram_gb')::int AS ram_gb
FROM products WHERE category = 'laptop' AND (attributes ->> 'ram_gb')::int >= 16;
```
```
     name     |      cpu       | ram_gb
 ThinkPad E14 | Ryzen 7 7735HS |     16
(1 row)
```

```sql
-- accessory: colour is black
SELECT name, attributes ->> 'color' AS color, attributes -> 'dpi' AS dpi_steps
FROM products WHERE category = 'accessory' AND attributes ->> 'color' = 'black';
```
```
      name      | color |     dpi_steps
 Wireless Mouse | black | [800, 1600, 2400]
(1 row)
```

Extra: a nested key with the path operator `#>>`:

```sql
SELECT name, attributes #>> '{storage,type}' AS storage_type, (attributes #>> '{storage,gb}')::int AS gb
FROM products WHERE attributes ? 'storage';
```
```
      name      | storage_type | gb
 ThinkPad E14   | ssd          | 512
 IdeaPad Slim 3 | ssd          | 512
(2 rows)
```

### Task 4 — Containment query (`04_containment.sql`)

```sql
SELECT name FROM products WHERE attributes @> '{"wireless": true}';
```
```
      name
 Wireless Mouse
(1 row)
```

Containment also matches nested objects and array members:

```sql
SELECT name FROM products WHERE attributes @> '{"storage": {"type": "ssd"}}';   -- ThinkPad E14, IdeaPad Slim 3
SELECT name FROM products WHERE attributes @> '{"dpi": [1600]}';                -- Wireless Mouse
```

### Task 5 — Update JSONB without altering the table (`05_update.sql`)

```sql
UPDATE products SET attributes = attributes || '{"discount_pct": 10}' WHERE name = 'Wireless Mouse';
```
```
UPDATE 1
      name      |                                     attributes
 Wireless Mouse | {"dpi": [800, 1600, 2400], "color": "black", "wireless": true, "discount_pct": 10}
(1 row)
```

I also tried the other two ways to change a document in place: `jsonb_set` for a nested value and
the `-` operator to remove a key.

```sql
UPDATE products SET attributes = jsonb_set(attributes, '{storage,gb}', '1024') WHERE name = 'ThinkPad E14';
UPDATE products SET attributes = attributes - 'edition' WHERE name = 'Designing Data-Intensive Applications';
```
```
 Designing Data-Intensive Applications | {"pages": 616, "author": "Martin Kleppmann"}
 ThinkPad E14                          | {"cpu": "Ryzen 7 7735HS", "ram_gb": 16, "storage": {"gb": 1024, "type": "ssd"}}
```

The table definition did not change. `information_schema.columns` still lists the same five
columns: `id integer, name character varying, category character varying, price numeric, attributes jsonb`.

### Task 6 — Index and compare (`06_index_compare.sql`)

**Why the table was enlarged first.** Five rows fit in a single 8 KB page, so the planner reads
the whole table whatever indexes exist, and a before/after on five rows would show the same plan
twice. The script adds 200,000 generated products shaped like the real ones (books with
`author`/`pages`, laptops with `ram_gb`/`cpu`, accessories with `color`/`wireless`, and 1 in 200
accessories wireless) and runs `ANALYZE`. The table ends up with 200,005 rows and takes 24 MB.

```
 category  | count
-----------+-------
 accessory | 66668
 book      | 66668
 laptop    | 66669
```

**Before the index:**

```
=== BEFORE  containment @> {"wireless": true}
 Seq Scan on products  (cost=0.00..5524.06 rows=340 width=24) (actual time=0.070..25.713 rows=335 loops=1)
   Filter: (attributes @> '{"wireless": true}'::jsonb)
   Rows Removed by Filter: 199670
 Planning Time: 0.121 ms
 Execution Time: 25.739 ms

=== BEFORE  Task 3 laptop query (->> with a cast)
 Seq Scan on products  (cost=0.00..7579.40 rows=22114 width=56) (actual time=0.011..19.582 rows=26668 loops=1)
   Filter: (((category)::text = 'laptop'::text) AND (((attributes ->> 'ram_gb'::text))::integer >= 16))
   Rows Removed by Filter: 173337
 Planning Time: 0.082 ms
 Execution Time: 20.143 ms

=== BEFORE  key-exists ? storage
 Seq Scan on products  (cost=0.00..5524.06 rows=7 width=24) (actual time=0.007..16.982 rows=2 loops=1)
   Filter: (attributes ? 'storage'::text)
   Rows Removed by Filter: 200003
 Execution Time: 16.994 ms
```

**Create the GIN index:**

```sql
CREATE INDEX idx_products_attributes ON products USING GIN (attributes);
```
```
 gin_index_size
----------------
 2248 kB
```

**After the index:**

```
=== AFTER  containment @> {"wireless": true}
 Bitmap Heap Scan on products  (cost=23.36..1030.77 rows=353 width=24) (actual time=0.624..0.959 rows=335 loops=1)
   Recheck Cond: (attributes @> '{"wireless": true}'::jsonb)
   Heap Blocks: exact=335
   ->  Bitmap Index Scan on idx_products_attributes  (cost=0.00..23.28 rows=353 width=0) (actual time=0.592..0.593 rows=335 loops=1)
         Index Cond: (attributes @> '{"wireless": true}'::jsonb)
 Planning Time: 0.211 ms
 Execution Time: 1.015 ms

=== AFTER  Task 3 laptop query (->> with a cast)
 Seq Scan on products  (cost=0.00..7579.77 rows=22261 width=56) (actual time=0.011..18.854 rows=26668 loops=1)
   Filter: (((category)::text = 'laptop'::text) AND (((attributes ->> 'ram_gb'::text))::integer >= 16))
   Rows Removed by Filter: 173337
 Execution Time: 19.431 ms

=== AFTER  key-exists ? storage
 Bitmap Heap Scan on products  (cost=12.85..39.93 rows=7 width=24) (actual time=0.016..0.017 rows=2 loops=1)
   ->  Bitmap Index Scan on idx_products_attributes  (cost=0.00..12.85 rows=7 width=0) (actual time=0.008..0.008 rows=2 loops=1)
         Index Cond: (attributes ? 'storage'::text)
 Execution Time: 0.043 ms
```

| Query | Plan before | Plan after GIN | Time before | Time after |
|---|---|---|---|---|
| `attributes @> '{"wireless": true}'` | Seq Scan, 199,670 rows filtered out | Bitmap Index Scan on `idx_products_attributes` | 25.7 ms | 1.0 ms |
| `attributes ? 'storage'` | Seq Scan | Bitmap Index Scan | 17.0 ms | 0.04 ms |
| Task 3 laptop `(attributes ->> 'ram_gb')::int >= 16` | Seq Scan | **Seq Scan (unchanged)** | 20.1 ms | 19.4 ms |

**What I noticed.** The GIN index helped exactly the operators it supports (`@>` and `?`). It
did nothing for the Task 3 style query, because `->>` followed by a cast and `>=` is a range
comparison on a computed value, and a GIN index on the whole document cannot answer that. To speed
up that query I added a partial B-tree expression index:

```sql
CREATE INDEX idx_products_ram ON products (((attributes ->> 'ram_gb')::int)) WHERE category = 'laptop';
```
```
=== AFTER expression index  Task 3 laptop query, rarer value (>= 32)
 Bitmap Heap Scan on products  (cost=251.79..3773.69 rows=22129 width=24) (actual time=0.738..3.379 rows=13334 loops=1)
   Recheck Cond: ((((attributes ->> 'ram_gb'::text))::integer >= 32) AND ((category)::text = 'laptop'::text))
   ->  Bitmap Index Scan on idx_products_ram  (cost=0.00..246.26 rows=22129 width=0) (actual time=0.483..0.484 rows=13334 loops=1)
         Index Cond: (((attributes ->> 'ram_gb'::text))::integer >= 32)
 Execution Time: 3.694 ms
```

So the lesson is to write the query the way the index can use it. If exact matches are enough,
`attributes @> '{"ram_gb": 16}'` uses the GIN index. If you need ranges, index that one
expression.

### Task 7 — MongoDB comparison (`07_mongodb.js`)

The same five products went into a `products` collection in database `assignment2` (MongoDB 8.2.1,
mongosh 2.5.3). Run with `mongosh --quiet mongodb://localhost:27017/assignment2 07_mongodb.js`. The
database was dropped afterwards (`{ ok: 1, dropped: 'assignment2' }`).

```javascript
db.products.insertMany([
  { name: "Clean Code", category: "book", price: 499.00, attributes: { author: "Robert C. Martin", pages: 464 } },
  { name: "Designing Data-Intensive Applications", category: "book", price: 1299.00, attributes: { author: "Martin Kleppmann", pages: 616, edition: 1 } },
  { name: "ThinkPad E14", category: "laptop", price: 68990.00, attributes: { ram_gb: 16, cpu: "Ryzen 7 7735HS", storage: { type: "ssd", gb: 512 } } },
  { name: "IdeaPad Slim 3", category: "laptop", price: 45990.00, attributes: { ram_gb: 8, cpu: "Core i5-1235U", storage: { type: "ssd", gb: 512 } } },
  { name: "Wireless Mouse", category: "accessory", price: 799.00, attributes: { color: "black", wireless: true, dpi: [800, 1600, 2400] } }
])
```

Output (`output/07_mongodb.txt`, condensed to one line per document):

```
inserted: 5
// book: pages > 500            db.products.find({ category: "book", "attributes.pages": { $gt: 500 } })
{ name: 'Designing Data-Intensive Applications', attributes: { author: 'Martin Kleppmann', pages: 616 } }
// laptop: ram_gb >= 16         db.products.find({ category: "laptop", "attributes.ram_gb": { $gte: 16 } })
{ name: 'ThinkPad E14', attributes: { cpu: 'Ryzen 7 7735HS' } }
// accessory: color black       db.products.find({ category: "accessory", "attributes.color": "black" })
{ name: 'Wireless Mouse', attributes: { dpi: [ 800, 1600, 2400 ] } }
// nested: storage.type ssd     db.products.find({ "attributes.storage.type": "ssd" })
{ name: 'ThinkPad E14' }  { name: 'IdeaPad Slim 3' }
// wireless: true               db.products.find({ "attributes.wireless": true })
{ name: 'Wireless Mouse' }
// array member: dpi has 1600   db.products.find({ "attributes.dpi": 1600 })
{ name: 'Wireless Mouse' }
// key exists                   db.products.find({ "attributes.storage": { $exists: true } })
{ name: 'ThinkPad E14' }  { name: 'IdeaPad Slim 3' }
// updateOne matched/modified: 1 1     { $set: { "attributes.discount_pct": 10 } }
{ name: 'Wireless Mouse', attributes: { color: 'black', wireless: true, dpi: [ 800, 1600, 2400 ], discount_pct: 10 } }
// laptop query plan with index: FETCH -> IXSCAN (category_1_attributes.ram_gb_1) | keysExamined 1 | docsExamined 1
```

All seven queries returned the same rows as their PostgreSQL versions.

**Differences I noticed**

| | PostgreSQL `jsonb` | MongoDB |
|---|---|---|
| Reading a nested value | `attributes ->> 'ram_gb'`, `#>> '{storage,type}'` | `"attributes.ram_gb"`, `"attributes.storage.type"` (dot paths) |
| Numeric comparison | needs a cast: `(attributes ->> 'ram_gb')::int >= 16` | no cast, the number is stored as a number: `{ $gte: 16 }` |
| Containment | `@> '{"wireless": true}'` | just an equality filter on the path |
| Array membership | `@> '{"dpi": [1600]}'` | `{ "attributes.dpi": 1600 }` matches any element |
| Key exists | `? 'storage'` | `{ $exists: true }` |
| Add a field | `attributes \|\| '{"discount_pct": 10}'` | `$set: { "attributes.discount_pct": 10 }` |
| Indexing | one GIN index covers every key for `@>`/`?`; ranges need an expression index per path | an index per path (`createIndex({ category: 1, "attributes.ram_gb": 1 })`) handles equality and ranges; no single index covers every key except a wildcard index |
| Combining with typed data | same row, same SQL, can be joined | everything is a document; joins need `$lookup` |

**Ease of use.** For these queries MongoDB is shorter: dot paths read naturally and numbers need
no casting. The `->` / `->>` split and the `::int` casts are the most common thing I got wrong in
PostgreSQL. On the other side, Postgres let me keep `price` as a real `NUMERIC(10,2)` with
`NOT NULL`, and mix document filters with normal SQL in one statement. In MongoDB `price` is
whatever the client sends. On indexing, the GIN index was the easier win for "has this key/value"
lookups, while MongoDB's per-path index was the better fit for the range query in Task 3. That is
the same gap I found with EXPLAIN in Task 6.
