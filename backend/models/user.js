import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export const ROLES = {
  ADMIN: "admin",
  MAINTENANCE_ENGINEER: "maintenance_engineer"
};

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@company.com";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true
  },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: Object.values(ROLES), 
    required: true 
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password
UserSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model("User", UserSchema);