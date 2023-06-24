import express from "express";
import v1routes from "./v1";
import { generalLimiter } from "../middlewares";

const router = express.Router();

router.use(generalLimiter);

router.use("/v1", v1routes);

export default router;
