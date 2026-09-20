// Show databases
show dbs

// Switch to/create database
use mydatabase

// Create collection and insert document
db.users.insertOne({
  name: "John Doe",
  age: 30,
  email: "john@example.com"
})

// Insert multiple documents
db.users.insertMany([
  { name: "Jane Smith", age: 25, email: "jane@example.com" },
  { name: "Bob Johnson", age: 35, email: "bob@example.com" }
])

// Find all documents
db.users.find()

// Find with filter
db.users.find({ age: { $gt: 25 } })

// Update document
db.users.updateOne(
  { name: "John Doe" },
  { $set: { age: 31 } }
)

// Delete document
db.users.deleteOne({ name: "Bob Johnson" })

// Create index
db.users.createIndex({ email: 1 })

db.users.getIndexes()
db.users.find()
