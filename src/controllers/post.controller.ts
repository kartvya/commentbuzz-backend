import { Request, Response } from "express";
import PostModel from "../models/Post";
import cloudinary from "../utils/cloudinary";
import mongoose from "mongoose";
import User from "../models/User";
import { AuthRequest } from "../middlewares/isAuthenticated";
import CommentModel from "../models/Comment";

// Upload a new post
export const uploadPost = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId, body, files } = req as any;
    const { description = "" } = body;

    const hasText = description.trim();
    const hasMedia = files && files.length > 0;

    if (!hasText && !hasMedia) {
      res.status(400).json({
        success: false,
        message: "Post must contain at least text or media.",
      });
      return;
    }

    let uploadedMediaUrls: string[] = [];

    if (hasMedia) {
      try {
        const uploadPromises = files.map((file: Express.Multer.File) =>
          cloudinary.uploader.upload(file.path, {
            folder: "commentbuzz/posts",
          })
        );

        const uploadResults = await Promise.all(uploadPromises);
        uploadedMediaUrls = uploadResults.map((result) => result.secure_url);
      } catch (err) {
        console.error("[Cloudinary Upload Error]", err);
        res.status(500).json({
          success: false,
          message: "Failed to upload media to Cloudinary.",
        });
        return;
      }
    }

    // Create the post
    const newPost = await PostModel.create({
      user: userId,
      description: description.trim(),
      media: uploadedMediaUrls,
    });

    res.status(201).json({
      success: true,
      message: "Post created successfully.",
      post: newPost,
    });
  } catch (error) {
    console.error("[uploadPost]", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while creating the post.",
    });
  }
};

// Get a single post by ID
export const getPostById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { postId } = req.params;

    const post = await PostModel.findById(postId).populate(
      "user",
      "username profilePic"
    );

    if (!post) {
      res.status(404).json({
        success: false,
        message: "Post not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      post,
    });
  } catch (error) {
    console.error("[getPostById]", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while fetching the post.",
    });
  }
};

export const getOnlyUsersPost = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const userId = req.userId;
    const posts = await PostModel.find({ user: userId })
      .populate("user", "username profilePic")
      .lean()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    if (!posts) {
      res.status(404).json({
        success: false,
        message: "Post not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      posts,
    });
  } catch (error) {
    console.error("[getPostById]", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while fetching the post.",
    });
  }
};

export const getAllPosts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const posts = await PostModel.find()
      .populate("user", "username profilePic")
      .lean()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await PostModel.countDocuments();

    res.status(200).json({
      success: true,
      message: "Posts fetched successfully.",
      data: {
        posts,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[getAllPosts]", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while fetching posts.",
    });
  }
};

// Update a post by ID
export const updatePost = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    const updatedPost = await PostModel.findByIdAndUpdate(
      id,
      { description },
      { new: true }
    );

    if (!updatedPost) {
      res.status(404).json({
        success: false,
        message: "Post not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Post updated successfully.",
      post: updatedPost,
    });
  } catch (error) {
    console.error("[updatePost]", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while updating the post.",
    });
  }
};

// Delete a post by ID
export const deletePost = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      res.status(400).json({
        success: false,
        message: "Invalid post ID.",
      });
      return;
    }

    const post = await PostModel.findById(postId);
    if (!post) {
      res.status(404).json({
        success: false,
        message: "Post not found.",
      });
      return;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Reverse buzzCoins from user
      if (post.buzzCoinsEarned && post.user) {
        await User.findByIdAndUpdate(
          post.user,
          {
            $inc: { buzzCoins: -post.buzzCoinsEarned },
          },
          { session }
        );
      }

      // 2. Delete related comments
      await CommentModel.deleteMany({ post: postId }).session(session);

      // 3. Delete the post
      await PostModel.findByIdAndDelete(postId).session(session);

      await session.commitTransaction();
      session.endSession();

      res.status(200).json({
        success: true,
        message: "Post and related data deleted successfully.",
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } catch (error) {
    console.error("[deletePost]", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while deleting the post.",
    });
  }
};

export const handleVote = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { type, userId, postId } = req.body;

    const post = await PostModel.findById(postId);

    if (!post) {
      res.status(404).json({ success: false, message: "Post not found" });
      return;
    }

    const hasUpvoted = post.upvotes.some((id) => id.toString() === userId);
    const hasDownvoted = post.downvotes.some((id) => id.toString() === userId);

    let delta = 0;

    if (type === "upvote") {
      if (hasUpvoted) {
        // undo upvote
        post.upvotes = post.upvotes.filter((id) => id.toString() !== userId);
        delta = -1;
      } else {
        // new upvote (possibly flipping a downvote)
        if (hasDownvoted) {
          post.downvotes = post.downvotes.filter(
            (id) => id.toString() !== userId
          );
          delta += 1; // remove the −1 from the earlier downvote
        }
        post.upvotes.push(new mongoose.Types.ObjectId(userId));
        delta += 1;
      }
    } else if (type === "downvote") {
      if (hasDownvoted) {
        // undo downvote
        post.downvotes = post.downvotes.filter(
          (id) => id.toString() !== userId
        );
        delta = +1;
      } else {
        // new downvote (possibly flipping an upvote)
        if (hasUpvoted) {
          post.upvotes = post.upvotes.filter((id) => id.toString() !== userId);
          delta -= 1; // remove the +1 from the earlier upvote
        }
        post.downvotes.push(new mongoose.Types.ObjectId(userId));
        delta -= 1;
      }
    } else if (type === "none") {
      // If the user has voted, remove the vote (either upvote or downvote)
      if (hasUpvoted) {
        post.upvotes = post.upvotes.filter((id) => id.toString() !== userId);
        delta -= 1; // remove the upvote
      } else if (hasDownvoted) {
        post.downvotes = post.downvotes.filter(
          (id) => id.toString() !== userId
        );
        delta += 1; // remove the downvote
      }
    } else {
      res.status(400).json({ success: false, message: "Invalid vote type." });
      return;
    }

    // 4. Apply coin changes
    post.buzzCoinsEarned += delta;
    await post.save();

    // 5. Credit/debit the post’s author
    await User.findByIdAndUpdate(
      post.user,
      { $inc: { buzzCoins: delta } },
      { new: true }
    );

    // 6. Return updated post (and author’s new balance if desired)
    res.status(200).json({ success: true, data: post });
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "An unknown error occurred";
    res.status(400).json({ success: false, message: errorMessage });
  }
};
