# Exp 14 (Optional) — PostgreSQL: Relational vs Document Databases

Manual: `Lectures/Backend Development/Lab/Exp 14 (Optional) Postgresql.md`
("Lab: Relational vs Document Databases — PostgreSQL & MongoDB").

PostgreSQL 16 runs in a Docker container, every SQL statement and psql command in the manual is
run against it, the same data is then put in MongoDB, and the two are compared. All output in
`evidence/` is real, captured on 2026-09-27.

## Assignment checklist

| Assignment item | Where | Result |
|---|---|---|
| Create database `student_management` (PostgreSQL) | `sql/01-create.sql` | `CREATE DATABASE` |
| `students` table: `id`, `name`, `branch`, `email`, `enrollment_date` | `sql/01-create.sql` | `CREATE TABLE` (identity PK, `NOT NULL`, `UNIQUE`, `DEFAULT CURRENT_DATE`) |
| Insert at least 5 records | `sql/02-crud.sql` | `INSERT 0 5` |
| Students in `CSE` | `sql/02-crud.sql` | 3 rows |
| Students enrolled after Jan 2024 | `sql/02-crud.sql` | 2 rows (Carla 2024-03-02, Ethan 2024-02-18) |
| Update a branch | `sql/02-crud.sql` | `UPDATE 1`, Bilal ECE → AI/ML |
| Delete a record | `sql/02-crud.sql` | `DELETE 1`, Divya removed (checked with a `SELECT` first, as the manual says) |
| MongoDB `students` collection with at least 3 documents | `mongo/students.mongosh.js` | 3 inserted, find / update / delete |
| Compare the two | "PostgreSQL vs MongoDB" below | — |

Plus the rest of the manual: Module 2 meta-commands (`\l \c \dt \d \du \? \h \i \q`),
`pg_dump` and restore, the bonus `GROUP BY`, and Module 5 (JSONB column, `->`, `->>`, `@>`,
GIN index).

## Setup: PostgreSQL in Docker instead of a native install

The manual's Module 1 installs PostgreSQL with Homebrew, or on Windows through WSL + `apt`. On
this machine it runs in Docker instead: one container, nothing installed on Windows, and it can
be deleted without leaving anything behind.

| | |
|---|---|
| Container | `bdlab-postgres`, image `postgres:16` (PostgreSQL 16.15) — the manual installs `postgresql@16` |
| Port | host **5433** → container 5432 (5432 is left free for other projects) |
| Data | Docker volume `bdlab-pgdata` |
| Admin role | `postgres`, password `bdlab_pg_pass` (lab-only) |

| Manual (Linux/macOS) | Here |
|---|---|
| `brew install postgresql@16` / `apt install postgresql` | `docker run -d --name bdlab-postgres -e POSTGRES_PASSWORD=bdlab_pg_pass -p 5433:5432 -v bdlab-pgdata:/var/lib/postgresql/data postgres:16` |
| `systemctl status postgresql`, `pg_isready` | `docker ps --filter name=bdlab-postgres`, `docker exec bdlab-postgres pg_isready` |
| `sudo -u postgres psql` | `docker exec -it bdlab-postgres psql -U postgres` |
| `pg_dump student_management > backup.sql` | `docker exec bdlab-postgres pg_dump -U postgres student_management > backup.sql` |
| `psql student_management < backup.sql` | `docker exec -i bdlab-postgres psql -U postgres student_management < backup.sql` |
| `\i /path/to/file.sql` | `docker cp file.sql bdlab-postgres:/tmp/` then `\i /tmp/file.sql` (psql runs inside the container, so the path is the container's) |

The MongoDB half (Module 4) uses the MongoDB 8.2.1 Windows service already on this machine (see
[`Exp13-MongoDB-Installation/`](../Exp13-MongoDB-Installation/)), not the manual's `apt install mongodb`.

## How to run

```bash
bash run-all.sh                      # creates or starts bdlab-postgres, runs every module, prints the results
docker exec -it bdlab-postgres psql -U postgres -d student_management   # poke around
docker stop bdlab-postgres           # the container is left stopped, not removed
```

The container is **stopped** at the end of the run. To bring it back with the data intact:
`docker start bdlab-postgres`. To remove everything: `docker rm bdlab-postgres && docker volume rm bdlab-pgdata`.
`run-all.sh` drops and recreates `student_management`, so it gives the same result every time.

## Files

| File | Manual module |
|---|---|
| `sql/01-create.sql` | 3 — create database + table |
| `sql/02-crud.sql` | 3 — insert, three reads, update, delete, aggregation; then constraint checks (beyond the manual) |
| `sql/03-meta.sql`, `sql/hello.sql` | 2 — meta-commands, with `hello.sql` as the `\i` target |
| `sql/04-jsonb.sql` | 5 — JSONB column, operators, GIN index; then `?`, casts and `EXPLAIN` (beyond the manual) |
| `sql/backup.sql` | 2 — the `pg_dump` output |
| `mongo/students.mongosh.js` | 4 — the MongoDB equivalent; then the comparison queries (beyond the manual) |
| `run-all.sh` | everything above, end to end |
| `evidence/*.txt` | captured output |

Every statement the manual gives is in these files unchanged. Additions are under a
"Beyond the manual" or "not in the manual" comment.

## Checks run

**Server** (`evidence/01-install.txt`)

```
$ docker ps --filter name=bdlab-postgres
NAMES            IMAGE         STATUS         PORTS
bdlab-postgres   postgres:16   Up 3 seconds   0.0.0.0:5433->5432/tcp, [::]:5433->5432/tcp
$ docker exec bdlab-postgres pg_isready
/var/run/postgresql:5432 - accepting connections
$ docker exec bdlab-postgres psql --version
psql (PostgreSQL) 16.15 (Debian 16.15-1.pgdg13+2)
```

**Module 3 — CRUD** (`evidence/02-create.txt`, `evidence/03-crud.txt`)

```
INSERT 0 5
SELECT * FROM students WHERE branch = 'CSE';
  1 | Alice Sharma | CSE    | alice@example.com | 2024-01-15
  3 | Carla Gomez  | CSE    | carla@example.com | 2024-03-02
  5 | Ethan Brooks | CSE    | ethan@example.com | 2024-02-18
(3 rows)
SELECT * FROM students WHERE enrollment_date > '2024-01-31';
  3 | Carla Gomez  | CSE    | carla@example.com | 2024-03-02
  5 | Ethan Brooks | CSE    | ethan@example.com | 2024-02-18
(2 rows)
SELECT * FROM students WHERE name ILIKE 'a%';          -> 1 | Alice Sharma
UPDATE students SET branch = 'AI/ML' WHERE email = 'bilal@example.com';   UPDATE 1
DELETE FROM students WHERE email = 'divya@example.com';                   DELETE 1
SELECT branch, COUNT(*) AS total FROM students GROUP BY branch ORDER BY total DESC;
 CSE    |     3
 AI/ML  |     1
```

The constraints, tried on purpose:

```
INSERT ... ('Alice Copy', 'CSE', 'alice@example.com');
ERROR:  duplicate key value violates unique constraint "students_email_key"
INSERT INTO students (branch, email) VALUES ('CSE', 'noname@example.com');
ERROR:  null value in column "name" of relation "students" violates not-null constraint
INSERT INTO students (id, name) VALUES (99, 'Manual Id');
ERROR:  cannot insert a non-DEFAULT value into column "id"
HINT:  Use OVERRIDING SYSTEM VALUE to override.
INSERT ... ('Farah Ali', 'IT', 'farah@example.com');   -> id 8, enrollment_date 2026-09-27, is_today t
```

Farah got id **8**, not 6. The two inserts that failed had already taken ids 6 and 7 from the
identity sequence, and a sequence never hands a number back. Gaps in an identity column are
normal.

**Module 2 — meta-commands** (`evidence/04-meta-commands.txt`): `\l` lists `postgres`,
`student_management`, `template0`, `template1`; `\dt` → `public | students | table`; `\d students`
shows `generated always as identity`, `CURRENT_DATE` default, `students_pkey` and
`students_email_key`; `\du` → `postgres | Superuser, Create role, Create DB, Replication, Bypass RLS`;
`\h CREATE TABLE` prints the full syntax and the docs URL; `\?` prints 145 lines of help;
`\i /tmp/hello.sql` returns `run from a .sql file with \i | student_management | postgres | 2026-09-27`;
`\q` exits with code 0.

**`pg_dump` and restore** (`evidence/06-dump-restore.txt`): the 103-line `backup.sql` holds
`CREATE TABLE`, the identity definition, `COPY ... FROM stdin`, the constraints and the GIN index.
Restored into a new database `student_management_restore`, it gives back all 5 rows with ids,
JSONB profiles and all three indexes, and `setval` puts the sequence back at 8. The copy was
dropped afterwards.

**Module 5 — JSONB** (`evidence/05-jsonb.txt`)

```
SELECT profile -> 'skills' ...   ["python", "sql"]        (jsonb)
SELECT profile ->> 'clubs' ...   {"robotics": true}       (text)
SELECT * FROM students WHERE profile @> '{"clubs": {"robotics": true}}';   -> Alice Sharma
CREATE INDEX idx_students_profile ON students USING GIN (profile);         CREATE INDEX
SELECT name FROM students WHERE profile -> 'skills' ? 'sql';               -> Alice Sharma
EXPLAIN SELECT * FROM students WHERE profile @> '{"clubs": {"robotics": true}}';
 Bitmap Heap Scan on students
   Recheck Cond: (profile @> '{"clubs": {"robotics": true}}'::jsonb)
   ->  Bitmap Index Scan on idx_students_profile
```

With five rows the planner would normally just scan the table, so `enable_seqscan` is turned off
for that one `EXPLAIN` to show the GIN index is usable for `@>`.

**Password and the host port** (`evidence/07-auth-and-host-port.txt`): the manual's
`ALTER USER postgres WITH PASSWORD ...` → `ALTER ROLE`. A separate throwaway `postgres:16` client
container connecting over TCP to `host.docker.internal:5433` gets `student_management | 5`
students. With a wrong password it gets `FATAL: password authentication failed for user "postgres"`.
`Test-NetConnection localhost -Port 5433` → `True`.

**Module 4 — MongoDB** (`evidence/08-mongodb.txt`)

```
student_management> db.students.insertMany([...3 docs...])   { acknowledged: true, insertedIds: { '0': ..., '1': ..., '2': ... } }
student_management> db.students.find({ branch: "CSE" })      -> Alice Sharma, Carla Gomez
student_management> db.students.updateOne({ email: "bilal@example.com" }, { $set: { branch: "AI/ML" } })   { matchedCount: 1, modifiedCount: 1 }
student_management> db.students.deleteOne({ email: "carla@example.com" })   { acknowledged: true, deletedCount: 1 }
db.students.find({ "profile.clubs.robotics": true }, ...)    -> Alice Sharma, no schema change needed first
db.students.aggregate([{ $group: ... }])                     -> [ { _id: 'CSE', total: 1 }, { _id: 'AI/ML', total: 1 } ]
db.students.insertOne({ name: "Alice Copy", email: "alice@example.com" })  -> accepted
db.students.countDocuments({ email: "alice@example.com" })   -> 2
```

The "enrolled after Jan 2024" query prints nothing on the Mongo side. That is the right answer
for what is left: Carla, the only post-January student among the manual's three, was just deleted.
The `student_management` database was dropped from the local MongoDB server afterwards.

**Final state** (`evidence/09-final-state.txt`): `bdlab-postgres` is `Exited (0)` with volume
`bdlab-pgdata` kept; MongoDB has the same databases as before the run. `run-all.sh` was also run
once from scratch and finished with exit code 0.

## PostgreSQL vs MongoDB — what doing the same job felt like

| | PostgreSQL | MongoDB |
|---|---|---|
| Before the first insert | Had to `CREATE DATABASE` and `CREATE TABLE` with every column and type. | Nothing. `use student_management` + `insertMany` created both. |
| Bad data | Refused: duplicate email, missing name and hand-set id each gave a clear `ERROR` with the constraint's name. | Accepted: a second document with `alice@example.com` and no `branch` went straight in. Uniqueness needs an index you create yourself, and required fields need schema validation (or Mongoose, as in Exp 13 B). |
| Adding a new kind of field | `ALTER TABLE ... ADD COLUMN profile JSONB` first, then `UPDATE`. | Just `$set` it on one document; the other documents are not affected. |
| Querying | One language (SQL) for filters, `ILIKE`, `GROUP BY`, and with JSONB operators even for nested data. | `find` with operator objects (`$gt`, dotted paths), and `aggregate` with a pipeline for grouping. Reads well in JavaScript, but grouping takes more typing than `GROUP BY`. |
| Dates | `'2024-01-31'` compared as a `DATE` directly. | Needs `new Date("2024-01-31")`; comparing to a plain string silently matches nothing. |
| Tooling seen here | `\d`, `\h`, `EXPLAIN` and `pg_dump` all come with the server. | `mongosh` comes with it; dump/export tools are a separate download (not installed on this machine). |

For this data — students with fixed core fields and a few optional extras — PostgreSQL with one
`jsonb` column covered everything MongoDB did. It also kept the guarantees MongoDB dropped
(unique email, required name), which is the manual's own conclusion. MongoDB was quicker to start
and needed less ceremony for one-off fields, which fits data whose shape really does differ from
record to record.
