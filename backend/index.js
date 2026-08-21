const path = require("path");
const fs = require("fs");
const http = require("http");

require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

const express = require("express");
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

const storageRoutes = require("./routes/storageRoutes");

const iciciPaymentRoutes = require("./routes/iciciPaymentRoutes");

const storageService = require("./utils/storageService");

const {
  startAppointmentReminderScheduler,
} = require("./utils/appointmentNotifications");

const startServer = async () => {
  const app = express();

  const httpServer = http.createServer(app);

  const PORT = Number(process.env.PORT) || 25000;

  /*
   * --------------------------------------------------
   * CORS
   * --------------------------------------------------
   */

  const allowedOrigins = [
    "https://creadentsmiles.com",
    "https://api.creadentsmiles.com",
    "http://localhost:5173",
    "http://localhost:25001",
    "http://localhost:3000",
  ];

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error("Not allowed by CORS"));
      },

      credentials: true,

      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],

      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "apollographql-client-name",
        "apollographql-client-version",
      ],
    }),
  );

  /*
   * --------------------------------------------------
   * STORAGE ROUTES
   *
   * IMPORTANT:
   * These must be mounted BEFORE express.json()
   * so Multer can consume multipart/form-data.
   * --------------------------------------------------
   */

  app.use("/api/storage", storageRoutes);

  app.use("/storage", storageRoutes);

  app.use("/graphql/storage", storageRoutes);

  /*
   * --------------------------------------------------
   * BODY PARSERS
   * --------------------------------------------------
   */

  app.use(
    express.json({
      limit: "50mb",
    }),
  );

  app.use(
    express.urlencoded({
      extended: true,
      limit: "50mb",
    }),
  );

  /*
   * --------------------------------------------------
   * REST API ROUTES
   * --------------------------------------------------
   */

  app.use("/api", authRoutes);

  app.use("/api/icici", iciciPaymentRoutes);

  /*
   * --------------------------------------------------
   * SOCKET.IO
   * --------------------------------------------------
   */

  const io = socket.init(httpServer);

  io.on("connection", (clientSocket) => {
    clientSocket.on("disconnect", () => {});
  });

  /*
   * --------------------------------------------------
   * DATABASE
   * --------------------------------------------------
   */

  await connectDB();

  await seedAdmin();

  startAppointmentReminderScheduler();

  /*
   * --------------------------------------------------
   * APOLLO GRAPHQL
   * --------------------------------------------------
   */

  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,

    cacheControl: {
      defaultMaxAge: 60,
    },
  });

  await apolloServer.start();

  app.use(
    "/graphql",
    expressMiddleware(apolloServer, {
      context: async ({ req }) => {
        const authHeader = req.headers.authorization || "";

        const token = authHeader.startsWith("Bearer ")
          ? authHeader.slice(7)
          : null;

        let user = null;

        if (token) {
          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            user = await User.findById(decoded.id).select("-password");
          } catch {
            user = null;
          }
        }

        return {
          user,
          io,
        };
      },
    }),
  );

  /*
   * --------------------------------------------------
   * LOCAL FILE DOWNLOAD
   * --------------------------------------------------
   */

  app.get("/files/*key", async (req, res) => {
    try {
      const rawKey = Array.isArray(req.params.key)
        ? req.params.key.join("/")
        : req.params.key || "";

      const key = decodeURIComponent(rawKey);

      if (!key) {
        return res.status(404).json({
          error: "Not found",
        });
      }

      const uploadDir = path.resolve(storageService.localUploadDir);

      const localFull = path.resolve(uploadDir, key);

      if (
        localFull !== uploadDir &&
        !localFull.startsWith(uploadDir + path.sep)
      ) {
        return res.status(403).json({
          error: "Forbidden",
        });
      }

      if (!fs.existsSync(localFull) || !fs.statSync(localFull).isFile()) {
        return res.status(404).json({
          error: "Not found",
        });
      }

      res.type(path.extname(localFull));

      res.setHeader("Content-Disposition", "inline");

      return res.sendFile(localFull);
    } catch {
      return res.status(500).json({
        error: "Unable to download file",
      });
    }
  });

  /*
   * --------------------------------------------------
   * FRONTEND
   * --------------------------------------------------
   */

  const frontendBuildPath = path.join(__dirname, "../frontend/dist");

  const hashedAssetPattern = /\.[a-z0-9]{2,8}$/i;

  const isStaticAssetRequest = (requestPath) =>
    requestPath.startsWith("/assets/") ||
    requestPath === "/sw.js" ||
    requestPath.startsWith("/workbox-") ||
    requestPath.endsWith(".webmanifest") ||
    hashedAssetPattern.test(requestPath);

  app.use(
    express.static(frontendBuildPath, {
      setHeaders(res, filePath) {
        const fileName = path.basename(filePath);

        if (
          fileName === "index.html" ||
          fileName === "sw.js" ||
          fileName.endsWith(".webmanifest")
        ) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        } else if (hashedAssetPattern.test(fileName)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      },
    }),
  );

  /*
   * --------------------------------------------------
   * HEALTH
   * --------------------------------------------------
   */

  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  });

  /*
   * --------------------------------------------------
   * SITEMAP
   * --------------------------------------------------
   */

  app.get("/sitemap.xml", (req, res) => {
    const baseUrl = process.env.SITE_URL || "https://creadentsmiles.com";

    const today = new Date().toISOString().split("T")[0];

    const staticPages = [
      {
        loc: `${baseUrl}/`,
        priority: "1.0",
        changefreq: "daily",
      },
      {
        loc: `${baseUrl}/login`,
        priority: "0.8",
        changefreq: "monthly",
      },
      {
        loc: `${baseUrl}/register`,
        priority: "0.8",
        changefreq: "monthly",
      },
      {
        loc: `${baseUrl}/verify-otp`,
        priority: "0.7",
        changefreq: "monthly",
      },
      {
        loc: `${baseUrl}/privacy-policy`,
        priority: "0.7",
        changefreq: "monthly",
      },
      {
        loc: `${baseUrl}/account-deletion-policy`,
        priority: "0.7",
        changefreq: "monthly",
      },
      {
        loc: `${baseUrl}/terms-of-service`,
        priority: "0.7",
        changefreq: "monthly",
      },
      {
        loc: `${baseUrl}/cookie-policy`,
        priority: "0.7",
        changefreq: "monthly",
      },
      {
        loc: `${baseUrl}/disclaimer`,
        priority: "0.7",
        changefreq: "monthly",
      },
      {
        loc: `${baseUrl}/careers`,
        priority: "0.8",
        changefreq: "weekly",
      },
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages
  .map(
    (page) => `  <url>
    <loc>${page.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`;

    res.header("Content-Type", "application/xml");

    res.send(xml);
  });

  /*
   * --------------------------------------------------
   * SPA FALLBACK
   * --------------------------------------------------
   */

  app.use((req, res, next) => {
    if (req.method !== "GET") {
      return next();
    }

    if (
      req.path.startsWith("/graphql") ||
      req.path.startsWith("/api") ||
      req.path.startsWith("/storage") ||
      req.path.startsWith("/health") ||
      req.path.startsWith("/sitemap.xml") ||
      req.path.startsWith("/files")
    ) {
      return next();
    }

    if (isStaticAssetRequest(req.path)) {
      return res.status(404).type("text/plain").send("Not found");
    }

    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

    return res.sendFile(path.join(frontendBuildPath, "index.html"));
  });

  /*
   * --------------------------------------------------
   * 404
   * --------------------------------------------------
   */

  app.use((req, res) => {
    res.status(404).json({
      message: "Route not found",
    });
  });

  /*
   * --------------------------------------------------
   * ERROR HANDLER
   * --------------------------------------------------
   */

  app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    res.status(statusCode).json({
      message: err.message || "Internal Server Error",
    });
  });

  /*
   * --------------------------------------------------
   * START SERVER
   * --------------------------------------------------
   */

  httpServer.listen(PORT, () => {
    console.log(`Creadent API running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);

  process.exit(1);
});
