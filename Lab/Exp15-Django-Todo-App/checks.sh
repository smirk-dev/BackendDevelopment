#!/usr/bin/env bash
# Exp 15 — rebuilds each app's database from its migrations, runs Django's checks and test
# suite, then drives the running dev server with curl. Writes everything to evidence/.
#
# Usage (Git Bash, from this folder, with a venv that has requirements.txt installed):
#   PY=path/to/venv/Scripts/python.exe bash checks.sh
set -u
export MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*'
unset FORCE_COLOR
HERE="$(cd "$(dirname "$0")" && pwd)"
PY="${PY:-python}"
EV="$HERE/evidence"
mkdir -p "$EV"
TMPD="$(cygpath -m "$(mktemp -d)")"   # native curl/python need Windows paths
JAR="$TMPD/cookies.txt"; BODY="$TMPD/body"; HEAD="$TMPD/head"

say(){ printf '\n$ %s\n' "$*"; }
run(){ say "$*"; eval "$@" 2>&1; local rc=$?; [ $rc -ne 0 ] && echo "[exit code $rc]"; return 0; }

csrf(){ awk '$6=="csrftoken"{print $7}' "$JAR" | tail -1; }
# curl wrapper that prints the request line and the response status + Location + body (trimmed)
req(){
  local method=$1 path=$2; shift 2
  say "curl -X $method http://127.0.0.1:$PORT$path $*"
  curl -s -o $BODY -D $HEAD -b "$JAR" -c "$JAR" -X "$method" "http://127.0.0.1:$PORT$path" "$@"
  tr -d '\r' < $HEAD | grep -E '^HTTP/|^Location:|^Allow:|^Content-Type:'
}
items(){ # the task lines as the page renders them
  curl -s -b "$JAR" "http://127.0.0.1:$PORT/" | tr -d '\r' | python -c "$1"
}

start_server(){
  "$PY" manage.py runserver "$PORT" --noreload >"$TMPD/$V-runserver.log" 2>&1 &
  SERVER=$!
  for _ in $(seq 1 50); do curl -s -o "$TMPD/null" "http://127.0.0.1:$PORT/" && return 0; sleep 0.2; done
  echo "server did not start"; cat "$TMPD/$V-runserver.log"
}
stop_server(){ kill "$SERVER" 2>/dev/null; wait "$SERVER" 2>/dev/null; }

for V in v1 v2; do
  cd "$HERE/$V"
  [ "$V" = v1 ] && PORT=3036 || PORT=3037
  rm -f db.sqlite3 "$JAR"; : > "$JAR"

  {
    echo "# Exp 15 $V — management commands and test suite ($(date '+%Y-%m-%d %H:%M %Z'))"
    run "\"$PY\" -m django --version"
    run "\"$PY\" manage.py check"
    run "\"$PY\" manage.py makemigrations --check --dry-run todo"
    run "\"$PY\" manage.py migrate"
    run "\"$PY\" manage.py showmigrations todo"
    run "\"$PY\" manage.py sqlmigrate todo 0001"
    run "\"$PY\" manage.py test todo -v 2"
  } > "$EV/$V-manage-and-tests.txt"

  if [ "$V" = v1 ]; then
    LIST='import sys,re
h=sys.stdin.read(); body=h.split("<ul>")[1].split("</ul>")[0]
for li in re.findall(r"<li>(.*?)</li>", body, re.S):
    t=re.sub(r"\s+"," ",re.sub(r"<a href=\"([^\"]+)\">(\w+)</a>",r"[\2 \1]",li)).strip(); print("  ", t)'
  else
    LIST='import sys,re
h=sys.stdin.read(); body=h.split("class=\"task-list\">")[1].split("</ul>")[0]
for li in re.findall(r"<li[^>]*>(.*?)</li>", body, re.S):
    m=re.search(r"<span class=\"(\w*)\">\s*(.*?)\s*</span>", li, re.S)
    if not m: print("  ", re.sub(r"\s+"," ",li).strip()); continue
    acts=re.findall(r"action=\"([^\"]+)\".*?<button[^>]*>\s*(.*?)\s*</button>", li, re.S)
    print("  ", m.group(2), "(class=%s)" % (m.group(1) or "none"), " ".join("[%s POST %s]" % (b,a) for a,b in acts))'
  fi

  start_server
  {
    echo "# Exp 15 $V — curl journey against python manage.py runserver $PORT"
    req GET /
    echo "  rendered list:"; items "$LIST"
    req GET /add/
    grep -o 'name="csrfmiddlewaretoken" value="[^"]\{8\}' $BODY | sed 's/$/…"  (token in the form)/'
    for t in "Write the Exp 15 README" "Revise Unit 3 notes on middleware" "Submit Django lab"; do
      req POST /add/ --data-urlencode "csrfmiddlewaretoken=$(csrf)" --data-urlencode "title=$t"
    done
    req POST /add/ --data-urlencode "csrfmiddlewaretoken=$(csrf)" --data-urlencode "title="
    echo "  (empty title: redirected, nothing created)"
    if [ "$V" = v2 ]; then
      req POST /add/ --data-urlencode "csrfmiddlewaretoken=$(csrf)" --data-urlencode "title=   "
      echo "  (whitespace-only title: v2 strips it, nothing created)"
    fi
    echo "  rendered list:"; items "$LIST"
    ID=$("$PY" manage.py shell -v 0 -c "from todo.models import Task;print(Task.objects.get(title__startswith='Revise').id)")
    DEL=$("$PY" manage.py shell -v 0 -c "from todo.models import Task;print(Task.objects.get(title__startswith='Submit').id)")
    if [ "$V" = v1 ]; then
      req GET "/toggle/$ID/"
      echo "  rendered list:"; items "$LIST"
      req GET "/delete/$DEL/"
      echo "  rendered list:"; items "$LIST"
      req GET /toggle/999/
      echo "  (v1 uses Task.objects.get(): an unknown id is an unhandled DoesNotExist -> 500)"
      req POST /add/ --data-urlencode "title=no token"
      echo "  (POST without csrfmiddlewaretoken -> 403 CSRF verification failed)"
    else
      req GET "/toggle/$ID/"
      echo "  (@require_POST: a plain link or crawler cannot change data)"
      req POST "/toggle/$ID/" --data-urlencode "csrfmiddlewaretoken=$(csrf)"
      echo "  rendered list:"; items "$LIST"
      req POST "/toggle/$ID/" --data-urlencode "csrfmiddlewaretoken=$(csrf)"
      req POST "/toggle/$ID/" --data-urlencode "csrfmiddlewaretoken=$(csrf)"
      req GET "/delete/$DEL/"
      req POST "/delete/$DEL/" --data-urlencode "csrfmiddlewaretoken=$(csrf)"
      echo "  rendered list:"; items "$LIST"
      req POST /toggle/999/ --data-urlencode "csrfmiddlewaretoken=$(csrf)"
      echo "  (get_object_or_404: unknown id -> 404)"
      req POST "/delete/$ID/"
      echo "  (POST without csrfmiddlewaretoken -> 403 CSRF verification failed)"
    fi
    echo
    echo "## static files served by runserver (DEBUG=True)"
    if [ "$V" = v1 ]; then A="css/style.css js/main.js"; else A="css/style.css css/add_task.css js/app.js js/char_count.js js/confirm-delete.js images/logo.png"; fi
    for a in $A; do req GET "/static/todo/$a"; done
    req GET /static/todo/missing.css
  } > "$EV/$V-curl-journey.txt"
  stop_server

  {
    echo "# Exp 15 $V — persistence across a server restart"
    echo "  rows in db.sqlite3 before restart:"
    "$PY" manage.py shell -v 0 -c "from todo.models import Task;[print('   ',t.id,t.title,t.completed) for t in Task.objects.order_by('id')]"
    start_server
    echo "  server restarted on $PORT (new PID); list after restart:"; items "$LIST"
    stop_server
  } > "$EV/$V-persistence.txt"

  if [ "$V" = v2 ]; then
    start_server
    {
      echo "# Exp 15 v2 — Django Admin (list_display, list_filter, search_fields, list_editable)"
      run "DJANGO_SUPERUSER_PASSWORD=labpass-2026 \"$PY\" manage.py createsuperuser --noinput --username admin --email admin@example.com"
      : > "$JAR"
      req GET /admin/todo/task/
      req GET /admin/login/
      req POST /admin/login/ --data-urlencode "csrfmiddlewaretoken=$(csrf)" --data-urlencode "username=admin" --data-urlencode "password=labpass-2026" --data-urlencode "next=/admin/todo/task/"
      req GET /admin/todo/task/
      python - "$BODY" <<'PY'
import re, sys
h=open(sys.argv[1],encoding='utf-8').read()
m=re.search(r'<title>(.*?)</title>', h, re.S); print("  page title           :", m and m.group(1).strip())
m=re.search(r'<h1>(.*?)</h1>', h, re.S); print("  heading              :", m and m.group(1).strip())
print("  column headers       :", [re.sub('<[^>]+>','',c).strip() for c in re.findall(r'<th scope="col"[^>]*>(.*?)</th>', h, re.S)][1:])
print("  rows                 :", re.findall(r'<th class="field-title"><a[^>]*>(.*?)</a>', h))
print("  editable checkboxes  :", len(re.findall(r'name="form-\d+-completed"', h)))
print("  search box present   :", 'id="searchbar"' in h)
print("  filter options       :", re.findall(r'href="\?completed__exact=(\d)"[^>]*>(\w+)', h))
PY
      ROWS='import re,sys;h=open(sys.argv[1],encoding="utf-8").read();print("  rows ->", re.findall(r"<th class=\"field-title\"><a[^>]*>(.*?)</a>", h))'
      req GET "/admin/todo/task/?q=Revise";            python -c "$ROWS" "$BODY"
      req GET "/admin/todo/task/?completed__exact=0";  python -c "$ROWS" "$BODY"
      req GET "/admin/todo/task/?completed__exact=1";  python -c "$ROWS" "$BODY"
    } > "$EV/v2-admin.txt"
    stop_server
  fi
done
rm -rf "$TMPD"
echo "evidence written to $EV"
