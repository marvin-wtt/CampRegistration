import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import passport from "passport";
import apiRoutes from "./routes";
import config from "./config";
import morgan from "./config/morgan";
import { errorConverter, errorHandler } from "./middlewares";
import ApiError from "./utils/ApiError";
import httpStatus from "http-status";
import { jwtStrategy } from "./config/passport";
import cookieParser from "cookie-parser";

// TODO https://expressjs.com/en/advanced/best-practice-security.html#use-tls

const app = express();

if (config.env !== "test") {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// set security HTTP headers
app.use(helmet());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// Parse json body as json
app.use(express.json());

// Use cookies
app.use(cookieParser());

// // gzip compression
app.use(compression());

// enable cors

app.use(
  cors({
    // TODO
    origin: "http://localhost:9000",
    credentials: true,
    // origin: config.origin || "*",
  })
);
app.options("*", cors());

// authentication
app.use(passport.initialize());
passport.use("jwt", jwtStrategy);

// // api routes
app.use("/api", apiRoutes);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, "Not found"));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

export default app;
