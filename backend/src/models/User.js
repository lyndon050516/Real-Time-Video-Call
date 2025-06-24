import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/**
 * ==========================================
 * User Schema Definition
 * ==========================================
 * Defines the structure of user documents in MongoDB
 * with validation and default values.
 */
const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 6 },
    bio: { type: String, default: "" },
    profilePic: { type: String, default: "" },
    nativeLanguage: { type: String, default: "" },
    learningLanguage: { type: String, default: "" },
    location: { type: String, default: "" },
    isOnboarded: { type: Boolean, default: false },
    friends: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
  },
  { timestamps: true }
);

/**
 * ==========================================
 * Middleware
 * ==========================================
 * Pre-save hook to hash password before saving to database
 */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * ==========================================
 * Instance Methods
 * ==========================================
 * Method to compare password for authentication
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error("Error comparing password:", error);
  }
};

/**
 * ==========================================
 * Model Creation & Export
 * ==========================================
 */
const User = mongoose.model("User", userSchema);

export default User;
