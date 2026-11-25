# Backend Development: Lab and Theory

Course: **Backend Development (CSFS3008P)** · B.Tech Full Stack, Semester 5 · UPES
Instructor: Dr. Prateek Raj Gautam · Student: Suryansh Mishra (590012069, `smirk-dev`)

All the coursework, one folder per experiment or task. Live site: <https://smirk-dev.github.io/BackendDevelopment/> shows every folder's README and downloads any of them, or all of them together, as a PDF report.

- **PBL Assignment:** [smirk-dev/Backend-PBL](https://github.com/smirk-dev/Backend-PBL), the Exam 01 notes app with Docker, docker-compose, automated route tests and a scheduled GitHub Actions pipeline (test, then build and push to Docker Hub)
- **Unit 4 hands-on (Docker + CI/CD):** [smirk-dev/FastAPI-Docker-Tutorial](https://github.com/smirk-dev/FastAPI-Docker-Tutorial), mounted here as the submodule [`Theory/Unit4-Docker-CICD`](Theory/Unit4-Docker-CICD/)

## Lab experiments

| # | Experiment | Folder |
|---|------------|--------|
| 00 | Git basics (Part A) and the optional Git hands-on (Part B) | [`Lab/Exp00-Git-Basics/`](Lab/Exp00-Git-Basics/) |
| 01 | Create a web page with all possible elements of HTML5 | [`Lab/Exp01-HTML5-Elements/`](Lab/Exp01-HTML5-Elements/) |
| 02 | Create a web page with all types of Cascading Style Sheets | [`Lab/Exp02-CSS-Types/`](Lab/Exp02-CSS-Types/) |
| 03 | Create a responsive web page with HTML and CSS | [`Lab/Exp03-Responsive-HTML-CSS/`](Lab/Exp03-Responsive-HTML-CSS/) |
| 04 | Responsive web pages with Bootstrap and Tailwind CSS | [`Lab/Exp04-Responsive-Bootstrap/`](Lab/Exp04-Responsive-Bootstrap/) |
| 05 | Programs to demonstrate JavaScript arrays, objects and functions | [`Lab/Exp05-JS-Arrays-Objects-Functions/`](Lab/Exp05-JS-Arrays-Objects-Functions/) |
| 06 | Client-side scripts for form validation using JavaScript | [`Lab/Exp06-Form-Validation/`](Lab/Exp06-Form-Validation/) |
| 07 & 08 | ES6, DOM manipulation and event handling (every manual section live, plus the To-Do app) | [`Lab/Exp07_08-ES6-DOM-Events/`](Lab/Exp07_08-ES6-DOM-Events/) |
| 09, 10, 11 | AJAX with XML and JSON, jQuery, and an Ajax website (one project in the manual) | [`Lab/Exp09_10_11-AJAX-jQuery-Website/`](Lab/Exp09_10_11-AJAX-jQuery-Website/) |
| 12 | Node.js, npm, Express, nodemon and EJS (Parts A-C) | [`Lab/Exp12-NodeJS-Express-EJS/`](Lab/Exp12-NodeJS-Express-EJS/) |
| 12B | State management with sessions and cookies (optional) | [`Lab/Exp12B-State-Management/`](Lab/Exp12B-State-Management/) |
| 13 | Installation of MongoDB, mongosh basics and Mongoose CRUD | [`Lab/Exp13-MongoDB-Installation/`](Lab/Exp13-MongoDB-Installation/) |
| 13A | MongoDB, Mongoose and Express user registration and login | [`Lab/Exp13A-MongoDB-Mongoose-UserAuth/`](Lab/Exp13A-MongoDB-Mongoose-UserAuth/) |
| 13B | User registration, login and a To-Do REST API with Express and MongoDB (optional) | [`Lab/Exp13B-Express-MongoDB-Todo/`](Lab/Exp13B-Express-MongoDB-Todo/) |
| 14 | PostgreSQL: relational vs document databases (optional) | [`Lab/Exp14-PostgreSQL/`](Lab/Exp14-PostgreSQL/) |
| 15 | Django To-Do app, both versions of the manual | [`Lab/Exp15-Django-Todo-App/`](Lab/Exp15-Django-Todo-App/) |
| Exam 01 | Lab examination: "My Notes", a notes app with Express, EJS and MongoDB | [`Lab/Exam01-Notes-App/`](Lab/Exam01-Notes-App/) |

## Theory tasks and assignments

Full table with the lecture each one comes from: [`Theory/README.md`](Theory/README.md).

| Task | Folder |
|------|--------|
| Task 1: Node.js, npm, Express and EJS | [`Theory/Task1/`](Theory/Task1/) |
| Task 2: Flask API and inspecting HTTP requests (curl, Postman) | [`Theory/Task2/`](Theory/Task2/) |
| Task 3: RESTful APIs with FastAPI | [`Theory/Task3/`](Theory/Task3/) |
| Task 4: Sessions, cookies and query strings | [`Theory/Task4/`](Theory/Task4/) |
| Task 5: localStorage, sessionStorage and JSON | [`Theory/Task5/`](Theory/Task5/) |
| Task 6: Server-side rendering and templating engines | [`Theory/Task6/`](Theory/Task6/) |
| Unit 4: FastAPI + Docker + GitHub Actions CI/CD | [`Theory/Unit4-Docker-CICD/`](Theory/Unit4-Docker-CICD/) (submodule) |
| Assignment 1: Notes app with localStorage | [`Theory/Assignment1-Notes-App/`](Theory/Assignment1-Notes-App/) |
| Assignment 2: PostgreSQL JSONB vs MongoDB | [`Theory/Assignment2-PostgreSQL-JSONB/`](Theory/Assignment2-PostgreSQL-JSONB/) |
| Assignment 3: Event-driven serverless (Topic 9) | [`Theory/Assignment3-Event-Driven-Serverless/`](Theory/Assignment3-Event-Driven-Serverless/) |
| PBL Assignment | [smirk-dev/Backend-PBL](https://github.com/smirk-dev/Backend-PBL) |

## Running any of them

Each folder's `README.md` says what it covers, how to run it, and the checks that were run
against it.

```bash
# static pages (Exp 01-07&08, Exp 09-11 pages): from inside the folder
py -3 -m http.server 8000

# Node folders (Exp 09-11 API, 12, 12B, 13, 13A, 13B, Exam 01, Theory Tasks 1, 4, 6)
npm install
npm start

# Python folders (Theory Tasks 2, 3, 6, Exp 15)
py -3 -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
```

MongoDB experiments expect a server on `localhost:27017`. The PostgreSQL work runs Postgres in Docker;
the commands are in those folders.

## Conventions

- Plain HTML, CSS and JavaScript unless the experiment asks for a framework. No build step.
- **All assets are local.** No CDN links, no placeholder-image services, no remote sample
  media. Frameworks the manuals use (Bootstrap, Tailwind, jQuery) are vendored, so every page
  renders offline in the lab.
- `node_modules`, virtual environments, databases and `.env` files are never committed.

## Lab manuals

Published at <https://upessocs.github.io> (a client-side viewer). The underlying markdown
lives in the [`upessocs/Lectures`](https://github.com/upessocs/Lectures) repository under
`Backend Development/`.
