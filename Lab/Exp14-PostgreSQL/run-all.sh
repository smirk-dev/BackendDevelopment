#!/usr/bin/env bash
# Exp 14 — recreate the whole lab from scratch in Docker and run every module.
# Git Bash on Windows: MSYS would rewrite /tmp and /var paths in docker arguments without this.
export MSYS_NO_PATHCONV=1
set -e
cd "$(dirname "$0")"

# Module 1 — PostgreSQL 16 server in a container (host port 5433 -> container 5432)
if ! docker ps -a --format '{{.Names}}' | grep -qx bdlab-postgres; then
  docker run -d --name bdlab-postgres -e POSTGRES_PASSWORD=bdlab_pg_pass \
    -p 5433:5432 -v bdlab-pgdata:/var/lib/postgresql/data postgres:16
else
  docker start bdlab-postgres
fi
until docker exec bdlab-postgres pg_isready -U postgres >/dev/null 2>&1; do sleep 1; done
sleep 2  # first start: the image runs a temporary server during initdb, then restarts
docker exec bdlab-postgres psql --version

PSQL="docker exec -i bdlab-postgres psql -U postgres -a"
$PSQL -c "DROP DATABASE IF EXISTS student_management;"
$PSQL < sql/01-create.sql                               # Module 3: database + table
$PSQL -d student_management < sql/02-crud.sql || true    # Module 3: CRUD (last block raises 3 intended errors)
docker cp sql/hello.sql bdlab-postgres:/tmp/hello.sql
$PSQL < sql/03-meta.sql                                 # Module 2: meta-commands
$PSQL -d student_management < sql/04-jsonb.sql           # Module 5: JSONB + GIN index

# Module 2: pg_dump / restore into a fresh database
docker exec bdlab-postgres pg_dump -U postgres student_management > sql/backup.sql
docker exec bdlab-postgres createdb -U postgres student_management_restore
docker exec -i bdlab-postgres psql -q -U postgres student_management_restore < sql/backup.sql
docker exec bdlab-postgres psql -U postgres -d student_management_restore -c "SELECT count(*) FROM students;"
docker exec bdlab-postgres dropdb -U postgres student_management_restore

# Module 4: the same data in MongoDB (needs a mongod on localhost:27017)
if command -v mongosh >/dev/null; then
  mongosh --quiet mongodb://127.0.0.1:27017 < mongo/students.mongosh.js
  mongosh --quiet --eval 'db.getSiblingDB("student_management").dropDatabase()'
fi

echo "Done. Stop the server with: docker stop bdlab-postgres"
