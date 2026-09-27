// inside mongosh
use student_management

db.students.insertMany([
  { name: "Alice Sharma", branch: "CSE", email: "alice@example.com", enrollment_date: new Date("2024-01-15") },
  { name: "Bilal Khan",   branch: "ECE", email: "bilal@example.com", enrollment_date: new Date("2023-08-10") },
  { name: "Carla Gomez",  branch: "CSE", email: "carla@example.com", enrollment_date: new Date("2024-03-02") }
])

db.students.find({ branch: "CSE" })
db.students.updateOne({ email: "bilal@example.com" }, { $set: { branch: "AI/ML" } })
db.students.deleteOne({ email: "carla@example.com" })

// Beyond the manual, for the comparison with the SQL side
// enrolled after Jan 2024 (SQL: WHERE enrollment_date > '2024-01-31')
db.students.find({ enrollment_date: { $gt: new Date("2024-01-31") } })
// no schema: a document can carry fields the others do not have (SQL needed ALTER TABLE ... ADD COLUMN profile JSONB)
db.students.updateOne({ email: "alice@example.com" }, { $set: { profile: { skills: ["python", "sql"], clubs: { robotics: true } } } })
db.students.find({ "profile.clubs.robotics": true }, { _id: 0, name: 1, profile: 1 })
// GROUP BY equivalent
db.students.aggregate([{ $group: { _id: "$branch", total: { $sum: 1 } } }, { $sort: { total: -1 } }])
// no UNIQUE constraint unless you create an index yourself
db.students.insertOne({ name: "Alice Copy", email: "alice@example.com" })
db.students.countDocuments({ email: "alice@example.com" })
db.students.find({}, { _id: 0 })
