import express from "express";
import { authMiddleware, requireEngineer } from "../middlewares/authMiddleware.js";
import {
  getEngineerDashboard,
  getEngineerProfile,
  updateEngineerProfile  // Single unified update method
} from "../controllers/engineerController.js";

const router = express.Router();

// Apply engineer middleware to all routes
router.use(authMiddleware, requireEngineer);

// Dashboard
router.get("/dashboard", getEngineerDashboard);

// Profile management 
router.get("/profile", getEngineerProfile);
router.patch("/profile", updateEngineerProfile); 

export default router;