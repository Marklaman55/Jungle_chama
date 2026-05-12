import { Request, Response } from "express";
import Product from "../models/Product.ts";

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  const { name, description, minPrice, maxPrice, currentPrice, investmentRequired, duration, expectedReturn, stock, imageUrl, tasks } = req.body;

  try {
    const product = new Product({
      name,
      description,
      minPrice,
      maxPrice,
      currentPrice: currentPrice || minPrice,
      investmentRequired,
      duration,
      expectedReturn,
      stock,
      imageUrl,
      tasks: tasks || [],
    });
    await product.save();
    res.status(201).json(product);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const product = await Product.findByIdAndUpdate(id, req.body, { returnDocument: 'after' });
    res.json(product);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await Product.findByIdAndDelete(id);
    res.json({ message: "Product deleted" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
