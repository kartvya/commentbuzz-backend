import mongoose, { Document, Schema } from "mongoose";

// 1. Create an interface (for TypeScript safety)
export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  profilePic: string;
  bio: string;
  fcmToken: string;
  buzzCoins: string;
  followers: mongoose.Schema.Types.ObjectId;
  following: mongoose.Schema.Types.ObjectId;
}

const UserSchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    profilePic: { type: String, default: "" },
    bio: { type: String, default: "" },
    fcmToken: { type: String },
    buzzCoins: { type: Number, default: 0 },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

// 3. Export the model
const User = mongoose.model<IUser>("User", UserSchema);
export default User;
