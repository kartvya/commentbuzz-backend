import mongoose, { Document, Schema } from "mongoose";

// 1. Create an interface (for TypeScript safety)
export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  profilePic: string;
  gender: string;
}

// 2. Define the Schema
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
    gender: {
      type: String,
      default: "",
    },
    profilePic: { type: String, default: "" },
  },
  { timestamps: true }
);

// 3. Export the model
const User = mongoose.model<IUser>("User", UserSchema);
export default User;
