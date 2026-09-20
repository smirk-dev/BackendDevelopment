// Sections 9-11 — CRUD, query operators, sort/limit/projection.
// Each block is the manual's snippet verbatim; the manual shows them as loose top-level
// `await` fragments, so here they are wrapped in one async main() against schoolDB.
const mongoose = require('mongoose');
const Student = require('./studentModel');

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/schoolDB');
  await Student.deleteMany({}); // start from an empty collection so the output is repeatable

  // (1) Create – Insert a Document
  const newStudent = new Student({
    name: "Alice",
    age: 22,
    course: "B.Tech",
    marks: 88
  });

  await newStudent.save();
  console.log('Student added!');

  // extra rows so the query-operator examples below have something to filter
  await Student.insertMany([
    { name: "Rohan", age: 21, course: "CS", marks: 79 },
    { name: "Meera", age: 23, course: "CS", marks: 72 },
    { name: "Kabir", age: 20, course: "IT", marks: 65 },
    { name: "Ishita", age: 22, course: "B.Tech", marks: 45 },
    { name: "Arjun", age: 24, course: "CS", marks: 91 }
  ]);
  console.log('Inserted 5 more students for the query examples');

  // (2) Read – Find Documents
  // Find all
  const students = await Student.find();
  console.log(students);

  // Find with condition
  const result = await Student.findOne({ name: "Alice" });
  console.log(result);

  // (3) Update – Modify Existing Document
  await Student.updateOne({ name: "Alice" }, { $set: { marks: 92 } });
  console.log('Record updated');
  console.log('Alice now:', (await Student.findOne({ name: "Alice" }, { _id: 0, __v: 0 })).toObject());

  // 10. Query Operators and Filters
  // Greater than operator
  const topStudents = await Student.find({ marks: { $gt: 80 } });
  console.log('$gt 80      :', topStudents.map(s => `${s.name}(${s.marks})`).join(', '));

  // AND condition
  const csStudents = await Student.find({ course: "CS", marks: { $gte: 75 } });
  console.log('CS & >= 75  :', csStudents.map(s => `${s.name}(${s.marks})`).join(', '));

  // OR condition
  const special = await Student.find({ $or: [{ course: "IT" }, { marks: { $lt: 50 } }] });
  console.log('IT or < 50  :', special.map(s => `${s.name}(${s.course},${s.marks})`).join(', '));

  // 11. Sorting, Limiting, and Projecting Results
  const sorted = await Student.find().sort({ marks: -1 }); // Descending
  console.log('sorted desc :', sorted.map(s => `${s.name}(${s.marks})`).join(', '));

  const top5 = await Student.find().sort({ marks: -1 }).limit(5);
  console.log('top 5       :', top5.map(s => `${s.name}(${s.marks})`).join(', '));

  const namesOnly = await Student.find({}, { name: 1, course: 1, _id: 0 });
  console.log('projection  :', JSON.stringify(namesOnly));

  // (4) Delete – Remove Document
  await Student.deleteOne({ name: "Alice" });
  console.log('Record deleted');
  console.log('count after delete:', await Student.countDocuments());

  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
