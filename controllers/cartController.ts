import { Request, Response } from "express";
import Cart from "../models/Cart.ts";
import Order from "../models/Order.ts";
import Product from "../models/Product.ts";
import User from "../models/User.ts";

export const getCart = async (req: any, res: Response) => {
  try {
    const cartItems = await Cart.find({ memberId: req.user.id }).populate("productId");
    const formatted = cartItems.map((item: any) => ({
      cartId: item._id,
      _id: item.productId._id,
      name: item.productId.name,
      description: item.productId.description,
      price: item.productId.currentPrice,
      quantity: item.quantity,
      imageUrl: item.productId.imageUrl,
    }));
    res.json(formatted);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const addToCart = async (req: any, res: Response) => {
  const { productId, quantity } = req.body;
  try {
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });
    
    if (product.stock < (quantity || 1)) {
      return res.status(400).json({ error: "Insufficient stock" });
    }

    let item = await Cart.findOne({ memberId: req.user.id, productId });
    if (item) {
      if (product.stock < (item.quantity + (quantity || 1))) {
        return res.status(400).json({ error: "Insufficient stock" });
      }
      item.quantity += quantity || 1;
      await item.save();
    } else {
      item = new Cart({ memberId: req.user.id, productId, quantity: quantity || 1 });
      await item.save();
    }
    res.json(item);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const removeFromCart = async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    // Ownership validation
    const item = await Cart.findOneAndDelete({ _id: id, memberId: req.user.id });
    if (!item) return res.status(404).json({ error: "Cart item not found or unauthorized" });
    res.json({ message: "Item removed" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const checkout = async (req: any, res: Response) => {
  const { deliveryAddress } = req.body;
  try {
    const cartItems = await Cart.find({ memberId: req.user.id }).populate("productId");
    if (cartItems.length === 0) return res.status(400).json({ error: "Cart is empty" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    let productTotal = 0;
    const orderItems = [];

    for (const item of cartItems) {
      const product = item.productId as any;
      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      }
      productTotal += product.currentPrice * item.quantity;
      orderItems.push({
        productId: product._id,
        name: product.name,
        price: product.currentPrice,
        quantity: item.quantity,
      });
    }

    const deliveryFee = Number(process.env.DELIVERY_FEE) || 190;
    const total = productTotal + deliveryFee;

    const order = new Order({
      memberId: req.user.id,
      items: orderItems,
      productTotal,
      deliveryFee,
      total,
      paymentStatus: "pending",
      orderStatus: "pending",
      deliveryStatus: "processing",
      deliveryPartner: process.env.DELIVERY_PARTNER || "ParcelGrid",
      deliveryAddress,
    });

    await order.save();
    
    // Clear cart after order creation
    await Cart.deleteMany({ memberId: req.user.id });

    res.json(order);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getOrders = async (req: any, res: Response) => {
  try {
    const orders = await Order.find({ memberId: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
