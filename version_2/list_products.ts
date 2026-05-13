
import mongoose from 'mongoose';
import Product from './models/Product.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://n8n_scrapper:n8n_scrapper@atlas-citrine-cable.60ngaae.mongodb.net/?appName=atlas-citrine-cable';

async function listProducts() {
  try {
    await mongoose.connect(MONGO_URI, { dbName: 'jungle_chama' });
    const products = await Product.find({}, 'name');
    console.log('Products:', JSON.stringify(products, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listProducts();
