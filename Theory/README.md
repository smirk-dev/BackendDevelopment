# Backend Development: Theory tasks and assignments

Course: Backend Development (CSFS3008P), B.Tech CSE Semester 5, UPES, Dr. Prateek Raj Gautam.
Student: Suryansh Mishra (590012069), GitHub `smirk-dev`.

Each folder has its own README covering what was built, how to run it, and a "Checks run" section
with the actual output.

| Task | Folder | Lecture | Status |
|---|---|---|---|
| Task 1: Node.js, npm, Express and EJS | [`Task1/`](Task1/) | Unit 1, L03 Setting Up the Backend Environment, §7 and Lab Exercise 3 | done, missing `views` fixed, checked before and after with curl |
| Task 2: Flask API and inspecting HTTP requests | [`Task2/`](Task2/) | Unit 1, L03 §8-10 and L04 HTTP Requests, DevTools, curl, Postman, fetch | done, every endpoint checked with curl; saved Postman collection |
| Task 3: RESTful APIs with FastAPI | [`Task3/`](Task3/) | Unit 1, L05 RESTful APIs and FastAPI | done, CRUD checked with curl; Swagger UI read in headless Chrome |
| Task 4: Sessions, cookies and query strings | [`Task4/`](Task4/) | Unit 1, L06 Managing server-side Session, Cookie, and State Management | done, checked with curl cookie jars |
| Task 5: localStorage, sessionStorage and JSON | [`Task5/`](Task5/) | Unit 1, L07 LocalStorage, SessionStorage and JSON, §1-11 | done, checked in headless Chrome |
| Task 6: Server-side rendering and templating engines | [`Task6/`](Task6/) | Unit 1, L08 Server-Side Rendering and Templating Engines | done, Express + EJS and FastAPI + Jinja2 both run |
| Unit 4: FastAPI + Docker + GitHub Actions CI/CD | [`Unit4-Docker-CICD/`](Unit4-Docker-CICD/) (git submodule) | Unit 4, Docker and CI/CD | done, in its own repo: [smirk-dev/upes-sem5-backend-task4-fastapi-docker-cicd](https://github.com/smirk-dev/upes-sem5-backend-task4-fastapi-docker-cicd) |
| Assignment 1: Notes app | [`Assignment1-Notes-App/`](Assignment1-Notes-App/) | Unit 1, L07 §12 "Final Task: Build a Notes App" | done, 38/38 browser tests pass |
| Assignment 2: PostgreSQL JSONB | [`Assignment2-PostgreSQL-JSONB/`](Assignment2-PostgreSQL-JSONB/), write-up [`Assignment 2 PostgreSQL JSONB.md`](Assignment%202%20PostgreSQL%20JSONB.md) (same text as [`590012069_assignment2.md`](590012069_assignment2.md)) | Assignment 2 brief (database unit; builds on Lab Exp 13 and 14) | done, every query run on Postgres 17 and MongoDB 8.2, outputs saved |
| Assignment 3: Event-driven serverless (Topic 9) | [`Assignment3-Event-Driven-Serverless/`](Assignment3-Event-Driven-Serverless/) | Unit 5, L55-57 Serverless with AWS Lambda and L59 Assignment III | done, 12-slide deck, PDF and presenter notes |
| PBL Assignment: Notes app with Docker and CI/CD | separate repo | Unit 4 PBL | done, in its own repo: [smirk-dev/backend-pbl-notes-cicd](https://github.com/smirk-dev/backend-pbl-notes-cicd) |

`Unit4-Docker-CICD` was the original `Task4` folder. It became a submodule pointing at its own
repository, and `Task4/` now holds the L06 sessions and cookies task.

## Running anything here

Node folders: `npm install`, then `npm start` (or `node app.js`). Python folders: create a virtual
environment, `pip install -r requirements.txt`, then the command in that folder's README.
`node_modules`, virtual environments and caches are not committed.
