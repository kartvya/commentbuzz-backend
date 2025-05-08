import { Request, Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middlewares/isAuthenticated";
import CommentModel from "../models/Comment";
import PostModel from "../models/Post";
import User from "../models/User";

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
    res.status(400).json({ error: "Invalid Post ID" });
    return;
  }

  try {
    const post = await PostModel.findById(postId)
      .populate("user", "_id name username profilePic") // populate post author
      .lean();

    if (!post) {
      res.status(404).json({ error: "Post not found" });
      return;
    }

    const comments = await CommentModel.find({ post: postId })
      .sort({ createdAt: -1 })
      .populate("user", "_id name username profilePic") // populate comment author
      .lean();

    res.status(200).json({
      success: true,
      post,
      comments,
    });
  } catch (err) {
    console.error("Error fetching comments by post ID:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

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

    const postId = comment.post;

    await comment.deleteOne();

    await PostModel.findByIdAndUpdate(postId, {
      $inc: { commentCount: -1 },
    });

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

export const handleCommentVote = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { type, userId, commentId } = req.body;

    const comment = await CommentModel.findById(commentId);

    if (!comment) {
      res.status(404).json({ success: false, message: "Post not found" });
      return;
    }

    const hasUpvoted = comment.upvotes.some((id) => id.toString() === userId);
    const hasDownvoted = comment.downvotes.some(
      (id) => id.toString() === userId
    );

    let delta = 0;

    if (type === "upvote") {
      if (hasUpvoted) {
        // undo upvote
        comment.upvotes = comment.upvotes.filter(
          (id) => id.toString() !== userId
        );
        delta = -1;
      } else {
        // new upvote (possibly flipping a downvote)
        if (hasDownvoted) {
          comment.downvotes = comment.downvotes.filter(
            (id) => id.toString() !== userId
          );
          delta += 1; // remove the −1 from the earlier downvote
        }
        comment.upvotes.push(new mongoose.Types.ObjectId(userId));
        delta += 1;
      }
    } else if (type === "downvote") {
      if (hasDownvoted) {
        // undo downvote
        comment.downvotes = comment.downvotes.filter(
          (id) => id.toString() !== userId
        );
        delta = +1;
      } else {
        // new downvote (possibly flipping an upvote)
        if (hasUpvoted) {
          comment.upvotes = comment.upvotes.filter(
            (id) => id.toString() !== userId
          );
          delta -= 1; // remove the +1 from the earlier upvote
        }
        comment.downvotes.push(new mongoose.Types.ObjectId(userId));
        delta -= 1;
      }
    } else if (type === "none") {
      // If the user has voted, remove the vote (either upvote or downvote)
      if (hasUpvoted) {
        comment.upvotes = comment.upvotes.filter(
          (id) => id.toString() !== userId
        );
        delta -= 1; // remove the upvote
      } else if (hasDownvoted) {
        comment.downvotes = comment.downvotes.filter(
          (id) => id.toString() !== userId
        );
        delta += 1; // remove the downvote
      }
    } else {
      res.status(400).json({ success: false, message: "Invalid vote type." });
      return;
    }

    // 4. Apply coin changes
    comment.buzzCoins += delta;
    await comment.save();

    // 5. Credit/debit the post’s author
    await User.findByIdAndUpdate(
      comment.user,
      { $inc: { buzzCoins: delta } },
      { new: true }
    );

    // 6. Return updated post (and author’s new balance if desired)
    res.status(200).json({ success: true, data: comment });
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "An unknown error occurred";
    res.status(400).json({ success: false, message: errorMessage });
  }
};
