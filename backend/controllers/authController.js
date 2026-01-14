import User, { ROLES, ADMIN_EMAIL } from "../models/user.js";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";

const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      name: user.name,
      email: user.email,
      role: user.role
    }, 
    config.jwtSecret, 
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );
};

// Register - only engineers
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    // Prevent admin email registration
    if (email === ADMIN_EMAIL) {
      return res.status(403).json({ message: "Email not available" });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Create engineer
    const user = await User.create({ 
      name, 
      email, 
      password, 
      role: ROLES.MAINTENANCE_ENGINEER 
    });

    const token = generateToken(user);

    res.status(201).json({
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      },
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login - both admin and engineers
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.isActive) {
      return res.status(403).json({ message: "Account deactivated" });
    }

    const token = generateToken(user);
    res.json({
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      },
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Check email availability
export const checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    const existingUser = await User.findOne({ email });
    res.json({ exists: !!existingUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};