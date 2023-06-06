import express from "express";
import v1routes from "./v1";
import { generalLimiter } from "../middlewares";
import authRoutes from "./v1/auth.routes";

const router = express.Router();

router.use(generalLimiter);

router.use("/v1", v1routes);

export default router;
