import express from 'express';
import v1routes from './v1';
import { generalLimiter, maintenance } from 'middlewares';
import passport from 'passport';
import ApiError from 'utils/ApiError';
import httpStatus from 'http-status';
import morgan from 'core/morgan';

const router = express.Router();

router.use(morgan.successHandler);

router.use(generalLimiter);
router.use(maintenance);
router.use(passport.authenticate(['jwt', 'anonymous'], { session: false }));

router.use('/v1', v1routes);

// send back a 404 error for any unknown api request
router.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

export default router;
