import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";

import { connectDB } from "./config/db.js";

// Connect to DB
connectDB();

dotenv.config();

const app = express();

// ----------------------
// MIDDLEWARES
// ----------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----------------------
// ROUTES
// ----------------------
app.use("/api/auth", authRoutes); // login, register, change password, admin reset
app.use("/api/courses", courseRoutes); // course management and enrollment
app.use("/api/users", userRoutes); // list users / course students
app.use("/api/audits", auditRoutes); // audit log retrieval (admins only)

// ----------------------
// HEALTH CHECK
// ----------------------
app.get("/", (req, res) => {
  res.send("API is running!");
});

// ----------------------
// GLOBAL ERROR HANDLER
// ----------------------
app.use(errorHandler);

// ----------------------
// CONNECT TO DB & START SERVER
// ----------------------
const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
