// controllers/voteController.ts
import Vote from "../models/Vote";
import Post from "../models/Post";
import User from "../models/User";

export const voteOnPost = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { postId } = req.params;
    const { voteType } = req.body; // 'upvote' | 'downvote'
    const userId = req.user._id;

    if (!["upvote", "downvote"].includes(voteType)) {
      return res.status(400).json({ message: "Invalid vote type" });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const existingVote = await Vote.findOne({ user: userId, post: postId });

    let voteChange = 0;
    let buzzCoinChange = 0;

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // Toggle off
        await existingVote.deleteOne();

        if (voteType === "upvote") {
          post.upvoteCount -= 1;
          buzzCoinChange = -1;
        } else {
          post.downvoteCount -= 1;
          buzzCoinChange = +1;
        }

        voteChange = -1;
      } else {
        // Switch vote
        existingVote.voteType = voteType;
        await existingVote.save();

        if (voteType === "upvote") {
          post.upvoteCount += 1;
          post.downvoteCount -= 1;
          buzzCoinChange = +2;
        } else {
          post.downvoteCount += 1;
          post.upvoteCount -= 1;
          buzzCoinChange = -2;
        }

        voteChange = 0;
      }
    } else {
      // First time voting
      await Vote.create({ user: userId, post: postId, voteType });

      if (voteType === "upvote") {
        post.upvoteCount += 1;
        buzzCoinChange = +1;
      } else {
        post.downvoteCount += 1;
        buzzCoinChange = -1;
      }

      voteChange = +1;
    }

    await post.save();

    // Update buzz coins for post owner
    const postOwner = await User.findById(post.user);
    if (postOwner) {
      postOwner.buzzCoins += buzzCoinChange;
      await postOwner.save();
    }

    return res.status(200).json({
      message: "Vote processed",
      voteType: existingVote?.voteType === voteType ? "removed" : voteType,
      upvoteCount: post.upvoteCount,
      downvoteCount: post.downvoteCount,
    });
  } catch (err) {
    console.error("Vote error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
