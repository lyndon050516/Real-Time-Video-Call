import { generateStreamToken } from "../lib/stream.js";

export const getStreamToken = async (req, res) => {
  try {
    const { _id: myId } = req.user;
    const token = await generateStreamToken(myId);
    res.status(200).json(token);
  } catch (error) {
    console.error("Error getting stream token:", error);
  }
};
