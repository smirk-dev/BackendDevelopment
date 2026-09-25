# Assignment 2 — PostgreSQL JSONB (runnable files)

The write-up is [`../Assignment 2 PostgreSQL JSONB.md`](../Assignment%202%20PostgreSQL%20JSONB.md),
with the same content in [`../590012069_assignment2.md`](../590012069_assignment2.md). This folder
holds the SQL and the mongosh script that produced every output quoted there.

**Spec:** Backend Development, *Assignment 2 — PostgreSQL as SQL + NoSQL: Working with JSONB*. It
builds on the database part of the course (Lab Exp 13 MongoDB and Exp 14 PostgreSQL).

| File | Part B task |
|---|---|
| `01_schema.sql` | Task 1, `products` table with four typed columns and `attributes jsonb` |
| `02_insert.sql` | Task 2, five products in three categories, each with its own keys |
| `03_category_queries.sql` | Task 3, one query per category, plus a nested `#>>` path |
| `04_containment.sql` | Task 4, `@>` on a flat key, a nested object and an array member, and the four operators side by side |
| `05_update.sql` | Task 5, `\|\|`, `jsonb_set` and `-`, with the column list shown to be unchanged |
| `06_index_compare.sql` | Task 6, 200,000 generated rows, EXPLAIN ANALYZE before and after the GIN index, plus an expression index |
| `07_mongodb.js` | Task 7, the same products and queries in mongosh, plus an index and its explain plan |
| `run_all.sh` | rebuilds everything from scratch and cleans up |
| `output/` | raw output of the last run, one file per script |

## Run

```bash
bash run_all.sh            # needs Docker and a local mongod on 27017
```

Or by hand:

```bash
docker run -d --name bdtheory-postgres -e POSTGRES_PASSWORD=theory -e POSTGRES_DB=assignment2 -p 5434:5432 postgres:17-alpine
docker exec -i bdtheory-postgres psql -U postgres -d assignment2 -a < 01_schema.sql      # then 02 ... 06
mongosh mongodb://localhost:27017/assignment2 07_mongodb.js
psql -h localhost -p 5434 -U postgres assignment2                                       # if you have psql on the host
```

## Checks run

- PostgreSQL 17.12 (`postgres:17-alpine`) in container `bdtheory-postgres` on host port 5434. All six
  SQL files exited 0 with `ON_ERROR_STOP=1`; their output is in `output/01..06_*.txt`.
- The GIN index changed the `@>` plan from `Seq Scan` (25.7 ms, 199,670 rows filtered out) to
  `Bitmap Index Scan on idx_products_attributes` (1.0 ms) on 200,005 rows. The `?` query went from
  17.0 ms to 0.04 ms. The Task 3 `->>`/cast query stayed a Seq Scan (20.1 to 19.4 ms) until a B-tree
  expression index was added.
- json vs jsonb on 300,000 generated documents: insert 511 ms vs 608 ms, filter 171 ms vs 53 ms.
- MongoDB 8.2.1 / mongosh 2.5.3: `07_mongodb.js` returned the same rows as the SQL versions, and the
  compound index plan was `FETCH -> IXSCAN (category_1_attributes.ram_gb_1)` with 1 key and 1
  document examined. Database `assignment2` dropped afterwards: `{ ok: 1, dropped: 'assignment2' }`.
- Container `bdtheory-postgres` was removed after the run.
