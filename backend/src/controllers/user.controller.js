import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";

/***************************************************************************************************
 *                                     GET RECOMMENDED USERS
 ***************************************************************************************************/
/**
 * @route GET /api/users/
 * @desc Retrieves a list of recommended users for the current user.
 *       - Excludes the current user.
 *       - Excludes users who are already friends with the current user.
 *       - Filters for users who have completed the onboarding process.
 *       - Selects a limited set of fields to avoid exposing sensitive information.
 * @access Private
 */
export const getRecommendedUsers = async (req, res) => {
  try {
    const { _id: currentUserId, friends } = req.user;
    const recommendedUsers = await User.find({
      // Create a query condition for the '_id' field.
      _id: {
        $ne: currentUserId, // Exclude the current user from the results.
        $nin: friends, // Exclude users who are already in the current user's friends list.
      },
      // Add a condition to only include users who have completed the onboarding process.
      isOnboarded: true,
      // Select only specific fields to return for each user, enhancing performance and security.
    }).select(
      "fullName profilePic nativeLanguage learningLanguage bio location"
    );

    res.status(200).json(recommendedUsers);
  } catch (error) {
    console.error("Error getting recommended users:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/***************************************************************************************************
 *                                        GET MY FRIENDS
 ***************************************************************************************************/
/**
 * @route GET /api/users/friends
 * @desc Retrieves the list of friends for the current user.
 *       - Populates friend data with specific fields for the client.
 * @access Private
 */
export const getMyFriends = async (req, res) => {
  try {
    // Find the current user by their ID.
    const user = await User.findById(req.user._id)
      // Specify that we only need the 'friends' field from the user document initially.
      .select("friends")
      // Populate the 'friends' array with actual user documents instead of just IDs.
      .populate({
        path: "friends", // The field to populate.
        // The specific fields to include from the populated friend documents.
        select: "fullName profilePic nativeLanguage learningLanguage",
      });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json(user.friends || []);
  } catch (error) {
    console.error("Error getting my friends:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const sendFriendRequest = async (req, res) => {
  try {
    const { id: recipientId } = req.params;
    const myId = req.user._id.toString();
    // prevent sending friend request to myself
    if (recipientId === myId) {
      return res.status(400).json({
        success: false,
        message: "You cannot send a friend request to yourself",
      });
    }

    // check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res
        .status(404)
        .json({ success: false, message: "Recipient not found" });
    }

    // check if already friends
    const isFriend = recipient.friends.includes(myId);
    if (isFriend) {
      return res
        .status(400)
        .json({ success: false, message: "You are already friends" });
    }

    // check if friend request already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: myId, recipient: recipientId }, // if any of these conditions are true, the request is already pending
        { sender: recipientId, recipient: myId },
      ],
    });
    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "Friend request already exists",
      });
    }

    // create friend request
    const friendRequest = await FriendRequest.create({
      sender: myId,
      recipient: recipientId,
    });

    res.status(201).json({
      success: true,
      message: "Friend request sent",
      friendRequest,
    });
  } catch (error) {
    console.error("Error sending friend request:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const acceptFriendRequest = async (req, res) => {
  try {
    const { id: requestId } = req.params;
    const myId = req.user._id.toString(); 
    // check if friend request exists
    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest) {
      return res
        .status(404)
        .json({ success: false, message: "Friend request not found" });
    }

    // check if friend request is pending
    if (friendRequest.status !== "pending") {
      return res
        .status(400)
        .json({ success: false, message: "Friend request is not pending" });
    }

    // check if friend request is for me
    if (friendRequest.recipient.toString() !== myId) {
      return res.status(403).json({
        success: false,
        message: "You are not the recipient of this friend request",
      });
    }

    // update friend request status to accepted
    friendRequest.status = "accepted";
    await friendRequest.save();

    // add each user to friends list
    await User.findByIdAndUpdate(friendRequest.recipient, {
      $addToSet: { friends: friendRequest.sender }, // add to set to avoid duplicates
    });
    await User.findByIdAndUpdate(friendRequest.sender, {
      $addToSet: { friends: friendRequest.recipient },
    });

    res.status(200).json({
      success: true,
      message: "Friend request accepted",
    });
  } catch (error) {
    console.error("Error accepting friend request:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getFriendRequests = async (req, res) => {
  try {
    const { _id: myId } = req.user;
    const incomingReqs = await FriendRequest.find({
      recipient: myId,
      status: "pending",
    }).populate(
      "sender",
      "fullName profilePic nativeLanguage learningLanguage"
    );
    const acceptedReqs = await FriendRequest.find({
      sender: myId,
      status: "accepted",
    }).populate("recipient", "fullName profilePic");

    res.status(200).json({
      success: true,
      incomingReqs,
      acceptedReqs,
    });
  } catch (error) {
    console.error("Error getting friend requests:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getOutgoingFriendRequests = async (req, res) => {
  try {
    const myId = req.user._id.toString();
    const outgoingReqs = await FriendRequest.find({
      sender: myId,
      status: "pending",
    }).populate(
      "recipient",
      "fullName profilePic nativeLanguage learningLanguage"
    );
    res.status(200).json(outgoingReqs);
  } catch (error) {
    console.error("Error getting outgoing friend requests:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
