import { Router } from "express";
import {
  deletePost,
  getAllPosts,
  getOnlyUsersPost,
  getPostById,
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

router.get("/getPost/:postId", isAuthenticated, getPostById);

router.get("/getOnlyUserPost", isAuthenticated, getOnlyUsersPost);

export default router;
