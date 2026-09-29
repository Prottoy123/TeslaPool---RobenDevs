import { Router } from "express";
import {
  getZones,
  estimateFare,
  requestRide,
  getRideStatus,
  getRideHistory,
  cancelRide,
} from "../controllers/passenger.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { restrictTo } from "../middlewares/role.middleware.js";

const router = Router();

// Apply auth and PASSENGER role restriction to all passenger routes
router.use(verifyJWT);
router.use(restrictTo("PASSENGER"));

router.get("/zones", getZones);
router.get("/ride/estimate-fare", estimateFare);
router.post("/ride/request", requestRide);
router.get("/ride/status", getRideStatus);
router.get("/ride/history", getRideHistory);
router.patch("/ride/cancel", cancelRide);

export default router;
