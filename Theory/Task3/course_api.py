# Theory Task 3 — L05 Lab Exercise: a Course resource with full CRUD in FastAPI.
# Run: uvicorn course_api:app --reload --port 5000   (or: python course_api.py)
import os
from typing import List, Optional

import uvicorn
from fastapi import FastAPI, HTTPException, Query, Response, status
from pydantic import BaseModel, Field, field_validator

app = FastAPI(
    title="Course Management API",
    version="1.0.0",
    description="L05 lab exercise: GET all, GET by id, POST, PUT, DELETE, and ?department= filtering.",
)


class CourseIn(BaseModel):
    """What a client sends. The server owns the id."""
    title: str = Field(min_length=2, max_length=80, examples=["Backend Development"])
    credits: int = Field(ge=1, le=6, examples=[4])
    department: str = Field(min_length=2, max_length=10, examples=["CSE"])

    @field_validator("department")
    @classmethod
    def normalise_department(cls, value: str) -> str:
        # "cse", " Cse " and "CSE" are the same department
        return value.strip().upper()


class Course(CourseIn):
    id: int


courses: dict[int, Course] = {
    1: Course(id=1, title="Backend Development", credits=4, department="CSE"),
    2: Course(id=2, title="Data Communication and Networks", credits=3, department="CSE"),
    3: Course(id=3, title="Digital Electronics", credits=3, department="ECE"),
    4: Course(id=4, title="Linear Algebra", credits=4, department="MATH"),
}
next_id = 5


def find_or_404(course_id: int) -> Course:
    course = courses.get(course_id)
    if course is None:
        raise HTTPException(status_code=404, detail=f"Course {course_id} not found")
    return course


@app.get("/")
def root():
    return {"message": "Course Management API", "docs": "/docs", "redoc": "/redoc"}


@app.get("/courses", response_model=List[Course])
def list_courses(department: Optional[str] = Query(None, description="Filter, e.g. CSE")):
    result = list(courses.values())
    if department:
        result = [c for c in result if c.department == department.strip().upper()]
    return result


@app.get("/courses/{course_id}", response_model=Course)
def get_course(course_id: int):
    return find_or_404(course_id)


@app.post("/courses", response_model=Course, status_code=status.HTTP_201_CREATED)
def create_course(data: CourseIn):
    global next_id
    course = Course(id=next_id, **data.model_dump())
    courses[next_id] = course
    next_id += 1
    return course


@app.put("/courses/{course_id}", response_model=Course)
def replace_course(course_id: int, data: CourseIn):
    find_or_404(course_id)
    courses[course_id] = Course(id=course_id, **data.model_dump())
    return courses[course_id]


@app.delete("/courses/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(course_id: int):
    find_or_404(course_id)
    del courses[course_id]
    return Response(status_code=status.HTTP_204_NO_CONTENT)


if __name__ == "__main__":
    uvicorn.run("course_api:app", host="127.0.0.1", port=int(os.environ.get("PORT", 5000)), reload=True)
