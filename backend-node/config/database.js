import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    let mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017';
    const dbName = process.env.DB_NAME || 'pharmaventory';
    
    // Handle MongoDB Atlas connection strings (mongodb+srv://)
    // If connection string already ends with /, append database name
    // Otherwise, append /database_name
    if (mongoUrl.endsWith('/')) {
      mongoUrl = `${mongoUrl}${dbName}`;
    } else if (!mongoUrl.includes('/') || !mongoUrl.match(/\/[^\/]+$/)) {
      mongoUrl = `${mongoUrl}/${dbName}`;
    }
    
    // Add connection options for MongoDB Atlas
    const options = {
      retryWrites: true,
      w: 'majority',
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };
    
    // For mongodb+srv (Atlas), add SSL options
    if (mongoUrl.startsWith('mongodb+srv://')) {
      options.tls = true;
      options.tlsAllowInvalidCertificates = false;
    }
    
    await mongoose.connect(mongoUrl, options);
    console.log(`✓ MongoDB connected: ${dbName}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check if your password is correct in .env file');
    console.error('2. Verify your IP is whitelisted in MongoDB Atlas Network Access');
    console.error('3. Ensure database user exists and has proper permissions');
    console.error('4. Check if connection string format is correct');
    console.error('\nConnection string (password hidden):', 
      process.env.MONGO_URL?.replace(/:[^:@]+@/, ':****@'));
    process.exit(1);
  }
};

