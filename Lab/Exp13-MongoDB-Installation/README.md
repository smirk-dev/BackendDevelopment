# Exp 13 — Installation of MongoDB

Manual: `Lectures/Backend Development/Lab/Exp 13 _ Installation of MongoDB.md`
(published through upessocs.github.io).

An installation report for **this machine** (Windows 11) plus every runnable example in the
manual: the mongosh basics, users and authentication, the Mongoose connection, model,
connection handling, CRUD, query operators, sorting, limiting and projection. Everything in
`evidence/` is real output captured on 2026-09-20, not copied from the manual.

## What is installed here

| Component | Version | Where | How it runs |
|---|---|---|---|
| MongoDB Community Server (`mongod`) | **8.2.1** | `C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe` | Windows service `MongoDB`, **Automatic**, runs as `NT AUTHORITY\NetworkService` |
| MongoDB Shell (`mongosh`) | **2.5.3** | `C:\Program Files\MongoDB\mongosh.exe` (on PATH) | CLI |
| MongoDB Compass | **1.49.12** | `%LOCALAPPDATA%\MongoDBCompass\app-1.49.12\` | GUI, connect string `mongodb://127.0.0.1:27017` |
| Database Tools (`mongodump`, `mongorestore`, `mongoexport`, `mongoimport`) | not installed | — | separate download, see "Not run" below |

Config file: `C:\Program Files\MongoDB\Server\8.2\bin\mongod.cfg` — data in
`...\Server\8.2\data`, log in `...\Server\8.2\log\mongod.log`, `bindIp: 127.0.0.1`, port
`27017`, and `replication.replSetName: rs0` (a single-member replica set, which is why the
mongosh prompt reads `rs0 [direct: primary]`). `mongod.exe` is not on PATH; the service starts
it by full path. `security.authorization` is off (commented out).

The install followed the manual's **Windows** route: `.msi` installer, "install as a service",
then `mongosh` added to PATH, then verify by running `mongosh`. The macOS (Homebrew) and Ubuntu
(`apt`, `systemctl`) routes in the manual do not apply to this machine; the Windows equivalent of
each `systemctl` command is listed below.

| Manual (Ubuntu) | This machine (PowerShell) |
|---|---|
| `sudo systemctl status mongod` | `Get-Service MongoDB` |
| `sudo systemctl start / stop / restart mongod` | `Start-Service MongoDB` / `Stop-Service MongoDB` / `Restart-Service MongoDB` (elevated) |
| `sudo systemctl enable mongod` | `Set-Service MongoDB -StartupType Automatic` (already set) |
| `sudo tail -f /var/log/mongodb/mongod.log` | `Get-Content "C:\Program Files\MongoDB\Server\8.2\log\mongod.log" -Tail 20 -Wait` |
| `/etc/mongod.conf` | `C:\Program Files\MongoDB\Server\8.2\bin\mongod.cfg` |

## Files

| File | Manual section |
|---|---|
| `shell-basics.mongosh.js` | "Basic MongoDB Usage Examples" — `show dbs`, `use`, `insertOne`, `insertMany`, `find`, filter, `updateOne`, `deleteOne`, `createIndex` |
| `auth-demo.mongosh.js` | §6 Authentication and Security — `db.createUser(...)` for `adminUser` |
| `connect.js` | §5 Connecting MongoDB to Node.js |
| `studentModel.js` | §7 Model Creation |
| `db.js` | §8 Managing Database Connections (connect, disconnect, SIGINT handler) |
| `crud.js` | §9 CRUD, §10 query operators, §11 sort / limit / projection |
| `evidence/*.txt` | captured output of every command below |

## How to run

```bash
npm install          # mongoose 8
npm run connect      # §5
npm run db           # §8 — Ctrl+C to see the disconnect handler
npm run crud         # §9-11 against schoolDB
mongosh --quiet mongodb://127.0.0.1:27017 < shell-basics.mongosh.js
```

## Deviations from the manual

- **`mongoose` is pinned to 8.x.** With today's latest (`mongoose@9.13.1`, MongoDB driver 7) the
  manual's §5 snippet fails outright:
  `MongoParseError: options usenewurlparser, useunifiedtopology are not supported`
  (`evidence/05a-connect-mongoose9.txt`). On 8.x the same code connects and the driver only warns
  that both options "have no effect since Node.js Driver version 4.0.0". The code is unchanged;
  only the version is pinned.
- `connect.js` adds one line after the manual's code to disconnect once connected, so the script
  exits instead of holding the connection open forever.
- The manual writes §9-11 as loose `await` fragments, which do not run as a CommonJS file.
  `crud.js` wraps the same statements, unchanged, in one `async main()`, and inserts five extra
  students so the `$gt` / `$or` / sort / limit examples have something to filter.
- The auth demo **drops `adminUser` again** after proving login works, and every demo database
  (`mydatabase`, `schoolDB`, `testDB`) is dropped at the end. The local server is shared with
  Exp13A, Exam 01 and other projects, so it is left exactly as it was found.

## Checks run

All on 2026-09-20 against the local `MongoDB` service. Full output in `evidence/`.

**Versions** (`evidence/01-versions.txt`)

```
$ mongod --version
db version v8.2.1
Build Info: { "version": "8.2.1", "gitVersion": "3312bdcf28aa65f5930005e21c2cb130f648b8c3", ... "distmod": "windows" }

$ mongosh --version
2.5.3

$ mongosh --quiet --eval "db.version()"
8.2.1
```

**Service and port** (`evidence/02-service.txt`)

```
> Get-Service MongoDB
Name        : MongoDB
DisplayName : MongoDB Server (MongoDB)
Status      : Running
StartType   : Automatic

PathName  : "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --config "C:\Program Files\MongoDB\Server\8.2\bin\mongod.cfg" --service
StartName : NT AUTHORITY\NetworkService

> Get-NetTCPConnection -LocalPort 27017 -State Listen
LocalAddress LocalPort  State OwningProcess
127.0.0.1        27017 Listen          5356

> MongoDB Compass
ProductName    : MongoDBCompass
ProductVersion : 1.49.12
```

**Config, log and server status** (`evidence/09-config-and-logs.txt`)

```
{"t":{"$date":"2026-09-17T22:03:53.076+05:30"},"s":"I","c":"NETWORK","id":23016,"ctx":"listener","msg":"Waiting for connections","attr":{"port":27017,"ssl":"off"}}

$ mongosh --eval "rs.status().members"
[ { name: 'localhost:27017', state: 'PRIMARY', health: 1 } ]

$ mongosh --eval "db.serverStatus()" (selected fields)
{ host: 'SuryanshMishra', version: '8.2.1', storageEngine: 'wiredTiger', uptimeHours: 62.6, connections: 9 }
```

**mongosh basics** (`evidence/03-shell-basics.txt`, abridged)

```
rs0 [direct: primary] test> switched to db mydatabase
mydatabase> db.users.insertOne(...)        { acknowledged: true, insertedId: ObjectId('6aaf860675e336bdfe748a5f') }
mydatabase> db.users.insertMany([...])     { acknowledged: true, insertedIds: { '0': ..., '1': ... } }
mydatabase> db.users.find({ age: { $gt: 25 } })   -> John Doe (30), Bob Johnson (35)
mydatabase> db.users.updateOne(...)        { matchedCount: 1, modifiedCount: 1 }
mydatabase> db.users.deleteOne(...)        { acknowledged: true, deletedCount: 1 }
mydatabase> db.users.createIndex({ email: 1 })    email_1
mydatabase> db.users.getIndexes()          [ { key: { _id: 1 } }, { key: { email: 1 }, name: 'email_1' } ]
mydatabase> db.users.find()                -> John Doe (age 31), Jane Smith (25)
```

**Authentication** (`evidence/04-auth.txt`)

```
admin> db.createUser({ user: "adminUser", ..., roles: [ { role: "userAdminAnyDatabase", db: "admin" } ] })
{ ok: 1, ... }

$ mongosh -u adminUser -p securePassword123 --authenticationDatabase admin --eval "db.runCommand({connectionStatus:1}).authInfo"
{ authenticatedUsers: [ { user: 'adminUser', db: 'admin' } ],
  authenticatedUserRoles: [ { role: 'userAdminAnyDatabase', db: 'admin' } ] }

$ mongosh -u adminUser -p wrongPassword --authenticationDatabase admin --eval "1"
MongoServerError: Authentication failed.

$ mongosh --eval 'db.getSiblingDB("admin").dropUser("adminUser")'   -> { ok: 1 }, getUsers() -> users: []
```

**Mongoose** (`evidence/05-connect.txt`, `06-db-connection.txt`, `07-crud-queries.txt`)

```
$ node connect.js
(node:1068) [MONGODB DRIVER] Warning: useNewUrlParser is a deprecated option: ...
(node:1068) [MONGODB DRIVER] Warning: useUnifiedTopology is a deprecated option: ...
MongoDB Connected

$ node -e "require('./db.js'); setTimeout(() => process.emit('SIGINT'), 2000)"
Database connected
Database disconnected
exit code: 0

$ node crud.js
Student added!
Record updated
Alice now: { name: 'Alice', age: 22, course: 'B.Tech', marks: 92 }
$gt 80      : Alice(92), Arjun(91)
CS & >= 75  : Rohan(79), Arjun(91)
IT or < 50  : Kabir(IT,65), Ishita(B.Tech,45)
sorted desc : Alice(92), Arjun(91), Rohan(79), Meera(72), Kabir(65), Ishita(45)
top 5       : Alice(92), Arjun(91), Rohan(79), Meera(72), Kabir(65)
projection  : [{"name":"Alice","course":"B.Tech"},{"name":"Rohan","course":"CS"}, ...]
Record deleted
count after delete: 5
```

Windows cannot send a real SIGINT to a child process (killing it that way skips the handler), so
the §8 handler was triggered with `process.emit("SIGINT")`, the same code path Ctrl+C takes in a
terminal.

**Clean-up** (`evidence/08-cleanup.txt`)

```
{ ok: 1, dropped: 'mydatabase' }
{ ok: 1, dropped: 'schoolDB' }
{ ok: 1, dropped: 'testDB' }
show dbs -> admin, config, local, notes_lab, student_portal, userdb   (same list as before the run)
```

## Not run, and why

- **Installers, `apt`, `brew`, `systemctl`, `mongod --repair`, uninstall** — the server is
  already installed and in daily use by other projects; reinstalling or repairing it would put
  their data at risk. The Windows equivalents are listed in the table above.
- **Enabling `security.authorization`** in `mongod.cfg` — it would lock out every other app on
  this machine that connects without credentials. The `createUser` / login part was run instead,
  and the user was removed afterwards.
- **MongoDB Atlas** — needs a cloud account. Connecting to it is the same `mongoose.connect()`
  call with a `mongodb+srv://` URL.
- **`mongodump` / `mongorestore` / `mongoexport` / `mongoimport`** — the MongoDB Database Tools
  are a separate download and are not installed here (`evidence/02-service.txt`).
