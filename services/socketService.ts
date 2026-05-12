import { Server } from "socket.io";
import { Server as HttpServer } from "http";

let io: Server | null = null;

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join", (userId: string) => {
      socket.join(userId);
      console.log(`User ${userId} joined their room`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

export const sendNotification = (userId: string, data: { title: string; message: string; type: string }) => {
  if (io) {
    io.to(userId).emit("notification", data);
    // Also broadcast to all if it's a general update, but usually notifications are targeted
  }
};

export const broadcastNotification = (data: { title: string; message: string; type: string }) => {
  if (io) {
    io.emit("notification", data);
  }
};

export const sendPaymentSuccess = (userId: string, data: { amount: number; totalPoints: number; pointsEarned: number }) => {
  if (io) {
    io.to(userId).emit("payment_success", data);
  }
};
