import express from "express";
import { authMiddleware, requireAdmin } from "../middlewares/authMiddleware.js";
import * as adminController from "../controllers/adminController.js";

const router = express.Router();

// Apply auth to all admin routes
router.use(authMiddleware, requireAdmin);

// Dashboard
router.get("/dashboard", adminController.getAdminDashboard);

// Engineer management
router.get("/engineers", adminController.getEngineers);
router.post("/engineers", adminController.createEngineer);
router.patch("/engineers/:id", adminController.updateEngineer);
router.delete("/engineers/:id", adminController.deleteEngineer);

// Threshold management
// router.get("/thresholds", adminController.getThresholds);
// router.get("/thresholds/:robotId", adminController.getThresholds);
// router.get("/robots-with-thresholds", adminController.getRobotsWithThresholds);
// router.put("/thresholds/:robotId/:category/:metric", adminController.updateThreshold);
// router.put("/thresholds/:robotId/bulk", adminController.bulkUpdateThresholds);
// router.post("/thresholds/:robotId/reset", adminController.resetThresholds);
// router.get("/thresholds/:robotId/history", adminController.getThresholdHistory);
// router.get("/thresholds/:robotId/:category/:metric", adminController.getThreshold);
// router.post("/thresholds/copy/:sourceRobotId/to/:targetRobotId", adminController.copyThresholds);
// router.get("/thresholds/:robotId/export", adminController.exportThresholds);
// router.post("/test-threshold-save", adminController.testThresholdSave);
export default router;