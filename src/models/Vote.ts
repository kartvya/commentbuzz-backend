import mongoose from "mongoose";

const VoteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
    voteType: { type: String, enum: ["upvote", "downvote"], required: true },
  },
  { timestamps: true }
);

VoteSchema.index({ user: 1, post: 1 }, { unique: true });

export default mongoose.model("Vote", VoteSchema);
