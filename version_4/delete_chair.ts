
import mongoose from 'mongoose';
import Product from './models/Product.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://n8n_scrapper:n8n_scrapper@atlas-citrine-cable.60ngaae.mongodb.net/?appName=atlas-citrine-cable';

async function deleteRusticChair() {
  try {
    await mongoose.connect(MONGO_URI, { dbName: 'jungle_chama' });
    const result = await Product.deleteOne({ name: 'Rustic Wooden Chair' });
    console.log('Delete result:', result);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

deleteRusticChair();
