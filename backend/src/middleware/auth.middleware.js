/**
 * Authentication middleware module for protecting routes that require user authentication.
 * This middleware validates JWT tokens, retrieves user information, and controls access to protected routes.
 */
import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Middleware that protects routes requiring authentication
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} - Returns unauthorized response if authentication fails
 */

export const protectRoute = async (req, res, next) => {
  try {
    // Extract JWT token from cookies
    const token = req.cookies.jwt;
    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No token provided" });
    }

    // Verify the JWT token using the secret key from environment variables
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }

    console.log("decoded", decoded);

    // Find the user in the database using the ID from the decoded token
    // Exclude the password field for security reasons
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Unauthorized - User not found" });
    }

    // Attach the authenticated user object to the request for use in subsequent middleware or route handlers
    req.user = user;
    next(); // Continue to the next middleware or route handler
  } catch (error) {
    console.error("Error protecting route:", error);
    return res.status(401).json({ message: "Unauthorized - Invalid token" });
  }
};
