import { Router } from "express";
import {
  deleteComment,
  getCommentsByPostId,
  handleCommentVote,
  uploadComment,
} from "../controllers/comment.controller";
import { isAuthenticated } from "../middlewares/isAuthenticated";

const router = Router();

router.post("/createComment", isAuthenticated, uploadComment);

router.get("/getComments/:postId", isAuthenticated, getCommentsByPostId);

router.delete("/deleteComment/:commentId", isAuthenticated, deleteComment);

router.patch("/commentVoteToggle", isAuthenticated, handleCommentVote);

export default router;
