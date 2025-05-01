import express from "express";
import { connectDB } from "./config/db";
import authRoutes from "./routes/auth.routes";

const PORT = process.env.PORT || 8000;
const app = express();

app.use(express.json());

app.use("/api/auth", authRoutes); 

app.get("/", (req, res) => {
  res.send("✅ API is running...");
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  await connectDB(); 
});

