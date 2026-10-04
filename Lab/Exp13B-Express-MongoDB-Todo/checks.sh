#!/usr/bin/env bash
# Exp 13 B — full API journey with curl. Usage: BASE=http://localhost:3034 bash checks.sh
export MSYS_NO_PATHCONV=1
BASE=${BASE:-http://localhost:3000}
req() { # method path [json] [token]
  local m=$1 p=$2 d=$3 t=$4
  local args=(-s -w '\nHTTP %{http_code}' -X "$m" "$BASE$p")
  [ -n "$d" ] && args+=(-H "Content-Type: application/json" -d "$d")
  [ -n "$t" ] && args+=(-H "Authorization: Bearer $t")
  echo "\$ curl -X $m $p${d:+ -d '$d'}${t:+ -H 'Authorization: Bearer <token>'}"
  OUT=$(curl "${args[@]}"); echo "$OUT"; echo
  BODY=$(echo "$OUT" | sed '$d')
}
field() { node -e "let o=JSON.parse(process.argv[1]);for(const k of process.argv[2].split('.'))o=o[k];console.log(o)" "$BODY" "$1"; }

echo '## Experiment 1 - connection'
req GET /

echo '## Experiment 2 - registration'
req POST /api/auth/register '{"username":"john","email":"john@example.com","password":"password123"}'
TOKEN=$(field token)
echo '# duplicate registration is refused'
req POST /api/auth/register '{"username":"john","email":"john@example.com","password":"password123"}'
echo '# schema validation (minlength 6 on password, email regex) surfaces as the catch-all 500'
req POST /api/auth/register '{"username":"al","email":"not-an-email","password":"123"}'

echo '## Experiment 3 - login'
req POST /api/auth/login '{"email":"john@example.com","password":"password123"}'
TOKEN=$(field token)
echo '# wrong password and unknown email get the same generic answer'
req POST /api/auth/login '{"email":"john@example.com","password":"wrongpass"}'
req POST /api/auth/login '{"email":"nobody@example.com","password":"password123"}'
req POST /api/auth/login '{"email":"john@example.com"}'

echo '## Protected routes require a valid token'
req GET /api/todos
req GET /api/todos '' 'not.a.real.token'

echo '## Experiment 4 - todo CRUD'
req POST /api/todos '{"title":"Buy groceries","description":"Milk, eggs, bread","priority":"high"}' "$TOKEN"
TODO1=$(field todo._id)
req POST /api/todos '{"title":"Finish Exp 13 B report","priority":"medium","dueDate":"2026-10-09"}' "$TOKEN"
TODO2=$(field todo._id)
req POST /api/todos '{"title":"Call home","priority":"low"}' "$TOKEN"
TODO3=$(field todo._id)
echo '# validation: missing title, bad priority enum'
req POST /api/todos '{"description":"no title"}' "$TOKEN"
req POST /api/todos '{"title":"x","priority":"urgent"}' "$TOKEN"
req GET /api/todos '' "$TOKEN"
req GET /api/todos/$TODO1 '' "$TOKEN"
echo '# toggle completed on, then off again'
req PUT /api/todos/$TODO1 '{"completed":true}' "$TOKEN"
req PUT /api/todos/$TODO1 '{"completed":false}' "$TOKEN"
req PUT /api/todos/$TODO2 '{"completed":true,"title":"Finish Exp 13 B report (done)"}' "$TOKEN"
req DELETE /api/todos/$TODO3 '' "$TOKEN"
req GET /api/todos/$TODO3 '' "$TOKEN"

echo '## Users cannot access other users todos'
req POST /api/auth/register '{"username":"priya","email":"priya@example.com","password":"secret456"}'
TOKEN2=$(field token)
req GET /api/todos '' "$TOKEN2"
req GET /api/todos/$TODO1 '' "$TOKEN2"
req PUT /api/todos/$TODO1 '{"completed":true}' "$TOKEN2"
req DELETE /api/todos/$TODO1 '' "$TOKEN2"
echo '# john still has both remaining todos, unchanged'
req GET /api/todos '' "$TOKEN"

echo '## "Logout" - JWT is stateless, so logging out means the client discards the token'
echo '# the API keeps no session; once the client drops the token every protected call is 401 again'
TOKEN=""
req GET /api/todos '' "$TOKEN"
