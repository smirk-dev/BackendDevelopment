# Theory Task 2 — L03 Tasks 6-7 (Flask server) and L04 (inspecting HTTP requests).
# L03 Lab Exercise 4 adds POST /students; /client serves the fetch() page from L04.
import os

from flask import Flask, jsonify, request, send_from_directory

app = Flask(__name__)

students = [
    {"id": 1, "name": "Aarav", "branch": "CSE"},
    {"id": 2, "name": "Diya", "branch": "ECE"},
    {"id": 3, "name": "Rohan", "branch": "IT"},
]


@app.route("/")
def home():
    return "Student Management API"


@app.route("/students", methods=["GET"])
def get_students():
    return jsonify(students)


@app.route("/students/<int:student_id>")
def get_student(student_id):
    student = next((s for s in students if s["id"] == student_id), None)
    if student:
        return jsonify(student)
    else:
        return jsonify({"error": "Student not found"}), 404


@app.route("/students", methods=["POST"])
def add_student():
    # silent=True gives None instead of raising when the body is missing or not JSON
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    branch = str(data.get("branch", "")).strip()
    if not name or not branch:
        return jsonify({"error": "Both 'name' and 'branch' are required"}), 400

    new_student = {
        "id": max((s["id"] for s in students), default=0) + 1,
        "name": name,
        "branch": branch.upper(),
    }
    students.append(new_student)
    return jsonify(new_student), 201


@app.route("/client")
def client():
    # Same origin as the API, so fetch() needs no CORS headers.
    return send_from_directory(app.static_folder, "client.html")


if __name__ == "__main__":
    app.run(debug=True, port=int(os.environ.get("PORT", 5000)))
