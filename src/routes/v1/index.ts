import express from "express";
import config from "../../config";
import campRoutes from "./camp.routes";
import registrationRoutes from "./registration.routes";
import authRoutes from "./auth.routes";
import profileRoutes from "./profile.routes";
import templateRoutes from "./template.routes";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/camps/:campId/registrations", registrationRoutes);
router.use("/camps/:campId/templates", templateRoutes);
router.use("/camps", campRoutes);

// TODO Add controllers
// router.use("/users", userRoutes)

router.use("/profile", profileRoutes);

if (config.env === "development") {
  // TODO
  // router.use("/docs", docsRoute);
}

export default router;
