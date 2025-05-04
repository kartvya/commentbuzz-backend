import { Router } from "express";
import { uploadPost } from "../controllers/post.controller";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { upload } from "../utils/multer";

const router = Router();

router.post(
  "/createPost",
  isAuthenticated,
  upload.array("media", 5),
  uploadPost
);

export default router;
