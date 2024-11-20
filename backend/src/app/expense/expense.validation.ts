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
    amount: Joi.number().precision(2).required(),
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
    name: Joi.string().required(),
    receiptNumber: Joi.number().integer().positive().optional(),
    description: Joi.string().optional(),
    amount: Joi.number().precision(2).required(),
    date: Joi.date().required(),
    category: Joi.string().optional(),
    paidAt: Joi.date().optional(),
    paidBy: Joi.string().optional(),
    payee: Joi.string().optional(),
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
