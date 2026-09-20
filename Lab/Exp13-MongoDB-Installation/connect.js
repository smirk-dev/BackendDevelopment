// Section 5 — Connecting MongoDB to Node.js (verbatim from the manual)
const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/schoolDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log('Connection error:', err));

// Added so the script exits once the connection is proven (the manual's snippet keeps it open).
mongoose.connection.once('open', () => setTimeout(() => mongoose.disconnect(), 200));
