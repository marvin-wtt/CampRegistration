import express from 'express';
import { validate } from 'middlewares';
import { feedbackValidation } from 'validations';
import { feedbackController } from 'controllers';

const router = express.Router();

router.post('/', validate(feedbackValidation.store), feedbackController.store);

export default router;
