import { AuthRequest } from "../middlewares/isAuthenticated";
import { Response } from "express";
import User from "../models/User";
import cloudinary from "../utils/cloudinary";
import { promisify } from "util";
import { log } from "console";

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

    console.log("--- [updateProfile] Start ---");
    console.log("UserID:", userId);
    console.log("Body:", { username, bio });
    console.log("File Path:", profilePicPath);

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
        console.log("Attempting Cloudinary upload for:", profilePicPath);
        const result = await cloudinaryUpload(profilePicPath);
        console.log("Cloudinary upload success:", result);
        updates.profilePic = result?.secure_url;
      } catch (err) {
        console.error("[Cloudinary Upload Error]", err);
        res.status(500).json({
          success: false,
          message: "Failed to upload profile picture",
        });
        return;
      }
    }
    console.log("updates", updates);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true }
    ).select("-password");

    console.log("updatedUser", updatedUser);

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

export const trackSessionTime = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const { duration, sessionType = "app_open" } = req.body; // duration in minutes

    if (!userId) {
      res
        .status(401)
        .json({ success: false, message: "Unauthorized - No user id" });
      return;
    }

    if (!duration || duration <= 0) {
      res
        .status(400)
        .json({
          success: false,
          message: "Duration is required and must be greater than 0",
        });
      return;
    }

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
    const timestamp = new Date();

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $push: {
          sessionTime: {
            timestamp,
            date: today,
            duration,
            sessionType,
          },
        },
      },
      { new: true }
    ).select("-password");

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Session time tracked successfully",
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

export const getWeeklyAverageTime = async (
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

    // Calculate date range for last 7 days
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Filter sessions from last 7 days
    const recentSessions = user.sessionTime.filter((session) => {
      const sessionDate = new Date(session.timestamp);
      return sessionDate >= sevenDaysAgo;
    });

    // Calculate total time and average
    const totalMinutes = recentSessions.reduce(
      (sum, session) => sum + session.duration,
      0
    );
    const averageMinutes = recentSessions.length > 0 ? totalMinutes / 7 : 0; // Average per day over 7 days

    // Group by day for detailed breakdown
    const dailyBreakdown = recentSessions.reduce((acc, session) => {
      const date = session.date;
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += session.duration;
      return acc;
    }, {} as Record<string, number>);

    res.status(200).json({
      success: true,
      data: {
        totalMinutes,
        averageMinutes: Math.round(averageMinutes * 100) / 100, // Round to 2 decimal places
        totalSessions: recentSessions.length,
        dailyBreakdown,
        sessions: recentSessions,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};
