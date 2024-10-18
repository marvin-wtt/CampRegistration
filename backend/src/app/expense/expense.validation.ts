import Joi from 'joi';
import {
  ExpenseCreateData,
  ExpenseUpdateData,
} from '@camp-registration/common/entities';

const show = {
  params: Joi.object({
    campId: Joi.string().required(),
    expenseId: Joi.string().required(),
  }),
};

const index = {
  params: Joi.object({
    campId: Joi.string().required(),
  }),
};

const store = {
  params: Joi.object({
    campId: Joi.string().required(),
  }),
  body: Joi.object<ExpenseCreateData>({
    name: Joi.string().required(),
    description: Joi.string().optional(),
    amount: Joi.number().required(),
    date: Joi.date().required(),
    category: Joi.string().optional(),
    paidAt: Joi.date().optional(),
    paidBy: Joi.string().optional(),
    payee: Joi.string().optional(),
  }),
};

const update = {
  params: Joi.object({
    campId: Joi.string().required(),
    expenseId: Joi.string().required(),
  }),
  body: Joi.object<ExpenseUpdateData>({
    name: Joi.string().optional(),
    receiptNumber: Joi.number().integer().positive().allow(null).optional(),
    description: Joi.string().allow(null, '').optional(),
    amount: Joi.number().allow(null).optional(),
    date: Joi.date().allow(null).optional(),
    category: Joi.string().allow(null).optional(),
    paidAt: Joi.date().allow(null).optional(),
    paidBy: Joi.string().allow(null).optional(),
    payee: Joi.string().allow(null, '').optional(),
  }),
};

const destroy = {
  params: Joi.object({
    campId: Joi.string().required(),
    expenseId: Joi.string().required(),
  }),
};

export default {
  show,
  index,
  store,
  update,
  destroy,
};
