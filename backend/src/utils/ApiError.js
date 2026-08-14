export class ApiError extends Error {
  constructor(statusCode, message, details = null, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.errorCode = errorCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
