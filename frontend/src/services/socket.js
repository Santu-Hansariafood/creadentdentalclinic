import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:25000";

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      console.log("🔌 Connecting to socket server at:", SOCKET_URL);
      this.socket = io(SOCKET_URL, {
        transports: ["websocket", "polling"],
      });

      this.socket.on("connect", () => {
        console.log("Connected to socket server:", this.socket.id);
      });

      this.socket.on("disconnect", (reason) => {
        console.log("Disconnected from socket server:", reason);
      });

      this.socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      console.log("🔌 Disconnecting from socket server");
      this.socket.disconnect();
      this.socket = null;
    }
  }

  onNotification(callback) {
    if (this.socket) {
      this.socket.on("notification", callback);
    }
  }

  offNotification() {
    if (this.socket) {
      this.socket.off("notification");
    }
  }
}

const socketService = new SocketService();
export default socketService;
