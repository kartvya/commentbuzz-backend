import { Router } from "express";
import { uploadComment } from "../controllers/comment.controller";
import { isAuthenticated } from "../middlewares/isAuthenticated";

const router = Router();

router.post("/createComment", isAuthenticated, uploadComment);

export default router;
