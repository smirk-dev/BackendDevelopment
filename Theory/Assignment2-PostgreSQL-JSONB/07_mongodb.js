// Task 7 — the same five products in MongoDB, and the Task 3 / Task 4 / Task 5 queries.
// Run: mongosh --quiet mongodb://localhost:27017/assignment2 07_mongodb.js
db.products.drop();

const ins = db.products.insertMany([
  { name: "Clean Code", category: "book", price: 499.00,
    attributes: { author: "Robert C. Martin", pages: 464 } },
  { name: "Designing Data-Intensive Applications", category: "book", price: 1299.00,
    attributes: { author: "Martin Kleppmann", pages: 616, edition: 1 } },
  { name: "ThinkPad E14", category: "laptop", price: 68990.00,
    attributes: { ram_gb: 16, cpu: "Ryzen 7 7735HS", storage: { type: "ssd", gb: 512 } } },
  { name: "IdeaPad Slim 3", category: "laptop", price: 45990.00,
    attributes: { ram_gb: 8, cpu: "Core i5-1235U", storage: { type: "ssd", gb: 512 } } },
  { name: "Wireless Mouse", category: "accessory", price: 799.00,
    attributes: { color: "black", wireless: true, dpi: [800, 1600, 2400] } }
]);
print("inserted:", Object.keys(ins.insertedIds).length);

const show = (label, cursor) => { print("\n// " + label); cursor.forEach(d => printjson(d)); };
const p = { _id: 0, name: 1 };

// Task 3 equivalents
show("book: pages > 500", db.products.find({ category: "book", "attributes.pages": { $gt: 500 } }, { _id: 0, name: 1, "attributes.author": 1, "attributes.pages": 1 }));
show("laptop: ram_gb >= 16", db.products.find({ category: "laptop", "attributes.ram_gb": { $gte: 16 } }, { _id: 0, name: 1, "attributes.cpu": 1 }));
show("accessory: color black", db.products.find({ category: "accessory", "attributes.color": "black" }, { _id: 0, name: 1, "attributes.dpi": 1 }));
show("nested: storage.type ssd", db.products.find({ "attributes.storage.type": "ssd" }, p));

// Task 4 equivalent (containment) and key-exists
show("wireless: true", db.products.find({ "attributes.wireless": true }, p));
show("array member: dpi contains 1600", db.products.find({ "attributes.dpi": 1600 }, p));
show("key exists: attributes.storage", db.products.find({ "attributes.storage": { $exists: true } }, p));

// Task 5 equivalent: add a field, no schema change
const upd = db.products.updateOne({ name: "Wireless Mouse" }, { $set: { "attributes.discount_pct": 10 } });
print("\n// updateOne matched/modified:", upd.matchedCount, upd.modifiedCount);
show("after $set", db.products.find({ name: "Wireless Mouse" }, { _id: 0, name: 1, attributes: 1 }));

// Indexing: one index per path, not one index for the whole document
db.products.createIndex({ category: 1, "attributes.ram_gb": 1 });
const plan = db.products.find({ category: "laptop", "attributes.ram_gb": { $gte: 16 } }).explain("executionStats");
const stage = s => s.inputStage ? s.stage + " -> " + stage(s.inputStage) : s.stage + (s.indexName ? " (" + s.indexName + ")" : "");
print("\n// laptop query plan with index:", stage(plan.queryPlanner.winningPlan),
      "| keysExamined", plan.executionStats.totalKeysExamined, "| docsExamined", plan.executionStats.totalDocsExamined);
