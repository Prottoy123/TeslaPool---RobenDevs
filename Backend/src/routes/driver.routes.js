import { Router } from "express";
import {
  getPendingRequests,
  acceptRequest,
  updatePoolStatus,
  getActivePool,
  updateVehicleStatus,
  getVehicle,
  getDriverRideHistory,
} from "../controllers/driver.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { restrictTo } from "../middlewares/role.middleware.js";

const router = Router();

// Apply auth and DRIVER role restriction to all driver routes
router.use(verifyJWT);
router.use(restrictTo("DRIVER"));

router.get("/vehicle", getVehicle);
router.patch("/vehicle/status", updateVehicleStatus);
router.get("/pending-requests", getPendingRequests);
router.post("/pool/accept", acceptRequest);
router.patch("/pool/status", updatePoolStatus);
router.get("/pool/active", getActivePool);
router.get("/history", getDriverRideHistory);
router.get("/pool/history", getDriverRideHistory);

export default router;
