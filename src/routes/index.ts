import express from "express";
import v1routes from "./v1";
import { generalLimiter } from "../middlewares";
import passport from "passport";

const router = express.Router();

router.use(generalLimiter);

router.use(passport.authenticate(["jwt", "anonymous"], { session: false }));

router.use("/v1", v1routes);

export default router;
