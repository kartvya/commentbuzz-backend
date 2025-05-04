import { Request, Response } from "express";
import PostModel from "../models/Post";
import cloudinary from "../utils/cloudinary";

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
