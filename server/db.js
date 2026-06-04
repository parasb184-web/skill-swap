const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/skillswap';
  
  try {
    // Configure connection pooling and connection options
    const options = {
      maxPoolSize: 200, // Handle 200+ concurrent requests using pool
      minPoolSize: 10,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
    };

    console.log(`Connecting to MongoDB at: ${mongoURI}...`);
    const conn = await mongoose.connect(mongoURI, options);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Monitor connection states
    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB Connection Error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
