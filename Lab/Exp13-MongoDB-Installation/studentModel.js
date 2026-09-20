// Section 7 — Model Creation (verbatim from the manual)
const mongoose = require('mongoose');

// Define schema
const studentSchema = new mongoose.Schema({
  name: String,
  age: Number,
  course: String,
  marks: Number
});

// Create model
const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
