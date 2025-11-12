import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    let mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017';
    const dbName = process.env.DB_NAME || 'pharmaventory';
    
    // Clean up connection string (remove quotes, spaces, etc.)
    mongoUrl = mongoUrl.trim().replace(/^["']|["']$/g, '');
    
    // Handle MongoDB Atlas connection strings (mongodb+srv://)
    // If connection string already ends with /, append database name
    // Otherwise, append /database_name
    if (mongoUrl.endsWith('/')) {
      mongoUrl = `${mongoUrl}${dbName}?retryWrites=true&w=majority`;
    } else if (!mongoUrl.includes('/') || !mongoUrl.match(/\/[^\/\?]+$/)) {
      mongoUrl = `${mongoUrl}/${dbName}?retryWrites=true&w=majority`;
    } else if (!mongoUrl.includes('?')) {
      mongoUrl = `${mongoUrl}?retryWrites=true&w=majority`;
    }
    
    console.log('Attempting to connect to MongoDB...');
    console.log('Connection string (password hidden):', 
      mongoUrl.replace(/:[^:@]+@/, ':****@'));
    
    // Add connection options for MongoDB Atlas
    const options = {
      retryWrites: true,
      w: 'majority',
      serverSelectionTimeoutMS: 10000,
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
    console.error('\n❌ MongoDB connection error:', error.message);
    
    if (error.message.includes('authentication failed') || error.message.includes('bad auth')) {
      console.error('\n🔴 AUTHENTICATION FAILED - This means:');
      console.error('   1. Password is INCORRECT');
      console.error('   2. User does NOT exist in MongoDB Atlas');
      console.error('   3. User exists but password is WRONG');
      console.error('\n✅ FIX STEPS:');
      console.error('   1. Go to MongoDB Atlas → Database Access');
      console.error('   2. Find user "arpitsingh" (or create new user)');
      console.error('   3. Click "Edit" → "Edit Password"');
      console.error('   4. Set password (remember it!)');
      console.error('   5. Update .env file with correct password');
      console.error('   6. Also update Render environment variable');
      console.error('\n📝 Connection string format:');
      console.error('   mongodb+srv://username:password@cluster.mongodb.net/');
      console.error('   (NO quotes, NO spaces around =)');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('timeout')) {
      console.error('\n🔴 NETWORK ERROR - This means:');
      console.error('   Your IP is NOT whitelisted in MongoDB Atlas');
      console.error('\n✅ FIX:');
      console.error('   1. Go to MongoDB Atlas → Network Access');
      console.error('   2. Click "Add IP Address"');
      console.error('   3. Select "Allow Access from Anywhere"');
      console.error('   4. This adds 0.0.0.0/0 (allows all IPs)');
      console.error('   5. Wait 1-2 minutes for changes to apply');
    }
    
    console.error('\nConnection string used (password hidden):', 
      process.env.MONGO_URL?.replace(/:[^:@]+@/, ':****@'));
    
    // Don't exit in production, let it retry
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    } else {
      console.error('\n⏳ Will retry connection in 10 seconds...');
      setTimeout(() => connectDB(), 10000);
    }
  }
};

