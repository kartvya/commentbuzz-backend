import { Router } from "express";
import {
  getProfile,
  getWeeklyAverageTime,
  trackSessionTime,
  updateProfile,
} from "../controllers/user.controller";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { upload } from "../utils/multer";

const router = Router();

router.get("/profile", isAuthenticated, getProfile);

router.put(
  "/editProfile",
  isAuthenticated,
  upload.single("profilePic"),
  updateProfile
);

router.post("/trackSession", isAuthenticated, trackSessionTime);

router.get("/weeklyAverageTime", isAuthenticated, getWeeklyAverageTime);

export default router;
