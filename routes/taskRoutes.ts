import express from "express";
import { getTasks, createTask, updateTask, deleteTask } from "../controllers/taskController.ts";
import { authenticateToken, isAdmin } from "../middleware/authMiddleware.ts";

const router = express.Router();

router.get("/", authenticateToken, getTasks);
router.post("/", authenticateToken, isAdmin, createTask);
router.put("/:id", authenticateToken, isAdmin, updateTask);
router.delete("/:id", authenticateToken, isAdmin, deleteTask);

export default router;
