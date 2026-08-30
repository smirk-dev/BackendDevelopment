# Theory Task 6 (FastAPI half) — L08 Part C and section 18, plus Lab Exercises 3 and 5.
# Run: uvicorn main:app --reload   (or: python main.py)
import os
from datetime import datetime
from pathlib import Path

import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

BASE_DIR = Path(__file__).resolve().parent   # so templates/ and static/ are found from any working folder

app = FastAPI(title="SSR with Jinja2")
templates = Jinja2Templates(directory=BASE_DIR / "templates")
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")

students = [
    {"id": 1, "name": "Aarav", "branch": "CSE"},
    {"id": 2, "name": "Diya", "branch": "ECE"},
    {"id": 3, "name": "Rohan", "branch": "IT"},
]


# Section 13: Hello World
@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse(request, "home.html", {"name": "Aarav"})


# Section 14: student list. ?empty=1 renders the "No students found" branch of the template.
@app.get("/students", response_class=HTMLResponse)
def student_list(request: Request, empty: bool = False):
    return templates.TemplateResponse(request, "students.html", {"students": [] if empty else students})


# Lab Exercise 3: current server date and time through {{ now }}
@app.get("/now", response_class=HTMLResponse)
def server_time(request: Request):
    now = datetime.now()
    return templates.TemplateResponse(
        request, "now.html", {"now": now.strftime("%A, %d %B %Y, %H:%M:%S"), "iso": now.isoformat(timespec="seconds")}
    )


# Lab Exercise 5: an image from static/images/ shown in a template
@app.get("/gallery", response_class=HTMLResponse)
def gallery(request: Request):
    return templates.TemplateResponse(request, "gallery.html", {"image": "images/server-rack.svg"})


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=int(os.environ.get("PORT", 8000)), reload=True)
