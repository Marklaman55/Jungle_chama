import mongoose from 'mongoose';

// dotenv is loaded in app.ts via import 'dotenv/config'

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error('MONGO_URI environment variable is required. Set it in your Render dashboard.');
}

let cachedConnection: typeof mongoose | null = null;

export const connectDatabase = async (): Promise<typeof mongoose> => {
  if (cachedConnection) return cachedConnection;

  const censoredUri = MONGO_URI.replace(/:([^@]+)@/, ':****@');
  console.log(`Connecting to MongoDB Atlas Cluster: ${censoredUri}`);

  const dbOptions = {
     dbName: 'jungle_chama',
     serverSelectionTimeoutMS: 5000,
     connectTimeoutMS: 5000,
     socketTimeoutMS: 5000,
     maxPoolSize: 5,
   };

  mongoose.set('bufferCommands', true);

  const connection = await mongoose.connect(MONGO_URI, dbOptions);
  cachedConnection = connection;

  mongoose.connection.on('connected', () =>
    console.log('Mongoose connected successfully to jungle_chama database.')
  );
  mongoose.connection.on('error', (err) =>
    console.error('Mongoose connection error:', err)
  );
  mongoose.connection.on('disconnected', () =>
    console.log('Mongoose connection lost.')
  );

  return connection;
};