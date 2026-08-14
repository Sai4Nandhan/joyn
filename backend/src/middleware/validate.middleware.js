import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errArray = errors.array();
    console.warn('[Validation Failed]', req.method, req.originalUrl, errArray);
    const detailMsg = errArray.map((e) => `${e.path || e.param}: ${e.msg}`).join('; ');
    return next(new ApiError(422, `Validation failed: ${detailMsg}`, errArray));
  }
  next();
}
