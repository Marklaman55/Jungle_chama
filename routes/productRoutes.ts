import express from "express";
import { getAllProducts, createProduct, updateProduct, deleteProduct } from "../controllers/productController.ts";
import { authenticateToken, isAdmin } from "../middleware/authMiddleware.ts";

const router = express.Router();

router.get("/", getAllProducts);
router.post("/", authenticateToken, isAdmin, createProduct);
router.put("/:id", authenticateToken, isAdmin, updateProduct);
router.delete("/:id", authenticateToken, isAdmin, deleteProduct);

export default router;
