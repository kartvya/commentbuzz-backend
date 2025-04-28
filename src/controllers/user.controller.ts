import { AuthRequest } from "../middlewares/isAuthenticated";
import { Response } from "express";
import User from "../models/User";

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

    const user = await User.findById(userId).select("-password"); // exclude password

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
