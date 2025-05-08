import { Router } from "express";
import {
  getCommentsByPostId,
  uploadComment,
} from "../controllers/comment.controller";
import { isAuthenticated } from "../middlewares/isAuthenticated";

const router = Router();

router.post("/createComment", isAuthenticated, uploadComment);

router.get("/getComments/:postId", isAuthenticated, getCommentsByPostId);

export default router;
