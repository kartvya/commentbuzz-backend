import { Request, Response } from "express";
import PostModel from "../models/Post";
import cloudinary from "../utils/cloudinary";

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
    const { id } = req.params;

    const post = await PostModel.findById(id).populate("user", "name email");

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

export const getAllPosts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const posts = await PostModel.find()
      .populate("user", "username profilePic")
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
    const { id } = req.params;

    const deletedPost = await PostModel.findByIdAndDelete(id);

    if (!deletedPost) {
      res.status(404).json({
        success: false,
        message: "Post not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Post deleted successfully.",
    });
  } catch (error) {
    console.error("[deletePost]", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while deleting the post.",
    });
  }
};
