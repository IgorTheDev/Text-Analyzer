import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // In Docker/production, static files are in dist/public relative to the app root
  const distPath = path.resolve(process.cwd(), "dist", "public");

  console.log("Serving static files from:", distPath);
  console.log("Current working directory:", process.cwd());
  console.log("Directory exists:", fs.existsSync(distPath));

  if (!fs.existsSync(distPath)) {
    console.log("Contents of current directory:", fs.readdirSync(process.cwd()));
    if (fs.existsSync("dist")) {
      console.log("Contents of dist directory:", fs.readdirSync("dist"));
    }
    throw new Error(
      `Could not find the build directory: ${distPath}. Make sure to build the client first.`,
    );
  }

  // SPA fallback: serve index.html for client routes
  app.get("*", (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.resolve(distPath, "index.html"));
  });

  // Serve static files (after SPA fallback so static files take precedence)
  app.use(express.static(distPath));
}
