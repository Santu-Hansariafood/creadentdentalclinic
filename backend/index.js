const express = require("express");
const http = require("http");
const cors = require("cors");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const connectDB = require("./config/db");
const seedAdmin = require("./seedAdmin");
const typeDefs = require("./graphql/typeDefs");
const resolvers = require("./graphql/resolvers");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const socket = require("./socket");
const authRoutes = require("./routes/authRoutes");
require("dotenv").config();

const startServer = async () => {
  const app = express();
  const httpServer = http.createServer(app);
  const PORT = process.env.PORT || 5000;

  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  );

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  const io = socket.init(httpServer);

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  await connectDB();

  await seedAdmin();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    cacheControl: {
      defaultMaxAge: 60,
    },
  });

  await server.start();

  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req }) => {
        const authHeader = req.headers.authorization || "";
        const token = authHeader.split(" ")[1];

        let user = null;
        if (token) {
          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            user = await User.findById(decoded.id).select("-password");
          } catch (err) {
            console.error("Invalid token");
          }
        }

        return { user, io };
      },
    }),
  );

  app.use("/api", authRoutes);

  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/", (req, res) => {
    res.send({
      message: "Creadent Dental Clinic Management API",
      version: "1.0.0",
      graphql: "/graphql",
      rest: "/api",
    });
  });

  app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
  });

  app.use((err, req, res, next) => {
    console.error("Error:", err);
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
      message: err.message || "Internal Server Error",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  });

  httpServer.listen(PORT, () => {
    console.log("=============================================");
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`🎯 GraphQL endpoint: http://localhost:${PORT}/graphql`);
    console.log(`🌐 REST API base: http://localhost:${PORT}/api`);
    console.log("=============================================");
  });
};

startServer();
