// Section 8 — Managing Database Connections (verbatim from the manual)
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/testDB');
    console.log('Database connected');
  } catch (error) {
    console.error('Connection error:', error);
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  console.log('Database disconnected');
};

connectDB();

// On exit
process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});
