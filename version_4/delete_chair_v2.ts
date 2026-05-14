
import mongoose from 'mongoose';
import Product from './models/Product.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://n8n_scrapper:n8n_scrapper@atlas-citrine-cable.60ngaae.mongodb.net/?appName=atlas-citrine-cable';

async function deleteRusticChair() {
  try {
    await mongoose.connect(MONGO_URI, { dbName: 'jungle_chama' });
    // Aggressive search for the chair
    const products = await Product.find({ name: /rustic.*chair/i });
    if (products.length > 0) {
        console.log('Found products to delete:', products.map(p => p.name));
        const ids = products.map(p => p._id);
        const result = await Product.deleteMany({ _id: { $in: ids } });
        console.log('Delete result:', result);
    } else {
        console.log('No Rustic Wooden Chair found.');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

deleteRusticChair();
