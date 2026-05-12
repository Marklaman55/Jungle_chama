import { Request, Response } from "express";
import Task from "../models/Task.ts";
import { sendNotification, broadcastNotification } from "../services/socketService.ts";

export const getTasks = async (req: Request, res: Response) => {
  try {
    const { priority, status } = req.query;
    const filter: any = {};
    if (priority) filter.priority = priority;
    if (status) filter.status = status;

    const tasks = await Task.find(filter).populate('memberId', 'name email');
    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const task = new Task(req.body);
    await task.save();
    res.status(201).json(task);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    if (!task) return res.status(404).json({ error: "Task not found" });

    // Send real-time notification for goal progress
    if (task.memberId) {
      sendNotification(task.memberId.toString(), {
        title: "Goal Progress Update",
        message: `Your goal "${task.title}" has been updated to status: ${task.status}`,
        type: "info"
      });
    } else {
      // If it's a general task, broadcast it
      broadcastNotification({
        title: "Chama Goal Update",
        message: `The goal "${task.title}" has been updated to status: ${task.status}`,
        type: "info"
      });
    }

    res.json(task);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json({ message: "Task deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
