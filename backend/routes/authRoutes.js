import express from "express";
import { 
  register, 
  login, 
  checkEmail, 
  getCurrentUser 
} from "../controllers/authController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/check-email", checkEmail);

// Protected route
router.get("/me", authMiddleware, getCurrentUser);

export default router;