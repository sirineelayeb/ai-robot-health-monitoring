import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { ADMIN_EMAIL } from "../models/User.js";

export const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });
  
  const isAdmin = req.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() || 
                  req.user.role?.toLowerCase() === "admin";
  
  if (!isAdmin) return res.status(403).json({ message: "Admin only" });
  next();
};

export const requireEngineer = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });
  if (req.user.role?.toLowerCase() !== "maintenance_engineer") {
    return res.status(403).json({ message: "Engineer only" });
  }
  next();
};