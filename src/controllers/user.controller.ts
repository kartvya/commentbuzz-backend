import { AuthRequest } from "../middlewares/isAuthenticated";
import { Response } from "express";
import User from "../models/User";
import cloudinary from "../utils/cloudinary";
import { promisify } from "util";

const cloudinaryUpload = promisify(cloudinary.uploader.upload);

export const getProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res
        .status(401)
        .json({ success: false, message: "Unauthorized - No user id" });
      return;
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

// export const updateProfile = async (
//   req: AuthRequest,
//   res: Response
// ): Promise<void> => {
//   try {
//     const userId = req.userId;
//     const { username, bio } = req.body;
//     const profilePicPath = req.file?.path;

//     if (!userId) {
//       res
//         .status(401)
//         .json({ success: false, message: "Unauthorized - No user ID" });
//       return;
//     }

//     // Check for duplicate username (excluding current user)
//     if (username) {
//       const existingUser = await User.findOne({
//         username,
//         _id: { $ne: userId },
//       });

//       if (existingUser) {
//         res
//           .status(400)
//           .json({ success: false, message: "Username already taken" });
//         return;
//       }
//     }

//     // Build update object
//     const updates: Partial<{
//       username: string;
//       bio: string;
//       profilePic: string;
//     }> = {};

//     if (username) updates.username = username;
//     if (bio) updates.bio = bio;

//     if (profilePicPath) {
//       try {
//         const result = await cloudinaryUpload(profilePicPath);
//         updates.profilePic = result?.url;
//       } catch (err) {
//         console.error("[Cloudinary Upload Error]", err);
//         res.status(500).json({
//           success: false,
//           message: "Failed to upload profile picture",
//         });
//         return;
//       }
//     }

//     const updatedUser = await User.findByIdAndUpdate(
//       userId,
//       { $set: updates },
//       { new: true }
//     ).select("-password");

//     if (!updatedUser) {
//       res.status(404).json({ success: false, message: "User not found" });
//       return;
//     }

//     res.status(200).json({
//       success: true,
//       message: "Profile updated successfully",
//       user: updatedUser,
//     });
//   } catch (error) {
//     console.error("[updateProfile]", error);
//     res.status(500).json({ success: false, message: "Something went wrong" });
//   }
// };

export const updateProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const { username, bio } = req.body;
    const profilePicPath = req.file?.path;

    if (!userId) {
      res
        .status(401)
        .json({ success: false, message: "Unauthorized - No user ID" });
      return;
    }

    const currentUser = await User.findById(userId);
    if (!currentUser) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    // Check if username is changing
    if (username && username !== currentUser.username) {
      const existingUser = await User.findOne({
        username,
        _id: { $ne: userId },
      });

      if (existingUser) {
        res
          .status(400)
          .json({ success: false, message: "Username already taken" });
        return;
      }
    }

    // Prepare updates
    const updates: Partial<{
      username: string;
      bio: string;
      profilePic: string;
    }> = {};

    if (username) updates.username = username;
    if (bio) updates.bio = bio;

    if (profilePicPath) {
      try {
        const result = await cloudinaryUpload(profilePicPath);
        updates.profilePic = result?.url;
      } catch (err) {
        console.error("[Cloudinary Upload Error]", err);
        res.status(500).json({
          success: false,
          message: "Failed to upload profile picture",
        });
        return;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("[updateProfile]", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};
