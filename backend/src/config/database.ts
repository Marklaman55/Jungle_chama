import mongoose from 'mongoose';
import { config } from './env.js';

const MONGO_URI = config.mongoUri;
const FALLBACK_URI = 'mongodb+srv://n8n_scrapper:n8n_scrapper@atlas-citrine-cable.60ngaae.mongodb.net/?appName=atlas-citrine-cable';

let cachedConnection: typeof mongoose | null = null;

export const connectDatabase = async (): Promise<typeof mongoose> => {
  if (cachedConnection) return cachedConnection;

  const connectionString = MONGO_URI || FALLBACK_URI;
  const censoredUri = connectionString.replace(/:([^@]+)@/, ':****@');
  console.log(`Connecting to MongoDB Atlas Cluster: ${censoredUri}`);

  const dbOptions = {
    dbName: 'jungle_chama',
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 15000,
  };

  mongoose.set('bufferCommands', true);

  const connection = await mongoose.connect(connectionString, dbOptions);
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