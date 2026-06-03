import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connectDb } from "./src/config/db.js";
import pollRoutes from "./src/routes/pollRoutes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config({ path: path.join(__dirname, "../.env") });

const app = express();
const port = process.env.SERVER_PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/polls", pollRoutes);

connectDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Metadata server listening on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start metadata server:", error.message);
    process.exit(1);
  });
