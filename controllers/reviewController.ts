import { Request, Response } from "express";
import Review from "../models/Review";
import Product from "../models/Product";

export const createReview = async (req: Request, res: Response) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = (req as any).user.id;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const review = new Review({
      userId,
      productId,
      rating: Number(rating),
      comment,
      image: req.files && (req.files as any).image ? (req.files as any).image[0].path : undefined,
      video: req.files && (req.files as any).video ? (req.files as any).video[0].path : undefined,
    });

    await review.save();
    res.status(201).json(review);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId })
      .populate("userId", "name")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getLatestReviews = async (req: Request, res: Response) => {
  try {
    const reviews = await Review.find()
      .populate("userId", "name")
      .populate("productId", "name")
      .sort({ createdAt: -1 })
      .limit(3);
    res.json(reviews);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllReviews = async (req: Request, res: Response) => {
  try {
    const reviews = await Review.find()
      .populate("userId", "name")
      .populate("productId", "name")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
