import { Request, Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middlewares/isAuthenticated";
import CommentModel from "../models/Comment";
import PostModel from "../models/Post";

export const uploadComment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const { postId, description = "" } = req.body;

    if (!description.trim()) {
      res.status(400).json({
        success: false,
        message: "Comment must contain text.",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      res.status(400).json({
        success: false,
        message: "Invalid post ID.",
      });
      return;
    }

    const postExists = await PostModel.exists({ _id: postId });
    if (!postExists) {
      res.status(404).json({
        success: false,
        message: "Post not found.",
      });
      return;
    }

    const newComment = await CommentModel.create({
      user: userId,
      post: postId,
      text: description.trim(),
    });

    await PostModel.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

    res.status(201).json({
      success: true,
      message: "Comment added successfully.",
      comment: newComment,
    });
  } catch (error) {
    console.error("[uploadComment]", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while uploading the comment.",
    });
  }
};

export const getCommentsByPostId = async (req: Request, res: Response) => {
  const { postId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({ error: "Invalid Post ID" });
  }

  try {
    const post = await PostModel.findById(postId)
      .populate("user", "_id name username profilePic") // populate post author
      .lean();

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const comments = await CommentModel.find({ post: postId })
      .sort({ createdAt: -1 })
      .populate("user", "_id name username profilePic") // populate comment author
      .lean();

    return res.status(200).json({
      success: true,
      post,
      comments,
    });
  } catch (err) {
    console.error("Error fetching comments by post ID:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// export const getCommentsByPostId = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const { postId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(postId)) {
//       res.status(400).json({
//         success: false,
//         message: "Invalid post ID.",
//       });
//       return;
//     }

//     const comments = await CommentModel.find({ post: postId })
//       .populate("user", "username profilePic")
//       .sort({ createdAt: -1 })
//       .lean();

//     res.status(200).json({
//       success: true,
//       comments,
//     });
//   } catch (error) {
//     console.error("[getCommentsByPostId]", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch comments.",
//     });
//   }
// };

export const deleteComment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { commentId } = req.params;
    const userId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      res.status(400).json({
        success: false,
        message: "Invalid comment ID.",
      });
      return;
    }

    const comment = await CommentModel.findById(commentId);

    if (!comment) {
      res.status(404).json({
        success: false,
        message: "Comment not found.",
      });
      return;
    }

    if (comment.user.toString() !== userId) {
      res.status(403).json({
        success: false,
        message: "You are not authorized to delete this comment.",
      });
      return;
    }

    await comment.deleteOne();

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully.",
    });
  } catch (error) {
    console.error("[deleteComment]", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while deleting the comment.",
    });
  }
};
