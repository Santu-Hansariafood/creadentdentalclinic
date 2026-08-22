const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const http = require("http");
const cors = require("cors");
const fs = require("fs");
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
  const PORT = process.env.PORT || 25000;

  app.use(cors());

  const storageRoutesLogger = (prefix) => (req, res, next) => {
    console.log("[STORAGE-MOUNT:%s] method=%s path=%s originalUrl=%s ct=%s cl=%s",
      prefix, req.method, req.path, req.originalUrl,
      req.headers["content-type"] || "?",
      req.headers["content-length"] || "?");
    next();
  };
  app.use("/api/storage", storageRoutesLogger("api"), storageRoutes);
  app.use("/storage", storageRoutesLogger("root"), storageRoutes);
  app.use("/graphql/storage", storageRoutesLogger("gql"), storageRoutes);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  app.use("/api", authRoutes);
  app.use("/api/icici", iciciPaymentRoutes);

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
      "http://localhost:3000",
    ];
    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin) || !origin) {
      res.setHeader("Access-Control-Allow-Origin", origin || "*");
      console.log("Set Access-Control-Allow-Origin to:", origin || "*");
    } else {
      console.log("Origin not allowed:", origin);
    }

    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS",
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, apollographql-client-name, apollographql-client-version",
    );
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
  startAppointmentReminderScheduler();

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

  // Debug: ensure storage route is mounted
  app.use((req, res, next) => {
    if (req.path.startsWith("/api/")) {
      console.log("[API-DEBUG] path=%s method=%s", req.path, req.method);
    }
    next();
  });

  app.get("/files/*key", async (req, res) => {
  try {
    const rawKey = Array.isArray(req.params.key)
      ? req.params.key.join("/")
      : req.params.key || "";

    const key = decodeURIComponent(rawKey);

    if (!key) {
      return res.status(404).json({ error: "Not found" });
    }

    const uploadDir = path.resolve(storageService.localUploadDir);
    const localFull = path.resolve(uploadDir, key);

    if (
      localFull !== uploadDir &&
      !localFull.startsWith(uploadDir + path.sep)
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (
      !fs.existsSync(localFull) ||
      !fs.statSync(localFull).isFile()
    ) {
      return res.status(404).json({ error: "Not found" });
    }

    res.type(path.extname(localFull));
    res.setHeader("Content-Disposition", "inline");
    return res.sendFile(localFull);
  } catch (error) {
    console.error("File download error:", error);

    return res.status(500).json({
      error: "Unable to download file",
    });
  }
});

const frontendBuildPath = path.join(__dirname, "../frontend/dist");
  const publicSeo = {
    "/": {
      title: "Best Dental Clinic in Salt Lake Kolkata | Creadent Dental Clinic",
      description: "Looking for the best dental clinic in Salt Lake, Kolkata? Creadent Dental Clinic offers expert dentists, root canal treatment, dental implants, braces, teeth whitening, and family dental care.",
    },
    "/about-us": {
      title: "About Us | Best Dental Clinic in Salt Lake Kolkata",
      description: "Learn about Creadent Dental Clinic in Salt Lake, Kolkata, our patient-first approach, and our commitment to modern, dependable dental care.",
    },
    "/contact-us": {
      title: "Contact Us | Creadent Dental Clinic Salt Lake Kolkata",
      description: "Contact Creadent Dental Clinic in Salt Lake, Kolkata for appointments, payment support, and patient enquiries.",
    },
    "/google-reviews": {
      title: "Google Reviews | Creadent Dental Clinic Salt Lake Kolkata",
      description: "Read Google reviews for Creadent Dental Clinic in Salt Lake, Kolkata, and share your experience with our dental team.",
    },
    "/privacy-policy": {
      title: "Privacy Policy | Creadent Dental Clinic Kolkata",
      description: "Read the privacy policy for Creadent Dental Clinic to understand how we securely handle patient, visitor, and payment information.",
    },
    "/terms-and-conditions": {
      title: "Terms and Conditions | Creadent Dental Clinic",
      description: "Review the terms and conditions for using the Creadent Dental Clinic website, online booking, and payment processing services.",
    },
    "/refund-policy": {
      title: "Refund Policy | Creadent Dental Clinic",
      description: "Read the refund policy for Creadent Dental Clinic to understand how online payment refunds and transaction reversals are handled.",
    },
    "/cancellation-policy": {
      title: "Cancellation Policy | Creadent Dental Clinic",
      description: "Read the cancellation policy for Creadent Dental Clinic appointments and online payments.",
    },
  };
  const escapeHtml = (value) =>
    value.replace(/[&<>'"]/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    })[character]);
  const renderPublicSeoHtml = (requestPath) => {
    const seo = publicSeo[requestPath];
    const html = fs.readFileSync(path.join(frontendBuildPath, "index.html"), "utf8");
    if (!seo) return html;

    const title = escapeHtml(seo.title);
    const description = escapeHtml(seo.description);
    const canonical = `https://creadentsmiles.com${requestPath}`;
    return html
      .replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`)
      .replace(/(<meta name="title" content=")[^"]*(")/i, `$1${title}$2`)
      .replace(/(<meta name="description" content=")[^"]*(")/i, `$1${description}$2`)
      .replace(/(<meta property="og:url" content=")[^"]*(")/i, `$1${canonical}$2`)
      .replace(/(<meta property="og:title" content=")[^"]*(")/i, `$1${title}$2`)
      .replace(/(<meta property="og:description" content=")[^"]*(")/i, `$1${description}$2`)
      .replace(/(<meta name="twitter:url" content=")[^"]*(")/i, `$1${canonical}$2`)
      .replace(/(<meta name="twitter:title" content=")[^"]*(")/i, `$1${title}$2`)
      .replace(/(<meta name="twitter:description" content=")[^"]*(")/i, `$1${description}$2`)
      .replace(/(<link rel="canonical" href=")[^"]*(")/i, `$1${canonical}$2`);
  };
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

  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/sitemap.xml", async (req, res) => {
    const baseUrl = process.env.SITE_URL || "https://creadentsmiles.com";
    const today = new Date().toISOString().split("T")[0];

    const staticPages = Object.keys(publicSeo).map((pagePath) => ({
      loc: `${baseUrl}${pagePath}`,
      priority: pagePath === "/" ? "1.0" : pagePath === "/about-us" || pagePath === "/contact-us" ? "0.9" : "0.7",
      changefreq: pagePath === "/" || pagePath === "/google-reviews" ? "weekly" : "monthly",
    }));

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
    if (publicSeo[req.path]) {
      return res.type("html").send(renderPublicSeoHtml(req.path));
    }
    return res.sendFile(path.join(frontendBuildPath, "index.html"));
  });

  app.use((req, res) => {
    console.log("[404-ROUTE-NOT-FOUND] method=%s path=%s originalUrl=%s contentType=%s",
      req.method, req.path, req.originalUrl, req.headers["content-type"]);
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
