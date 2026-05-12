import express from "express";
import { createReview, getProductReviews, getLatestReviews, getAllReviews } from "../controllers/reviewController";
import { authenticateToken, isAdmin } from "../middleware/authMiddleware";
import { upload } from "../middleware/upload";

const router = express.Router();

router.post(
  "/",
  authenticateToken,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  createReview
);

router.get("/all", authenticateToken, isAdmin, getAllReviews);
router.get("/product/:productId", getProductReviews);
router.get("/latest", getLatestReviews);

export default router;
