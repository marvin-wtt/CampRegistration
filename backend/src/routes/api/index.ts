import express from 'express';
import v1routes from './v1.js';
import maintenance from '#middlewares/maintenance.middleware';
import { generalLimiter } from '#middlewares/rateLimiter.middleware';
import convertEmptyStringsToNull from '#middlewares/emptyStringNull.middleware';

import passport from 'passport';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import morgan from '#core/morgan';

const router = express.Router();

router.use(morgan.successHandler);

router.use(generalLimiter);
router.use(maintenance);
router.use(convertEmptyStringsToNull);
router.use(passport.authenticate(['jwt', 'anonymous'], { session: false }));

router.use('/v1', v1routes);

// send back a 404 error for any unknown api request
router.use((_req, _res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

export default router;
