import { Router } from "express";
import {
  deletePost,
  getAllPosts,
  handleVote,
  uploadPost,
} from "../controllers/post.controller";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { upload } from "../utils/multer";

const router = Router();

router.post(
  "/createPost",
  isAuthenticated,
  upload.array("media", 5),
  uploadPost
);

router.get("/getPost", isAuthenticated, getAllPosts);

router.patch("/voteToggle", isAuthenticated, handleVote);

router.delete("/deletePost/:postId", isAuthenticated, deletePost);

export default router;
