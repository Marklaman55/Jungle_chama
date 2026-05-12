import express from "express";
import { getCart, addToCart, removeFromCart, checkout, getOrders } from "../controllers/cartController.ts";
import { authenticateToken } from "../middleware/authMiddleware.ts";

const router = express.Router();

router.get("/", authenticateToken, getCart);
router.post("/add", authenticateToken, addToCart);
router.delete("/:id", authenticateToken, removeFromCart);
router.post("/checkout", authenticateToken, checkout);
router.get("/orders", authenticateToken, getOrders);
router.get("/", authenticateToken, (req, res, next) => {
  // If this is called as /api/orders, it should return orders
  if (req.baseUrl === '/api/orders') return getOrders(req, res);
  // Otherwise it's /api/cart, return cart
  return getCart(req, res);
});

export default router;
