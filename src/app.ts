import cookieParser from "cookie-parser";
import express from "express";
import { connectDB } from "./config/db";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import postRoutes from "./routes/post.routes";
import commentRoutes from "./routes/comment.routes";
import cors from "cors";

const PORT = process.env.PORT || 8000;
const app = express();

app.use(express.json());

app.use(cookieParser());

app.use(cors({ origin: "*", credentials: true }));

app.use("/api/auth", authRoutes);

app.use("/api/user", userRoutes);

app.use("/api/post", postRoutes);

app.use("/api/comment", commentRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://10.81.104.9:${PORT}`);
  await connectDB();
});
