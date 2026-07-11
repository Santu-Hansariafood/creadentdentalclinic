const express = require("express");
const http = require("http");
const cors = require("cors");
const path = require("path");
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
  const PORT = process.env.PORT || 25000;

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Custom CORS middleware to handle both origins and subdomains
  app.use((req, res, next) => {
    console.log("=== Incoming request ===");
    console.log("Method:", req.method);
    console.log("URL:", req.url);
    console.log("Origin:", req.headers.origin);
    console.log("Headers:", req.headers);

    const allowedOrigins = [
      "https://creadentsmiles.com",
      "https://api.creadentsmiles.com",
      "http://localhost:5173",
      "http://localhost:25001",
      "http://localhost:3000"
    ];
    const origin = req.headers.origin;

    // Always set CORS headers for allowed origins or no origin
    if (allowedOrigins.includes(origin) || !origin) {
      res.setHeader("Access-Control-Allow-Origin", origin || "*");
      console.log("Set Access-Control-Allow-Origin to:", origin || "*");
    } else {
      console.log("Origin not allowed:", origin);
    }

    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, apollographql-client-name, apollographql-client-version");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
      console.log("Handling OPTIONS preflight request");
      return res.sendStatus(204);
    }

    next();
  });

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

  // Serve static files from frontend build
  const frontendBuildPath = path.join(__dirname, "../frontend/dist");
  app.use(express.static(frontendBuildPath));

  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/sitemap.xml", async (req, res) => {
    const baseUrl = process.env.SITE_URL || "https://creadentsmiles.com";
    const today = new Date().toISOString().split("T")[0];

    const staticPages = [
      { loc: `${baseUrl}/`, priority: "1.0", changefreq: "daily" },
      { loc: `${baseUrl}/login`, priority: "0.8", changefreq: "monthly" },
      { loc: `${baseUrl}/register`, priority: "0.8", changefreq: "monthly" },
      { loc: `${baseUrl}/verify-otp`, priority: "0.7", changefreq: "monthly" },
      { loc: `${baseUrl}/privacy-policy`, priority: "0.7", changefreq: "monthly" },
      { loc: `${baseUrl}/account-deletion-policy`, priority: "0.7", changefreq: "monthly" },
      { loc: `${baseUrl}/terms-of-service`, priority: "0.7", changefreq: "monthly" },
      { loc: `${baseUrl}/cookie-policy`, priority: "0.7", changefreq: "monthly" },
      { loc: `${baseUrl}/disclaimer`, priority: "0.7", changefreq: "monthly" },
      { loc: `${baseUrl}/careers`, priority: "0.8", changefreq: "weekly" },
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(page => `  <url>
    <loc>${page.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

    res.header("Content-Type", "application/xml");
    res.send(xml);
  });

  // Catch-all middleware for client-side routing (avoids Express 5 path-to-regexp error)
  app.use((req, res, next) => {
    if (
      req.method === "GET" &&
      !req.path.startsWith("/graphql") &&
      !req.path.startsWith("/api") &&
      !req.path.startsWith("/health") &&
      !req.path.startsWith("/sitemap.xml")
    ) {
      return res.sendFile(path.join(frontendBuildPath, "index.html"));
    }
    next();
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
