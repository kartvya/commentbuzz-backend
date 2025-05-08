import mongoose, { Schema, Document } from "mongoose";

export interface IComment extends Document {
  post: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  text: string;
  parentComment?: mongoose.Types.ObjectId;
  upvotes: mongoose.Types.ObjectId[];
  downvotes: mongoose.Types.ObjectId[];
  buzzCoins: number;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    buzzCoins: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const CommentModel = mongoose.model<IComment>("Comment", commentSchema);
export default CommentModel;
