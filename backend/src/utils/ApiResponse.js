export function ApiResponse(res, statusCode, data = null, message = 'Success') {
  return res.status(statusCode).json({
    success: statusCode < 400,
    message,
    data,
  });
}
