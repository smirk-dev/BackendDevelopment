#!/usr/bin/env bash
# Recreate every Part B result from scratch: a throwaway Postgres container on port 5434, the six
# SQL files in order, then the MongoDB script against a local mongod. Output lands in output/.
set -e
cd "$(dirname "$0")"
mkdir -p output

docker rm -f bdtheory-postgres >/dev/null 2>&1 || true
docker run -d --name bdtheory-postgres -e POSTGRES_PASSWORD=theory -e POSTGRES_DB=assignment2 \
    -p 5434:5432 postgres:17-alpine >/dev/null
until docker exec bdtheory-postgres pg_isready -U postgres -d assignment2 >/dev/null 2>&1; do sleep 1; done
sleep 2   # the image restarts postgres once after initdb

for f in 01_schema 02_insert 03_category_queries 04_containment 05_update; do
    docker exec -i bdtheory-postgres psql -U postgres -d assignment2 -X -a -v ON_ERROR_STOP=1 < "$f.sql" > "output/$f.txt" 2>&1
    echo "ran $f.sql"
done
docker exec -i bdtheory-postgres psql -U postgres -d assignment2 -X -v ON_ERROR_STOP=1 < 06_index_compare.sql > output/06_index_compare.txt 2>&1
echo "ran 06_index_compare.sql"

mongosh --quiet mongodb://localhost:27017/assignment2 07_mongodb.js > output/07_mongodb.txt 2>&1
mongosh --quiet --eval 'db.getSiblingDB("assignment2").dropDatabase()' mongodb://localhost:27017/admin >/dev/null
echo "ran 07_mongodb.js and dropped the assignment2 database"

docker rm -f bdtheory-postgres >/dev/null
echo "removed bdtheory-postgres"
